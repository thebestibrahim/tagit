import { createAdminClient } from "@/lib/supabase/admin";
import { createClient as createServerClient } from "@/lib/supabase/server";
import { log } from "@/lib/logger";
import { NextResponse } from "next/server";
import { settleInvoice } from "@/lib/billing/settle";

// POST /api/admin/billing/invoices/[invoiceId]/mark-paid
// Manual / offline payment. Settles the invoice exactly like a webhook would.
export async function POST(
  _request: Request,
  { params }: { params: Promise<{ invoiceId: string }> }
) {
  const { invoiceId } = await params;

  const authClient = await createServerClient();
  const { data: { user } } = await authClient.auth.getUser();
  if (!user || user.app_metadata?.role !== "tagit_admin") {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  const admin = createAdminClient();
  const { data: invoice } = await admin
    .from("invoices")
    .select("*")
    .eq("id", invoiceId)
    .single();
  if (!invoice) {
    return NextResponse.json({ error: "Invoice not found." }, { status: 404 });
  }

  try {
    const reference = invoice.paystack_reference ?? `manual_${invoiceId}_${Date.now()}`;
    const { alreadyPaid } = await settleInvoice(admin, invoice, {
      reference,
      amount: invoice.amount,
      payload: { source: "manual", marked_by: user.id },
    });
    return NextResponse.json({ success: true, already_paid: alreadyPaid });
  } catch (err) {
    log.error("admin/billing/mark-paid", "Settle failed", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
