import { createAdminClient } from "@/lib/supabase/admin";
import { createClient as createServerClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";
import { infoUrl } from "@/lib/exhibitions";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Admin = any;

// GET — full detail for one exhibition: every attached product with its current
// info-code status (none, active, or inactive). Revoked codes are history and
// are not surfaced as a product's current code.
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const authClient = await createServerClient();
  const { data: { user } } = await authClient.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized." }, { status: 401 });

  const admin = createAdminClient() as Admin;

  const { data: exhibition } = await admin
    .from("exhibitions")
    .select("id, name, location, start_date, end_date, created_at")
    .eq("id", id)
    .eq("company_id", user.id)
    .maybeSingle();

  if (!exhibition) return NextResponse.json({ error: "Exhibition not found." }, { status: 404 });

  const [{ data: links }, { data: codes }] = await Promise.all([
    admin
      .from("exhibition_products")
      .select("product_id, created_at, products(id, name, photos, retail_price, currency)")
      .eq("exhibition_id", id)
      .order("created_at", { ascending: true }),
    admin
      .from("info_codes")
      .select("id, product_id, token, status, scan_count, generated_at")
      .eq("exhibition_id", id)
      .order("generated_at", { ascending: false }),
  ]);

  // Most-recent non-revoked code per product is that product's current code.
  const currentCode = new Map<string, { id: string; token: string; status: string; scan_count: number }>();
  for (const c of (codes ?? []) as { id: string; product_id: string; token: string; status: string; scan_count: number }[]) {
    if (c.status === "revoked") continue;
    if (!currentCode.has(c.product_id)) {
      currentCode.set(c.product_id, { id: c.id, token: c.token, status: c.status, scan_count: c.scan_count });
    }
  }

  const products = ((links ?? []) as {
    product_id: string;
    products: { id: string; name: string; photos: string[] | null; retail_price: number | null; currency: string } | null;
  }[]).map((l) => {
    const code = currentCode.get(l.product_id) ?? null;
    return {
      product_id: l.product_id,
      name: l.products?.name ?? "Untitled",
      photo: l.products?.photos?.[0] ?? null,
      code: code
        ? { id: code.id, status: code.status, token: code.token, scan_count: code.scan_count, url: infoUrl(code.token) }
        : null,
    };
  });

  return NextResponse.json({ exhibition, products });
}
