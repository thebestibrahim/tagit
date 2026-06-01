export const dynamic = "force-dynamic";

import { createClient } from "@/lib/supabase/server";
import Image from "next/image";
import { getUser } from "@/lib/auth";
import { redirect } from "next/navigation";
import { format, subDays } from "date-fns";
import { BarChart2, Eye, Package, Award, TrendingUp } from "lucide-react";
import { getCurrentBrandFlags } from "@/lib/feature-flags/server";
import FeatureWall from "@/components/company/FeatureWall";
import ScanChart from "./ScanChart";
export default async function AnalyticsPage() {
  const supabase = await createClient();
  const user = await getUser();
  if (!user) redirect("/auth/login");

  const flags = await getCurrentBrandFlags();
  if (!flags.resale_analytics) {
    return (
      <FeatureWall
        name="Analytics"
        description="See how your tags are scanned and how your products are performing."
      />
    );
  }

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

  const ownedTags = tags.filter((t) => t.status === "owned").length;
  const totalTags = tags.length;
  const deployedTags = tags.filter((t) =>
    ["embedded", "activated", "unowned", "claim_pending", "owned", "transfer_pending"].includes(t.status)
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

  const statCards = [
    {
      label: "Scans (30 days)",
      value: (totalScans ?? 0).toLocaleString(),
      icon: Eye,
      delta: scanDelta,
      sub: (prevScans ?? 0) > 0 ? `${prevScans?.toLocaleString()} prev. period` : "First period",
    },
    {
      label: "Unique items scanned",
      value: uniqueItemsScanned.toLocaleString(),
      icon: BarChart2,
      delta: null,
      sub: `of ${totalTags} total tags`,
    },
    {
      label: "Owned items",
      value: ownedTags.toLocaleString(),
      icon: Award,
      delta: null,
      sub:
        totalTags > 0
          ? `${Math.round((ownedTags / totalTags) * 100)}% ownership rate`
          : "—",
    },
    {
      label: "Total tags",
      value: totalTags.toLocaleString(),
      icon: Package,
      delta: null,
      sub: `${deployedTags} deployed`,
    },
  ];

  return (
    <div className="p-8 max-w-5xl mx-auto">
      <div className="page-header mb-8">
        <p
          className="text-micro font-semibold uppercase tracking-widest mb-2"
          style={{ color: "var(--color-gold)" }}
        >
          Insights
        </p>
        <h1
          className="font-display"
          style={{ fontSize: "32px", color: "var(--color-charcoal)", lineHeight: 1.15, letterSpacing: "-0.02em" }}
        >
          Analytics
        </h1>
        <p className="mt-1" style={{ color: "var(--color-slate)", fontSize: "var(--text-body-sm)" }}>
          Scan activity and ownership metrics for the last 30 days
        </p>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-2 gap-4 mb-8 sm:grid-cols-4">
        {statCards.map(({ label, value, icon: Icon, delta, sub }) => (
          <div key={label} className="card-raised rounded-xl p-5">
            <div className="flex items-center justify-between mb-3">
              <div
                className="w-8 h-8 rounded-lg flex items-center justify-center"
                style={{ backgroundColor: "var(--color-linen)" }}
              >
                <Icon size={15} style={{ color: "var(--color-gold)" }} />
              </div>
              {delta !== null && (
                <span
                  className="text-micro font-semibold px-1.5 py-0.5 rounded"
                  style={{
                    backgroundColor: delta >= 0 ? "var(--color-verified-tint)" : "var(--color-alert-tint)",
                    color: delta >= 0 ? "var(--color-verified)" : "var(--color-alert)",
                  }}
                >
                  {delta >= 0 ? "+" : ""}
                  {delta}%
                </span>
              )}
            </div>
            <p
              className="text-gradient-gold"
              style={{ fontSize: "28px", fontWeight: 700, letterSpacing: "-0.03em", lineHeight: 1 }}
            >
              {value}
            </p>
            <p className="mt-1 text-micro font-semibold uppercase tracking-wider" style={{ color: "var(--color-slate)" }}>
              {label}
            </p>
            {sub && (
              <p className="mt-0.5" style={{ fontSize: "var(--text-caption)", color: "var(--color-mist)" }}>
                {sub}
              </p>
            )}
          </div>
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-[1fr,300px]">
        {/* Scan activity chart */}
        <div className="card-raised rounded-xl p-6">
          <div className="flex items-center gap-2 mb-6">
            <TrendingUp size={16} style={{ color: "var(--color-gold)" }} />
            <h2
              className="font-semibold"
              style={{ fontSize: "var(--text-body-sm)", color: "var(--color-charcoal)" }}
            >
              Scan activity — last 14 days
            </h2>
          </div>
          {chartTotal === 0 ? (
            <div className="py-10 text-center" style={{ color: "var(--color-mist)" }}>
              <p style={{ fontSize: "var(--text-body-sm)" }}>No scans yet in this period</p>
            </div>
          ) : (
            <ScanChart days={chartDays} max={chartMax} />
          )}
          <div
            className="mt-2 flex justify-between"
            style={{ fontSize: "var(--text-caption)", color: "var(--color-mist)" }}
          >
            <span>{chartDays[0]?.label}</span>
            <span>{chartDays[13]?.label}</span>
          </div>
        </div>

        {/* Top products */}
        <div className="card-raised rounded-xl p-6">
          <div className="flex items-center gap-2 mb-5">
            <Package size={16} style={{ color: "var(--color-gold)" }} />
            <h2
              className="font-semibold"
              style={{ fontSize: "var(--text-body-sm)", color: "var(--color-charcoal)" }}
            >
              Top scanned products
            </h2>
          </div>
          {topProducts.length === 0 ? (
            <div className="py-8 text-center" style={{ color: "var(--color-mist)" }}>
              <p style={{ fontSize: "var(--text-body-sm)" }}>No scan data yet</p>
            </div>
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
    </div>
  );
}
