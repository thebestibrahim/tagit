import { createClient } from "@/lib/supabase/server";
import { getUser } from "@/lib/auth";
import { redirect } from "next/navigation";
import Link from "next/link";
import { ArrowRight, Tag, Package, Users, AlertCircle } from "lucide-react";

export default async function CompanyOverviewPage() {
  const user = await getUser();
  if (!user) redirect("/auth/login");

  const supabase = await createClient();

  const { data: rawTags } = await supabase
    .from("tags")
    .select("id, status")
    .eq("company_id", user.id);

  const tags = (rawTags ?? []) as { id: string; status: string }[];
  const tagIds = tags.map((t) => t.id);

  const { data: rawProducts } = await supabase
    .from("products")
    .select("id")
    .eq("company_id", user.id);

  const products = (rawProducts ?? []) as { id: string }[];

  const { data: rawClaims } = tagIds.length
    ? await supabase
        .from("ownership_claims")
        .select("id")
        .eq("status", "pending")
        .in("tag_id", tagIds)
    : { data: [] };

  const pendingClaims = (rawClaims ?? []) as { id: string }[];

  const quickStats = [
    { label: "Total tags",          value: tags.length,                                     icon: Tag,         href: "/dashboard/tags",      accent: false },
    { label: "Products registered", value: products.length,                                  icon: Package,     href: "/dashboard/products",  accent: false },
    { label: "Owned tags",          value: tags.filter((t) => t.status === "owned").length, icon: Users,       href: "/dashboard/ownership", accent: false },
    { label: "Pending claims",      value: pendingClaims.length,                             icon: AlertCircle, href: "/dashboard/ownership", accent: pendingClaims.length > 0 },
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

      {/* Stat cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-10">
        {quickStats.map((stat) => {
          const Icon = stat.icon;
          return (
            <Link
              key={stat.label}
              href={stat.href}
              className={`p-6 block transition-all duration-200 group ${stat.accent ? "card-accent-gold" : "card-raised"}`}
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
            { title: "Register a product",         desc: "Link a product record to an unassigned tag",                                                          href: "/dashboard/products/new" },
            { title: "Review ownership claims",    desc: `${pendingClaims.length} pending claim${pendingClaims.length !== 1 ? "s" : ""} awaiting your approval`, href: "/dashboard/ownership" },
            { title: "Customize brand experience", desc: "Update colours, fonts, and brand story",                                                              href: "/dashboard/customization" },
          ].map((action) => (
            <Link
              key={action.href}
              href={action.href}
              className="card-raised p-5 flex items-start justify-between gap-3 transition-all duration-200 group"
            >
              <div>
                <p className="font-medium text-body-sm mb-1" style={{ color: "var(--color-charcoal)" }}>
                  {action.title}
                </p>
                <p className="text-caption" style={{ color: "var(--color-slate)" }}>
                  {action.desc}
                </p>
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
