import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database, Invoice, InvoiceType, VolumeTier } from "@/types/database";
import {
  calculateChipOrderTotal,
  getPricePerUnit,
  getEffectivePrice,
  applyDiscount,
  getNextBillingDate,
  asTiers,
} from "@/lib/billing/pricing";
import {
  getActiveBatchDiscount,
  getActiveSubscriptionDiscount,
  consumeDiscount,
} from "@/lib/billing/discounts";
import { initializeTransaction, buildReference } from "@/lib/paystack";
import { sendBatchInvoiceEmail, sendSubscriptionInvoiceEmail, sendTrialEndedInvoiceEmail, sendPlanActivationEmail } from "@/lib/email";
import { generateInvoicePdf } from "@/lib/billing/invoice-pdf";
import { log } from "@/lib/logger";

type DB = SupabaseClient<Database>;

const BATCH_DUE_DAYS = 7;
const SUBSCRIPTION_DUE_DAYS = 14;

// Mirrors the brand_pricing column defaults — used when a brand has no custom row.
const DEFAULT_TIERS: VolumeTier[] = [
  { min: 1, max: 50, price_per_unit: 400000 },
  { min: 51, max: 100, price_per_unit: 350000 },
  { min: 101, max: 200, price_per_unit: 300000 },
  { min: 201, max: null, price_per_unit: 250000 },
];

function addDays(from: Date, days: number): Date {
  const d = new Date(from);
  d.setDate(d.getDate() + days);
  return d;
}

function isoDate(d: Date): string {
  return d.toISOString().slice(0, 10);
}

// Display invoice number derived from year + id, e.g. TGT-2026-3f9a1b2c.
export function invoiceNumber(inv: Pick<Invoice, "id" | "created_at">): string {
  const year = new Date(inv.created_at).getFullYear();
  return `TGT-${year}-${inv.id.replace(/-/g, "").slice(0, 8).toUpperCase()}`;
}

// ── Create a batch (chip order) invoice ──────────────────────────────────────
// Applies the active BATCH discount only. Sets batch status to awaiting_payment.
export async function createBatchInvoice(
  supabase: DB,
  batchId: string,
  companyId: string
): Promise<Invoice> {
  const { data: batch, error: batchErr } = await supabase
    .from("tag_batches")
    .select("batch_size, cards_quantity, batch_type")
    .eq("id", batchId)
    .single();
  if (batchErr || !batch) throw new Error(`Batch ${batchId} not found`);

  const { data: pricing } = await supabase
    .from("brand_pricing")
    .select("tag_tiers, card_tiers")
    .eq("company_id", companyId)
    .maybeSingle();

  const tagTiers = pricing ? asTiers(pricing.tag_tiers) : DEFAULT_TIERS;
  const cardTiers = pricing ? asTiers(pricing.card_tiers) : DEFAULT_TIERS;

  const tagsQty = batch.batch_size ?? 0;
  const cardsQty = batch.cards_quantity ?? 0;

  const lineItems: {
    description: string;
    quantity: number;
    unit_price: number;
    total: number;
    sort_order: number;
  }[] = [];

  let subtotal = 0;
  if (tagsQty > 0) {
    const unit = getPricePerUnit(tagsQty, tagTiers);
    const total = calculateChipOrderTotal(tagsQty, tagTiers);
    subtotal += total;
    lineItems.push({
      description: `${tagsQty} × Tags`,
      quantity: tagsQty,
      unit_price: unit,
      total,
      sort_order: 0,
    });
  }
  if (cardsQty > 0) {
    const unit = getPricePerUnit(cardsQty, cardTiers);
    const total = calculateChipOrderTotal(cardsQty, cardTiers);
    subtotal += total;
    lineItems.push({
      description: `${cardsQty} × Cards`,
      quantity: cardsQty,
      unit_price: unit,
      total,
      sort_order: 1,
    });
  }

  // Active BATCH discount only — never the subscription discount.
  const discount = await getActiveBatchDiscount(supabase, companyId);
  let discountAmount = 0;
  let amount = subtotal;
  if (discount) {
    const r = applyDiscount(subtotal, discount.percentage);
    discountAmount = r.discountAmount;
    amount = r.finalAmount;
    lineItems.push({
      description: `Discount — ${discount.percentage}% off`,
      quantity: 1,
      unit_price: -discountAmount,
      total: -discountAmount,
      sort_order: 2,
    });
  }

  const { data: invoice, error: invErr } = await supabase
    .from("invoices")
    .insert({
      company_id: companyId,
      type: "batch",
      status: "sent",
      subtotal,
      discount_amount: discountAmount,
      amount,
      discount_id: discount?.id ?? null,
      discount_percentage: discount?.percentage ?? null,
      due_date: isoDate(addDays(new Date(), BATCH_DUE_DAYS)),
      batch_id: batchId,
    })
    .select("*")
    .single();
  if (invErr || !invoice) throw new Error(`Failed to create batch invoice: ${invErr?.message}`);

  await insertLineItems(supabase, invoice.id, lineItems);
  await generatePaystackLinkForInvoice(supabase, invoice, companyId);

  // One batch order consumes one unit of the batch discount.
  if (discount) await consumeDiscount(supabase, discount.id);

  // Batch is only dispatched after the invoice is paid.
  await supabase.from("tag_batches").update({ status: "awaiting_payment" }).eq("id", batchId);

  return invoice;
}

