import { describe, it, expect, beforeEach } from "vitest";
import {
  getActiveSubscriptionDiscount,
  getActiveBatchDiscount,
  consumeDiscount,
} from "@/lib/billing/discounts";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database, Discount } from "@/types/database";

// ── Minimal in-memory Supabase mock for the `discounts` table ────────────────
function makeDb(rows: Discount[]) {
  function table() {
    let filters: Record<string, unknown> = {};
    let pending: Partial<Discount> | null = null;
    const api: Record<string, unknown> = {};
    api.select = () => api;
    api.eq = (col: string, val: unknown) => { filters[col] = val; return api; };
    api.update = (patch: Partial<Discount>) => { pending = patch; return api; };
    const match = () => rows.filter((r) => Object.entries(filters).every(([k, v]) => (r as Record<string, unknown>)[k] === v));
    api.maybeSingle = async () => ({ data: match()[0] ?? null, error: null });
    api.single = async () => ({ data: match()[0] ?? null, error: null });
    // update().eq() resolves as a thenable
    api.then = (resolve: (v: { data: null; error: null }) => void) => {
      if (pending) match().forEach((r) => Object.assign(r, pending));
      pending = null; filters = {};
      return Promise.resolve({ data: null, error: null }).then(resolve);
    };
    return api;
  }
  return { from: () => table() } as unknown as SupabaseClient<Database>;
}

function discount(over: Partial<Discount>): Discount {
  return {
    id: "d1", company_id: "c1", type: "subscription", percentage: 20, duration: 3,
    used: 0, is_active: true, note: null, created_by: null,
    starts_at: "2026-01-01", created_at: "2026-01-01", ...over,
  };
}

describe("getActiveSubscriptionDiscount / getActiveBatchDiscount", () => {
  it("returns active subscription discount for brand", async () => {
    const db = makeDb([discount({ id: "s", type: "subscription" })]);
    expect((await getActiveSubscriptionDiscount(db, "c1"))?.id).toBe("s");
  });

  it("returns null when no active subscription discount", async () => {
    const db = makeDb([discount({ type: "subscription", is_active: false })]);
    expect(await getActiveSubscriptionDiscount(db, "c1")).toBeNull();
  });

  it("does not return batch discount when querying subscription", async () => {
    const db = makeDb([discount({ id: "b", type: "batch" })]);
    expect(await getActiveSubscriptionDiscount(db, "c1")).toBeNull();
  });

  it("returns active batch discount for brand", async () => {
    const db = makeDb([discount({ id: "b", type: "batch" })]);
    expect((await getActiveBatchDiscount(db, "c1"))?.id).toBe("b");
  });

  it("does not return subscription discount when querying batch", async () => {
    const db = makeDb([discount({ type: "subscription" })]);
    expect(await getActiveBatchDiscount(db, "c1")).toBeNull();
  });
});

describe("consumeDiscount", () => {
  let rows: Discount[];
  beforeEach(() => { rows = []; });

  it("increments used by 1", async () => {
    rows = [discount({ id: "d", used: 0, duration: 3 })];
    await consumeDiscount(makeDb(rows), "d");
    expect(rows[0].used).toBe(1);
    expect(rows[0].is_active).toBe(true);
  });

  it("deactivates when used reaches duration", async () => {
    rows = [discount({ id: "d", used: 2, duration: 3 })];
    await consumeDiscount(makeDb(rows), "d");
    expect(rows[0].used).toBe(3);
    expect(rows[0].is_active).toBe(false);
  });

  it("consuming batch discount does not affect subscription discount", async () => {
    rows = [
      discount({ id: "sub", type: "subscription", used: 0 }),
      discount({ id: "bat", type: "batch", used: 0 }),
    ];
    await consumeDiscount(makeDb(rows), "bat");
    expect(rows.find((r) => r.id === "bat")!.used).toBe(1);
    expect(rows.find((r) => r.id === "sub")!.used).toBe(0);
  });

  it("brand can have both discounts active simultaneously", async () => {
    rows = [
      discount({ id: "sub", type: "subscription" }),
      discount({ id: "bat", type: "batch" }),
    ];
    const db = makeDb(rows);
    expect((await getActiveSubscriptionDiscount(db, "c1"))?.id).toBe("sub");
    expect((await getActiveBatchDiscount(db, "c1"))?.id).toBe("bat");
  });
});
