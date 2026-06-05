import { createClient } from "@/lib/supabase/server";
import { getUser } from "@/lib/auth";
import { redirect } from "next/navigation";
import Link from "next/link";
import { format } from "date-fns";
import { Layers, Plus, ChevronRight } from "lucide-react";
import { getCurrentBrandFlags } from "@/lib/feature-flags/server";
import FeatureWall from "@/components/company/FeatureWall";
import { batchQuantityLabel, BATCH_TYPE_BADGE, BATCH_STATUS_STYLES, type BatchRow } from "@/components/company/batch-display";
import Pagination from "@/components/ui/Pagination";
import type { BatchType } from "@/types/database";

const TYPE_FILTERS: ("all" | BatchType)[] = ["all", "tags", "cards", "mixed"];

const PER_PAGE = 20;

export default async function BatchesPage({
  searchParams,
}: {
  searchParams: Promise<{ type?: string; page?: string }>;
}) {
  const supabase = await createClient();
  const user = await getUser();
  if (!user) redirect("/auth/login");

  const flags = await getCurrentBrandFlags();
  if (!flags.bulk_tag_creation) {
    return (
      <FeatureWall
        name="Bulk Tag Creation"
        description="Request and manage large batches of tags and cards in one operation."
      />
    );
  }

  const params = await searchParams;
  const typeFilter = (TYPE_FILTERS as string[]).includes(params.type ?? "") ? params.type! : "all";
  const page = Math.max(1, parseInt(params.page ?? "1", 10));
  const from = (page - 1) * PER_PAGE;

  let query = supabase
    .from("tag_batches")
    .select("id, industry, batch_size, cards_quantity, batch_type, batch_name, status, notes, created_at, shipped_at", { count: "exact" })
    .eq("company_id", user.id)
    .order("created_at", { ascending: false })
    .range(from, from + PER_PAGE - 1);

  if (typeFilter !== "all") query = query.eq("batch_type", typeFilter as BatchType);

  const { data, count } = await query;
  const batches = (data ?? []) as BatchRow[];
  const totalPages = Math.ceil((count ?? 0) / PER_PAGE);
  const pageHref = (p: number) => {
    const sp = new URLSearchParams();
    if (typeFilter !== "all") sp.set("type", typeFilter);
    if (p > 1) sp.set("page", String(p));
    const qs = sp.toString();
    return qs ? `/dashboard/id-keys/batches?${qs}` : "/dashboard/id-keys/batches";
  };

  return (
    <div className="p-8 max-w-3xl mx-auto">
      <div className="flex items-start justify-between mb-8">
        <div className="page-header">
          <p className="text-micro font-semibold uppercase tracking-widest mb-2" style={{ color: "var(--color-gold)" }}>
            ID Keys
          </p>
          <h1 className="font-display" style={{ fontSize: "32px", color: "var(--color-charcoal)", lineHeight: 1.15, letterSpacing: "-0.02em" }}>
            Batches
          </h1>
          <p className="mt-1" style={{ color: "var(--color-slate)", fontSize: "var(--text-body-sm)" }}>
            Order history and dispatch status
          </p>
        </div>
        <Link
          href="/dashboard/batches/request"
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl font-medium text-body-sm shrink-0 mt-1"
          style={{ backgroundColor: "var(--color-onyx)", color: "var(--color-pearl)", textDecoration: "none", fontSize: "var(--text-body-sm)" }}
        >
          <Plus size={14} />
          Request batch
        </Link>
      </div>

      {/* Type filter */}
      <div className="flex flex-wrap gap-1 p-1 rounded-lg mb-6 w-fit" style={{ backgroundColor: "var(--color-linen)" }}>
        {TYPE_FILTERS.map((t) => (
          <Link
            key={t}
            href={t === "all" ? "/dashboard/id-keys/batches" : `/dashboard/id-keys/batches?type=${t}`}
            className="px-3 py-1.5 rounded-md text-caption font-medium capitalize transition-colors"
            style={{
              backgroundColor: typeFilter === t ? "var(--color-pearl)" : "transparent",
              color: typeFilter === t ? "var(--color-charcoal)" : "var(--color-slate)",
              boxShadow: typeFilter === t ? "var(--shadow-sm)" : "none",
              textDecoration: "none",
            }}
          >
            {t}
          </Link>
        ))}
      </div>

      {batches.length === 0 ? (
        <div className="rounded-2xl p-10 text-center" style={{ border: "1px solid var(--color-cream)", backgroundColor: "var(--color-pearl)" }}>
          <div className="w-14 h-14 rounded-2xl flex items-center justify-center mx-auto mb-4" style={{ backgroundColor: "var(--color-linen)" }}>
            <Layers size={24} style={{ color: "var(--color-gold)" }} />
          </div>
          <h2 className="font-semibold mb-2" style={{ fontSize: "var(--text-body)", color: "var(--color-charcoal)" }}>
            No batches yet
          </h2>
          <p className="mb-6" style={{ fontSize: "var(--text-body-sm)", color: "var(--color-slate)" }}>
            Request your first batch of tags or cards and we&apos;ll have them ready for you.
          </p>
          <Link
            href="/dashboard/batches/request"
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl font-medium"
            style={{ backgroundColor: "var(--color-onyx)", color: "var(--color-pearl)", textDecoration: "none", fontSize: "var(--text-body-sm)" }}
          >
            <Plus size={14} />
            Request your first batch
          </Link>
        </div>
      ) : (
        <div className="space-y-3">
          {batches.map((batch) => {
            const s = BATCH_STATUS_STYLES[batch.status] ?? BATCH_STATUS_STYLES.pending;
            const typeBadge = BATCH_TYPE_BADGE[batch.batch_type] ?? BATCH_TYPE_BADGE.tags;
            return (
              <Link
                key={batch.id}
                href={`/dashboard/id-keys/batches/${batch.id}`}
                className="card-raised rounded-2xl p-5 flex items-center gap-4 group"
                style={{ textDecoration: "none" }}
              >
                <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0" style={{ backgroundColor: "var(--color-linen)" }}>
                  <Layers size={16} style={{ color: "var(--color-gold)" }} />
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div className="flex items-center gap-2 mb-1 flex-wrap">
                    <p className="font-semibold capitalize" style={{ fontSize: "var(--text-body-sm)", color: "var(--color-charcoal)" }}>
                      {batch.batch_name || `${batch.industry} batch`}
                    </p>
                    <span className="px-2 py-0.5 rounded-full text-micro font-medium" style={{ backgroundColor: typeBadge.bg, color: typeBadge.color }}>
                      {typeBadge.label}
                    </span>
                    <span className="px-2 py-0.5 rounded-full text-micro font-medium capitalize" style={{ backgroundColor: s.bg, color: s.color }}>
                      {batch.status}
                    </span>
                  </div>
                  <p style={{ fontSize: "var(--text-caption)", color: "var(--color-slate)" }}>
                    {batchQuantityLabel(batch)} · Ordered {format(new Date(batch.created_at), "MMM d, yyyy")}
                    {batch.shipped_at ? ` · Shipped ${format(new Date(batch.shipped_at), "MMM d")}` : ""}
                  </p>
                </div>
                <ChevronRight size={16} style={{ color: "var(--color-mist)" }} className="shrink-0" />
              </Link>
            );
          })}
          <Pagination page={page} totalPages={totalPages} makeHref={pageHref} totalLabel={`${count ?? 0} total`} />
        </div>
      )}
    </div>
  );
}
