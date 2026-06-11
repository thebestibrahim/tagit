import { createAdminClient } from "@/lib/supabase/admin";
import { log } from "@/lib/logger";
import { NextResponse } from "next/server";
import { verifyWebhookSignature } from "@/lib/paystack";
import { settleInvoice } from "@/lib/billing/settle";

// POST /api/webhooks/paystack
// Verifies the x-paystack-signature, then settles the matching invoice on
// charge.success. ALWAYS returns 200 (except on a bad signature) so Paystack
// does not retry storms; internal errors are logged, never surfaced as 4xx/5xx.
export async function POST(request: Request) {
  const rawBody = await request.text();
  const signature = request.headers.get("x-paystack-signature");

  if (!verifyWebhookSignature(rawBody, signature)) {
    return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
  }

  let event: { event?: string; data?: { reference?: string; amount?: number } };
  try {
    event = JSON.parse(rawBody);
  } catch {
    return NextResponse.json({ received: true }, { status: 200 });
  }

  // We only act on successful charges.
  if (event.event !== "charge.success" || !event.data?.reference) {
    return NextResponse.json({ received: true }, { status: 200 });
  }

  try {
    const admin = createAdminClient();
    const reference = event.data.reference;

    const { data: invoice } = await admin
      .from("invoices")
      .select("*")
      .eq("paystack_reference", reference)
      .maybeSingle();

    if (!invoice) {
      log.warn("webhooks/paystack", `No invoice for reference ${reference}`);
      return NextResponse.json({ received: true }, { status: 200 });
    }

    await settleInvoice(admin, invoice, {
      reference,
      amount: event.data.amount ?? invoice.amount,
      payload: event as never,
    });
  } catch (err) {
    log.error("webhooks/paystack", "Webhook processing failed", err);
  }

  return NextResponse.json({ received: true }, { status: 200 });
}
