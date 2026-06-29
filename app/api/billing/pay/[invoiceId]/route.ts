import { createAdminClient } from "@/lib/supabase/admin";
import { ensurePaystackLink } from "@/lib/billing/invoices";
import { log } from "@/lib/logger";
import { NextResponse } from "next/server";

// GET /api/billing/pay/[invoiceId]
// The single entry point behind every Pay button (invoice emails, reminders,
// the dashboard). It guarantees the brand can always pay: if the Paystack
// checkout link is missing — because upfront generation at invoice creation hit
// a transient failure — it mints one on demand, then redirects to checkout.
// Already-paid or settled invoices fall through to the invoice page.
export async function GET(
  request: Request,
  { params }: { params: Promise<{ invoiceId: string }> }
) {
  const { invoiceId } = await params;
  const origin = new URL(request.url).origin;
  const invoicePage = new URL(`/dashboard/features/invoices/${invoiceId}`, origin);
  const billingHome = new URL("/dashboard/features", origin);

  try {
    const admin = createAdminClient();
    const { url, failed } = await ensurePaystackLink(admin, invoiceId);
    if (url) return NextResponse.redirect(url);
    // Generation failed (e.g. Paystack API rejected the request) — tell the
    // brand instead of silently bouncing them back with no explanation.
    if (failed) invoicePage.searchParams.set("pay_error", "1");
    return NextResponse.redirect(invoicePage);
  } catch (err) {
    log.error("billing/pay", `Pay redirect failed for invoice ${invoiceId}`, err);
    return NextResponse.redirect(billingHome);
  }
}
