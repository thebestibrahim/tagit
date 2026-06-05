import { createAdminClient } from "@/lib/supabase/admin";
import Link from "next/link";
import { ToggleLeft } from "lucide-react";
import { FlagToggle } from "./FlagToggle";
import { CreateFlagModal } from "./CreateFlagModal";
import { describeFlagState, type FlagTone } from "@/lib/feature-flags/describe";
import Pagination from "@/components/ui/Pagination";

const PER_PAGE = 50;

const TONE_DOT: Record<FlagTone, string> = {
  on: "#16A34A",
  partial: "var(--color-deep-gold)",
  off: "#9CA3AF",
};

type FlagRow = {
  id: string;
  key: string;
  name: string;
  description: string | null;
  enabled: boolean;
  rollout_percentage: number;
  environments: string[];
  feature_flag_overrides: { id: string }[];
};

export default async function FeatureFlagsPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string }>;
}) {
  const admin = createAdminClient();

  const { data } = await admin
    .from("feature_flags")
    .select("id, key, name, description, enabled, rollout_percentage, environments, feature_flag_overrides(id)")
    .order("key");

  const allFlags = (data ?? []) as FlagRow[];
  const { page: pageParam } = await searchParams;
  const page = Math.max(1, parseInt(pageParam ?? "1", 10));
  const totalPages = Math.ceil(allFlags.length / PER_PAGE);
  const flags = allFlags.slice((page - 1) * PER_PAGE, (page - 1) * PER_PAGE + PER_PAGE);
  const pageHref = (p: number) => (p > 1 ? `/admin/feature-flags?page=${p}` : "/admin/feature-flags");

  return (
    <div className="p-8 max-w-5xl mx-auto">
      <div className="flex items-start justify-between mb-8">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <ToggleLeft size={18} style={{ color: "var(--color-gold)" }} />
            <p className="text-micro font-semibold uppercase tracking-widest" style={{ color: "var(--color-gold)" }}>
              Admin
            </p>
          </div>
          <h1 className="font-display" style={{ fontSize: "32px", color: "var(--color-charcoal)", letterSpacing: "-0.02em", lineHeight: 1.15 }}>
            Feature Flags
          </h1>
          <p className="mt-1" style={{ color: "var(--color-slate)", fontSize: "var(--text-body-sm)" }}>
            Control feature rollout across all brands
          </p>
        </div>
        <CreateFlagModal />
      </div>

      <div
        className="rounded-xl overflow-hidden"
        style={{ border: "1px solid var(--color-cream)", boxShadow: "var(--shadow-sm)" }}
      >
        {flags.length === 0 ? (
          <div className="py-16 text-center" style={{ color: "var(--color-mist)" }}>
            <ToggleLeft size={32} className="mx-auto mb-3 opacity-30" />
            <p style={{ fontSize: "var(--text-body-sm)" }}>No feature flags yet</p>
          </div>
        ) : (
          <table className="w-full">
            <thead>
              <tr style={{ backgroundColor: "var(--color-smoke)", borderBottom: "1px solid var(--color-cream)" }}>
                {["Feature", "Master", "Effective access", "Overrides", ""].map((h) => (
                  <th
                    key={h}
                    className="text-left px-5 py-3 text-micro font-medium uppercase tracking-wider"
                    style={{ color: "var(--color-slate)" }}
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {flags.map((flag, i) => {
                const overrideCount = flag.feature_flag_overrides?.length ?? 0;
                const state = describeFlagState({
                  enabled: flag.enabled,
                  rolloutPercentage: flag.rollout_percentage,
                  overrideCount,
                });
                return (
                  <tr
                    key={flag.id}
                    style={{
                      backgroundColor: "var(--color-pearl)",
                      borderBottom: i < flags.length - 1 ? "1px solid var(--color-cream)" : "none",
                    }}
                  >
                    <td className="px-5 py-4">
                      <p className="font-medium" style={{ color: "var(--color-charcoal)", fontSize: "var(--text-body-sm)" }}>
                        {flag.name}
                      </p>
                      <code
                        className="mt-1 inline-block px-1.5 py-0.5 rounded text-micro"
                        style={{ backgroundColor: "var(--color-smoke)", color: "var(--color-mist)", fontFamily: "var(--font-jetbrains-mono)" }}
                      >
                        {flag.key}
                      </code>
                    </td>
                    <td className="px-5 py-4">
                      <FlagToggle
                        flagKey={flag.key}
                        enabled={flag.enabled}
                        rolloutPercentage={flag.rollout_percentage}
                        flagName={flag.name}
                      />
                    </td>
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-2">
                        <span className="rounded-full shrink-0" style={{ width: 8, height: 8, backgroundColor: TONE_DOT[state.tone] }} />
                        <span style={{ color: "var(--color-graphite)", fontSize: "var(--text-body-sm)" }}>
                          {state.label}
                        </span>
                      </div>
                    </td>
                    <td className="px-5 py-4">
                      <span
                        className="text-caption font-medium"
                        style={{ color: overrideCount > 0 ? "var(--color-deep-gold)" : "var(--color-mist)" }}
                      >
                        {overrideCount > 0 ? overrideCount : "—"}
                      </span>
                    </td>
                    <td className="px-5 py-4 text-right">
                      <Link
                        href={`/admin/feature-flags/${flag.key}`}
                        className="text-body-sm"
                        style={{ color: "var(--color-graphite)" }}
                      >
                        Configure →
                      </Link>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
        <Pagination page={page} totalPages={totalPages} makeHref={pageHref} totalLabel={`${allFlags.length} total`} />
      </div>
    </div>
  );
}
