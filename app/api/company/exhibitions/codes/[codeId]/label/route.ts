import { createAdminClient } from "@/lib/supabase/admin";
import { createClient as createServerClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";
import { renderInfoLabel, labelFileName } from "@/lib/exhibition-label";
import { fetchLogoDataUrl } from "@/lib/certificate";
import { exhibitionsEnabled } from "@/lib/exhibitions-server";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Admin = any;

// GET — a single print-ready info placard (PDF) for one code.
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ codeId: string }> }
) {
  const { codeId } = await params;
  const authClient = await createServerClient();
  const { data: { user } } = await authClient.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  if (!(await exhibitionsEnabled(user.id))) {
    return NextResponse.json({ error: "Exhibitions is not enabled for your account." }, { status: 403 });
  }

  const admin = createAdminClient() as Admin;

  const { data: code } = await admin
    .from("info_codes")
    .select("id, token, status, product_id, products(name)")
    .eq("id", codeId)
    .eq("company_id", user.id)
    .maybeSingle();
  if (!code) return NextResponse.json({ error: "Info code not found." }, { status: 404 });

  const row = code as { token: string; products: { name: string } | null };

  const { data: company } = await admin
    .from("companies")
    .select("name, logo_url, brand_primary_color, brand_secondary_color, brand_accent_color, brand_text_color")
    .eq("id", user.id)
    .maybeSingle();
  const brand = (company as {
    name: string;
    logo_url: string | null;
    brand_primary_color: string | null;
    brand_secondary_color: string | null;
    brand_accent_color: string | null;
    brand_text_color: string | null;
  } | null) ?? null;

  const productName = row.products?.name ?? "Untitled";
  const logoDataUrl = await fetchLogoDataUrl(brand?.logo_url ?? null);

  const pdf = await renderInfoLabel({
    productName,
    brandName: brand?.name ?? "Tagit",
    token: row.token,
    logoDataUrl,
    colors: {
      brand_primary_color: brand?.brand_primary_color ?? null,
      brand_secondary_color: brand?.brand_secondary_color ?? null,
      brand_accent_color: brand?.brand_accent_color ?? null,
      brand_text_color: brand?.brand_text_color ?? null,
    },
  });

  return new NextResponse(pdf as unknown as BodyInit, {
    status: 200,
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="${labelFileName(productName)}"`,
      "Cache-Control": "no-store",
    },
  });
}