// ── Create a subscription invoice for the current billing period ─────────────
// Applies the active SUBSCRIPTION discount only, consumes it, advances the period.
export async function createSubscriptionInvoice(
  supabase: DB,
  subscriptionId: string
): Promise<Invoice> {
  const { data: sub, error: subErr } = await supabase
    .from("subscriptions")
    .select("*, plans(name, monthly_price)")
    .eq("id", subscriptionId)
    .single();
  if (subErr || !sub) throw new Error(`Subscription ${subscriptionId} not found`);

  const plan = (sub as unknown as { plans: { name: string; monthly_price: number } | null }).plans;
  const planPrice = plan?.monthly_price ?? 0;
  const subtotal = getEffectivePrice(planPrice, sub.custom_monthly_price, sub.billing_interval);

  const periodStart = sub.current_period_end
    ? new Date(sub.current_period_end)
    : sub.trial_ends_at
    ? new Date(sub.trial_ends_at)
    : new Date();
  const periodEnd = getNextBillingDate(periodStart, sub.billing_interval);

  const lineItems: {
    description: string;
    quantity: number;
    unit_price: number;
    total: number;
    sort_order: number;
  }[] = [
    {
      description: `${plan?.name ?? "Plan"} — ${sub.billing_interval} subscription`,
      quantity: 1,
      unit_price: subtotal,
      total: subtotal,
      sort_order: 0,
    },
  ];

  // Active SUBSCRIPTION discount only — never the batch discount.
  const discount = await getActiveSubscriptionDiscount(supabase, sub.company_id);
  let discountAmount = 0;
  let amount = subtotal;
  if (discount) {
    const r = applyDiscount(subtotal, discount.percentage);
    discountAmount = r.discountAmount;
    amount = r.finalAmount;
    lineItems.push({
      description: `Discount — ${discount.percentage}% off`,
      quantity: 1,
      unit_price: -discountAmount,
      total: -discountAmount,
      sort_order: 1,
    });
  }

  const { data: invoice, error: invErr } = await supabase
    .from("invoices")
    .insert({
      company_id: sub.company_id,
      type: "subscription",
      status: "sent",
      subtotal,
      discount_amount: discountAmount,
      amount,
      discount_id: discount?.id ?? null,
      discount_percentage: discount?.percentage ?? null,
      due_date: isoDate(addDays(new Date(), SUBSCRIPTION_DUE_DAYS)),
      subscription_id: subscriptionId,
      period_start: isoDate(periodStart),
      period_end: isoDate(periodEnd),
    })
    .select("*")
    .single();
  if (invErr || !invoice) throw new Error(`Failed to create subscription invoice: ${invErr?.message}`);

  await insertLineItems(supabase, invoice.id, lineItems);
  await generatePaystackLinkForInvoice(supabase, invoice, sub.company_id);

  // Advance the billing window.
  await supabase
    .from("subscriptions")
    .update({
      current_period_start: periodStart.toISOString(),
      current_period_end: periodEnd.toISOString(),
      updated_at: new Date().toISOString(),
    })
    .eq("id", subscriptionId);

  // Consume one cycle of the subscription discount (deactivates when exhausted).
  if (discount) await consumeDiscount(supabase, discount.id);

  return invoice;
}

