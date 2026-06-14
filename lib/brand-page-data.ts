import { createAdminClient } from "@/lib/supabase/admin";
import {
  resolvePalette,
  toPublicProduct,
  toPublicProductDetail,
  type PublicProduct,
  type PublicProductDetail,
  type BrandPalette,
} from "@/lib/brand-page";

// Server-side loaders for the public brand page. Reads through the service-role
// client (same pattern as /v/[token]) and returns ONLY fields that are safe to
// expose publicly. No tag ids, tokens, HMAC, ownership, scans or transfers.

export type PublicBrand = {
  id: string;
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

export type PublicBrandProduct = {
  brand: PublicBrand;
  product: PublicProductDetail;
};

const COMPANY_SELECT =
  "id, name, slug, logo_url, page_bio, page_enabled, contact_phone, brand_primary_color, brand_secondary_color, brand_accent_color, brand_text_color, brand_font";

const PRODUCT_SELECT = "id, name, photos, retail_price, currency, industry_fields, created_at, tags(status)";

type CompanyRow = {
  id: string;
  name: string;
  slug: string | null;
  logo_url: string | null;
  page_bio: string | null;
  page_enabled: boolean | null;
  contact_phone: string | null;
  brand_primary_color: string | null;
  brand_secondary_color: string | null;
  brand_accent_color: string | null;
  brand_text_color: string | null;
  brand_font: string | null;
};

function toPublicBrand(company: CompanyRow): PublicBrand {
  return {
    id: company.id,
    name: company.name,
    slug: company.slug!,
    logo_url: company.logo_url,
    bio: company.page_bio,
    whatsapp_number: company.contact_phone,
    baseFont: company.brand_font,
    palette: resolvePalette(company),
  };
}

// Loads a published brand by slug, or null. Shared by the page + detail loaders.
async function loadPublishedBrand(slug: string): Promise<CompanyRow | null> {
  const normalized = slug.trim().toLowerCase();
  if (!normalized) return null;

  const { data } = await createAdminClient()
    .from("companies")
    .select(COMPANY_SELECT)
    .eq("slug", normalized)
    .maybeSingle();

  const company = data as CompanyRow | null;
  if (!company || !company.page_enabled) return null;
  return company;
}

// Returns null when the slug doesn't exist or the page isn't published — the
// caller renders a 404 either way, so we never reveal which slugs exist.
export async function getPublicBrandPage(slug: string): Promise<PublicBrandPage | null> {
  const company = await loadPublishedBrand(slug);
  if (!company) return null;

  const { data: rawProducts } = await createAdminClient()
    .from("products")
    .select(PRODUCT_SELECT)
    .eq("company_id", company.id)
    .order("created_at", { ascending: false });

  const products = (rawProducts ?? [])
    .map((p) => toPublicProduct(p))
    .filter((p): p is PublicProduct => p !== null);

  return { brand: toPublicBrand(company), products };
}

// Single product on a published brand page. Returns null (→ 404) when the brand
// or product is missing, the product isn't this brand's, or it isn't publicly
// visible (no live/owned tag).
export async function getPublicBrandProduct(
  slug: string,
  productId: string,
): Promise<PublicBrandProduct | null> {
  const company = await loadPublishedBrand(slug);
  if (!company) return null;

  const { data: rawProduct } = await createAdminClient()
    .from("products")
    .select(PRODUCT_SELECT)
    .eq("id", productId)
    .eq("company_id", company.id)
    .maybeSingle();

  if (!rawProduct) return null;

  const product = toPublicProductDetail(rawProduct);
  if (!product) return null;

  return { brand: toPublicBrand(company), product };
}
