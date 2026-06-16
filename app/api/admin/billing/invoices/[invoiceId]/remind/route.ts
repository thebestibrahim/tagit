import { createAdminClient } from "@/lib/supabase/admin";
import { createClient as createServerClient } from "@/lib/supabase/server";
import { log } from "@/lib/logger";
import { NextResponse } from "next/server";
import { invoiceNumber } from "@/lib/billing/invoices";
import { sendManualInvoiceReminderEmail } from "@/lib/email";

// POST /api/admin/billing/invoices/[invoiceId]/remind
// Manually nudge a brand about an open invoice (due-soon or overdue). Reuses the
// invoice's existing Paystack link. Idempotent in effect: it only ever sends an
// email, it never mutates billing state.
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

  // Reminders only make sense for an open balance.
  if (invoice.status !== "sent" && invoice.status !== "overdue") {
    return NextResponse.json({ error: "This invoice has no open balance to remind about." }, { status: 400 });
  }

  const { data: company } = await admin
    .from("companies")
    .select("name, email")
    .eq("id", invoice.company_id)
    .single();
  if (!company?.email) {
    return NextResponse.json({ error: "Brand has no email on file." }, { status: 400 });
  }

  // Whole days past the due date (negative = still due in the future).
  const startOfDay = (d: Date) => Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate());
  const daysOverdue = Math.round((startOfDay(new Date()) - startOfDay(new Date(invoice.due_date))) / 86400000);

  try {
    await sendManualInvoiceReminderEmail(company.email, {
      companyName: company.name,
      invoiceNumber: invoiceNumber(invoice),
      amount: invoice.amount,
      dueDate: invoice.due_date,
      daysOverdue,
      payUrl: invoice.paystack_payment_link,
    });
    return NextResponse.json({ success: true });
  } catch (err) {
    log.error("admin/billing/remind", "Reminder email failed", err);
    return NextResponse.json({ error: "Failed to send reminder." }, { status: 500 });
  }
}
