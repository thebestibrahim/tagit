import { createAdminClient } from "@/lib/supabase/admin";
import { createClient as createServerClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
  const authClient = await createServerClient();
  const { data: { user } } = await authClient.auth.getUser();

  if (!user) return NextResponse.json({ error: "Unauthorized." }, { status: 401 });

  const { tag_id, company_id, name, industry_fields, retail_price, currency } = await request.json();

  if (company_id !== user.id) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  if (!tag_id || !name) {
    return NextResponse.json({ error: "Tag and product name are required." }, { status: 400 });
  }

  const admin = createAdminClient();

  // Verify the tag belongs to this company and is unlinked
  const { data: tag } = await admin
    .from("tags")
    .select("id, status, company_id")
    .eq("id", tag_id)
    .single();

  const tagRow = tag as { id: string; status: string; company_id: string } | null;

  if (!tagRow || tagRow.company_id !== company_id) {
    return NextResponse.json({ error: "Tag not found." }, { status: 404 });
  }

  if (tagRow.status !== "created") {
    return NextResponse.json({ error: "Tag is already assigned to a product." }, { status: 409 });
  }

  const { error: productError } = await admin.from("products").insert({
    tag_id,
    company_id,
    name,
    industry_fields: industry_fields ?? {},
    retail_price: retail_price ?? null,
    currency: currency ?? "NGN",
    photos: [],
    ai_persona_config: {},
  });

  if (productError) {
    return NextResponse.json({ error: productError.message }, { status: 500 });
  }

  await admin.from("tags").update({ status: "embedded" }).eq("id", tag_id);

  return NextResponse.json({ success: true });
}
