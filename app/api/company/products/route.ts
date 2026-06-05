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
    .select("id, status, company_id, medium")
    .in("id", tag_ids);

  const tagRows = (tagsData ?? []) as { id: string; status: string; company_id: string; medium: string }[];

  for (const tagId of tag_ids as string[]) {
    const tag = tagRows.find((t) => t.id === tagId);
    if (!tag || tag.company_id !== company_id) {
      return NextResponse.json({ error: `Tag not found.` }, { status: 404 });
    }
    // A tag may have a product attached while still `created` (not yet shipped)
    // or after it has been `shipped` to the brand — both go `live` on attach.
    if (!["created", "shipped"].includes(tag.status)) {
      return NextResponse.json({ error: `Tag ${tagId} is already assigned to a product.` }, { status: 409 });
    }
  }

  // A product may carry at most one card. This route always creates a fresh
  // product, so the only way to exceed one is to attach two cards at once.
  if (tagRows.filter((t) => t.medium === "card").length > 1) {
    return NextResponse.json({ error: "A product can only have one card." }, { status: 409 });
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

  const productId = (insertedProduct as { id: string }).id;

  // Link the tags and flip them to `live`. If this fails (e.g. a status that
  // the DB constraint rejects), roll back the just-created product so we never
  // leave an orphan product with no linked tag (which showed as a blank status).
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { error: tagLinkError } = await (admin.from("tags") as any)
    .update({ product_id: productId, status: "live", live_at: new Date().toISOString() })
    .in("id", tag_ids);

  if (tagLinkError) {
    await admin.from("products").delete().eq("id", productId);
    return NextResponse.json(
      { error: (tagLinkError as { message?: string }).message ?? "Failed to link tags to product." },
      { status: 500 }
    );
  }

  return NextResponse.json({ success: true });
}
