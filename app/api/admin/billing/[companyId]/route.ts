import { createAdminClient } from "@/lib/supabase/admin";
import { createClient as createServerClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

// GET /api/admin/billing/[companyId] — full billing detail for one brand.
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ companyId: string }> }
) {
  const { companyId } = await params;

  const authClient = await createServerClient();
  const { data: { user } } = await authClient.auth.getUser();
  if (!user || user.app_metadata?.role !== "tagit_admin") {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  const admin = createAdminClient();

  const [company, subscription, discounts, pricing, invoices, plans] = await Promise.all([
    admin.from("companies").select("id, name, email").eq("id", companyId).single(),
    admin.from("subscriptions").select("*, plans(name, monthly_price, included_chips)").eq("company_id", companyId).maybeSingle(),
    admin.from("discounts").select("*").eq("company_id", companyId).eq("is_active", true),
    admin.from("brand_pricing").select("*").eq("company_id", companyId).maybeSingle(),
    admin.from("invoices").select("*, invoice_line_items(*)").eq("company_id", companyId).order("created_at", { ascending: false }),
    admin.from("plans").select("*").eq("is_active", true).order("monthly_price", { ascending: true }),
  ]);

  if (!company.data) {
    return NextResponse.json({ error: "Company not found." }, { status: 404 });
  }

  const list = discounts.data ?? [];
  return NextResponse.json({
    company: company.data,
    subscription: subscription.data,
    subscription_discount: list.find((d) => d.type === "subscription") ?? null,
    batch_discount: list.find((d) => d.type === "batch") ?? null,
    pricing: pricing.data,
    invoices: invoices.data ?? [],
    plans: plans.data ?? [],
  });
}