async function insertLineItems(
  supabase: DB,
  invoiceId: string,
  items: { description: string; quantity: number; unit_price: number; total: number; sort_order: number }[]
): Promise<void> {
  if (items.length === 0) return;
  await supabase
    .from("invoice_line_items")
    .insert(items.map((i) => ({ ...i, invoice_id: invoiceId })));
}

// Generate a Paystack payment link for an invoice and persist it on the record.
export async function generatePaystackLink(
  invoiceId: string,
  amount: number,
  email: string,
  metadata: Record<string, string>
): Promise<string> {
  const reference = buildReference(invoiceId);
  const result = await initializeTransaction({ email, amount, reference, metadata });
  return result.authorization_url;
}

async function generatePaystackLinkForInvoice(
  supabase: DB,
  invoice: Invoice,
  companyId: string
): Promise<void> {
  // A zero-amount (100% discount / free) invoice needs no payment link.
  if (invoice.amount <= 0) return;

  const { data: company } = await supabase
    .from("companies")
    .select("email")
    .eq("id", companyId)
    .single();
  if (!company?.email) return;

  try {
    const reference = buildReference(invoice.id);
    const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "";
    const result = await initializeTransaction({
      email: company.email,
      amount: invoice.amount,
      reference,
      metadata: { invoice_id: invoice.id, type: invoice.type, company_id: companyId },
      // After payment Paystack redirects here; the callback verifies + settles
      // so the brand gets immediate feedback even without the dashboard webhook.
      callbackUrl: appUrl ? `${appUrl}/api/billing/paystack/callback` : undefined,
    });
    await supabase
      .from("invoices")
      .update({
        paystack_payment_link: result.authorization_url,
        paystack_reference: reference,
      })
      .eq("id", invoice.id);
    invoice.paystack_payment_link = result.authorization_url;
    invoice.paystack_reference = reference;
  } catch (err) {
    log.error("billing/invoices", "Paystack link generation failed", err);
  }
}

// Stable, self-healing pay URL used by every Pay button (emails + dashboard).
// It points at our own /api/billing/pay route rather than the raw Paystack
// link, so the button always renders even when the link wasn't generated yet —
// the route mints it on demand. Returns null only when we have no app URL to
// build an absolute link from (e.g. local scripts without NEXT_PUBLIC_APP_URL).
export function invoicePayUrl(invoiceId: string): string | null {
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "";
  return appUrl ? `${appUrl}/api/billing/pay/${invoiceId}` : null;
}

// Ensure an unpaid invoice has a Paystack checkout link, minting one on demand
// if the upfront generation at creation time failed or never ran. Returns the
// checkout URL, or null if the invoice is settled/free or generation fails.
// This is the safety net behind the /api/billing/pay route: a single transient
// Paystack outage at invoice creation no longer leaves an invoice unpayable.
export async function ensurePaystackLink(
  supabase: DB,
  invoiceId: string
): Promise<string | null> {
  const { data: invoice } = await supabase
    .from("invoices")
    .select("*")
    .eq("id", invoiceId)
    .single();
  if (!invoice) return null;
  if (invoice.status === "paid" || invoice.status === "cancelled") return null;
  if (invoice.amount <= 0) return null;
  if (invoice.paystack_payment_link) return invoice.paystack_payment_link;

  await generatePaystackLinkForInvoice(supabase, invoice as Invoice, invoice.company_id);
  return invoice.paystack_payment_link ?? null;
}

export interface InvoiceEmailPayload {
  email: string;
  type: InvoiceType;
  issuedAt: string;
  periodStart: string | null;
  periodEnd: string | null;
  common: {
    companyName: string;
    invoiceNumber: string;
    subtotal: number;
    discountAmount: number;
    discountPercentage: number | null;
    amount: number;
    dueDate: string;
    payUrl: string | null;
    paid: boolean;
    lineItems: { description: string; total: number }[];
  };
}

