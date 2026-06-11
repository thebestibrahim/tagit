import { createAdminClient } from "@/lib/supabase/admin";
import { createClient as createServerClient } from "@/lib/supabase/server";
import { log } from "@/lib/logger";
import { NextResponse } from "next/server";

// DELETE /api/admin/billing/[companyId]/discount/[discountId]
// Deactivates one specific discount. Does not touch the other type.
export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ companyId: string; discountId: string }> }
) {
  const { companyId, discountId } = await params;

  const authClient = await createServerClient();
  const { data: { user } } = await authClient.auth.getUser();
  if (!user || user.app_metadata?.role !== "tagit_admin") {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  const admin = createAdminClient();
  const { error } = await admin
    .from("discounts")
    .update({ is_active: false })
    .eq("id", discountId)
    .eq("company_id", companyId);
  if (error) {
    log.error("admin/billing/discount", "Deactivate failed", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
