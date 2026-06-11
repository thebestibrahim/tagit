import { describe, it, expect } from "vitest";
import {
  validateChipQuantity,
  chipUsage,
  effectiveLimit,
  addOrderTotals,
  MINIMUM_ORDER,
} from "@/lib/billing/limits";

// Marque-style: 10 lifetime each. Helper to validate tags by default.
function vTag(requested: number, used: number, planLimit: number | null = 10, override: number | null = null) {
  return validateChipQuantity(requested, override, planLimit, used, "Marque", "tag");
}
function vCard(requested: number, used: number, planLimit: number | null = 10, override: number | null = null) {
  return validateChipQuantity(requested, override, planLimit, used, "Marque", "card");
}

describe("chip limit validation", () => {
  it("blocks tags when remaining < minimum order", () => {
    const r = vTag(10, 5); // 5 remaining of 10
    expect(r.ok).toBe(false);
    if (!r.ok) { expect(r.status).toBe(403); expect(r.upgradeRequired).toBe(true); }
  });

  it("blocks cards when remaining < minimum order", () => {
    const r = vCard(10, 5);
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.upgradeRequired).toBe(true);
  });

  it("blocks tags when requested > remaining", () => {
    const r = vTag(20, 0, 25); // 25 limit, 0 used → 25 remaining, request 20 is fine... use bigger
    expect(r.ok).toBe(true);
    const r2 = vTag(20, 10, 25); // 15 remaining, request 20
    expect(r2.ok).toBe(false);
    if (!r2.ok) { expect(r2.status).toBe(403); expect(r2.upgradeRequired).toBe(true); }
  });

  it("blocks cards when requested > remaining", () => {
    const r = vCard(20, 10, 25); // 15 remaining
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.upgradeRequired).toBe(true);
  });

  it("allows order when within limits", () => {
    expect(vTag(10, 0).ok).toBe(true);
    expect(vTag(10, 0, 30).ok).toBe(true);
  });

  it("tags and cards validated independently", () => {
    // tags exhausted, cards fresh — each call is independent
    expect(vTag(10, 5).ok).toBe(false);
    expect(vCard(10, 0).ok).toBe(true);
  });

  it("exhausted tags does not block card order (separate validation)", () => {
    const tags = vTag(10, 10); // 0 remaining
    const cards = vCard(10, 0);
    expect(tags.ok).toBe(false);
    expect(cards.ok).toBe(true);
  });

  it("exhausted cards does not block tag order (separate validation)", () => {
    expect(vCard(10, 10).ok).toBe(false);
    expect(vTag(10, 0).ok).toBe(true);
  });

  it("skips limit check for Bespoke (null limit)", () => {
    const r = validateChipQuantity(5000, null, null, 99999, "Bespoke", "tag");
    expect(r.ok).toBe(true);
  });

  it("uses override over plan default when set", () => {
    // plan limit 10 (exhausted at 10), but override 100 → allowed
    const r = validateChipQuantity(50, 100, 10, 10, "Atelier", "tag");
    expect(r.ok).toBe(true);
    // override 10 beats a generous plan limit
    const r2 = validateChipQuantity(20, 10, 1000, 5, "Atelier", "tag");
    expect(r2.ok).toBe(false);
  });

  it("returns upgrade_required: true when blocked by limit", () => {
    const r = vTag(10, 8);
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.upgradeRequired).toBe(true);
  });

  it("minimum order of 10 enforced per type (400, not upgrade)", () => {
    const r = vTag(9, 0, 100);
    expect(r.ok).toBe(false);
    if (!r.ok) { expect(r.status).toBe(400); expect(r.upgradeRequired).toBe(false); }
  });
});

describe("effectiveLimit", () => {
  it("prefers override over plan limit", () => expect(effectiveLimit(50, 10)).toBe(50));
  it("falls back to plan limit when no override", () => expect(effectiveLimit(null, 10)).toBe(10));
  it("returns null (unlimited) when both null", () => expect(effectiveLimit(null, null)).toBeNull());
  it("treats override 0 as a real limit", () => expect(effectiveLimit(0, 10)).toBe(0));
});

describe("chipUsage", () => {
  it("computes remaining and exhausted for a finite limit", () => {
    const u = chipUsage(null, 10, 5);
    expect(u).toMatchObject({ limit: 10, used: 5, remaining: 5, unlimited: false, exhausted: true });
  });
  it("not exhausted when a full minimum order remains", () => {
    expect(chipUsage(null, 30, 10).exhausted).toBe(false); // 20 remaining
  });
  it("reports unlimited for null limit", () => {
    const u = chipUsage(null, null, 999);
    expect(u.unlimited).toBe(true);
    expect(u.remaining).toBeNull();
    expect(u.exhausted).toBe(false);
  });
  it("clamps remaining at 0 when over-ordered", () => {
    expect(chipUsage(null, 10, 15).remaining).toBe(0);
  });
});

describe("addOrderTotals", () => {
  it("increments tags_ordered_total after a successful order", () => {
    const next = addOrderTotals({ tags_ordered_total: 10, cards_ordered_total: 0 }, 10, 0);
    expect(next.tags_ordered_total).toBe(20);
    expect(next.cards_ordered_total).toBe(0);
  });
  it("increments cards_ordered_total after a successful order", () => {
    const next = addOrderTotals({ tags_ordered_total: 0, cards_ordered_total: 5 }, 0, 15);
    expect(next.cards_ordered_total).toBe(20);
    expect(next.tags_ordered_total).toBe(0);
  });
  it("increments both independently for a mixed order", () => {
    expect(addOrderTotals({ tags_ordered_total: 3, cards_ordered_total: 4 }, 10, 20)).toEqual({
      tags_ordered_total: 13,
      cards_ordered_total: 24,
    });
  });
});

describe("MINIMUM_ORDER", () => {
  it("is 10", () => expect(MINIMUM_ORDER).toBe(10));
});
