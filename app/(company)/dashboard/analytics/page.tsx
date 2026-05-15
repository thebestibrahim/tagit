export const dynamic = "force-dynamic";

import { createClient } from "@/lib/supabase/server";
import Image from "next/image";
import { getUser } from "@/lib/auth";
import { redirect } from "next/navigation";
import { format, subDays } from "date-fns";
import { BarChart2, Eye, Package, Award, TrendingUp } from "lucide-react";
export default async function AnalyticsPage() {
  const supabase = await createClient();
  const user = await getUser();
  if (!user) redirect("/auth/login");

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
  const fourteenDaysAgo = subDays(now, 14).toISOString();

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
  // Fetch only tag_id column — much smaller payload, still subject to 1000 cap
  // but unique item count is bounded by number of tags not number of scans
  const { data: recentScans } = tagIds.length
    ? await supabase
        .from("scan_logs")
        .select("tag_id")
        .in("tag_id", tagIds)
        .gte("created_at", thirtyDaysAgo)
    : { data: [] as { tag_id: string }[] };

  const uniqueItemsScanned = new Set((recentScans ?? []).map((s) => s.tag_id)).size;

  const ownedTags = tags.filter((t) => t.status === "owned").length;
  const totalTags = tags.length;

  // ── 14-day chart: one count query per day ──
  const chartDays = await Promise.all(
    Array.from({ length: 14 }, async (_, i) => {
      const d = subDays(now, 13 - i);
      const dayStart = new Date(d);
      dayStart.setHours(0, 0, 0, 0);
      const dayEnd = new Date(d);
      dayEnd.setHours(23, 59, 59, 999);

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

  // ── Top 5 most scanned products (last 30 days) ──
  // Derive counts from the recentScans data already fetched above — no extra queries
  let topProducts: { name: string; photo: string | null; scans: number }[] = [];
  if (tagIds.length > 0) {
    const tagCountMap: Record<string, number> = {};
    for (const s of (recentScans ?? [])) {
      tagCountMap[s.tag_id] = (tagCountMap[s.tag_id] ?? 0) + 1;
    }

    const top5 = Object.entries(tagCountMap)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 5)
      .map(([tag_id, count]) => ({ tag_id, count }));

    if (top5.length > 0) {
      const { data: productsData } = await supabase
        .from("products")
        .select("tag_id, name, photos")
        .in("tag_id", top5.map((t) => t.tag_id));

      topProducts = top5.map(({ tag_id, count: scans }) => {
        const p = (productsData ?? []).find(
          (x: { tag_id: string; name: string; photos: string[] }) => x.tag_id === tag_id
        ) as { tag_id: string; name: string; photos: string[] } | undefined;
        return {
          name: p?.name ?? "Unknown product",
          photo: p?.photos?.[0] ?? null,
          scans,
        };
      });
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
      sub: `${tags.filter((t) => ["embedded", "activated"].includes(t.status)).length} active`,
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
          {(totalScans ?? 0) === 0 ? (
            <div className="py-10 text-center" style={{ color: "var(--color-mist)" }}>
              <p style={{ fontSize: "var(--text-body-sm)" }}>No scans yet in this period</p>
            </div>
          ) : (
            <div style={{ display: "flex", alignItems: "flex-end", gap: "6px", height: "120px" }}>
              {chartDays.map((day) => (
                <div
                  key={day.label}
                  style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: "4px", height: "100%" }}
                >
                  <div style={{ flex: 1, width: "100%", display: "flex", alignItems: "flex-end" }}>
                    <div
                      style={{
                        width: "100%",
                        height: `${Math.max((day.count / chartMax) * 100, day.count > 0 ? 8 : 2)}%`,
                        backgroundColor: day.count > 0 ? "var(--color-gold)" : "var(--color-linen)",
                        borderRadius: "3px 3px 0 0",
                        transition: "height 0.3s ease",
                        minHeight: "2px",
                      }}
                    />
                  </div>
                  <span style={{ fontSize: "9px", color: "var(--color-mist)", whiteSpace: "nowrap" }}>
                    {day.label.split(" ")[1]}
                  </span>
                </div>
              ))}
            </div>
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
