import { createAdminClient } from "@/lib/supabase/admin";
import { createClient as createServerClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";
import { infoUrl } from "@/lib/exhibitions";
import { insertInfoCode, exhibitionsEnabled } from "@/lib/exhibitions-server";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Admin = any;

// POST — generate an info code for one product in this exhibition.
export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const authClient = await createServerClient();
  const { data: { user } } = await authClient.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  if (!(await exhibitionsEnabled(user.id))) {
    return NextResponse.json({ error: "Exhibitions is not enabled for your account." }, { status: 403 });
  }

  const body = await request.json().catch(() => ({}));
  const { product_id } = body as { product_id?: string };
  if (!product_id) return NextResponse.json({ error: "product_id is required." }, { status: 400 });

  const admin = createAdminClient() as Admin;

  // Exhibition must belong to this brand, and the product must be attached to it.
  const { data: exhibition } = await admin
    .from("exhibitions")
    .select("id")
    .eq("id", id)
    .eq("company_id", user.id)
    .maybeSingle();
  if (!exhibition) return NextResponse.json({ error: "Exhibition not found." }, { status: 404 });

  const { data: link } = await admin
    .from("exhibition_products")
    .select("id")
    .eq("exhibition_id", id)
    .eq("product_id", product_id)
    .maybeSingle();
  if (!link) return NextResponse.json({ error: "Product is not in this exhibition." }, { status: 404 });

  // One current code per product: reject if a non-revoked code already exists
  // (use toggle or regenerate instead).
  const { data: existing } = await admin
    .from("info_codes")
    .select("id")
    .eq("exhibition_id", id)
    .eq("product_id", product_id)
    .neq("status", "revoked")
    .maybeSingle();
  if (existing) {
    return NextResponse.json({ error: "This product already has an info code." }, { status: 409 });
  }

  const code = await insertInfoCode(admin, { exhibition_id: id, product_id, company_id: user.id });
  if (!code) return NextResponse.json({ error: "Failed to generate info code." }, { status: 500 });

  return NextResponse.json(
    { code: { ...code, url: infoUrl(code.token) }, url: infoUrl(code.token) },
    { status: 201 }
  );
}
