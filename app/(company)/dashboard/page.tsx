import { createClient } from "@/lib/supabase/server";
import { getUser } from "@/lib/auth";
import { redirect } from "next/navigation";
import Link from "next/link";
import { ArrowRight, Tag, Package, Users, AlertCircle, CheckCircle2, Circle, Layers, PenLine, CreditCard, AlertTriangle } from "lucide-react";
import { formatNaira, getEffectivePrice } from "@/lib/billing/pricing";
import type { Subscription, Discount, Plan } from "@/types/database";

type SubWithPlan = Subscription & { plans: Pick<Plan, "name" | "monthly_price"> | null };

export default async function CompanyOverviewPage() {
  const user = await getUser();
  if (!user) redirect("/auth/login");

  const supabase = await createClient();

  const [
    { data: rawTags },
    { data: rawProducts },
    { data: companyData },
    { data: batchData },
    { data: subData },
    { data: discountData },
    { data: openInvoiceData },
  ] = await Promise.all([
    supabase.from("tags").select("id, status").eq("company_id", user.id),
    supabase.from("products").select("id").eq("company_id", user.id),
    supabase.from("companies").select("brand_story, custom_header_text, ai_enabled, ai_persona_name, ai_persona_prompt, logo_url, signature_url").eq("id", user.id).single(),
    supabase.from("tag_batches").select("id", { count: "exact", head: true }).eq("company_id", user.id),
    supabase.from("subscriptions").select("*, plans(name, monthly_price)").eq("company_id", user.id).maybeSingle(),
    supabase.from("discounts").select("*").eq("company_id", user.id).eq("is_active", true),
    supabase.from("invoices").select("id, amount, status, paystack_payment_link, due_date").eq("company_id", user.id).in("status", ["sent", "overdue"]).order("created_at", { ascending: false }).limit(1),
  ]);

  const sub = (subData as SubWithPlan | null) ?? null;
  const discounts = (discountData ?? []) as Discount[];
  const subDiscount = discounts.find((d) => d.type === "subscription");
  const openInvoice = (openInvoiceData?.[0] as { id: string; amount: number; status: string; paystack_payment_link: string | null; due_date: string } | undefined) ?? undefined;

  const tags = (rawTags ?? []) as { id: string; status: string }[];
  const tagIds = tags.map((t) => t.id);
  const products = (rawProducts ?? []) as { id: string }[];
  const company = companyData as {
    brand_story: string | null;
    custom_header_text: string | null;
    ai_enabled: boolean;
    ai_persona_name: string | null;
    ai_persona_prompt: string | null;
    logo_url: string | null;
    signature_url: string | null;
  } | null;

  const { count: pendingClaimsCount } = tagIds.length
    ? await supabase
        .from("ownership_claims")
        .select("id", { count: "exact", head: true })
        .eq("status", "pending")
        .in("tag_id", tagIds)
    : { count: 0 };

  const hasBatches = (batchData as unknown as { count: number } | null)?.count
    ? true
    : false;

  // Onboarding steps — shown until all complete
  const steps = [
    {
      label: "Request your first tag batch",
      desc: "Order tags or cards from Tagit to get started",
      done: tags.length > 0 || hasBatches,
      href: "/dashboard/batches/request",
    },
    {
      label: "Customize your brand",
      desc: "Set your colours, logo, and brand story",
      done: Boolean(company?.brand_story || company?.custom_header_text || company?.logo_url),
      href: "/dashboard/customization",
    },
    {
      label: "Register your first product",
      desc: "Link a product record to a tag",
      done: products.length > 0,
      href: "/dashboard/products/new",
    },
    {
      label: "Set up your AI persona",
      desc: "Give customers a voice to talk to after scanning",
      done: Boolean(company?.ai_enabled && company?.ai_persona_name && company?.ai_persona_prompt),
      href: "/dashboard/ai-persona",
    },
    {
      label: "Upload your certificate signature",
      desc: "Add a handwritten signature to every PDF certificate you issue",
      done: Boolean(company?.signature_url),
      href: "/dashboard/customization",
    },
  ];

  const completedSteps = steps.filter((s) => s.done).length;
  const allDone = completedSteps === steps.length;

  const quickStats = [
    { label: "Total tags",          value: tags.length,                                     icon: Tag,         href: "/dashboard/id-keys/tags", accent: false },
    { label: "Products registered", value: products.length,                                  icon: Package,     href: "/dashboard/products",  accent: false },
    { label: "Owned tags",          value: tags.filter((t) => ["owned", "transferred"].includes(t.status)).length, icon: Users,       href: "/dashboard/ownership", accent: false },
    { label: "Pending claims",      value: pendingClaimsCount ?? 0,                          icon: AlertCircle, href: "/dashboard/ownership", accent: (pendingClaimsCount ?? 0) > 0 },
  ];

  return (
    <div className="p-8 max-w-5xl mx-auto">
      {/* Page header */}
      <div className="page-header mb-10">
        <p className="text-micro font-semibold uppercase tracking-widest mb-2" style={{ color: "var(--color-gold)" }}>
          Dashboard
        </p>
        <h1 className="font-display" style={{ fontSize: "32px", color: "var(--color-charcoal)", lineHeight: 1.15, letterSpacing: "-0.02em" }}>
          Overview
        </h1>
        <p className="mt-1" style={{ color: "var(--color-slate)", fontSize: "var(--text-body-sm)" }}>
          Your brand&apos;s tag and ownership activity
        </p>
      </div>

      {/* ── Plan / billing status ── */}
      <PlanStatus sub={sub} subDiscount={subDiscount} openInvoice={openInvoice} />

      {/* ── Get started checklist (hide when all done) ── */}
      {!allDone && (
        <div
          className="rounded-2xl p-6 mb-10"
          style={{ border: "1px solid var(--color-champagne)", backgroundColor: "var(--color-soft-gold)" }}
        >
          <div className="flex items-start justify-between mb-5">
            <div>
              <p className="text-micro font-semibold uppercase tracking-widest mb-1" style={{ color: "var(--color-deep-gold)" }}>
                Getting started
              </p>
              <h2 className="font-semibold" style={{ fontSize: "var(--text-body)", color: "var(--color-charcoal)" }}>
                Set up your account
              </h2>
            </div>
            <div className="text-right">
              <p style={{ fontSize: "28px", fontWeight: 700, color: "var(--color-gold)", letterSpacing: "-0.04em", lineHeight: 1 }}>
                {completedSteps}/{steps.length}
              </p>
              <p style={{ fontSize: "var(--text-caption)", color: "var(--color-deep-gold)" }}>complete</p>
            </div>
          </div>

          {/* Progress bar */}
          <div
            className="mb-5 rounded-full overflow-hidden"
            style={{ height: 4, backgroundColor: "rgba(184,148,93,0.2)" }}
          >
            <div
              style={{
                height: "100%",
                width: `${(completedSteps / steps.length) * 100}%`,
                backgroundColor: "var(--color-gold)",
                borderRadius: 99,
                transition: "width 0.4s ease",
              }}
            />
          </div>

          <div className="space-y-2">
            {steps.map((step) => (
              <Link
                key={step.href}
                href={step.done ? "#" : step.href}
                className="flex items-center gap-3 px-4 py-3 rounded-xl group transition-all"
                style={{
                  backgroundColor: step.done ? "rgba(184,148,93,0.08)" : "rgba(255,255,255,0.65)",
                  textDecoration: "none",
                  cursor: step.done ? "default" : "pointer",
                  border: "1px solid transparent",
                }}
              >
                {step.done ? (
                  <CheckCircle2 size={18} style={{ color: "var(--color-verified)", flexShrink: 0 }} />
                ) : (
                  <Circle size={18} style={{ color: "var(--color-champagne)", flexShrink: 0 }} />
                )}
                <div style={{ flex: 1 }}>
                  <p
                    className="font-medium"
                    style={{
                      fontSize: "var(--text-body-sm)",
                      color: step.done ? "var(--color-slate)" : "var(--color-charcoal)",
                      textDecoration: step.done ? "line-through" : "none",
                    }}
                  >
                    {step.label}
                  </p>
                  {!step.done && (
                    <p style={{ fontSize: "var(--text-caption)", color: "var(--color-slate)" }}>
                      {step.desc}
                    </p>
                  )}
                </div>
                {!step.done && (
                  <ArrowRight
                    size={14}
                    strokeWidth={1.5}
                    className="shrink-0 transition-transform duration-150 group-hover:translate-x-0.5"
                    style={{ color: "var(--color-deep-gold)" }}
                  />
                )}
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* Stat cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-10">
        {quickStats.map((stat) => {
          const Icon = stat.icon;
          return (
            <Link
              key={stat.label}
              href={stat.href}
              className={`p-6 block transition-all duration-200 group ${stat.accent ? "card-accent-gold" : "card-raised"}`}
              style={{ textDecoration: "none" }}
            >
              <div className="flex items-start justify-between mb-4">
                <div
                  className="w-8 h-8 rounded-lg flex items-center justify-center"
                  style={{
                    backgroundColor: stat.accent ? "rgba(184,148,93,0.15)" : "var(--color-linen)",
                    border: `1px solid ${stat.accent ? "var(--color-champagne)" : "var(--color-cream)"}`,
                  }}
                >
                  <Icon size={15} strokeWidth={1.5}
                    style={{ color: stat.accent ? "var(--color-gold)" : "var(--color-graphite)" }}
                  />
                </div>
                <ArrowRight
                  size={14}
                  strokeWidth={1.5}
                  className="transition-transform duration-150 group-hover:translate-x-0.5"
                  style={{ color: "var(--color-mist)" }}
                />
              </div>
              <p
                className={`font-semibold mb-1 ${stat.accent ? "" : "text-gradient-gold"}`}
                style={{
                  fontSize: "36px",
                  lineHeight: 1,
                  letterSpacing: "-0.03em",
                  color: stat.accent ? "var(--color-gold)" : undefined,
                }}
              >
                {stat.value}
              </p>
              <p
                className="text-caption"
                style={{ color: stat.accent ? "var(--color-deep-gold)" : "var(--color-slate)" }}
              >
                {stat.label}
              </p>
            </Link>
          );
        })}
      </div>

      {/* Quick actions */}
      <div>
        <h2
          className="font-semibold mb-4"
          style={{ fontSize: "var(--text-body-sm)", color: "var(--color-slate)", textTransform: "uppercase", letterSpacing: "0.06em" }}
        >
          Quick actions
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          {[
            { title: "Request tag batch",          desc: "Order tags or cards for your next collection",                                                                   href: "/dashboard/batches/request", icon: Layers },
            { title: "Register a product",         desc: "Link a product record to an unassigned tag",                                                               href: "/dashboard/products/new",    icon: Package },
            { title: "Review ownership claims",    desc: `${pendingClaimsCount ?? 0} pending claim${(pendingClaimsCount ?? 0) !== 1 ? "s" : ""} awaiting your approval`, href: "/dashboard/ownership",    icon: Users },
            { title: "Upload certificate signature", desc: "Add your signature to branded PDF certificates",                                                          href: "/dashboard/customization",   icon: PenLine },
          ].map((action) => (
            <Link
              key={action.href}
              href={action.href}
              className="card-raised p-5 flex items-start justify-between gap-3 transition-all duration-200 group"
              style={{ textDecoration: "none" }}
            >
              <div className="flex items-start gap-3">
                <div
                  className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0 mt-0.5"
                  style={{ backgroundColor: "var(--color-linen)" }}
                >
                  <action.icon size={14} style={{ color: "var(--color-gold)" }} />
                </div>
                <div>
                  <p className="font-medium text-body-sm mb-1" style={{ color: "var(--color-charcoal)" }}>
                    {action.title}
                  </p>
                  <p className="text-caption" style={{ color: "var(--color-slate)" }}>
                    {action.desc}
                  </p>
                </div>
              </div>
              <ArrowRight
                size={16}
                strokeWidth={1.5}
                className="shrink-0 mt-0.5 transition-transform duration-150 group-hover:translate-x-0.5"
                style={{ color: "var(--color-mist)" }}
              />
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}

// ── Plan / billing status banner shown at the top of the Overview ────────────
function fmtDate(d: string | null | undefined): string {
  if (!d) return "—";
  return new Date(d).toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" });
}
function daysUntil(d: string): number {
  return Math.max(0, Math.ceil((new Date(d).getTime() - Date.now()) / 86400000));
}

function PlanStatus({
  sub,
  subDiscount,
  openInvoice,
}: {
  sub: SubWithPlan | null;
  subDiscount?: Discount;
  openInvoice?: { id: string; amount: number; status: string; paystack_payment_link: string | null; due_date: string };
}) {
  // Nothing to show until Tagit configures billing for this brand.
  if (!sub) return null;

  const planName = sub.plans?.name ?? "Plan";
  const baseNext = getEffectivePrice(sub.plans?.monthly_price ?? 0, sub.custom_monthly_price, sub.billing_interval);
  const nextAmount = subDiscount ? Math.round(baseNext * (1 - subDiscount.percentage / 100)) : baseNext;

  // Overdue / suspended — red, with a Pay action.
  if (sub.status === "past_due" || sub.status === "suspended") {
    const amount = openInvoice?.amount ?? nextAmount;
    const suspended = sub.status === "suspended";
    return (
      <div className="rounded-2xl p-5 mb-10 flex items-start gap-3" style={{ border: "1px solid #FECACA", backgroundColor: "#FEF2F2" }}>
        <AlertTriangle size={20} style={{ color: "#B91C1C" }} className="mt-0.5 shrink-0" />
        <div className="flex-1">
          <p className="font-semibold" style={{ color: "#7F1D1D", fontSize: "var(--text-body-sm)" }}>
            {suspended ? "Your account is suspended" : `You have an overdue invoice of ${formatNaira(amount)}`}
          </p>
          <p className="mt-0.5" style={{ color: "#991B1B", fontSize: "var(--text-caption)" }}>
            {suspended ? "Pay your outstanding balance to restore dashboard access. Chip scanning is never affected." : "Pay now to avoid account suspension."}
          </p>
        </div>
        {openInvoice?.paystack_payment_link ? (
          <a href={openInvoice.paystack_payment_link} target="_blank" rel="noopener noreferrer" className="shrink-0 inline-flex items-center gap-1.5 px-4 py-2 rounded-full text-micro font-semibold" style={{ backgroundColor: "#B91C1C", color: "#fff" }}>
            Pay {formatNaira(amount)} <ArrowRight size={12} />
          </a>
        ) : (
          <Link href="/dashboard/features" className="shrink-0 inline-flex items-center gap-1.5 px-4 py-2 rounded-full text-micro font-semibold" style={{ backgroundColor: "#B91C1C", color: "#fff" }}>
            View billing <ArrowRight size={12} />
          </Link>
        )}
      </div>
    );
  }

  // Trialing — gold.
  if (sub.status === "trialing" && sub.trial_ends_at) {
    return (
      <BannerShell tone="gold">
        <CreditCard size={18} style={{ color: "var(--color-gold)" }} className="mt-0.5 shrink-0" />
        <div className="flex-1">
          <p className="font-semibold" style={{ color: "var(--color-charcoal)", fontSize: "var(--text-body-sm)" }}>
            Free trial · {planName} — {daysUntil(sub.trial_ends_at)} days remaining
          </p>
          <p className="mt-0.5" style={{ color: "var(--color-deep-gold)", fontSize: "var(--text-caption)" }}>
            First invoice of {formatNaira(nextAmount)} on {fmtDate(sub.trial_ends_at)}.
          </p>
        </div>
        <ManageLink />
      </BannerShell>
    );
  }

  // Active — neutral. The sidebar plan chip already shows this, so the Overview
  // doesn't repeat it; only the actionable states above (trial / overdue /
  // suspended) surface a banner here.
  return null;
}

function BannerShell({ tone, children }: { tone: "gold" | "default"; children: React.ReactNode }) {
  const style =
    tone === "gold"
      ? { border: "1px solid var(--color-champagne)", backgroundColor: "var(--color-soft-gold)" }
      : { border: "1px solid var(--color-cream)", backgroundColor: "var(--color-pearl)" };
  return (
    <div className="rounded-2xl p-5 mb-10 flex items-start gap-3" style={style}>
      {children}
    </div>
  );
}

function ManageLink() {
  return (
    <Link href="/dashboard/features" className="shrink-0 inline-flex items-center gap-1 text-micro font-semibold mt-0.5" style={{ color: "var(--color-graphite)" }}>
      Manage <ArrowRight size={12} />
    </Link>
  );
}
