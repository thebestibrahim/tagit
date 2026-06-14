// ── Public brand page (tagitlux.com/[slug]) ─────────────────────────────────
// Shared logic for slug generation/validation, the luxury colour palette, the
// font resolver, and shaping a brand's products into the safe public payload.
// Used by the dashboard settings section, the /api/company/page routes, the
// public /api/brand/[slug] route, and app/[slug]/page.tsx.

import type { TagStatus } from "@/types/database";

// ── Slug rules ──────────────────────────────────────────────────────────────
// Lowercase letters, digits and single hyphens; 3–40 chars; must not collide
// with a real top-level route or a name we want to keep reserved.

export const SLUG_MIN = 3;
export const SLUG_MAX = 40;

// The spec's reserved list, plus every real top-level path segment in the app
// so a brand slug can never shadow an existing route. Catch-all dynamic routes
// always lose to static segments in the App Router, but we 404 these anyway so
// the URLs stay predictable and safe.
export const RESERVED_SLUGS = new Set<string>([
  // from the brand-page spec
  "admin", "dashboard", "api", "v", "auth", "login", "signup",
  "settings", "billing", "features", "pricing", "about",
  "contact", "privacy", "terms", "health",
  // additional real top-level segments / reserved words
  "control", "certificate", "dev", "register", "signin", "sign-in",
  "robots", "sitemap", "icon", "apple-icon", "favicon", "og-default",
  "well-known", "_next", "static", "public", "brand", "tagit", "www",
]);

const SLUG_PATTERN = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

/** Turn an arbitrary string (usually a company name) into a candidate slug. */
export function slugify(input: string): string {
  return input
    .toLowerCase()
    .trim()
    // strip accents/diacritics so "Atelier Moréttï" -> "atelier-moretti"
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/&/g, " and ")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, SLUG_MAX)
    .replace(/-+$/g, "");
}

export type SlugValidation = { valid: true; slug: string } | { valid: false; error: string };

/** Validate a user-supplied slug against format + reserved-list rules. */
export function validateSlug(raw: string): SlugValidation {
  const slug = (raw ?? "").trim().toLowerCase();

  if (!slug) return { valid: false, error: "Enter a slug." };
  if (slug.length < SLUG_MIN) return { valid: false, error: `Slug must be at least ${SLUG_MIN} characters.` };
  if (slug.length > SLUG_MAX) return { valid: false, error: `Slug must be ${SLUG_MAX} characters or fewer.` };
  if (!SLUG_PATTERN.test(slug)) {
    return { valid: false, error: "Use lowercase letters, numbers and hyphens only (no spaces or special characters)." };
  }
  if (RESERVED_SLUGS.has(slug)) return { valid: false, error: "That slug is reserved. Choose another." };

  return { valid: true, slug };
}

// ── Colour palette ──────────────────────────────────────────────────────────
// Pulled from the brand's existing customisation fields (the same ones that
// theme the consumer scan page). Brands without the brand_customisation flag
// never write these, so they stay NULL and fall back to the luxury defaults.
//
// Field mapping (defaults line up exactly with the scan-page defaults):
//   brand_text_color    -> page background  (#FAFAF8 pearl)
//   brand_primary_color -> primary ink      (#0A0A0B onyx)
//   brand_secondary_color -> muted text     (#8A8A8E)
//   brand_accent_color  -> gold accent      (#B8945D)

export type BrandColors = {
  brand_primary_color: string | null;
  brand_secondary_color: string | null;
  brand_accent_color: string | null;
  brand_text_color: string | null;
};

export type BrandPalette = {
  background: string;
  textPrimary: string;
  textSecondary: string;
  accent: string;
  divider: string;
  badgeBg: string;
  badgeText: string;
};

const DEFAULTS = {
  background: "#FAFAF8",
  textPrimary: "#0A0A0B",
  textSecondary: "#8A8A8E",
  accent: "#B8945D",
};

