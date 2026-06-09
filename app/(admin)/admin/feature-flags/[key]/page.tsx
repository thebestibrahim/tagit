import { createAdminClient } from "@/lib/supabase/admin";
import { notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, ToggleLeft } from "lucide-react";
import { GlobalSettings, OverridesCard } from "./FlagDetailClient";
import LocalTime from "@/components/ui/LocalTime";

type Override = {
  id: string;
  entity_id: string;
  entity_type: string;
  enabled: boolean;
  reason: string | null;
  created_at: string;
};

type AuditRow = {
  id: string;
  action: string;
  old_value: Record<string, unknown> | null;
  new_value: Record<string, unknown> | null;
  performed_by_email: string | null;
  performed_at: string;
};

export default async function FlagDetailPage({
  params,
}: {
  params: Promise<{ key: string }>;
}) {
  const { key } = await params;
  const admin = createAdminClient();

  const [{ data: flag }, { data: auditData }, { data: brandsData }] = await Promise.all([
    admin
      .from("feature_flags")
      .select("*, feature_flag_overrides(*)")
      .eq("key", key)
      .single(),
    admin
      .from("feature_flag_audit")
      .select("id, action, old_value, new_value, performed_by_email, performed_at")
      .eq("flag_key", key)
      .order("performed_at", { ascending: false })
      .limit(50),
    admin
      .from("companies")
      .select("id, name")
      .eq("status", "approved")
      .order("name"),
  ]);

  if (!flag) notFound();

  const overrides = ((flag as { feature_flag_overrides?: Override[] }).feature_flag_overrides ?? []) as Override[];
  const audit = (auditData ?? []) as AuditRow[];
  const brands = (brandsData ?? []) as { id: string; name: string }[];

  return (
    <div className="p-8 max-w-3xl mx-auto">
      <Link
        href="/admin/feature-flags"
        className="inline-flex items-center gap-1.5 mb-6 text-body-sm"
        style={{ color: "var(--color-graphite)" }}
      >
        <ArrowLeft size={14} /> Feature Flags
      </Link>

      {/* Header */}
      <div className="flex items-start justify-between mb-8">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <ToggleLeft size={16} style={{ color: "var(--color-gold)" }} />
            <code
              className="text-micro px-2 py-0.5 rounded"
              style={{
                backgroundColor: "var(--color-smoke)",
                color: "var(--color-graphite)",
                fontFamily: "var(--font-jetbrains-mono)",
              }}
            >
              {flag.key}
            </code>
          </div>
          <h1
            className="font-display"
            style={{ fontSize: "28px", color: "var(--color-charcoal)", letterSpacing: "-0.02em", lineHeight: 1.2 }}
          >
            {flag.name}
          </h1>
          {flag.description && (
            <p className="mt-1" style={{ color: "var(--color-slate)", fontSize: "var(--text-body-sm)" }}>
              {flag.description}
            </p>
          )}
        </div>
        <span
          className="mt-1 px-3 py-1 rounded-full text-caption font-semibold"
          style={{
            backgroundColor: flag.enabled ? "#DCFCE7" : "#F3F4F6",
            color: flag.enabled ? "#166534" : "#6B7280",
          }}
        >
          {flag.enabled ? "● ENABLED" : "● DISABLED"}
        </span>
      </div>

      <div className="space-y-6">
        {/* Global settings */}
        <GlobalSettings
          flagKey={flag.key}
          flagName={flag.name}
          enabled={flag.enabled}
          rolloutPercentage={flag.rollout_percentage}
          environments={flag.environments}
          overrideCount={overrides.length}
        />

        {/* Brand overrides */}
        <OverridesCard
          flagKey={flag.key}
          overrides={overrides}
          brands={brands}
        />

        {/* Audit trail */}
        <div className="card-raised p-6">
          <h2 className="font-semibold mb-5" style={{ color: "var(--color-charcoal)", fontSize: "var(--text-h3)" }}>
            Change History
          </h2>

          {audit.length === 0 ? (
            <p className="text-body-sm py-4 text-center" style={{ color: "var(--color-mist)" }}>
              No changes recorded yet
            </p>
          ) : (
            <div className="space-y-3">
              {audit.map((entry) => (
                <div
                  key={entry.id}
                  className="flex gap-4 py-3"
                  style={{ borderBottom: "1px solid var(--color-cream)" }}
                >
                  <div
                    className="w-2 h-2 rounded-full mt-1.5 shrink-0"
                    style={{ backgroundColor: "var(--color-gold)" }}
                  />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <p className="text-body-sm font-medium" style={{ color: "var(--color-charcoal)" }}>
                        {formatAction(entry.action)}
                      </p>
                      <p className="text-caption shrink-0" style={{ color: "var(--color-mist)" }}>
                        {<LocalTime iso={entry.performed_at} pattern="MMM d, HH:mm" />}
                      </p>
                    </div>
                    {entry.performed_by_email && (
                      <p className="text-caption" style={{ color: "var(--color-mist)" }}>
                        by {entry.performed_by_email}
                      </p>
                    )}
                    {(entry.old_value || entry.new_value) && (
                      <div className="mt-1.5 flex gap-3 text-caption font-mono" style={{ color: "var(--color-slate)" }}>
                        {entry.old_value && (
                          <span style={{ color: "#DC2626" }}>
                            − {JSON.stringify(entry.old_value)}
                          </span>
                        )}
                        {entry.new_value && (
                          <span style={{ color: "#16A34A" }}>
                            + {JSON.stringify(entry.new_value)}
                          </span>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function formatAction(action: string): string {
  const map: Record<string, string> = {
    created: "Flag created",
    updated: "Settings updated",
    override_added: "Brand override added",
    override_removed: "Brand override removed",
    disabled_via_delete: "Flag disabled",
  };
  return map[action] ?? action;
}
