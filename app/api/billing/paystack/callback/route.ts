import { createAdminClient } from "@/lib/supabase/admin";
import { log } from "@/lib/logger";
import { NextResponse } from "next/server";
import { verifyTransaction } from "@/lib/paystack";
import { settleInvoice } from "@/lib/billing/settle";

// GET /api/billing/paystack/callback?reference=...
// Paystack redirects the payer here after checkout. We verify the transaction
// via the API and settle the invoice synchronously, so the brand gets feedback
// immediately — independent of the async dashboard webhook. Then we redirect to
// the invoice (which now shows Paid). Settlement is idempotent, so if the
// webhook also fires there is no double-processing.
export async function GET(request: Request) {
  const url = new URL(request.url);
  const reference = url.searchParams.get("reference") ?? url.searchParams.get("trxref");
  const billingHome = new URL("/dashboard/features", url.origin);

  if (!reference) return NextResponse.redirect(billingHome);

  try {
    const admin = createAdminClient();
    const { data: invoice } = await admin
      .from("invoices")
      .select("*")
      .eq("paystack_reference", reference)
      .maybeSingle();

    if (!invoice) {
      log.warn("billing/callback", `No invoice for reference ${reference}`);
      return NextResponse.redirect(billingHome);
    }

    const verified = await verifyTransaction(reference);
    if (verified?.status === "success") {
      await settleInvoice(admin, invoice, {
        reference,
        amount: verified.amount ?? invoice.amount,
        payload: { source: "callback" },
      });
      return NextResponse.redirect(new URL(`/dashboard/features/invoices/${invoice.id}?paid=1`, url.origin));
    }

    // Not successful (abandoned/failed): send them back to the invoice as-is.
    return NextResponse.redirect(new URL(`/dashboard/features/invoices/${invoice.id}`, url.origin));
  } catch (err) {
    log.error("billing/callback", "Callback processing failed", err);
    return NextResponse.redirect(billingHome);
  }
}
