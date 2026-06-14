import { getPublicBrandPage } from "@/lib/brand-page-data";
import { rateLimitAsync, getIp } from "@/lib/rate-limit";
import { NextResponse } from "next/server";

// GET /api/brand/[slug] — public, no auth.
// Returns the brand's identity plus its live (available) and owned (sold)
// products. Never exposes tag ids, tokens, chip/HMAC details, ownership
// records, scans or transfers. Unknown/unpublished slugs return 404 so the
// endpoint never reveals which slugs exist.
export async function GET(
  request: Request,
  { params }: { params: Promise<{ slug: string }> },
) {
  const ip = getIp(request);
  if (!(await rateLimitAsync(`brand-page:${ip}`, 60, 60_000))) {
    return NextResponse.json({ error: "Too many requests." }, { status: 429 });
  }

  const { slug } = await params;
  const page = await getPublicBrandPage(slug);
  if (!page) return NextResponse.json({ error: "Not found." }, { status: 404 });

  return NextResponse.json(
    {
      brand: {
        name: page.brand.name,
        slug: page.brand.slug,
        logo_url: page.brand.logo_url,
        bio: page.brand.bio,
        whatsapp_number: page.brand.whatsapp_number,
      },
      products: page.products,
    },
    { headers: { "Cache-Control": "public, max-age=60, stale-while-revalidate=300" } },
  );
}
