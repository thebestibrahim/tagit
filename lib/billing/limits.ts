// ── Lifetime chip limits ─────────────────────────────────────────────────────
// Tags and cards each have a lifetime cap that never resets. The effective
// limit is the per-brand override when set, otherwise the plan limit. A null
// effective limit means unlimited (Bespoke). Minimum order is always 10/type.

export const MINIMUM_ORDER = 10;

export type ChipNoun = "tag" | "card";

// Effective lifetime limit: override wins, else plan limit (null = unlimited).
export function effectiveLimit(
  override: number | null | undefined,
  planLimit: number | null | undefined
): number | null {
  if (override !== null && override !== undefined) return override;
  return planLimit ?? null;
}

export interface ChipUsage {
  limit: number | null; // null = unlimited
  used: number;
  remaining: number | null; // null = unlimited
  unlimited: boolean;
  // True when a finite limit leaves less than one minimum order — the brand
  // cannot place another order of this type without upgrading.
  exhausted: boolean;
}

export function chipUsage(
  override: number | null | undefined,
  planLimit: number | null | undefined,
  used: number
): ChipUsage {
  const limit = effectiveLimit(override, planLimit);
  if (limit === null) {
    return { limit: null, used, remaining: null, unlimited: true, exhausted: false };
  }
  const remaining = Math.max(0, limit - used);
  return { limit, used, remaining, unlimited: false, exhausted: remaining < MINIMUM_ORDER };
}

// New lifetime totals after an order. Tags and cards accumulate independently.
export function addOrderTotals(
  current: { tags_ordered_total: number; cards_ordered_total: number },
  tagsOrdered: number,
  cardsOrdered: number
): { tags_ordered_total: number; cards_ordered_total: number } {
  return {
    tags_ordered_total: current.tags_ordered_total + tagsOrdered,
    cards_ordered_total: current.cards_ordered_total + cardsOrdered,
  };
}

export type ChipValidation =
  | { ok: true }
  | { ok: false; status: number; error: string; upgradeRequired: boolean };

// Validate a requested quantity of one chip type against the effective lifetime
// limit and the running total. Mirrors the spec exactly:
//  - below minimum order            → 400 (not an upgrade problem)
//  - finite limit, remaining < min  → 403, upgrade_required
//  - finite limit, requested > rem  → 403, upgrade_required
//  - unlimited (null) limit         → only the minimum check applies
// Callers should only invoke this when `requested > 0`.
export function validateChipQuantity(
  requested: number,
  override: number | null | undefined,
  planLimit: number | null | undefined,
  used: number,
  planName: string,
  noun: ChipNoun
): ChipValidation {
  if (requested < MINIMUM_ORDER) {
    return { ok: false, status: 400, error: `Minimum ${noun} order is ${MINIMUM_ORDER}.`, upgradeRequired: false };
  }

  const limit = effectiveLimit(override, planLimit);
  if (limit === null) return { ok: true }; // unlimited

  const remaining = Math.max(0, limit - used);

  if (remaining < MINIMUM_ORDER) {
    return {
      ok: false,
      status: 403,
      error: `You have ${remaining} ${noun}${remaining === 1 ? "" : "s"} remaining on your ${planName} plan. Minimum order is ${MINIMUM_ORDER}. Upgrade to order more.`,
      upgradeRequired: true,
    };
  }
  if (requested > remaining) {
    return {
      ok: false,
      status: 403,
      error: `You can only order ${remaining} more ${noun}${remaining === 1 ? "" : "s"} on your ${planName} plan. Upgrade to order more.`,
      upgradeRequired: true,
    };
  }
  return { ok: true };
}
