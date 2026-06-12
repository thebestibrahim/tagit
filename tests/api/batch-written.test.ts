import { describe, it, expect, vi, beforeEach } from "vitest";

const state = vi.hoisted(() => ({
  user: { id: "admin-1", app_metadata: { role: "tagit_admin" } } as { id: string; app_metadata: { role: string } } | null,
  batch: { id: "b1", status: "generated" } as { id: string; status: string } | null,
  ops: [] as string[],
}));

vi.mock("@/lib/supabase/server", () => ({
  createClient: vi.fn(() =>
    Promise.resolve({
      auth: { getUser: vi.fn(() => Promise.resolve({ data: { user: state.user } })) },
    })
  ),
}));

vi.mock("@/lib/supabase/admin", () => ({
  createAdminClient: vi.fn(() => ({
    from: vi.fn((table: string) => {
      const b: Record<string, unknown> = {};
      b.select = () => b;
      b.eq = () => b;
      b.single = () =>
        Promise.resolve({ data: state.batch, error: state.batch ? null : { message: "not found" } });
      b.update = () => {
        state.ops.push(`${table}.update`);
        return { eq: () => Promise.resolve({ error: null }) };
      };
      return b;
    }),
  })),
}));

const { POST } = await import("@/app/api/admin/batches/[id]/written/route");

function call(id = "b1") {
  return POST(new Request("http://localhost", { method: "POST" }), {
    params: Promise.resolve({ id }),
  });
}

describe("POST /api/admin/batches/[id]/written", () => {
  beforeEach(() => {
    state.user = { id: "admin-1", app_metadata: { role: "tagit_admin" } };
    state.batch = { id: "b1", status: "generated" };
    state.ops = [];
  });

  it("returns 401 when the caller is not an admin", async () => {
    state.user = { id: "u", app_metadata: { role: "brand" } };
    const res = await call();
    expect(res.status).toBe(401);
  });

  it("returns 404 when the batch is missing", async () => {
    state.batch = null;
    const res = await call();
    expect(res.status).toBe(404);
  });

  it("returns 409 when chips have not been generated yet", async () => {
    state.batch = { id: "b1", status: "processing" };
    const res = await call();
    expect(res.status).toBe(409);
  });

  it("is idempotent when already written (no second update)", async () => {
    state.batch = { id: "b1", status: "written" };
    const res = await call();
    expect(res.status).toBe(200);
    expect(state.ops).not.toContain("tag_batches.update");
  });

  it("moves a generated batch to written", async () => {
    const res = await call();
    expect(res.status).toBe(200);
    expect(state.ops).toContain("tag_batches.update");
  });
});