/** Convert a #RRGGBB hex to an rgba() string at the given alpha. */
function withAlpha(hex: string, alpha: number): string {
  const m = /^#?([0-9a-f]{6})$/i.exec(hex.trim());
  if (!m) return hex;
  const int = parseInt(m[1], 16);
  const r = (int >> 16) & 255;
  const g = (int >> 8) & 255;
  const b = int & 255;
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

export function resolvePalette(brand: BrandColors): BrandPalette {
  const background = brand.brand_text_color || DEFAULTS.background;
  const textPrimary = brand.brand_primary_color || DEFAULTS.textPrimary;
  const textSecondary = brand.brand_secondary_color || DEFAULTS.textSecondary;
  const accent = brand.brand_accent_color || DEFAULTS.accent;

  return {
    background,
    textPrimary,
    textSecondary,
    accent,
    divider: withAlpha(textPrimary, 0.08),
    badgeBg: withAlpha(accent, 0.1),
    badgeText: accent,
  };
}

// ── Fonts ───────────────────────────────────────────────────────────────────
// Reuses the three system font CSS variables already loaded in the root layout
// (no new font families). brand_font, if set, picks the page's base family —
// the same pattern as the scan page — while the editorial scale still uses the
// display and mono variables explicitly where the design calls for them.

export const FONT_DISPLAY = "var(--font-display)";
export const FONT_BODY = "var(--font-body)";
export const FONT_MONO = "var(--font-mono)";

export function resolveBaseFont(brandFont: string | null | undefined): string {
  switch (brandFont) {
    case "display": return FONT_DISPLAY;
    case "mono": return FONT_MONO;
    default: return FONT_BODY;
  }
}

// ── Product shaping ─────────────────────────────────────────────────────────
// The public page shows only live (available) and owned (sold) pieces. Created,
// shipped, transferred, flagged, suspended and decommissioned tags are never
// surfaced. A product can carry several tags; it is "available" if any tag is
// live, otherwise "owned" if any tag is owned, otherwise it is omitted.

export type PublicProductStatus = "available" | "owned";

export type PublicProduct = {
  id: string;
  name: string;
  photo: string | null;
  price: number | null;
  currency: string;
  description: string | null;
  edition: string | null;
  status: PublicProductStatus;
};

type RawProduct = {
  id: string;
  name: string;
  photos: string[] | null;
  retail_price: number | null;
  currency: string | null;
  industry_fields: unknown;
  tags?: { status: string }[] | null;
};

// Story-like keys across the industry schemas, in display preference order.
const DESCRIPTION_KEYS = [
  "design_notes", "inspiration", "artist_statement", "story", "design_story",
];

function pickDescription(fields: Record<string, unknown>): string | null {
  for (const key of DESCRIPTION_KEYS) {
    const v = fields[key];
    if (typeof v === "string" && v.trim()) return v.trim();
  }
  return null;
}

/** Human edition label, e.g. "Edition 3 of 50", "Edition 12/50", or null. */
function pickEdition(fields: Record<string, unknown>): string | null {
  const number = fields.edition_number;
  const size = fields.edition_size;
  const numStr = typeof number === "string" || typeof number === "number" ? String(number).trim() : "";
  const sizeStr = typeof size === "string" || typeof size === "number" ? String(size).trim() : "";

  if (numStr && sizeStr && /^\d+$/.test(numStr) && /^\d+$/.test(sizeStr)) {
    return `Edition ${numStr} of ${sizeStr}`;
  }
  if (numStr) return `Edition ${numStr}`;
  if (sizeStr && /^\d+$/.test(sizeStr)) return `Edition of ${sizeStr}`;
  return null;
}

/** Resolve a product's public status from its tags, or null to omit it. */
export function productStatus(tags: { status: string }[] | null | undefined): PublicProductStatus | null {
  const statuses = (tags ?? []).map((t) => t.status as TagStatus);
  if (statuses.includes("live")) return "available";
  if (statuses.includes("owned")) return "owned";
  return null;
}

/** Map a raw product row to its public payload, or null if it should be hidden. */
export function toPublicProduct(raw: RawProduct): PublicProduct | null {
  const status = productStatus(raw.tags);
  if (!status) return null;

  const fields = (raw.industry_fields && typeof raw.industry_fields === "object"
    ? raw.industry_fields
    : {}) as Record<string, unknown>;

  return {
    id: raw.id,
    name: raw.name,
    photo: raw.photos?.[0] ?? null,
    price: raw.retail_price,
    currency: raw.currency ?? "NGN",
    description: pickDescription(fields),
    edition: pickEdition(fields),
    status,
  };
}

// ── WhatsApp ────────────────────────────────────────────────────────────────

/** Strip everything but digits — international format with no + or spaces. */
export function normalizePhone(raw: string | null | undefined): string | null {
  if (!raw) return null;
  const digits = raw.replace(/\D/g, "");
  return digits.length >= 7 ? digits : null;
}

/** Build the pre-filled WhatsApp enquiry link, or null if no number on file. */
export function whatsappEnquiryUrl(
  phone: string | null | undefined,
  productName: string,
  slug: string,
): string | null {
  const number = normalizePhone(phone);
  if (!number) return null;
  const text = `Hello, I came across ${productName} on Tagit and I would like to enquire about purchasing it.\n\ntagitlux.com/${slug}`;
  return `https://wa.me/${number}?text=${encodeURIComponent(text)}`;
}
