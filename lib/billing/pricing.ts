import type { VolumeTier, BillingInterval } from "@/types/database";

export type { VolumeTier };

// Find the tier that covers `quantity` (max null = no upper limit).
function findTier(quantity: number, tiers: VolumeTier[]): VolumeTier | undefined {
  const sorted = [...tiers].sort((a, b) => a.min - b.min);
  return sorted.find(
    (t) => quantity >= t.min && (t.max === null || quantity <= t.max)
  );
}

// Calculate total (kobo) for a chip order using volume tiers.
export function calculateChipOrderTotal(
  quantity: number,
  tiers: VolumeTier[]
): number {
  const tier = findTier(quantity, tiers);
  if (!tier) throw new Error(`No pricing tier for quantity ${quantity}`);
  return quantity * tier.price_per_unit;
}

// Get price per unit (kobo) for a given quantity.
export function getPricePerUnit(quantity: number, tiers: VolumeTier[]): number {
  const tier = findTier(quantity, tiers);
  if (!tier) throw new Error(`No pricing tier for quantity ${quantity}`);
  return tier.price_per_unit;
}

// Apply a discount percentage to an amount (kobo).
export function applyDiscount(
  subtotal: number,
  percentage: number
): { discountAmount: number; finalAmount: number } {
  const discountAmount = Math.round((subtotal * percentage) / 100);
  return { discountAmount, finalAmount: subtotal - discountAmount };
}

// Tagit bills in Naira only today. This is the single switch point: when other
// currencies are supported, thread a currency code through and the formatter
// (and the /100 minor-unit divisor) adapt without touching call sites.
export type CurrencyCode = "NGN";

// Format a minor-unit amount (kobo for NGN) into a currency string.
export function formatMoney(minorUnits: number, currency: CurrencyCode = "NGN"): string {
  const locale = currency === "NGN" ? "en-NG" : "en-NG";
  return new Intl.NumberFormat(locale, {
    style: "currency",
    currency,
    minimumFractionDigits: 0,
  }).format(minorUnits / 100);
}

// Convenience alias — Naira is the only supported currency for now.
export function formatNaira(kobo: number): string {
  return formatMoney(kobo, "NGN");
}

// Calculate the next billing date from a given date.
export function getNextBillingDate(from: Date, interval: BillingInterval): Date {
  const next = new Date(from);
  if (interval === "monthly") {
    next.setMonth(next.getMonth() + 1);
  } else if (interval === "quarterly") {
    next.setMonth(next.getMonth() + 3);
  } else {
    next.setFullYear(next.getFullYear() + 1);
  }
  return next;
}

// Effective subscription price (kobo): custom override if set, else plan price,
// scaled by the billing interval.
export function getEffectivePrice(
  planMonthlyPrice: number,
  customMonthlyPrice: number | null,
  billingInterval: BillingInterval
): number {
  const monthlyPrice = customMonthlyPrice ?? planMonthlyPrice;
  if (billingInterval === "monthly") return monthlyPrice;
  if (billingInterval === "quarterly") return monthlyPrice * 3;
  return monthlyPrice * 12;
}

// Coerce a raw JSONB value (Json) into a typed VolumeTier[].
export function asTiers(value: unknown): VolumeTier[] {
  if (!Array.isArray(value)) return [];
  return value as VolumeTier[];
}
