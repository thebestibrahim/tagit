import { createAdminClient } from "@/lib/supabase/admin";
import { resolvePalette, toPublicProduct, type PublicProduct, type BrandPalette } from "@/lib/brand-page";

// Server-side loader for the public brand page. Reads through the service-role
// client (same pattern as /v/[token]) and returns ONLY fields that are safe to
// expose publicly. No tag ids, tokens, HMAC, ownership, scans or transfers.

export type PublicBrand = {
  name: string;
  slug: string;
  logo_url: string | null;
  bio: string | null;
  whatsapp_number: string | null;
  baseFont: string | null;
  palette: BrandPalette;
};

export type PublicBrandPage = {
  brand: PublicBrand;
  products: PublicProduct[];
};

// Returns null when the slug doesn't exist or the page isn't published — the
// caller renders a 404 either way, so we never reveal which slugs exist.
export async function getPublicBrandPage(slug: string): Promise<PublicBrandPage | null> {
  const normalized = slug.trim().toLowerCase();
  if (!normalized) return null;

  const admin = createAdminClient();

  const { data: company } = await admin
    .from("companies")
    .select(
      "id, name, slug, logo_url, page_bio, page_enabled, contact_phone, brand_primary_color, brand_secondary_color, brand_accent_color, brand_text_color, brand_font",
    )
    .eq("slug", normalized)
    .maybeSingle();

  if (!company || !company.page_enabled) return null;

  const { data: rawProducts } = await admin
    .from("products")
    .select("id, name, photos, retail_price, currency, industry_fields, created_at, tags(status)")
    .eq("company_id", company.id)
    .order("created_at", { ascending: false });

  const products = (rawProducts ?? [])
    .map((p) => toPublicProduct(p))
    .filter((p): p is PublicProduct => p !== null);

  return {
    brand: {
      name: company.name,
      slug: company.slug!,
      logo_url: company.logo_url,
      bio: company.page_bio,
      whatsapp_number: company.contact_phone,
      baseFont: company.brand_font,
      palette: resolvePalette(company),
    },
    products,
  };
}
