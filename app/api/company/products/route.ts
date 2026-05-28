import { createAdminClient } from "@/lib/supabase/admin";
import { createClient as createServerClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
  const authClient = await createServerClient();
  const { data: { user } } = await authClient.auth.getUser();

  if (!user) return NextResponse.json({ error: "Unauthorized." }, { status: 401 });

  const { tag_ids, company_id, name, industry_fields, retail_price, currency, photos } = await request.json();

  if (company_id !== user.id) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  if (!Array.isArray(tag_ids) || tag_ids.length === 0 || !name) {
    return NextResponse.json({ error: "At least one tag and a product name are required." }, { status: 400 });
  }

  const admin = createAdminClient();

  // Verify all tags belong to this company and are unlinked
  const { data: tagsData } = await admin
    .from("tags")
    .select("id, status, company_id")
    .in("id", tag_ids);

  const tagRows = (tagsData ?? []) as { id: string; status: string; company_id: string }[];

  for (const tagId of tag_ids as string[]) {
    const tag = tagRows.find((t) => t.id === tagId);
    if (!tag || tag.company_id !== company_id) {
      return NextResponse.json({ error: `Tag not found.` }, { status: 404 });
    }
    if (tag.status !== "created") {
      return NextResponse.json({ error: `Tag ${tagId} is already assigned to a product.` }, { status: 409 });
    }
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: insertedProduct, error: productError } = await (admin.from("products") as any)
    .insert({
      company_id,
      name,
      industry_fields: industry_fields ?? {},
      retail_price: retail_price ?? null,
      currency: currency ?? "NGN",
      photos: photos ?? [],
      ai_persona_config: {},
    })
    .select("id")
    .single();

  if (productError || !insertedProduct) {
    return NextResponse.json({ error: (productError as { message?: string } | null)?.message ?? "Failed to create product." }, { status: 500 });
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  await (admin.from("tags") as any)
    .update({ product_id: (insertedProduct as { id: string }).id, status: "embedded" })
    .in("id", tag_ids);

  return NextResponse.json({ success: true });
}
