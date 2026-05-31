import { createServiceClient } from "@/lib/supabase/server";
import type { CompanyStatus, TagStatus } from "@/types/database";

export default async function AdminOverviewPage() {
  const supabase = createServiceClient();

  const [companiesResult, tagsResult] = await Promise.all([
    supabase.from("companies").select("status"),
    supabase.from("tags").select("status"),
  ]);

  const companies = (companiesResult.data ?? []) as { status: CompanyStatus }[];
  const tags = (tagsResult.data ?? []) as { status: TagStatus }[];

  const stats = [
    {
      label: "Total companies",
      value: companies.length,
      sub: `${companies.filter((c) => c.status === "pending").length} pending review`,
      accent: false,
    },
    {
      label: "Total tags",
      value: tags.length,
      sub: `${tags.filter((t) => t.status === "owned").length} owned`,
      accent: false,
    },
    {
      label: "Pending approval",
      value: companies.filter((c) => c.status === "pending").length,
      sub: "Companies awaiting review",
      accent: true,
    },
    {
      label: "Active tags",
      value: tags.filter((t) =>
        ["unowned", "claim_pending", "owned", "transfer_pending"].includes(t.status)
      ).length,
      sub: "In market",
      accent: false,
    },
  ];

  return (
    <div className="p-8 max-w-5xl mx-auto">
      {/* Page header */}
      <div className="page-header mb-10">
        <p className="text-micro font-semibold uppercase tracking-widest mb-2" style={{ color: "var(--color-gold)" }}>
          Admin
        </p>
        <h1 className="font-display" style={{ fontSize: "32px", color: "var(--color-charcoal)", lineHeight: 1.15, letterSpacing: "-0.02em" }}>
          Overview
        </h1>
        <p className="mt-1" style={{ color: "var(--color-slate)", fontSize: "var(--text-body-sm)" }}>
          Platform-wide operational summary
        </p>
      </div>

      {/* Stats grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat) => (
          <div
            key={stat.label}
            className={stat.accent ? "card-accent-gold p-6" : "card-raised p-6"}
          >
            <p
              className="text-micro font-semibold uppercase tracking-wider mb-4"
              style={{ color: stat.accent ? "var(--color-deep-gold)" : "var(--color-mist)" }}
            >
              {stat.label}
            </p>
            <p
              className={`font-semibold mb-1 ${stat.accent ? "" : "text-gradient-gold"}`}
              style={{
                fontSize: "40px",
                lineHeight: 1,
                letterSpacing: "-0.04em",
                color: stat.accent ? "var(--color-gold)" : undefined,
              }}
            >
              {stat.value.toLocaleString()}
            </p>
            <p
              className="text-caption mt-2"
              style={{ color: stat.accent ? "var(--color-gold)" : "var(--color-mist)" }}
            >
              {stat.sub}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}
