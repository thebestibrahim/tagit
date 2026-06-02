import { createClient } from "@/lib/supabase/server";
import { getUser } from "@/lib/auth";
import { redirect } from "next/navigation";
import Link from "next/link";
import { ArrowRight, Tag, Package, Users, AlertCircle, CheckCircle2, Circle, Layers, PenLine } from "lucide-react";

export default async function CompanyOverviewPage() {
  const user = await getUser();
  if (!user) redirect("/auth/login");

  const supabase = await createClient();

  const [
    { data: rawTags },
    { data: rawProducts },
    { data: companyData },
    { data: batchData },
  ] = await Promise.all([
    supabase.from("tags").select("id, status").eq("company_id", user.id),
    supabase.from("products").select("id").eq("company_id", user.id),
    supabase.from("companies").select("brand_story, custom_header_text, ai_enabled, ai_persona_name, ai_persona_prompt, logo_url, signature_url").eq("id", user.id).single(),
    supabase.from("tag_batches").select("id", { count: "exact", head: true }).eq("company_id", user.id),
  ]);

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
      desc: "Order NFC tags from Tagit to get started",
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
    { label: "Total tags",          value: tags.length,                                     icon: Tag,         href: "/dashboard/tags",      accent: false },
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
            { title: "Request tag batch",          desc: "Order NFC tags for your next collection",                                                                   href: "/dashboard/batches/request", icon: Layers },
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
