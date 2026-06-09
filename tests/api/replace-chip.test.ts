import { describe, it, expect, vi, beforeEach } from "vitest";
import { makeRequest } from "../setup";

// ── Shared, mutable test state + Supabase/email mocks (hoisted so the module
//    factories can close over them) ──────────────────────────────────────────
const h = vi.hoisted(() => {
  type Chip = {
    id: string;
    short_id: string;
    medium: string;
    status: string;
    product_id: string | null;
    company_id: string;
  };

  const state: {
    user: { id: string } | null;
    product: { id: string; name: string } | null;
    tags: Record<string, Chip | null>;
    groupTags: { id: string }[];
    owner: { owner_name: string; owner_email: string } | null;
    company: { name: string } | null;
    rpc: { data: { replacement_id: string; new_status: string }[] | null; error: unknown };
    ops: string[];
  } = {
    user: null,
    product: null,
    tags: {},
    groupTags: [],
    owner: null,
    company: null,
    rpc: { data: [], error: null },
    ops: [],
  };

  function resolveSingle(table: string, filters: Record<string, unknown>) {
    switch (table) {
      case "products":
        return { data: state.product, error: null };
      case "tags":
        return { data: state.tags[filters.short_id as string] ?? null, error: null };
      case "ownership_records":
        return { data: state.owner, error: null };
      case "companies":
        return { data: state.company, error: null };
      default:
        return { data: null, error: null };
    }
  }

  function resolveList(table: string) {
    if (table === "tags") return { data: state.groupTags, error: null };
    return { data: null, error: null };
  }

  function makeBuilder(table: string) {
    const filters: Record<string, unknown> = {};
    const b: Record<string, unknown> = {};
    const chain = () => b;
    b.select = chain;
    b.insert = () => { state.ops.push(`${table}.insert`); return b; };
    b.update = () => { state.ops.push(`${table}.update`); return b; };
    b.delete = () => { state.ops.push(`${table}.delete`); return b; };
    b.eq = (col: string, val: unknown) => { filters[col] = val; return b; };
    b.in = (col: string, val: unknown) => { filters[col] = val; return b; };
    b.single = () => Promise.resolve(resolveSingle(table, filters));
    b.maybeSingle = () => Promise.resolve(resolveSingle(table, filters));
    // Awaiting the builder itself (no terminal) resolves to a list result.
    b.then = (onF: (v: unknown) => unknown, onR?: (e: unknown) => unknown) =>
      Promise.resolve(resolveList(table)).then(onF, onR);
    return b;
  }

  const admin = {
    from: vi.fn((table: string) => makeBuilder(table)),
    rpc: vi.fn(() => Promise.resolve(state.rpc)),
  };

  const server = {
    auth: { getUser: vi.fn(() => Promise.resolve({ data: { user: state.user } })) },
  };

  const sendChipReplacedEmail = vi.fn(() => Promise.resolve());

  return { state, admin, server, sendChipReplacedEmail };
});

vi.mock("@/lib/supabase/admin", () => ({ createAdminClient: () => h.admin }));
vi.mock("@/lib/supabase/server", () => ({ createClient: () => Promise.resolve(h.server) }));
vi.mock("@/lib/email", () => ({ sendChipReplacedEmail: h.sendChipReplacedEmail }));
// Replace-chip is gated by the tag_migration flag — on by default for these
// tests; the flag-off case is covered explicitly below.
vi.mock("@/lib/feature-flags/server", () => ({
  getFlagsForBrand: vi.fn(() => Promise.resolve({ tag_migration: h.state.tagMigrationFlag ?? true })),
}));

const { POST } = await import("@/app/api/company/products/[id]/replace-chip/route");

const PRODUCT_ID = "prod-1";

function call(body: unknown, productId = PRODUCT_ID) {
  return POST(makeRequest(body), { params: Promise.resolve({ id: productId }) });
}

const validBody = {
  reason: "not_scanning",
  replacement_short_id: "NEW-1",
  old_short_id: "OLD-1",
};

function tag(overrides: Partial<{ id: string; short_id: string; medium: string; status: string; product_id: string | null; company_id: string }>) {
  return {
    id: "tag",
    short_id: "X",
    medium: "tag",
    status: "live",
    product_id: null,
    company_id: "brand-1",
    ...overrides,
  };
}

