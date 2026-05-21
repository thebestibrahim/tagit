import { createClient } from "@/lib/supabase/server";
import { log } from "@/lib/logger";
import { NextResponse } from "next/server";

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  // Verify ownership
  const { data: product } = await supabase
    .from("products")
    .select("id")
    .eq("id", id)
    .eq("company_id", user.id)
    .single();

  if (!product) return NextResponse.json({ error: "Product not found" }, { status: 404 });

  const body = await request.json().catch(() => ({}));
  const { name, retail_price, currency, industry_fields, photos } = body;

  const { error } = await supabase
    .from("products")
    .update({ name, retail_price: retail_price ?? null, currency: currency ?? "NGN", industry_fields, photos: photos ?? [] })
    .eq("id", id);

  if (error) { log.error("company/products", "Update failed", error); return NextResponse.json({ error: "Internal server error" }, { status: 500 }); }
  return NextResponse.json({ success: true });
}
