// Server-only helpers for the info-code feature. Kept apart from
// lib/exhibitions.ts (pure, unit-tested) because these touch the service-role
// client.

import { createAdminClient } from "@/lib/supabase/admin";
import { generateInfoToken, shapeInfoProduct, type InfoProduct } from "@/lib/exhibitions";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Admin = any;

export type NewInfoCode = {
  id: string;
  token: string;
  status: string;
  scan_count: number;
  product_id: string;
};

/**
 * Insert a fresh active info code for one product in an exhibition. Generates an
 * unguessable token (same shape as tag tokens). Caller is responsible for
 * having verified brand ownership and that no current code already exists.
 */
export async function insertInfoCode(
  admin: Admin,
  opts: { exhibition_id: string; product_id: string; company_id: string }
): Promise<NewInfoCode | null> {
  const { data, error } = await admin
    .from("info_codes")
    .insert({
      exhibition_id: opts.exhibition_id,
      product_id: opts.product_id,
      company_id: opts.company_id,
      token: generateInfoToken(),
      status: "active",
    })
    .select("id, token, status, scan_count, product_id")
    .single();

  if (error || !data) return null;
  return data as NewInfoCode;
}

// ── Public info-page read + scan recording ───────────────────────────────────

export type InfoBrand = {
  name: string;
  logo_url: string | null;
  slug: string | null;
  /** Public brand page exists (page_enabled + slug) → expired page can link to it. */
  hasPublicPage: boolean;
  whatsapp_number: string | null;
  // Customisation colours / font for the editorial info-page theming.
  brand_primary_color: string | null;
  brand_secondary_color: string | null;
  brand_accent_color: string | null;
  brand_text_color: string | null;
  brand_font: string | null;
  ai_enabled: boolean;
  ai_persona_name: string | null;
};

export type InfoPageResult =
  | {
      status: "active";
      codeId: string;
      companyId: string;
      scanCount: number;
      product: InfoProduct;
      brand: InfoBrand;
    }
  | {
      status: "expired";
      // Slug only when the brand has a published public page (else null).
      brandSlug: string | null;
      brandName: string | null;
    };

type CodeRow = {
  id: string;
  status: string;
  scan_count: number;
  product_id: string;
  company_id: string;
};

type CompanyRow = {
  name: string;
  logo_url: string | null;
  slug: string | null;
  page_enabled: boolean | null;
  contact_phone: string | null;
  brand_primary_color: string | null;
  brand_secondary_color: string | null;
  brand_accent_color: string | null;
  brand_text_color: string | null;
  brand_font: string | null;
  ai_enabled: boolean | null;
  ai_persona_name: string | null;
};

async function loadBrand(admin: Admin, companyId: string): Promise<CompanyRow | null> {
  const { data } = await admin
    .from("companies")
    .select(
      "name, logo_url, slug, page_enabled, contact_phone, brand_primary_color, brand_secondary_color, brand_accent_color, brand_text_color, brand_font, ai_enabled, ai_persona_name"
    )
    .eq("id", companyId)
    .maybeSingle();
  return (data as CompanyRow | null) ?? null;
}

/**
 * Pure read for a public info token (NO side effects). Returns the active
 * payload — only registration fields + brand identity, never ownership of any
 * kind — or an `expired` result for a missing, inactive or revoked code. The
 * expired result carries the brand slug only when the brand has a public page.
 */
export async function readInfoCode(token: string): Promise<InfoPageResult> {
  const admin = createAdminClient() as Admin;

  const { data: codeData } = await admin
    .from("info_codes")
    .select("id, status, scan_count, product_id, company_id")
    .eq("token", token)
    .maybeSingle();

  const code = codeData as CodeRow | null;

  // Not found, inactive or revoked → graceful expired state. We still try to
  // surface the brand's public page link when one exists.
  if (!code || code.status !== "active") {
    if (!code) return { status: "expired", brandSlug: null, brandName: null };
    const brand = await loadBrand(admin, code.company_id);
    const hasPage = !!(brand?.page_enabled && brand?.slug);
    return {
      status: "expired",
      brandSlug: hasPage ? brand!.slug : null,
      brandName: brand?.name ?? null,
    };
  }

  const [{ data: productData }, brand] = await Promise.all([
    admin
      .from("products")
      .select("name, industry_fields, photos")
      .eq("id", code.product_id)
      .maybeSingle(),
    loadBrand(admin, code.company_id),
  ]);

  const rawProduct = (productData as { name: string; industry_fields: Record<string, unknown> | null; photos: string[] | null } | null) ?? {
    name: "Untitled",
    industry_fields: {},
    photos: [],
  };

  // industry is inferred from the stored field keys (no tag context here).
  const product = shapeInfoProduct(rawProduct, "");

  return {
    status: "active",
    codeId: code.id,
    companyId: code.company_id,
    scanCount: code.scan_count,
    product,
    brand: {
      name: brand?.name ?? "",
      logo_url: brand?.logo_url ?? null,
      slug: brand?.slug ?? null,
      hasPublicPage: !!(brand?.page_enabled && brand?.slug),
      whatsapp_number: brand?.contact_phone ?? null,
      brand_primary_color: brand?.brand_primary_color ?? null,
      brand_secondary_color: brand?.brand_secondary_color ?? null,
      brand_accent_color: brand?.brand_accent_color ?? null,
      brand_text_color: brand?.brand_text_color ?? null,
      brand_font: brand?.brand_font ?? null,
      ai_enabled: !!brand?.ai_enabled,
      ai_persona_name: brand?.ai_persona_name ?? null,
    },
  };
}

type HeaderLike = { get(name: string): string | null };

/**
 * Record one info-code scan: bump scan_count and append a scan_logs row tagged
 * with source `qr_exhibition` (reusing the existing scan-logging table). Best
 * effort and fire-and-forget — never blocks or breaks the page render.
 */
export async function recordInfoScan(
  codeId: string,
  currentCount: number,
  headerStore: HeaderLike
): Promise<void> {
  const admin = createAdminClient() as Admin;

  const ip = headerStore.get("x-forwarded-for") ?? headerStore.get("x-real-ip") ?? null;
  const userAgent = headerStore.get("user-agent") ?? null;
  const country = headerStore.get("x-vercel-ip-country");
  const region = headerStore.get("x-vercel-ip-country-region");
  const city = headerStore.get("x-vercel-ip-city");
  const geo =
    country || region || city
      ? { country: country ?? null, region: region ?? null, city: city ? decodeURIComponent(city) : null }
      : null;

  await Promise.all([
    admin.from("info_codes").update({ scan_count: currentCount + 1 }).eq("id", codeId),
    admin.from("scan_logs").insert({
      tag_id: null,
      info_code_id: codeId,
      source: "qr_exhibition",
      scan_result: "info",
      ip_address: ip,
      user_agent: userAgent,
      geo_location: geo,
    }),
  ]).then(() => {}).catch(() => {});
}
