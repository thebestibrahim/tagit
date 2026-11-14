export const dynamic = "force-dynamic";

import { createClient } from "@/lib/supabase/server";
import Image from "next/image";
import Link from "next/link";
import { getUser } from "@/lib/auth";
import { redirect } from "next/navigation";
import { format, subDays } from "date-fns";
import { Lock } from "lucide-react";
import { getCurrentBrandFlags } from "@/lib/feature-flags/server";
import FeatureWall from "@/components/company/FeatureWall";
import ScanChart from "./ScanChart";

type Ranked = { name: string; count: number; pct: number };

export default async function AnalyticsPage({
  searchParams,
}: {
  searchParams: Promise<{ tab?: string }>;
}) {
  const supabase = await createClient();
  const user = await getUser();
  if (!user) redirect("/auth/login");

  const flags = await getCurrentBrandFlags();
  // Two independent flags: the Overview tab and the Resale Analytics tab each
  // have their own. Both tabs are always shown; a locked tab shows a wall.
  const analyticsUnlocked = flags.analytics_overview;
  const resaleUnlocked = flags.resale_analytics;
  const { tab } = await searchParams;
  const activeTab: "overview" | "resale" = tab === "resale" ? "resale" : "overview";

  // Fetch this company's tags
  const { data: tagsData } = await supabase
    .from("tags")
    .select("id, short_id, status")
    .eq("company_id", user.id);

  const tags = (tagsData ?? []) as { id: string; short_id: string; status: string }[];
  const tagIds = tags.map((t) => t.id);

  const now = new Date();
  const thirtyDaysAgo = subDays(now, 30).toISOString();
  const sixtyDaysAgo = subDays(now, 60).toISOString();

  // ── Accurate counts using head:true (no row transfer, no 1000-row cap) ──
  const [{ count: totalScans }, { count: prevScans }] = await Promise.all([
    tagIds.length
      ? supabase
          .from("scan_logs")
          .select("*", { count: "exact", head: true })
          .in("tag_id", tagIds)
          .gte("created_at", thirtyDaysAgo)
      : { count: 0 },
    tagIds.length
      ? supabase
          .from("scan_logs")
          .select("*", { count: "exact", head: true })
          .in("tag_id", tagIds)
          .gte("created_at", sixtyDaysAgo)
          .lt("created_at", thirtyDaysAgo)
      : { count: 0 },
  ]);

  const scanDelta =
    (prevScans ?? 0) > 0
      ? Math.round((((totalScans ?? 0) - (prevScans ?? 0)) / (prevScans ?? 1)) * 100)
      : null;

  // ── Unique items scanned (last 30 days) ──
  // Fetch tag_id column only; range bumped to 10 000 so counts are accurate up to
  // that volume. For higher-volume accounts a DB aggregate function would be needed.
  const { data: recentScans } = tagIds.length
    ? await supabase
        .from("scan_logs")
        .select("tag_id")
        .in("tag_id", tagIds)
        .gte("created_at", thirtyDaysAgo)
        .range(0, 9999)
    : { data: [] as { tag_id: string }[] };

  const uniqueItemsScanned = new Set((recentScans ?? []).map((s) => s.tag_id)).size;

  const ownedTags = tags.filter((t) => ["owned", "transferred"].includes(t.status)).length;
  const totalTags = tags.length;
  // "Deployed" = tag is out in the world with content attached.
  const deployedTags = tags.filter((t) =>
    ["live", "owned", "transferred"].includes(t.status)
  ).length;

  // ── 14-day chart: one count query per day ──
  const chartDays = await Promise.all(
    Array.from({ length: 14 }, async (_, i) => {
      const d = subDays(now, 13 - i);
      const dayStart = new Date(d);
      dayStart.setUTCHours(0, 0, 0, 0);
      const dayEnd = new Date(d);
      dayEnd.setUTCHours(23, 59, 59, 999);

      const label = format(d, "MMM d");

      if (!tagIds.length) return { label, count: 0 };

      const { count } = await supabase
        .from("scan_logs")
        .select("*", { count: "exact", head: true })
        .in("tag_id", tagIds)
        .gte("created_at", dayStart.toISOString())
        .lte("created_at", dayEnd.toISOString());

      return { label, count: count ?? 0 };
    })
  );
  const chartMax = Math.max(...chartDays.map((d) => d.count), 1);
  const chartTotal = chartDays.reduce((sum, d) => sum + d.count, 0);

  // ── Top 5 most scanned products (last 30 days) ──
  // Use recentScans only to find which tags were scanned (distinct tag_ids).
  // Then get the true per-tag count with head:true — immune to any row-limit cap.
  let topProducts: { name: string; photo: string | null; scans: number }[] = [];
  if (tagIds.length > 0) {
    const scannedTagIds = [...new Set((recentScans ?? []).map((s) => s.tag_id))];

    if (scannedTagIds.length > 0) {
      const tagCounts = await Promise.all(
        scannedTagIds.map(async (tag_id) => {
          const { count } = await supabase
            .from("scan_logs")
            .select("*", { count: "exact", head: true })
            .eq("tag_id", tag_id)
            .gte("created_at", thirtyDaysAgo);
          return { tag_id, count: count ?? 0 };
        })
      );

      const top5 = tagCounts
        .filter((t) => t.count > 0)
        .sort((a, b) => b.count - a.count)
        .slice(0, 5);

      if (top5.length > 0) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const { data: tagProductData } = await (supabase as any)
          .from("tags")
          .select("id, products(name, photos)")
          .in("id", top5.map((t) => t.tag_id));

        topProducts = top5
          .map(({ tag_id, count: scans }) => {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const row = ((tagProductData ?? []) as any[]).find((x: { id: string }) => x.id === tag_id);
            const raw = row?.products;
            const p = Array.isArray(raw) ? raw[0] : raw;
            if (!p) return null;
            return { name: p.name as string, photo: (p.photos as string[])?.[0] ?? null, scans };
          })
          .filter(Boolean) as { name: string; photo: string | null; scans: number }[];
      }
    }
  }

  // ── Location analytics ──
  // Scans: scan_logs.geo_location (JSONB) → country. Claims: ownership_claims
  // .claim_location (country name captured from edge geo at claim time). Resale:
  // transfer_requests.from_country/to_country on completed transfers.
  let scanCountries: Ranked[] = [];
  let claimCountries: Ranked[] = [];
  let resalePrev: Ranked[] = [];
  let resaleNew: Ranked[] = [];
  if (tagIds.length) {
    const [{ data: geoRows }, { data: claimRows }, { data: transferRows }] = await Promise.all([
      supabase.from("scan_logs").select("geo_location").in("tag_id", tagIds).not("geo_location", "is", null).range(0, 9999),
      supabase.from("ownership_claims").select("claim_location").in("tag_id", tagIds).not("claim_location", "is", null),
      supabase.from("transfer_requests").select("from_country, to_country").in("tag_id", tagIds).eq("status", "completed"),
    ]);
    scanCountries = rankLocations((geoRows ?? []).map((r) => extractCountry(r.geo_location)));
    claimCountries = rankLocations((claimRows ?? []).map((r) => countryName(r.claim_location)));
    resalePrev = rankLocations((transferRows ?? []).map((r) => countryName(r.from_country)));
    resaleNew = rankLocations((transferRows ?? []).map((r) => countryName(r.to_country)));
  }

  const statCards = [
    {
      label: "Scans, last 30 days",
      value: (totalScans ?? 0).toLocaleString(),
      delta: scanDelta,
      sub: (prevScans ?? 0) > 0 ? `${prevScans?.toLocaleString()} the 30 days before` : "Nothing to compare yet",
    },
    {
      label: "Pieces scanned",
      value: uniqueItemsScanned.toLocaleString(),
      delta: null,
      sub: `Out of ${totalTags.toLocaleString()} tags`,
    },
    {
      label: "Owned",
      value: ownedTags.toLocaleString(),
      delta: null,
      sub:
        totalTags > 0
          ? `${Math.round((ownedTags / totalTags) * 100)}% of your tags`
          : "No tags yet",
    },
    {
      label: "Tags",
      value: totalTags.toLocaleString(),
      delta: null,
      sub: `${deployedTags.toLocaleString()} out in the world`,
    },
  ];

  return (
    <div className="p-5 sm:p-8 max-w-5xl mx-auto">
      <div className="page-header mb-8">
        <h1 className="page-title">
          Analytics
        </h1>
        <p className="page-desc">
          Scan activity and ownership metrics for the last 30 days
        </p>
      </div>

      {/* Tabs */}
      <div className="cz-tabs">
        <TabLink label="Overview" tab="overview" active={activeTab === "overview"} locked={!analyticsUnlocked} />
        <TabLink label="Resale" tab="resale" active={activeTab === "resale"} locked={!resaleUnlocked} />
      </div>

      {activeTab === "overview" && !analyticsUnlocked && (
        <FeatureWall name="Analytics" description="See how your tags are scanned and where your items are being used." />
      )}

      {activeTab === "overview" && analyticsUnlocked && (
      <>
      <section aria-label="Totals" className="card-raised ov-figures mb-8">
        {statCards.map(({ label, value, delta, sub }) => (
          <div key={label} className="ov-figure" style={{ cursor: "default" }}>
            <span className="flex items-baseline gap-2">
              <span className="ov-figure-value">{value}</span>
              {delta !== null && (
                <span className="text-caption font-medium" style={{ color: delta >= 0 ? "var(--color-verified)" : "#8a3b3b" }}>
                  {delta >= 0 ? "Up" : "Down"} {Math.abs(delta)}%
                </span>
              )}
            </span>
            <span className="block text-body-sm font-medium" style={{ color: "var(--color-onyx)" }}>{label}</span>
            {sub && <span className="block text-caption" style={{ color: "var(--app-body)" }}>{sub}</span>}
          </div>
        ))}
      </section>

      <div className="grid gap-6 lg:grid-cols-[1fr,300px]">
        {/* Scan activity chart */}
        <div className="card-raised p-6">
          <h2 className="ov-h2 mb-5">Scans, last 14 days</h2>
          {chartTotal === 0 ? (
            <div className="py-10">
              <p className="text-body-sm" style={{ color: "var(--app-body)", maxWidth: "44ch" }}>
                {(totalScans ?? 0) > 0
                  ? "No scans in the last two weeks. The scans counted above happened earlier in the month."
                  : "No scans yet. Each tap of one of your tags will show up here by day."}
              </p>
            </div>
          ) : (
            <ScanChart days={chartDays} max={chartMax} />
          )}
          <div
            className="mt-2 flex justify-between text-caption"
            style={{ color: "var(--app-body)" }}
          >
            <span>{chartDays[0]?.label}</span>
            <span>{chartDays[13]?.label}</span>
          </div>
        </div>

        {/* Top products */}
        <div className="card-raised p-6">
          <h2 className="ov-h2 mb-5">Most scanned</h2>
          {topProducts.length === 0 ? (
            <p className="text-body-sm py-6" style={{ color: "var(--app-body)" }}>
              Your most scanned products will be ranked here.
            </p>
          ) : (
            <div className="space-y-3">
              {topProducts.map((p, i) => (
                <div key={i} className="flex items-center gap-3">
                  {p.photo ? (
                    <Image
                      src={p.photo}
                      alt=""
                      width={32}
                      height={32}
                      style={{
                        borderRadius: "4px",
                        objectFit: "cover",
                        border: "1px solid var(--color-cream)",
                        flexShrink: 0,
                      }}
                    />
                  ) : (
                    <div
                      style={{
                        width: "32px",
                        height: "32px",
                        borderRadius: "4px",
                        backgroundColor: "var(--color-linen)",
                        flexShrink: 0,
                      }}
                    />
                  )}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <p
                      className="truncate font-medium"
                      style={{ fontSize: "var(--text-body-sm)", color: "var(--color-charcoal)" }}
                    >
                      {p.name}
                    </p>
                    <div
                      style={{
                        marginTop: "4px",
                        height: "4px",
                        borderRadius: "2px",
                        backgroundColor: "var(--color-linen)",
                        overflow: "hidden",
                      }}
                    >
                      <div
                        style={{
                          height: "100%",
                          width: `${(p.scans / (topProducts[0]?.scans || 1)) * 100}%`,
                          backgroundColor: "var(--color-gold)",
                          borderRadius: "2px",
                        }}
                      />
                    </div>
                  </div>
                  <span
                    style={{
                      fontSize: "var(--text-body-sm)",
                      fontWeight: 600,
                      color: "var(--color-graphite)",
                      flexShrink: 0,
                    }}
                  >
                    {p.scans.toLocaleString()}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Location: where items are scanned and claimed */}
      <div className="grid gap-6 sm:grid-cols-2 mt-6">
        <LocationCard title="Where pieces are scanned" rows={scanCountries} empty="Countries appear here as your pieces are scanned." />
        <LocationCard title="Where owners claim" rows={claimCountries} empty="Countries appear here as buyers claim their pieces." />
      </div>
      </>
      )}

      {activeTab === "resale" && !resaleUnlocked && (
        <FeatureWall name="Resale analytics" description="See where your pieces travel after resale: the country each one left and the country it went to." />
      )}

      {activeTab === "resale" && resaleUnlocked && (
        <div>
          <p className="text-body-sm mb-6" style={{ color: "var(--app-body)", maxWidth: "60ch" }}>
            Where your pieces go when they are resold: the country of the owner who sold each one, and of the owner who bought it, across completed transfers.
          </p>
          <div className="grid gap-6 sm:grid-cols-2">
            <LocationCard title="Sold from" rows={resalePrev} empty="Countries appear here as your pieces change hands." />
            <LocationCard title="Bought in" rows={resaleNew} empty="Countries appear here as your pieces change hands." />
          </div>
        </div>
      )}
    </div>
  );
}

function TabLink({ label, tab, active, locked }: { label: string; tab: string; active: boolean; locked?: boolean }) {
  return (
    <Link
      href={`/dashboard/analytics?tab=${tab}`}
      className={`cz-tab inline-flex items-center gap-1.5 ${active ? "is-active" : ""}`}
      aria-current={active ? "page" : undefined}
      style={{ textDecoration: "none" }}
    >
      {label}
      {locked && <Lock size={12} style={{ color: "var(--color-mist)", opacity: 0.7 }} />}
    </Link>
  );
}

function LocationCard({ title, rows, empty }: { title: string; rows: Ranked[]; empty: string }) {
  return (
    <div className="card-raised p-6">
      <h2 className="ov-h2 mb-5">{title}</h2>
      {rows.length === 0 ? (
        <p className="text-body-sm py-6" style={{ color: "var(--app-body)" }}>{empty}</p>
      ) : (
        <div className="space-y-3">
          {rows.map((r) => (
            <div key={r.name} className="flex items-center gap-3">
              <span className="truncate font-medium" style={{ width: 120, fontSize: "var(--text-body-sm)", color: "var(--color-charcoal)" }}>{r.name}</span>
              <div style={{ flex: 1, height: 6, borderRadius: 3, backgroundColor: "var(--color-linen)", overflow: "hidden" }}>
                <div style={{ height: "100%", width: `${r.pct}%`, backgroundColor: "var(--color-gold)", borderRadius: 3 }} />
              </div>
              <span className="tabular-nums" style={{ width: 90, textAlign: "right", fontSize: "var(--text-body-sm)", color: "var(--color-graphite)" }}>
                <span style={{ fontWeight: 600 }}>{r.count.toLocaleString()}</span>
                <span style={{ color: "var(--app-body)" }}>, {r.pct}%</span>
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function rankLocations(values: (string | null | undefined)[]): Ranked[] {
  const counts = new Map<string, number>();
  let total = 0;
  for (const v of values) {
    const name = (v ?? "").trim();
    if (!name) continue;
    counts.set(name, (counts.get(name) ?? 0) + 1);
    total++;
  }
  if (total === 0) return [];
  return [...counts.entries()]
    .map(([name, count]) => ({ name, count, pct: Math.round((count / total) * 100) }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 8);
}

// Map a 2-letter ISO country code (e.g. "NG", from Vercel edge geo) to a full
// country name. Non-code values (free-text locations) pass through unchanged.
function countryName(raw: string | null | undefined): string | null {
  const v = (raw ?? "").trim();
  if (!v) return null;
  if (/^[A-Za-z]{2}$/.test(v)) {
    try {
      return new Intl.DisplayNames(["en"], { type: "region" }).of(v.toUpperCase()) ?? v;
    } catch {
      return v;
    }
  }
  return v;
}

function extractCountry(geo: unknown): string | null {
  if (!geo || typeof geo !== "object") return null;
  const g = geo as Record<string, unknown>;
  const raw = (g.country as string) ?? (g.country_name as string) ?? (g.region as string) ?? null;
  return countryName(raw);
}
