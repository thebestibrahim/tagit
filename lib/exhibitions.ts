// ── Exhibition QR info codes ─────────────────────────────────────────────────
// Shared logic for the exhibition info-page feature: token generation, the
// public info URL, and shaping a product's REGISTRATION record into the only
// fields an info page (or its AI chat) may ever show. Ownership, transfers,
// scans and tokens are never part of these payloads.
//
// This is purely an information layer. It plays no role in authentication or
// ownership — the NFC chip and card remain the sole root of trust.

import { nanoid } from "nanoid";
import { INDUSTRY_FIELDS, resolveField, inferIndustry } from "@/lib/industry-fields";

// Info codes are printed on placards whose URLs must resolve in production
// regardless of which environment generated them — same rationale as tag URLs.
const INFO_ORIGIN = "https://tagitlux.com";

// Reuse the exact unguessable token shape used for tags/cards (nanoid(21),
// ~126 bits of entropy). Info tokens are NOT HMAC-signed: they gate nothing and
// carry no authenticity meaning, so there is no signature to verify.
export function generateInfoToken(): string {
  return nanoid(21);
}

/** Public info-page URL for a token (what the QR code encodes). */
export function infoUrl(token: string): string {
  return `${INFO_ORIGIN}/info/${token}`;
}

// ── Registration-field shaping ───────────────────────────────────────────────
// The info page shows only what the brand entered at product registration:
// name, photos, and the structured industry fields (medium, dimensions, artist
// statement, story, …). Long-form (textarea) fields render as "stories"; the
// rest render as compact specs. Mirrors the scan page's field derivation so the
// same content surfaces, minus anything to do with ownership.

export type InfoSpec = { key: string; label: string; value: string };

export type InfoProduct = {
  name: string;
  photos: string[];
  /** Short attribute fields: medium, dimensions, materials, year, … */
  specs: InfoSpec[];
  /** Long-form fields: artist statement, story, design notes, … */
  stories: InfoSpec[];
};

type RawInfoProduct = {
  name: string;
  industry_fields: Record<string, unknown> | null;
  photos: string[] | null;
};

/**
 * Ordered, non-empty registration fields split into specs (short) and stories
 * (long-form). Field order follows the industry schema, then any extra stored
 * keys — identical to the scan page so nothing is silently dropped.
 */
export function shapeInfoProduct(raw: RawInfoProduct, industry: string): InfoProduct {
  const stored = (raw.industry_fields && typeof raw.industry_fields === "object"
    ? raw.industry_fields
    : {}) as Record<string, unknown>;

  const storedKeys = Object.keys(stored).filter(
    (k) => String(stored[k] ?? "").trim() !== ""
  );
  const effectiveIndustry = inferIndustry(storedKeys, industry);
  const schemaKeys = (INDUSTRY_FIELDS[effectiveIndustry] ?? []).map((f) => f.key);
  const orderedKeys = [
    ...schemaKeys.filter((k) => storedKeys.includes(k)),
    ...storedKeys.filter((k) => !schemaKeys.includes(k)),
  ];

  const specs: InfoSpec[] = [];
  const stories: InfoSpec[] = [];
  for (const key of orderedKeys) {
    const def = resolveField(key);
    const value = String(stored[key]).trim();
    const entry: InfoSpec = { key, label: def.label, value };
    if (def.type === "textarea") stories.push(entry);
    else specs.push(entry);
  }

  return {
    name: raw.name,
    photos: (raw.photos ?? []).filter((p): p is string => typeof p === "string" && !!p),
    specs,
    stories,
  };
}

// ── AI grounding ─────────────────────────────────────────────────────────────
// The optional info-page chat must answer STRICTLY from the registration record
// of this one product. It must refuse or redirect on anything outside it —
// price, availability, current owner, sale history, authenticity claims.

/**
 * System prompt for the info-page assistant. Built only from the shaped
 * registration fields, with hard rules forbidding out-of-scope answers. Kept
 * here (not inline in the route) so the grounding is unit-testable.
 */
export function buildInfoSystemPrompt(opts: {
  brandName: string;
  personaName: string;
  product: InfoProduct;
}): string {
  const { brandName, personaName, product } = opts;

  const facts = [
    `Name: ${product.name}`,
    ...product.specs.map((s) => `${s.label}: ${s.value}`),
    ...product.stories.map((s) => `${s.label}: ${s.value}`),
  ].join("\n");

  return [
    `You are ${personaName}, a calm, knowledgeable gallery guide for ${brandName}.`,
    `A visitor at an exhibition has scanned a QR code beside this piece to learn more about it.`,
    "",
    "--- THE ONLY INFORMATION YOU HAVE ABOUT THIS PIECE ---",
    facts,
    "--- END OF INFORMATION ---",
    "",
    "STRICT RULES:",
    "1. Answer ONLY using the information above. It is the entire extent of what you know.",
    "2. If a question cannot be answered from that information, say you do not have that detail, then offer to share what you do know about the piece.",
    "3. NEVER discuss or estimate price, availability, whether it is for sale, sale history, current or past owners, or provenance. For any commercial or purchase question, do not speculate; invite the visitor to use the enquiry option on the page to reach the brand.",
    "4. NEVER make authenticity or verification claims. This page is reference information only and is not a proof of authenticity. If asked whether the piece is authentic, explain that this QR page is informational only and authenticity is confirmed separately by the brand.",
    "5. Do not invent facts, measurements, materials or history that are not listed above.",
    "6. Keep replies warm, brief (2-3 sentences), and never break character.",
  ].join("\n");
}
