import { describe, it, expect } from "vitest";
import {
  slugify,
  validateSlug,
  resolvePalette,
  productStatus,
  toPublicProduct,
  whatsappEnquiryUrl,
  normalizePhone,
  type BrandColors,
} from "@/lib/brand-page";

// WCAG relative-luminance contrast ratio, recomputed here so the test is an
// independent check on resolvePalette (not reusing its private helpers).
function contrastRatio(a: string, b: string): number {
  const lum = (hex: string) => {
    const int = parseInt(hex.replace("#", ""), 16);
    const ch = [(int >> 16) & 255, (int >> 8) & 255, int & 255].map((v) => {
      const s = v / 255;
      return s <= 0.03928 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4;
    });
    return 0.2126 * ch[0] + 0.7152 * ch[1] + 0.0722 * ch[2];
  };
  const la = lum(a);
  const lb = lum(b);
  return (Math.max(la, lb) + 0.05) / (Math.min(la, lb) + 0.05);
}

const NO_CUSTOMISATION: BrandColors = {
  brand_primary_color: null,
  brand_secondary_color: null,
  brand_accent_color: null,
  brand_text_color: null,
};

describe("slugify", () => {
  it("lowercases and hyphenates a company name", () => {
    expect(slugify("Ounje Studio")).toBe("ounje-studio");
    expect(slugify("Bushua Art")).toBe("bushua-art");
  });
  it("strips accents and special characters", () => {
    expect(slugify("Atelier Moréttï!")).toBe("atelier-moretti");
    expect(slugify("Salt & Stone")).toBe("salt-and-stone");
  });
});

describe("validateSlug", () => {
  it("accepts a clean slug", () => {
    expect(validateSlug("ounje-studio")).toEqual({ valid: true, slug: "ounje-studio" });
  });
  it("rejects reserved paths, bad chars, and bad length", () => {
    expect(validateSlug("admin").valid).toBe(false);
    expect(validateSlug("api").valid).toBe(false);
    expect(validateSlug("Has Spaces").valid).toBe(false);
    expect(validateSlug("ab").valid).toBe(false);
  });
});

describe("resolvePalette legibility", () => {
  it("uses luxury defaults with strong contrast when uncustomised", () => {
    const p = resolvePalette(NO_CUSTOMISATION);
    expect(p.background).toBe("#fafaf8");
    expect(contrastRatio(p.textPrimary, p.background)).toBeGreaterThanOrEqual(4.5);
    expect(contrastRatio(p.textSecondary, p.background)).toBeGreaterThanOrEqual(3);
  });

  it("never produces low-contrast text, even when brand colours would invert", () => {
    // A brand whose customisation makes background AND primary both near-white
    // (the white-on-white case). Primary text must fall back to something legible.
    const nasty: BrandColors = {
      brand_text_color: "#FFFFFF", // -> background
      brand_primary_color: "#FAFAFA", // -> would be invisible text
      brand_secondary_color: "#F2F2F2",
      brand_accent_color: "#FEFEFE",
    };
    const p = resolvePalette(nasty);
    expect(contrastRatio(p.textPrimary, p.background)).toBeGreaterThanOrEqual(4.5);
    expect(contrastRatio(p.textSecondary, p.background)).toBeGreaterThanOrEqual(3);
    expect(contrastRatio(p.badgeText, p.background)).toBeGreaterThan(2.5);
    expect(contrastRatio(p.onAccent, p.accent)).toBeGreaterThanOrEqual(4.5);
  });

  it("keeps legible custom colours and gives readable text on a dark background", () => {
    const dark: BrandColors = {
      brand_text_color: "#101014", // dark background
      brand_primary_color: "#FFFFFF",
      brand_secondary_color: "#9A9AA0",
      brand_accent_color: "#C8A45D",
    };
    const p = resolvePalette(dark);
    expect(contrastRatio(p.textPrimary, p.background)).toBeGreaterThanOrEqual(4.5);
    expect(contrastRatio(p.textSecondary, p.background)).toBeGreaterThanOrEqual(3);
  });
});

describe("productStatus + toPublicProduct", () => {
  it("maps live -> available and owned -> owned, hides everything else", () => {
    expect(productStatus([{ status: "live" }])).toBe("available");
    expect(productStatus([{ status: "owned" }])).toBe("owned");
    expect(productStatus([{ status: "shipped" }])).toBeNull();
    expect(productStatus([{ status: "created" }, { status: "flagged" }])).toBeNull();
    // live wins over owned when a product carries multiple tags
    expect(productStatus([{ status: "owned" }, { status: "live" }])).toBe("available");
  });

  it("shapes a public product and omits non-public ones", () => {
    const live = toPublicProduct({
      id: "p1",
      name: "The Onyx Blazer",
      photos: ["https://x/1.jpg", "https://x/2.jpg"],
      retail_price: 180000,
      currency: "NGN",
      industry_fields: { edition_number: "3", edition_size: "10", design_notes: "Cut from one bolt." },
      tags: [{ status: "live" }],
    });
    expect(live).toMatchObject({
      id: "p1",
      photo: "https://x/1.jpg",
      price: 180000,
      edition: "Edition 3 of 10",
      description: "Cut from one bolt.",
      status: "available",
    });

    const hidden = toPublicProduct({
      id: "p2", name: "Draft", photos: null, retail_price: null,
      currency: null, industry_fields: {}, tags: [{ status: "created" }],
    });
    expect(hidden).toBeNull();
  });
});

describe("whatsappEnquiryUrl", () => {
  it("builds a wa.me link with a normalised number and pre-filled text", () => {
    const url = whatsappEnquiryUrl("+234 (0) 801-234-5678", "The Onyx Blazer", "ounje-studio");
    expect(url).toContain("https://wa.me/2340801234567");
    expect(url).toContain(encodeURIComponent("The Onyx Blazer"));
    expect(url).toContain(encodeURIComponent("tagitlux.com/ounje-studio"));
  });
  it("returns null when there is no usable number", () => {
    expect(whatsappEnquiryUrl(null, "x", "y")).toBeNull();
    expect(whatsappEnquiryUrl("123", "x", "y")).toBeNull();
    expect(normalizePhone("abc")).toBeNull();
  });
});
