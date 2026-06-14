// ── Public brand page (tagitlux.com/[slug]) ─────────────────────────────────
// Shared logic for slug generation/validation, the luxury colour palette, the
// font resolver, and shaping a brand's products into the safe public payload.
// Used by the dashboard settings section, the /api/company/page routes, the
// public /api/brand/[slug] route, and app/[slug]/page.tsx.

import type { TagStatus } from "@/types/database";
import { resolveField } from "@/lib/industry-fields";

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
  /** Legible text/icon colour to place ON an accent-filled surface. */
  onAccent: string;
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

// Parse a #RGB / #RRGGBB string to [r,g,b], or null if not a valid hex.
function parseHex(value: string | null | undefined): [number, number, number] | null {
  if (!value) return null;
  let hex = value.trim().replace(/^#/, "");
  if (/^[0-9a-f]{3}$/i.test(hex)) hex = hex.split("").map((c) => c + c).join("");
  if (!/^[0-9a-f]{6}$/i.test(hex)) return null;
  const int = parseInt(hex, 16);
  return [(int >> 16) & 255, (int >> 8) & 255, int & 255];
}

function toHex([r, g, b]: [number, number, number]): string {
  return "#" + [r, g, b].map((c) => Math.max(0, Math.min(255, Math.round(c))).toString(16).padStart(2, "0")).join("");
}

/** rgba() string from a hex (falls back to the raw value if unparseable). */
function withAlpha(value: string, alpha: number): string {
  const rgb = parseHex(value);
  if (!rgb) return value;
  return `rgba(${rgb[0]}, ${rgb[1]}, ${rgb[2]}, ${alpha})`;
}

// WCAG relative luminance + contrast ratio, used to guarantee legible text.
function luminance([r, g, b]: [number, number, number]): number {
  const ch = [r, g, b].map((v) => {
    const s = v / 255;
    return s <= 0.03928 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4;
  });
  return 0.2126 * ch[0] + 0.7152 * ch[1] + 0.0722 * ch[2];
}

function contrast(a: [number, number, number], b: [number, number, number]): number {
  const la = luminance(a);
  const lb = luminance(b);
  return (Math.max(la, lb) + 0.05) / (Math.min(la, lb) + 0.05);
}

const ONYX: [number, number, number] = [10, 10, 11];
const PEARL: [number, number, number] = [250, 250, 248];

// Mix two colours by ratio t (0 = a, 1 = b).
function mix(a: [number, number, number], b: [number, number, number], t: number): [number, number, number] {
  return [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, a[2] + (b[2] - a[2]) * t];
}

// Pick a candidate colour only if it reads clearly against `bg`; otherwise fall
// back to pure onyx or pearl (whichever contrasts better). This is what stops
// white-on-white / dark-on-dark when a brand's customisation colours, which were
// authored for the dark-header scan page, don't suit a light editorial page.
function legibleInk(
  candidate: [number, number, number] | null,
  bg: [number, number, number],
  minRatio: number,
): [number, number, number] {
  if (candidate && contrast(candidate, bg) >= minRatio) return candidate;
  return contrast(ONYX, bg) >= contrast(PEARL, bg) ? ONYX : PEARL;
}

export function resolvePalette(brand: BrandColors): BrandPalette {
  const bg = parseHex(brand.brand_text_color) ?? PEARL;
  const isLightBg = luminance(bg) > 0.4;

  // Primary text must be highly legible (AA body ≈ 4.5).
  const textPrimary = legibleInk(parseHex(brand.brand_primary_color), bg, 4.5);

  // Secondary text is muted but must still be readable (≈ 3.0). If the brand's
  // colour is too faint, derive a muted tone from the primary ink toward the bg.
  const secondaryCandidate = parseHex(brand.brand_secondary_color);
  const textSecondary =
    secondaryCandidate && contrast(secondaryCandidate, bg) >= 3
      ? secondaryCandidate
      : mix(textPrimary, bg, isLightBg ? 0.42 : 0.4);

  // Accent (gold) drives badges + CTAs. Keep the brand's accent if it has at
  // least light contrast; otherwise the luxury gold, nudged toward the ink if
  // the gold itself is too low-contrast on this background.
  const accentCandidate = parseHex(brand.brand_accent_color);
  const gold = parseHex(DEFAULTS.accent)!;
  let accent =
    accentCandidate && contrast(accentCandidate, bg) >= 2.6 ? accentCandidate : gold;
  if (contrast(accent, bg) < 2.6) accent = mix(accent, textPrimary, 0.45);

  // Readable text to sit on top of the accent (for filled CTA buttons).
  const onAccent = contrast(ONYX, accent) >= contrast(PEARL, accent) ? ONYX : PEARL;

  return {
    background: toHex(bg),
    textPrimary: toHex(textPrimary),
    textSecondary: toHex(textSecondary),
    accent: toHex(accent),
    onAccent: toHex(onAccent),
    divider: withAlpha(toHex(textPrimary), 0.1),
    badgeBg: withAlpha(toHex(accent), isLightBg ? 0.12 : 0.18),
    badgeText: toHex(accent),
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

// ── Product detail shaping ──────────────────────────────────────────────────
// The detail page additionally exposes every uploaded photo and the product's
// own attribute fields (materials, made in, dimensions, …). These are product
// specs the brand entered — never chip, tag, ownership, scan or transfer data.

export type ProductSpec = { label: string; value: string };

export type PublicProductDetail = PublicProduct & {
  photos: string[];
  specs: ProductSpec[];
};

// Keys handled elsewhere (name, edition, long-form description) — not repeated
// in the spec list.
const SPEC_EXCLUDE = new Set<string>([
  "product_name", "title", "item_name",
  "edition_number", "edition_size",
  ...DESCRIPTION_KEYS,
]);

function buildSpecs(fields: Record<string, unknown>): ProductSpec[] {
  const specs: ProductSpec[] = [];
  for (const [key, raw] of Object.entries(fields)) {
    if (SPEC_EXCLUDE.has(key)) continue;
    const value = typeof raw === "string" ? raw.trim() : typeof raw === "number" ? String(raw) : "";
    if (!value) continue;
    specs.push({ label: resolveField(key).label, value });
  }
  return specs;
}

export function toPublicProductDetail(raw: RawProduct): PublicProductDetail | null {
  const base = toPublicProduct(raw);
  if (!base) return null;

  const fields = (raw.industry_fields && typeof raw.industry_fields === "object"
    ? raw.industry_fields
    : {}) as Record<string, unknown>;

  return {
    ...base,
    photos: (raw.photos ?? []).filter((p): p is string => typeof p === "string" && !!p),
    specs: buildSpecs(fields),
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
