import { createClient } from "@/lib/supabase/server";
import { getUser } from "@/lib/auth";
import { redirect } from "next/navigation";
import Link from "next/link";
import { ArrowRight, Check, Plus } from "lucide-react";
import { formatNaira, getEffectivePrice } from "@/lib/billing/pricing";
import LocalTime from "@/components/ui/LocalTime";
import { embeddedName } from "@/lib/utils";
import type { Subscription, Discount, Plan } from "@/types/database";

type SubWithPlan = Subscription & { plans: Pick<Plan, "name" | "monthly_price"> | null };

type RecentClaim = {
  id: string;
  claimant_name: string;
  status: string;
  created_at: string;
  tags: { short_id: string; products: { name: string } | { name: string }[] | null } | null;
};

/**
 * The page a brand lands on. It answers one question: what needs me today?
 * Anything waiting (a claim, an invoice, an unfinished setup step) comes
 * first; the catalogue's figures and the latest claims follow.
 */
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
    { data: recentClaimsData },
  ] = await Promise.all([
    supabase.from("tags").select("id, status").eq("company_id", user.id),
    supabase.from("products").select("id").eq("company_id", user.id),
    supabase.from("companies").select("brand_story, custom_header_text, ai_enabled, ai_persona_name, ai_persona_prompt, logo_url, signature_url").eq("id", user.id).single(),
    supabase.from("tag_batches").select("id", { count: "exact", head: true }).eq("company_id", user.id),
    supabase.from("subscriptions").select("*, plans(name, monthly_price)").eq("company_id", user.id).maybeSingle(),
    supabase.from("discounts").select("*").eq("company_id", user.id).eq("is_active", true),
    supabase.from("invoices").select("id, amount, status, paystack_payment_link, due_date").eq("company_id", user.id).in("status", ["sent", "overdue"]).order("created_at", { ascending: false }).limit(1),
    supabase
      .from("ownership_claims")
      .select("id, claimant_name, status, created_at, tags!inner(short_id, company_id, products(name))")
      .eq("tags.company_id", user.id)
      .order("created_at", { ascending: false })
      .limit(5),
  ]);

  const sub = (subData as SubWithPlan | null) ?? null;
  const discounts = (discountData ?? []) as Discount[];
  const subDiscount = discounts.find((d) => d.type === "subscription");
  const openInvoice = (openInvoiceData?.[0] as { id: string; amount: number; status: string; paystack_payment_link: string | null; due_date: string } | undefined) ?? undefined;
  const recentClaims = (recentClaimsData ?? []) as unknown as RecentClaim[];

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
  const pending = pendingClaimsCount ?? 0;

  const hasBatches = (batchData as unknown as { count: number } | null)?.count ? true : false;

  // Onboarding steps, shown until all are complete.
  const steps = [
    {
      label: "Request your first tag batch",
      short: "Tag batch",
      desc: "Order tags or cards from Tagit to get started.",
      done: tags.length > 0 || hasBatches,
      href: "/dashboard/batches/request",
    },
    {
      label: "Customize your brand",
      short: "Brand",
      desc: "Set your colours, logo and brand story for the scan page.",
      done: Boolean(company?.brand_story || company?.custom_header_text || company?.logo_url),
      href: "/dashboard/customization",
    },
    {
      label: "Register your first product",
      short: "First product",
      desc: "Link a product to a tag so its certificate can be issued.",
      done: products.length > 0,
      href: "/dashboard/products/new",
    },
    {
      label: "Set up your AI persona",
      short: "AI persona",
      desc: "Give customers a voice to talk to after they scan.",
      done: Boolean(company?.ai_enabled && company?.ai_persona_name && company?.ai_persona_prompt),
      href: "/dashboard/ai-persona",
    },
    {
      label: "Upload your certificate signature",
      short: "Signature",
      desc: "Add a handwritten signature to every certificate you issue.",
      done: Boolean(company?.signature_url),
      href: "/dashboard/customization",
    },
  ];
  const completed = steps.filter((s) => s.done);
  const remaining = steps.filter((s) => !s.done);

  const unplaced = tags.filter((t) => ["created", "shipped"].includes(t.status)).length;
  const owned = tags.filter((t) => ["owned", "transferred"].includes(t.status)).length;

  const figures = [
    { label: "Tags", value: tags.length, note: tags.length ? `${unplaced} not yet on a piece` : "None ordered yet", href: "/dashboard/id-keys/tags" },
    { label: "Products", value: products.length, note: products.length ? "Registered to a tag" : "None registered yet", href: "/dashboard/products" },
    { label: "Owned", value: owned, note: "Pieces with a recorded owner", href: "/dashboard/ownership?view=owners" },
    { label: "Claims to review", value: pending, note: pending ? "Waiting for your decision" : "All caught up", href: "/dashboard/ownership", alert: pending > 0 },
  ];

  const summary =
    pending > 0
      ? `${pending} ownership claim${pending === 1 ? " is" : "s are"} waiting for you.`
      : remaining.length > 0
        ? `${remaining.length} setup step${remaining.length === 1 ? "" : "s"} left before you're fully set up.`
        : "Nothing needs your attention today.";

  return (
    <div className="p-5 sm:p-8 max-w-5xl mx-auto">
      <div className="page-header flex flex-wrap items-end justify-between gap-x-6 gap-y-4">
        <div>
          <h1 className="page-title">Overview</h1>
          <p className="page-desc">{summary}</p>
        </div>
        <div className="flex items-center gap-2">
          <Link href="/dashboard/batches/request" className="ov-btn ov-btn-quiet">
            Request a batch
          </Link>
          <Link href="/dashboard/products/new" className="ov-btn">
            <Plus size={15} aria-hidden />
            Register product
          </Link>
        </div>
      </div>

      <PlanStatus sub={sub} subDiscount={subDiscount} openInvoice={openInvoice} />

      {pending > 0 && (
        <Link href="/dashboard/ownership" className="ov-attention mb-6">
          <span className="ov-attention-dot" aria-hidden />
          <span className="flex-1">
            <span className="block font-medium" style={{ color: "var(--color-onyx)" }}>
              Review {pending} ownership claim{pending === 1 ? "" : "s"}
            </span>
            <span className="block text-body-sm" style={{ color: "var(--app-body)" }}>
              Buyers have tapped your tags and asked to be recorded as owners.
            </span>
          </span>
          <ArrowRight size={16} aria-hidden style={{ color: "var(--app-body)" }} />
        </Link>
      )}

      {remaining.length > 0 && (
        <section className="card-raised mb-10" aria-labelledby="setup-heading">
          <div className="flex flex-wrap items-baseline justify-between gap-3 px-6 pt-5 pb-4">
            <h2 id="setup-heading" className="ov-h2">Finish setting up</h2>
            <p className="text-body-sm" style={{ color: "var(--app-body)" }}>
              {completed.length} of {steps.length} done
            </p>
          </div>
          <div className="mx-6 mb-2 h-[3px] rounded-full overflow-hidden" style={{ backgroundColor: "var(--color-linen)" }}>
            <div className="h-full rounded-full" style={{ width: `${(completed.length / steps.length) * 100}%`, backgroundColor: "var(--color-gold)" }} />
          </div>

          <ul>
            {remaining.map((step) => (
              <li key={step.label}>
                <Link href={step.href} className="ov-row">
                  <span className="ov-step-ring" aria-hidden />
                  <span className="flex-1 min-w-0">
                    <span className="block font-medium text-body-sm" style={{ color: "var(--color-onyx)" }}>
                      {step.label}
                    </span>
                    <span className="block text-caption" style={{ color: "var(--app-body)" }}>
                      {step.desc}
                    </span>
                  </span>
                  <ArrowRight size={15} aria-hidden style={{ color: "var(--app-body)" }} />
                </Link>
              </li>
            ))}
          </ul>

          {completed.length > 0 && (
            <p className="flex items-center gap-2 px-6 py-3.5 text-caption" style={{ color: "var(--app-body)", borderTop: "1px solid var(--app-edge)" }}>
              <Check size={14} aria-hidden style={{ color: "var(--color-verified)" }} />
              Done: {completed.map((s) => s.short).join(", ")}
            </p>
          )}
        </section>
      )}

      <section aria-label="Your catalogue" className="card-raised ov-figures mb-10">
        {figures.map((f) => (
          <Link key={f.label} href={f.href} className="ov-figure">
            <span className="ov-figure-value" style={f.alert ? { color: "var(--color-deep-gold)" } : undefined}>
              {f.value.toLocaleString()}
            </span>
            <span className="block text-body-sm font-medium" style={{ color: "var(--color-onyx)" }}>
              {f.label}
            </span>
            <span className="block text-caption" style={{ color: "var(--app-body)" }}>
              {f.note}
            </span>
          </Link>
        ))}
      </section>

      <section aria-labelledby="claims-heading">
        <div className="flex items-baseline justify-between gap-4 mb-3">
          <h2 id="claims-heading" className="ov-h2">Latest claims</h2>
          {recentClaims.length > 0 && (
            <Link href="/dashboard/ownership?status=all" className="text-body-sm" style={{ color: "var(--app-body)" }}>
              See all claims
            </Link>
          )}
        </div>
        <div className="card-raised">
          {recentClaims.length === 0 ? (
            <div className="px-6 py-8">
              <p className="text-body-sm" style={{ color: "var(--app-body)", maxWidth: "56ch" }}>
                When a buyer taps one of your tags and claims the piece, it appears here. You approve or reject each claim, and approval issues their certificate.
              </p>
            </div>
          ) : (
            <ul>
              {recentClaims.map((c) => {
                const product = embeddedName(c.tags?.products);
                return (
                  <li key={c.id}>
                    <Link href={`/dashboard/ownership/${c.id}`} className="ov-row">
                      <span className="flex-1 min-w-0">
                        <span className="block text-body-sm font-medium truncate" style={{ color: "var(--color-onyx)" }}>
                          {c.claimant_name}
                        </span>
                        <span className="block text-caption truncate" style={{ color: "var(--app-body)" }}>
                          {product ?? "Unnamed product"}
                          {c.tags?.short_id ? `, tag ${c.tags.short_id}` : ""}
                        </span>
                      </span>
                      <ClaimStatus status={c.status} />
                      <span className="hidden sm:block w-24 text-right text-caption" style={{ color: "var(--app-body)" }}>
                        <LocalTime iso={c.created_at} pattern="d MMM yyyy" />
                      </span>
                    </Link>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      </section>
    </div>
  );
}

function ClaimStatus({ status }: { status: string }) {
  const map: Record<string, { label: string; color: string; bg: string }> = {
    pending: { label: "Waiting", color: "#7a5a1e", bg: "#f6ecd7" },
    approved: { label: "Approved", color: "#1f5a40", bg: "#e3f0e8" },
    rejected: { label: "Rejected", color: "#8a3b3b", bg: "#f6e4e4" },
    expired: { label: "Expired", color: "#5e5c57", bg: "#eeebe4" },
  };
  const s = map[status] ?? { label: status, color: "#5e5c57", bg: "#eeebe4" };
  return (
    <span className="shrink-0 rounded-full px-2.5 py-0.5 text-caption font-medium" style={{ color: s.color, backgroundColor: s.bg }}>
      {s.label}
    </span>
  );
}

// ── Plan / billing status shown at the top of the Overview ────────────
function fmtDate(d: string | null | undefined): string {
  if (!d) return "";
  return new Date(d).toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" });
}
function daysUntil(d: string): number {
  // A trial countdown is intentionally relative to now.
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

  // Overdue or suspended: this one is a real alarm, so it is red, with Pay.
  if (sub.status === "past_due" || sub.status === "suspended") {
    const amount = openInvoice?.amount ?? nextAmount;
    const suspended = sub.status === "suspended";
    return (
      <div className="rounded-[10px] px-5 py-4 mb-6 flex flex-wrap items-center gap-x-4 gap-y-3" style={{ border: "1px solid #ecc5c5", backgroundColor: "#fbf0f0" }}>
        <div className="flex-1 min-w-[16rem]">
          <p className="font-medium text-body-sm" style={{ color: "#7a2626" }}>
            {suspended ? "Your account is suspended" : `You have an overdue invoice of ${formatNaira(amount)}`}
          </p>
          <p className="text-caption" style={{ color: "#8a3b3b" }}>
            {suspended ? "Pay your outstanding balance to restore dashboard access. Scanning is never affected." : "Pay now to keep your account active."}
          </p>
        </div>
        {openInvoice ? (
          // Routed through the self-healing pay endpoint, not the raw stored
          // link: Paystack checkout sessions expire long before a lapsed
          // subscription's invoice gets paid.
          <a href={`/api/billing/pay/${openInvoice.id}`} target="_blank" rel="noopener noreferrer" className="ov-btn" style={{ backgroundColor: "#9b2c2c" }}>
            Pay {formatNaira(amount)}
          </a>
        ) : (
          <Link href="/dashboard/features" className="ov-btn" style={{ backgroundColor: "#9b2c2c" }}>
            View billing
          </Link>
        )}
      </div>
    );
  }

  // Trialing: a quiet note, with the date the first invoice lands.
  if (sub.status === "trialing" && sub.trial_ends_at) {
    const days = daysUntil(sub.trial_ends_at);
    return (
      <div className="card-raised px-5 py-4 mb-6 flex flex-wrap items-center gap-x-4 gap-y-2">
        <div className="flex-1 min-w-[16rem]">
          <p className="font-medium text-body-sm" style={{ color: "var(--color-onyx)" }}>
            {planName} trial: {days} day{days === 1 ? "" : "s"} left
          </p>
          <p className="text-caption" style={{ color: "var(--app-body)" }}>
            Your first invoice of {formatNaira(nextAmount)} arrives on {fmtDate(sub.trial_ends_at)}.
          </p>
        </div>
        <Link href="/dashboard/features" className="text-body-sm font-medium" style={{ color: "var(--color-onyx)" }}>
          View billing
        </Link>
      </div>
    );
  }

  // Active: the sidebar plan chip already says so; nothing to add here.
  return null;
}
