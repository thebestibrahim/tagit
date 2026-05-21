import { createClient as createServerClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { log } from "@/lib/logger";
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

  const admin = createAdminClient();

  const { error } = await admin.from("tag_batches").insert({
    company_id: user.id,
    industry,
    batch_size: qty,
    status: "pending",
    notes: notes?.trim() || null,
    batch_name: batch_name?.trim() || null,
    created_by: user.id,
  });

  if (error) { log.error("company/batch-request", "Insert failed", error); return NextResponse.json({ error: "Internal server error" }, { status: 500 }); }

  return NextResponse.json({ success: true });
}
