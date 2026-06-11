import { createAdminClient } from "@/lib/supabase/admin";
import { createClient as createServerClient } from "@/lib/supabase/server";
import { log } from "@/lib/logger";
import { NextResponse } from "next/server";
import { sendDiscountAppliedEmail } from "@/lib/email";
import type { DiscountType } from "@/types/database";

const TYPES = new Set<DiscountType>(["subscription", "batch"]);

// POST /api/admin/billing/[companyId]/discount — add a discount of one type.
// Deactivates any existing active discount of the same type first. The two
// types are independent and can both be active at once.
export async function POST(
  request: Request,
  { params }: { params: Promise<{ companyId: string }> }
) {
  const { companyId } = await params;

  const authClient = await createServerClient();
  const { data: { user } } = await authClient.auth.getUser();
  if (!user || user.app_metadata?.role !== "tagit_admin") {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  const { type, percentage, duration, note } = await request.json();

  if (!TYPES.has(type)) {
    return NextResponse.json({ error: "Invalid discount type." }, { status: 400 });
  }
  const pct = Number(percentage);
  const dur = Number(duration);
  if (!Number.isInteger(pct) || pct < 1 || pct > 100) {
    return NextResponse.json({ error: "Percentage must be 1–100." }, { status: 400 });
  }
  if (!Number.isInteger(dur) || dur < 1) {
    return NextResponse.json({ error: "Duration must be at least 1." }, { status: 400 });
  }

  const admin = createAdminClient();

  // Deactivate the existing active discount of the SAME type only.
  await admin
    .from("discounts")
    .update({ is_active: false })
    .eq("company_id", companyId)
    .eq("type", type)
    .eq("is_active", true);

  const { data: discount, error } = await admin
    .from("discounts")
    .insert({
      company_id: companyId,
      type,
      percentage: pct,
      duration: dur,
      note: note?.trim() || null,
      created_by: user.id,
    })
    .select("*")
    .single();
  if (error) {
    log.error("admin/billing/discount", "Insert failed", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }

  const { data: company } = await admin
    .from("companies")
    .select("name, email")
    .eq("id", companyId)
    .single();
  if (company?.email) {
    await sendDiscountAppliedEmail(company.email, {
      companyName: company.name,
      percentage: pct,
      duration: dur,
      type,
    }).catch((err) => log.error("admin/billing/discount", "Discount email failed", err));
  }

  return NextResponse.json({ discount });
}
