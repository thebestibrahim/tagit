import { describe, it, expect } from "vitest";
import {
  calculateChipOrderTotal,
  getPricePerUnit,
  applyDiscount,
  getNextBillingDate,
  getEffectivePrice,
  formatNaira,
} from "@/lib/billing/pricing";
import type { VolumeTier } from "@/types/database";

const TIERS: VolumeTier[] = [
  { min: 1, max: 50, price_per_unit: 400000 },
  { min: 51, max: 100, price_per_unit: 350000 },
  { min: 101, max: 200, price_per_unit: 300000 },
  { min: 201, max: null, price_per_unit: 250000 },
];

describe("calculateChipOrderTotal", () => {
  it("applies 1-50 tier correctly", () => expect(calculateChipOrderTotal(10, TIERS)).toBe(10 * 400000));
  it("applies 51-100 tier correctly", () => expect(calculateChipOrderTotal(75, TIERS)).toBe(75 * 350000));
  it("applies 101-200 tier correctly", () => expect(calculateChipOrderTotal(150, TIERS)).toBe(150 * 300000));
  it("applies 200+ tier correctly", () => expect(calculateChipOrderTotal(500, TIERS)).toBe(500 * 250000));

  it("applies correct tier at exact boundary: 50 units", () => expect(getPricePerUnit(50, TIERS)).toBe(400000));
  it("applies correct tier at exact boundary: 51 units", () => expect(getPricePerUnit(51, TIERS)).toBe(350000));
  it("applies correct tier at exact boundary: 100 units", () => expect(getPricePerUnit(100, TIERS)).toBe(350000));
  it("applies correct tier at exact boundary: 101 units", () => expect(getPricePerUnit(101, TIERS)).toBe(300000));

  it("uses custom brand tiers when provided", () => {
    const custom: VolumeTier[] = [{ min: 1, max: null, price_per_unit: 100000 }];
    expect(calculateChipOrderTotal(30, custom)).toBe(30 * 100000);
  });

  it("throws when quantity has no matching tier", () => {
    expect(() => calculateChipOrderTotal(0, TIERS)).toThrow();
  });
});

describe("applyDiscount", () => {
  it("calculates 20% discount correctly", () => expect(applyDiscount(1000000, 20)).toEqual({ discountAmount: 200000, finalAmount: 800000 }));
  it("calculates 50% discount correctly", () => expect(applyDiscount(1000000, 50)).toEqual({ discountAmount: 500000, finalAmount: 500000 }));
  it("calculates 100% discount — free invoice", () => expect(applyDiscount(1000000, 100)).toEqual({ discountAmount: 1000000, finalAmount: 0 }));
  it("rounds kobo correctly on odd amounts", () => {
    // 333 * 33% = 109.89 -> rounds to 110
    expect(applyDiscount(333, 33).discountAmount).toBe(110);
  });
  it("returns zero discount for 0%", () => expect(applyDiscount(1000000, 0)).toEqual({ discountAmount: 0, finalAmount: 1000000 }));
});

describe("getNextBillingDate", () => {
  it("adds 1 month for monthly", () => expect(getNextBillingDate(new Date("2026-01-15"), "monthly").toISOString().slice(0, 10)).toBe("2026-02-15"));
  it("adds 3 months for quarterly", () => expect(getNextBillingDate(new Date("2026-01-15"), "quarterly").toISOString().slice(0, 10)).toBe("2026-04-15"));
  it("adds 12 months for annually", () => expect(getNextBillingDate(new Date("2026-01-15"), "annually").toISOString().slice(0, 10)).toBe("2027-01-15"));
  it("handles end-of-month overflow (Jan 31 + 1 month rolls into March)", () => {
    // JS Date arithmetic overflows Feb; documented behaviour locked by this test.
    expect(getNextBillingDate(new Date("2026-01-31"), "monthly").getUTCMonth()).toBe(2);
  });
});

describe("getEffectivePrice", () => {
  it("uses custom price when set", () => expect(getEffectivePrice(15000000, 12000000, "monthly")).toBe(12000000));
  it("uses plan price when custom is null", () => expect(getEffectivePrice(15000000, null, "monthly")).toBe(15000000));
  it("multiplies by 3 for quarterly", () => expect(getEffectivePrice(15000000, null, "quarterly")).toBe(45000000));
  it("multiplies by 12 for annually", () => expect(getEffectivePrice(15000000, null, "annually")).toBe(180000000));
});

describe("formatNaira", () => {
  it("formats kobo into NGN with no decimals", () => {
    const s = formatNaira(15000000);
    expect(s).toContain("150,000");
  });
});