// Load everything an invoice email needs (recipient, totals, line items).
export async function loadInvoiceEmailPayload(
  supabase: DB,
  invoiceId: string
): Promise<InvoiceEmailPayload | null> {
  const { data: invoice } = await supabase
    .from("invoices")
    .select("*")
    .eq("id", invoiceId)
    .single();
  if (!invoice) return null;

  const { data: company } = await supabase
    .from("companies")
    .select("name, email")
    .eq("id", invoice.company_id)
    .single();
  if (!company?.email) return null;

  const { data: items } = await supabase
    .from("invoice_line_items")
    .select("description, quantity, unit_price, total, sort_order")
    .eq("invoice_id", invoiceId)
    .order("sort_order", { ascending: true });

  return {
    email: company.email,
    type: invoice.type,
    issuedAt: invoice.created_at,
    periodStart: invoice.period_start,
    periodEnd: invoice.period_end,
    common: {
      companyName: company.name,
      invoiceNumber: invoiceNumber(invoice),
      subtotal: invoice.subtotal,
      discountAmount: invoice.discount_amount,
      discountPercentage: invoice.discount_percentage,
      amount: invoice.amount,
      dueDate: invoice.due_date,
      // Route the Pay button through our self-healing pay endpoint so it always
      // renders and works, even if the raw Paystack link wasn't minted yet.
      payUrl: invoice.status === "paid" ? null : invoicePayUrl(invoice.id),
      paid: invoice.status === "paid",
      lineItems: (items ?? []).map((i) => ({ description: i.description, total: i.total })),
    },
  };
}

// Render the invoice PDF for a loaded payload (best-effort; null on failure so
// a PDF problem never blocks the email).
async function buildInvoicePdf(payload: InvoiceEmailPayload): Promise<Buffer | undefined> {
  try {
    return await generateInvoicePdf({
      invoiceNumber: payload.common.invoiceNumber,
      companyName: payload.common.companyName,
      type: payload.type,
      periodStart: payload.periodStart,
      periodEnd: payload.periodEnd,
      issuedAt: payload.issuedAt,
      dueDate: payload.common.dueDate,
      paid: payload.common.paid,
      lineItems: payload.common.lineItems,
      subtotal: payload.common.subtotal,
      discountAmount: payload.common.discountAmount,
      discountPercentage: payload.common.discountPercentage,
      amount: payload.common.amount,
    });
  } catch (err) {
    log.error("billing/invoices", "Invoice PDF generation failed", err);
    return undefined;
  }
}

// ── Send the invoice email (Resend) with payment link + PDF attachment ───────
export async function sendInvoiceEmail(
  supabase: DB,
  invoiceId: string,
  type: InvoiceType
): Promise<void> {
  const payload = await loadInvoiceEmailPayload(supabase, invoiceId);
  if (!payload) return;
  const pdf = await buildInvoicePdf(payload);

  if (type === "subscription") {
    await sendSubscriptionInvoiceEmail(payload.email, {
      ...payload.common,
      periodStart: payload.periodStart,
      periodEnd: payload.periodEnd,
      pdf,
    }).catch((err) => log.error("billing/invoices", "Subscription invoice email failed", err));
  } else {
    await sendBatchInvoiceEmail(payload.email, { ...payload.common, pdf }).catch((err) =>
      log.error("billing/invoices", "Batch invoice email failed", err)
    );
  }
}

// Trial-ended first invoice email, with PDF. Called by the cron.
export async function sendTrialEndedInvoice(supabase: DB, invoiceId: string): Promise<void> {
  const payload = await loadInvoiceEmailPayload(supabase, invoiceId);
  if (!payload) return;
  const pdf = await buildInvoicePdf(payload);
  await sendTrialEndedInvoiceEmail(payload.email, { ...payload.common, pdf }).catch((err) =>
    log.error("billing/invoices", "Trial ended invoice email failed", err)
  );
}

// First-time plan activation email (no-trial setup), with PDF. A welcome that
// states the plan and encloses the first invoice — distinct from a routine
// recurring invoice. Called by the admin configure route.
export async function sendPlanActivationInvoice(
  supabase: DB,
  invoiceId: string,
  meta: { planName: string; interval: string }
): Promise<void> {
  const payload = await loadInvoiceEmailPayload(supabase, invoiceId);
  if (!payload) return;
  const pdf = await buildInvoicePdf(payload);
  await sendPlanActivationEmail(payload.email, {
    ...payload.common,
    pdf,
    planName: meta.planName,
    interval: meta.interval,
    periodStart: payload.periodStart,
    periodEnd: payload.periodEnd,
  }).catch((err) => log.error("billing/invoices", "Plan activation email failed", err));
}