describe("POST /api/company/products/[id]/replace-chip", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    h.state.user = { id: "brand-1" };
    h.state.tagMigrationFlag = true;
    h.state.product = { id: PRODUCT_ID, name: "Aurora Tote" };
    h.state.tags = {
      "OLD-1": tag({ id: "old-tag", short_id: "OLD-1", medium: "tag", status: "owned", product_id: PRODUCT_ID }),
      "NEW-1": tag({ id: "new-tag", short_id: "NEW-1", medium: "tag", status: "live", product_id: null }),
    };
    h.state.groupTags = [{ id: "old-tag" }];
    h.state.owner = null;
    h.state.company = { name: "Maison Aurora" };
    h.state.rpc = { data: [{ replacement_id: "repl-1", new_status: "owned" }], error: null };
    h.state.ops = [];
    h.sendChipReplacedEmail.mockReset();
    h.sendChipReplacedEmail.mockResolvedValue(undefined);
  });

  // ── Happy paths ──
  it("replaces a tag with another tag on unowned product", async () => {
    const res = await call(validBody);
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.success).toBe(true);
    expect(json.chip.short_id).toBe("NEW-1");
    expect(h.sendChipReplacedEmail).not.toHaveBeenCalled();
  });

  it("returns 403 when the tag_migration flag is off for the brand", async () => {
    h.state.tagMigrationFlag = false;
    const res = await call(validBody);
    expect(res.status).toBe(403);
  });

  it("replaces a card with another card on unowned product", async () => {
    h.state.tags["OLD-1"] = tag({ id: "old-card", short_id: "OLD-1", medium: "card", status: "owned", product_id: PRODUCT_ID });
    h.state.tags["NEW-1"] = tag({ id: "new-card", short_id: "NEW-1", medium: "card", status: "live", product_id: null });
    const res = await call(validBody);
    expect(res.status).toBe(200);
  });

  it("replaces tag on owned product and notifies owner by email", async () => {
    h.state.owner = { owner_name: "Ada Lovelace", owner_email: "ada@example.com" };
    const res = await call(validBody);
    expect(res.status).toBe(200);
    expect(h.sendChipReplacedEmail).toHaveBeenCalledWith(
      "ada@example.com",
      expect.objectContaining({ productName: "Aurora Tote", brandName: "Maison Aurora" })
    );
  });

  it("replaces card on owned product and notifies owner by email", async () => {
    h.state.tags["OLD-1"] = tag({ id: "old-card", short_id: "OLD-1", medium: "card", status: "owned", product_id: PRODUCT_ID });
    h.state.tags["NEW-1"] = tag({ id: "new-card", short_id: "NEW-1", medium: "card", status: "live", product_id: null });
    h.state.owner = { owner_name: "Ada", owner_email: "ada@example.com" };
    const res = await call(validBody);
    expect(res.status).toBe(200);
    expect(h.sendChipReplacedEmail).toHaveBeenCalledTimes(1);
  });

  // ── Medium validation ──
  it("rejects replacing a tag with a card — returns 409", async () => {
    h.state.tags["NEW-1"] = tag({ id: "new-card", short_id: "NEW-1", medium: "card", product_id: null });
    const res = await call(validBody);
    expect(res.status).toBe(409);
  });

  it("rejects replacing a card with a tag — returns 409", async () => {
    h.state.tags["OLD-1"] = tag({ id: "old-card", short_id: "OLD-1", medium: "card", status: "owned", product_id: PRODUCT_ID });
    // NEW-1 stays a tag
    const res = await call(validBody);
    expect(res.status).toBe(409);
  });

  // ── Chip validation ──
  it("rejects chip belonging to another brand — returns 404", async () => {
    h.state.tags["NEW-1"] = tag({ id: "new-tag", short_id: "NEW-1", company_id: "brand-2", product_id: null });
    const res = await call(validBody);
    expect(res.status).toBe(404);
  });

  it("rejects chip already assigned to another product — returns 409", async () => {
    h.state.tags["NEW-1"] = tag({ id: "new-tag", short_id: "NEW-1", product_id: "prod-2" });
    const res = await call(validBody);
    expect(res.status).toBe(409);
  });

  it("rejects decommissioned chip — returns 409", async () => {
    h.state.tags["NEW-1"] = tag({ id: "new-tag", short_id: "NEW-1", status: "decommissioned", product_id: null });
    const res = await call(validBody);
    expect(res.status).toBe(409);
  });

  it("rejects flagged chip — returns 409", async () => {
    h.state.tags["NEW-1"] = tag({ id: "new-tag", short_id: "NEW-1", status: "flagged", product_id: null });
    const res = await call(validBody);
    expect(res.status).toBe(409);
  });

  it("rejects non-existent Short ID — returns 404", async () => {
    h.state.tags["NEW-1"] = null;
    const res = await call(validBody);
    expect(res.status).toBe(404);
  });

  // ── Auth ──
  it("rejects unauthenticated request — returns 401", async () => {
    h.state.user = null;
    const res = await call(validBody);
    expect(res.status).toBe(401);
  });

  it("rejects request on another brands product — returns 403", async () => {
    h.state.product = null; // company_id filter excludes it
    const res = await call(validBody);
    expect(res.status).toBe(403);
  });

  // ── Data integrity ──
  it("old chip is decommissioned after replacement", async () => {
    await call(validBody);
    expect(h.admin.rpc).toHaveBeenCalledWith(
      "replace_chip",
      expect.objectContaining({ p_old_tag_id: "old-tag" })
    );
  });

  it("new chip is linked to product after replacement", async () => {
    await call(validBody);
    expect(h.admin.rpc).toHaveBeenCalledWith(
      "replace_chip",
      expect.objectContaining({ p_new_tag_id: "new-tag", p_product_id: PRODUCT_ID })
    );
  });

  it("ownership records are unchanged after replacement", async () => {
    h.state.owner = { owner_name: "Ada", owner_email: "ada@example.com" };
    await call(validBody);
    expect(h.state.ops).not.toContain("ownership_records.update");
    expect(h.state.ops).not.toContain("ownership_records.insert");
    expect(h.state.ops).not.toContain("ownership_records.delete");
  });

  it("product details are unchanged after replacement", async () => {
    await call(validBody);
    expect(h.state.ops).not.toContain("products.update");
    expect(h.state.ops).not.toContain("products.insert");
  });

  it("tag_replacements row is created", async () => {
    await call(validBody);
    expect(h.admin.rpc).toHaveBeenCalledWith(
      "replace_chip",
      expect.objectContaining({
        p_reason: "not_scanning",
        p_medium: "tag",
        p_initiated_by: "brand-1",
      })
    );
  });

  it("no email sent when product is unowned", async () => {
    h.state.owner = null;
    await call(validBody);
    expect(h.sendChipReplacedEmail).not.toHaveBeenCalled();
  });

  it("replacement completes even if email sending fails", async () => {
    h.state.owner = { owner_name: "Ada", owner_email: "ada@example.com" };
    h.sendChipReplacedEmail.mockRejectedValueOnce(new Error("Resend down"));
    const res = await call(validBody);
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.success).toBe(true);
  });
});
