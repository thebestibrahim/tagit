import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database, Invoice } from "@/types/database";
import { getNextBillingDate } from "@/lib/billing/pricing";
import { invoiceNumber } from "@/lib/billing/invoices";
import { sendPaymentConfirmedEmail } from "@/lib/email";
import { log } from "@/lib/logger";

type DB = SupabaseClient<Database>;

// Settle an invoice — shared by the Paystack webhook and admin manual mark-paid.
// Idempotent: a no-op if the invoice is already paid.
export async function settleInvoice(
  admin: DB,
  invoice: Invoice,
  opts: { reference: string; amount: number; payload?: Database["public"]["Tables"]["payments"]["Insert"]["paystack_payload"] }
): Promise<{ alreadyPaid: boolean }> {
  if (invoice.status === "paid") return { alreadyPaid: true };

  // Defense in depth: never settle for less than the invoice owes. Paystack
  // fixes the charge amount at initialization, so this should never trip; if it
  // does it signals a misconfigured link or a partial payment — flag, don't pay.
  if (opts.amount < invoice.amount) {
    log.warn(
      "billing/settle",
      `Underpayment ignored for invoice ${invoice.id}: paid ${opts.amount} < owed ${invoice.amount} (ref ${opts.reference})`
    );
    return { alreadyPaid: false };
  }

  const now = new Date();

  // Atomic claim: flip the status to paid ONLY if it isn't already. The webhook
  // and the redirect callback (and Paystack's own retries) can race on the same
  // invoice; Postgres serialises the row update under READ COMMITTED, so the
  // second writer re-evaluates the WHERE against the now-paid row, matches zero
  // rows, and bails out here — before it can double-post a payment or advance
  // the subscription period twice. This is the concurrency guard for settlement.
  const { data: claimed } = await admin
    .from("invoices")
    .update({
      status: "paid",
      paid_at: now.toISOString(),
      paystack_reference: invoice.paystack_reference ?? opts.reference,
    })
    .eq("id", invoice.id)
    .neq("status", "paid")
    .select("id");

  if (!claimed || claimed.length === 0) {
    // Another settlement won the race and already marked this invoice paid.
    return { alreadyPaid: true };
  }

  // Record the payment. Unique on paystack_reference makes double-posting safe.
  await admin.from("payments").insert({
    invoice_id: invoice.id,
    paystack_reference: opts.reference,
    amount: opts.amount,
    paid_at: now.toISOString(),
    paystack_payload: opts.payload ?? null,
  });

  let periodLabel: string | undefined;

  if (invoice.type === "batch" && invoice.batch_id) {
    // Batch is now approved for fulfilment.
    await admin.from("tag_batches").update({ status: "processing" }).eq("id", invoice.batch_id);
  } else if (invoice.type === "subscription" && invoice.subscription_id) {
    const { data: sub } = await admin
      .from("subscriptions")
      .select("billing_interval, current_period_end")
      .eq("id", invoice.subscription_id)
      .single();
    if (sub) {
      const start = sub.current_period_end ? new Date(sub.current_period_end) : now;
      const end = getNextBillingDate(start, sub.billing_interval);
      await admin
        .from("subscriptions")
        .update({
          status: "active",
          current_period_start: start.toISOString(),
          current_period_end: end.toISOString(),
          updated_at: now.toISOString(),
        })
        .eq("id", invoice.subscription_id);
      periodLabel = `${start.toLocaleDateString("en-GB", { day: "numeric", month: "short" })} – ${end.toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })}`;
    }
  }

  // Receipt email (best-effort) — line items, reference, paid date, PAID badge.
  const [{ data: company }, { data: items }] = await Promise.all([
    admin.from("companies").select("name, email").eq("id", invoice.company_id).single(),
    admin
      .from("invoice_line_items")
      .select("description, total, sort_order")
      .eq("invoice_id", invoice.id)
      .order("sort_order", { ascending: true }),
  ]);
  if (company?.email) {
    await sendPaymentConfirmedEmail(company.email, {
      companyName: company.name,
      amount: opts.amount,
      invoiceNumber: invoiceNumber(invoice),
      type: invoice.type,
      periodLabel,
      paidAt: now.toISOString(),
      reference: opts.reference,
      lineItems: (items ?? []).map((i) => ({ description: i.description, total: i.total })),
      subtotal: invoice.subtotal,
      discountAmount: invoice.discount_amount,
      discountPercentage: invoice.discount_percentage,
    }).catch((err) => log.error("billing/settle", "Receipt email failed", err));
  }

  return { alreadyPaid: false };
}
