import { createAdminClient } from "@/lib/supabase/admin";
import { createClient as createServerClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";
import { zipSync } from "fflate";
import { renderInfoLabel, labelFileName } from "@/lib/exhibition-label";
import { fetchLogoDataUrl } from "@/lib/certificate";
import { exhibitionsEnabled } from "@/lib/exhibitions-server";
import type { BrandColors } from "@/lib/brand-page";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Admin = any;

// GET — one PDF placard per ACTIVE code in this exhibition, bundled as a ZIP and
// named by product name for easy sorting at print time.
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const authClient = await createServerClient();
  const { data: { user } } = await authClient.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  if (!(await exhibitionsEnabled(user.id))) {
    return NextResponse.json({ error: "Exhibitions is not enabled for your account." }, { status: 403 });
  }

  const admin = createAdminClient() as Admin;

  const { data: exhibition } = await admin
    .from("exhibitions")
    .select("id, name")
    .eq("id", id)
    .eq("company_id", user.id)
    .maybeSingle();
  if (!exhibition) return NextResponse.json({ error: "Exhibition not found." }, { status: 404 });

  const { data: codes } = await admin
    .from("info_codes")
    .select("token, products(name)")
    .eq("exhibition_id", id)
    .eq("status", "active");

  const rows = (codes ?? []) as { token: string; products: { name: string } | null }[];
  if (rows.length === 0) {
    return NextResponse.json({ error: "No active codes to print." }, { status: 404 });
  }

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

  const colors: BrandColors = {
    brand_primary_color: brand?.brand_primary_color ?? null,
    brand_secondary_color: brand?.brand_secondary_color ?? null,
    brand_accent_color: brand?.brand_accent_color ?? null,
    brand_text_color: brand?.brand_text_color ?? null,
  };
  const logoDataUrl = await fetchLogoDataUrl(brand?.logo_url ?? null);

  const files: Record<string, Uint8Array> = {};
  const used = new Set<string>();
  for (const row of rows) {
    const productName = row.products?.name ?? "Untitled";
    const pdf = await renderInfoLabel({ productName, brandName: brand?.name ?? "Tagit", token: row.token, logoDataUrl, colors });

    // Avoid collisions when two products share a name.
    let name = labelFileName(productName);
    if (used.has(name)) {
      let n = 2;
      const stem = name.replace(/\.pdf$/, "");
      while (used.has(`${stem}-${n}.pdf`)) n++;
      name = `${stem}-${n}.pdf`;
    }
    used.add(name);
    files[name] = new Uint8Array(pdf);
  }

  const zip = zipSync(files, { level: 0 });
  const zipName = labelFileName(exhibition.name, "zip");

  return new NextResponse(zip as unknown as BodyInit, {
    status: 200,
    headers: {
      "Content-Type": "application/zip",
      "Content-Disposition": `attachment; filename="${zipName}"`,
      "Cache-Control": "no-store",
    },
  });
}
