import { createServiceClient } from "@/lib/supabase/server";
import { getUser } from "@/lib/auth";
import { redirect } from "next/navigation";
import Link from "next/link";
import { getFlagsForBrand } from "@/lib/feature-flags/server";
import { CheckCircle2, Clock, CreditCard, ArrowRight, AlertTriangle } from "lucide-react";
import type { FlagKey } from "@/lib/feature-flags/types";
import type { Invoice, Subscription, Discount, Plan } from "@/types/database";
import { formatNaira, getEffectivePrice } from "@/lib/billing/pricing";
import { chipUsage, MINIMUM_ORDER, type ChipUsage } from "@/lib/billing/limits";
import { invoiceNumber } from "@/lib/billing/invoices";

const FEATURE_DISPLAY: { key: FlagKey; name: string; description: string }[] = [
  { key: "certificate_generation", name: "Certificate of Authenticity", description: "Verified certificates for every ownership confirmation" },
  { key: "brand_customisation", name: "Brand Page Customisation", description: "Personalise your consumer-facing scan experience" },
  { key: "ai_persona", name: "AI Product Persona", description: "Let your items speak for themselves with AI" },
  { key: "analytics_overview", name: "Analytics", description: "See how your tags are scanned and where your items are being used" },
  { key: "resale_analytics", name: "Resale Analytics", description: "Where your items travel after resale, by country" },
  { key: "bulk_tag_creation", name: "Bulk Tag Creation", description: "Create multiple tags in a single operation" },
  { key: "intelligence_reports", name: "Intelligence Reports", description: "Premium market intelligence for your brand" },
];

function fmtDate(d: string | null | undefined): string {
  if (!d) return "—";
  return new Date(d).toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" });
}

function daysUntil(d: string): number {
  return Math.max(0, Math.ceil((new Date(d).getTime() - Date.now()) / 86400000));
}

type SubWithPlan = Subscription & { plans: Pick<Plan, "name" | "monthly_price" | "tag_limit" | "card_limit"> | null };

