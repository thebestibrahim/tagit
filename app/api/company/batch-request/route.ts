import { createClient as createServerClient } from "@/lib/supabase/server";
import { createClient as createAdminClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";

const ALLOWED_INDUSTRIES = new Set(["fashion", "arts", "collectibles", "jewellery", "electronics", "other"]);
const MIN_QTY = 10;
const MAX_QTY = 10000;

export async function POST(request: Request) {
  const authClient = await createServerClient();
  const { data: { user } } = await authClient.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await request.json();
  const { industry, quantity, notes, batch_name } = body;

  if (!ALLOWED_INDUSTRIES.has(industry)) {
    return NextResponse.json({ error: "Invalid industry" }, { status: 400 });
  }
  const qty = parseInt(quantity, 10);
  if (isNaN(qty) || qty < MIN_QTY || qty > MAX_QTY) {
    return NextResponse.json({ error: `Quantity must be between ${MIN_QTY} and ${MAX_QTY}` }, { status: 400 });
  }

  const admin = createAdminClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  );

  const { error } = await admin.from("tag_batches").insert({
    company_id: user.id,
    industry,
    batch_size: qty,
    status: "pending",
    notes: notes?.trim() || null,
    batch_name: batch_name?.trim() || null,
    created_by: user.id,
  } as never);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ success: true });
}