export default async function BillingPage() {
  const user = await getUser();
  if (!user) redirect("/auth/login");

  const supabase = createServiceClient();

  const [{ data: company }, { data: subData }, { data: discountData }, { data: invoiceData }, flags] = await Promise.all([
    supabase.from("companies").select("name").eq("id", user.id).single(),
    supabase.from("subscriptions").select("*, plans(name, monthly_price, tag_limit, card_limit)").eq("company_id", user.id).maybeSingle(),
    supabase.from("discounts").select("*").eq("company_id", user.id).eq("is_active", true),
    supabase.from("invoices").select("*").eq("company_id", user.id).order("created_at", { ascending: false }),
    getFlagsForBrand(user.id),
  ]);

  if (!company) redirect("/auth/unauthorized");

  const sub = subData as SubWithPlan | null;
  const discounts = (discountData ?? []) as Discount[];
  const invoices = (invoiceData ?? []) as Invoice[];
  const subDiscount = discounts.find((d) => d.type === "subscription");
  const batchDiscount = discounts.find((d) => d.type === "batch");

  const planPrice = sub?.plans?.monthly_price ?? 0;
  const nextAmount = sub ? getEffectivePrice(planPrice, sub.custom_monthly_price, sub.billing_interval) : 0;

  const tagUse = sub ? chipUsage(sub.tag_limit_override, sub.plans?.tag_limit, sub.tags_ordered_total) : null;
  const cardUse = sub ? chipUsage(sub.card_limit_override, sub.plans?.card_limit, sub.cards_ordered_total) : null;
  const discountedNext = subDiscount ? Math.round(nextAmount * (1 - subDiscount.percentage / 100)) : nextAmount;

  // Most recent unpaid invoice drives the Pay Now banners.
  const openInvoice = invoices.find((i) => i.status === "sent" || i.status === "overdue");

  const activeCount = FEATURE_DISPLAY.filter((f) => flags[f.key]).length;

  return (
    <div className="p-8 max-w-3xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-2 mb-2">
          <CreditCard size={18} style={{ color: "var(--color-gold)" }} />
          <p className="text-micro font-semibold uppercase tracking-widest" style={{ color: "var(--color-gold)" }}>
            Billing & Plan
          </p>
        </div>
        <h1 className="font-display" style={{ fontSize: "32px", color: "var(--color-charcoal)", letterSpacing: "-0.02em", lineHeight: 1.15 }}>
          Billing
        </h1>
      </div>

      {/* Status banner */}
      <StatusBanner sub={sub} nextAmount={nextAmount} discountedNext={discountedNext} subDiscount={subDiscount} batchDiscount={batchDiscount} openInvoice={openInvoice} />

      {/* Current plan */}
      {sub && (
        <section className="mt-6 rounded-xl p-6" style={{ backgroundColor: "var(--color-pearl)", border: "1px solid var(--color-cream)" }}>
          <p className="text-micro font-semibold uppercase tracking-widest mb-4" style={{ color: "var(--color-mist)" }}>Current plan</p>
          <dl className="grid grid-cols-2 gap-y-3 gap-x-6">
            <Row label="Plan" value={sub.plans?.name ?? "—"} />
            <Row label="Interval" value={cap(sub.billing_interval)} />
            <Row label="Next billing" value={fmtDate(sub.current_period_end ?? sub.trial_ends_at)} />
            <Row label="Next amount" value={subDiscount ? `${formatNaira(discountedNext)}  (after ${subDiscount.percentage}% off)` : formatNaira(nextAmount)} />
            {subDiscount && <Row label="Subscription discount" value={`${subDiscount.percentage}% off — ${subDiscount.duration - subDiscount.used} cycles left`} />}
            {batchDiscount && <Row label="Batch discount" value={`${batchDiscount.percentage}% off — ${batchDiscount.duration - batchDiscount.used} orders left`} />}
          </dl>

          {/* Chip usage — lifetime limits */}
          {(tagUse || cardUse) && (
            <div className="mt-6 pt-6" style={{ borderTop: "1px solid var(--color-cream)" }}>
              <p className="text-micro font-semibold uppercase tracking-widest mb-4" style={{ color: "var(--color-mist)" }}>Chip allowance (lifetime)</p>
              <div className="space-y-5">
                {tagUse && <ChipUsageRow label="Tags" usage={tagUse} />}
                {cardUse && <ChipUsageRow label="Cards" usage={cardUse} />}
              </div>
              {((tagUse && tagUse.exhausted) || (cardUse && cardUse.exhausted)) && (
                <div className="mt-5 rounded-xl px-4 py-3 flex items-start gap-2.5" style={{ backgroundColor: "var(--color-soft-gold)", border: "1px solid var(--color-champagne)" }}>
                  <AlertTriangle size={16} style={{ color: "var(--color-deep-gold)" }} className="mt-0.5 shrink-0" />
                  <p style={{ color: "var(--color-deep-gold)", fontSize: "var(--text-caption)", lineHeight: 1.6 }}>
                    {tagUse?.exhausted && cardUse?.exhausted
                      ? `You have ${tagUse.remaining} tags and ${cardUse.remaining} cards remaining.`
                      : tagUse?.exhausted
                      ? `You have ${tagUse.remaining} tag${tagUse.remaining === 1 ? "" : "s"} remaining.`
                      : `You have ${cardUse?.remaining} card${cardUse?.remaining === 1 ? "" : "s"} remaining.`}{" "}
                    Minimum order is {MINIMUM_ORDER}. Contact Tagit to upgrade your plan to order more.
                  </p>
                </div>
              )}
            </div>
          )}
        </section>
      )}

      {/* Invoices */}
      <section className="mt-6">
        <p className="text-micro font-semibold uppercase tracking-widest mb-3" style={{ color: "var(--color-mist)" }}>Invoices</p>
        {invoices.length === 0 ? (
          <p className="text-body-sm rounded-xl px-5 py-6 text-center" style={{ color: "var(--color-mist)", backgroundColor: "var(--color-smoke)" }}>
            No invoices yet.
          </p>
        ) : (
          <div className="rounded-xl overflow-hidden" style={{ border: "1px solid var(--color-cream)" }}>
            {invoices.map((inv, idx) => {
              const overdue = inv.status === "overdue";
              const unpaid = inv.status === "sent" || inv.status === "overdue";
              return (
                <div key={inv.id} className="flex items-center gap-4 px-5 py-3.5" style={{ borderTop: idx === 0 ? "none" : "1px solid var(--color-cream)", backgroundColor: overdue ? "#FEF2F2" : "var(--color-pearl)" }}>
                  <div className="flex-1 min-w-0">
                    <Link href={`/dashboard/features/invoices/${inv.id}`} className="font-medium hover:underline" style={{ color: "var(--color-charcoal)", fontSize: "var(--text-body-sm)" }}>
                      {invoiceLabel(inv)}
                    </Link>
                    <p className="text-caption mt-0.5" style={{ color: "var(--color-mist)" }}>
                      {invoiceNumber(inv)} · {fmtDate(inv.created_at)}
                    </p>
                  </div>
                  <span className="font-medium tabular-nums" style={{ color: "var(--color-charcoal)", fontSize: "var(--text-body-sm)" }}>{formatNaira(inv.amount)}</span>
                  {inv.status === "paid" ? (
                    <span className="shrink-0 text-micro font-semibold px-2.5 py-1 rounded-full" style={{ backgroundColor: "#DCFCE7", color: "#166534" }}>● Paid</span>
                  ) : unpaid && inv.paystack_payment_link ? (
                    <a href={inv.paystack_payment_link} target="_blank" rel="noopener noreferrer" className="shrink-0 inline-flex items-center gap-1 text-micro font-semibold px-3 py-1.5 rounded-full" style={{ backgroundColor: "var(--color-charcoal)", color: "var(--color-pearl)" }}>
                      Pay now <ArrowRight size={11} />
                    </a>
                  ) : (
                    <span className="shrink-0 text-micro font-semibold px-2.5 py-1 rounded-full" style={{ backgroundColor: "var(--color-cream)", color: "var(--color-mist)" }}>{cap(inv.status)}</span>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </section>

      {/* Features */}
      <section className="mt-8">
        <p className="text-micro font-semibold uppercase tracking-widest mb-1" style={{ color: "var(--color-mist)" }}>Features</p>
        <p className="mb-3" style={{ color: "var(--color-slate)", fontSize: "var(--text-body-sm)" }}>
          {activeCount} of {FEATURE_DISPLAY.length} features active on your account
        </p>
        <div className="space-y-3">
          {FEATURE_DISPLAY.map((feature) => {
            const active = flags[feature.key] ?? false;
            return (
              <div key={feature.key} className="flex items-start gap-4 px-5 py-4 rounded-xl" style={{ backgroundColor: active ? "var(--color-pearl)" : "var(--color-smoke)", border: active ? "1px solid var(--color-cream)" : "1px solid transparent", opacity: active ? 1 : 0.75 }}>
                <div className="mt-0.5 shrink-0" style={{ color: active ? "#16A34A" : "var(--color-mist)" }}>
                  {active ? <CheckCircle2 size={18} /> : <Clock size={18} />}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium" style={{ color: active ? "var(--color-charcoal)" : "var(--color-graphite)", fontSize: "var(--text-body-sm)" }}>{feature.name}</p>
                  <p className="mt-0.5" style={{ color: "var(--color-mist)", fontSize: "var(--text-caption)" }}>{feature.description}</p>
                </div>
                {active ? (
                  <span className="shrink-0 text-micro font-semibold px-2.5 py-1 rounded-full" style={{ backgroundColor: "#DCFCE7", color: "#166534" }}>
                    Active
                  </span>
                ) : (
                  <a
                    href={`mailto:business@tagitlux.com?subject=${encodeURIComponent(`Upgrade request — ${feature.name}`)}`}
                    className="shrink-0 text-micro font-semibold px-3 py-1 rounded-full"
                    style={{ backgroundColor: "var(--color-soft-gold)", color: "var(--color-deep-gold)", textDecoration: "none" }}
                  >
                    Request upgrade
                  </a>
                )}
              </div>
            );
          })}
        </div>
      </section>

      <p className="mt-6 text-caption text-center" style={{ color: "var(--color-mist)" }}>
        Billing and feature access are managed by the Tagit team. Contact us with any questions.
      </p>
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-caption" style={{ color: "var(--color-mist)" }}>{label}</dt>
      <dd className="mt-0.5 font-medium" style={{ color: "var(--color-charcoal)", fontSize: "var(--text-body-sm)" }}>{value}</dd>
    </div>
  );
}

function ChipUsageRow({ label, usage }: { label: string; usage: ChipUsage }) {
  if (usage.unlimited) {
    return (
      <div className="flex items-center justify-between">
        <span className="font-medium" style={{ color: "var(--color-charcoal)", fontSize: "var(--text-body-sm)" }}>{label}</span>
        <span style={{ color: "var(--color-slate)", fontSize: "var(--text-body-sm)" }}>{usage.used.toLocaleString()} ordered · Unlimited</span>
      </div>
    );
  }
  const pct = usage.limit ? Math.min(100, Math.round((usage.used / usage.limit) * 100)) : 0;
  const barColor = usage.exhausted ? "#B45309" : pct >= 80 ? "var(--color-gold)" : "var(--color-verified)";
  return (
    <div>
      <div className="flex items-center justify-between mb-1.5">
        <span className="font-medium" style={{ color: "var(--color-charcoal)", fontSize: "var(--text-body-sm)" }}>{label}</span>
        <span className="tabular-nums" style={{ color: "var(--color-slate)", fontSize: "var(--text-body-sm)" }}>
          {usage.used.toLocaleString()} used of {usage.limit?.toLocaleString()} lifetime
        </span>
      </div>
      <div className="rounded-full overflow-hidden" style={{ height: 6, backgroundColor: "var(--color-cream)" }}>
        <div style={{ height: "100%", width: `${pct}%`, backgroundColor: barColor, borderRadius: 99, transition: "width 0.3s ease" }} />
      </div>
      <p className="mt-1 text-caption" style={{ color: usage.exhausted ? "#B45309" : "var(--color-mist)" }}>
        {usage.remaining?.toLocaleString()} remaining
      </p>
    </div>
  );
}

function cap(s: string): string {
  return s.charAt(0).toUpperCase() + s.slice(1);
}

function invoiceLabel(inv: Invoice): string {
  if (inv.type === "batch") return "Chip order";
  if (inv.period_start) return `${new Date(inv.period_start).toLocaleDateString("en-GB", { month: "long" })} subscription`;
  return "Subscription";
}

function StatusBanner({ sub, nextAmount, discountedNext, subDiscount, batchDiscount, openInvoice }: {
  sub: SubWithPlan | null;
  nextAmount: number;
  discountedNext: number;
  subDiscount?: Discount;
  batchDiscount?: Discount;
  openInvoice?: Invoice;
}) {
  if (!sub) {
    return (
      <Banner tone="default">
        <p style={{ color: "var(--color-slate)", fontSize: "var(--text-body-sm)" }}>Your billing has not been set up yet. The Tagit team will configure your plan shortly.</p>
      </Banner>
    );
  }

  const planName = sub.plans?.name ?? "Plan";

  if (sub.status === "trialing" && sub.trial_ends_at) {
    return (
      <Banner tone="gold">
        <p className="font-medium" style={{ color: "var(--color-charcoal)" }}>You are on a free trial — {daysUntil(sub.trial_ends_at)} days remaining.</p>
        <p className="mt-1" style={{ color: "var(--color-slate)", fontSize: "var(--text-body-sm)" }}>
          Your first invoice of {formatNaira(discountedNext)} will be sent on {fmtDate(sub.trial_ends_at)}.
        </p>
      </Banner>
    );
  }

  if (sub.status === "past_due" || sub.status === "suspended") {
    const amount = openInvoice?.amount ?? discountedNext;
    const suspended = sub.status === "suspended";
    return (
      <Banner tone="danger">
        <div className="flex items-start gap-3">
          <AlertTriangle size={20} style={{ color: "#B91C1C" }} className="mt-0.5 shrink-0" />
          <div className="flex-1">
            <p className="font-medium" style={{ color: "#7F1D1D" }}>
              {suspended ? "Your account is suspended." : `You have an overdue invoice of ${formatNaira(amount)}.`}
            </p>
            <p className="mt-1" style={{ color: "#991B1B", fontSize: "var(--text-body-sm)" }}>
              {suspended ? "Pay your outstanding balance to restore dashboard access. Chip scanning is never affected." : "Pay now to avoid account suspension."}
            </p>
            {openInvoice?.paystack_payment_link && (
              <a href={openInvoice.paystack_payment_link} target="_blank" rel="noopener noreferrer" className="mt-3 inline-flex items-center gap-1.5 text-micro font-semibold px-4 py-2 rounded-full" style={{ backgroundColor: "#B91C1C", color: "#fff" }}>
                Pay {formatNaira(amount)} now <ArrowRight size={12} />
              </a>
            )}
          </div>
        </div>
      </Banner>
    );
  }

  // Active
  return (
    <Banner tone="default">
      <div className="flex items-center gap-2 flex-wrap">
        <span className="inline-block w-2 h-2 rounded-full" style={{ backgroundColor: "#16A34A" }} />
        <span className="font-medium" style={{ color: "var(--color-charcoal)" }}>Active plan</span>
        <span style={{ color: "var(--color-mist)" }}>·</span>
        <span style={{ color: "var(--color-slate)" }}>{planName}</span>
        <span style={{ color: "var(--color-mist)" }}>·</span>
        <span style={{ color: "var(--color-slate)" }}>Next invoice: {formatNaira(subDiscount ? discountedNext : nextAmount)}</span>
      </div>
      {(subDiscount || batchDiscount) && (
        <div className="mt-2 space-y-0.5" style={{ fontSize: "var(--text-body-sm)" }}>
          {subDiscount && <p style={{ color: "var(--color-gold)" }}>Subscription: {subDiscount.percentage}% off — {subDiscount.duration - subDiscount.used} cycles remaining</p>}
          {batchDiscount && <p style={{ color: "var(--color-gold)" }}>Batch orders: {batchDiscount.percentage}% off — {batchDiscount.duration - batchDiscount.used} orders remaining</p>}
        </div>
      )}
    </Banner>
  );
}

function Banner({ tone, children }: { tone: "gold" | "danger" | "default"; children: React.ReactNode }) {
  const styles =
    tone === "gold"
      ? { backgroundColor: "var(--color-soft-gold)", border: "1px solid var(--color-cream)" }
      : tone === "danger"
      ? { backgroundColor: "#FEF2F2", border: "1px solid #FECACA" }
      : { backgroundColor: "var(--color-pearl)", border: "1px solid var(--color-cream)" };
  return (
    <div className="rounded-xl px-6 py-5" style={styles}>
      {children}
    </div>
  );
}
