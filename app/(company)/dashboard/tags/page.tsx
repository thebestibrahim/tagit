import { createClient } from "@/lib/supabase/server";
import type { TagStatus } from "@/types/database";
import { getUser } from "@/lib/auth";
import { redirect } from "next/navigation";
import Link from "next/link";
import { format } from "date-fns";
import { Tag, Layers } from "lucide-react";
import { Suspense } from "react";
import SearchInput from "@/components/ui/SearchInput";

const STATUS_FILTERS = ["all", "created", "shipped", "live", "owned", "transferred", "flagged"];

const BADGE: Record<string, { bg: string; color: string }> = {
  created:     { bg: "var(--color-linen)",         color: "var(--color-slate)" },
  shipped:     { bg: "var(--color-soft-gold)",     color: "var(--color-deep-gold)" },
  live:        { bg: "var(--color-soft-gold)",     color: "var(--color-deep-gold)" },
  owned:       { bg: "var(--color-verified-tint)", color: "var(--color-verified)" },
  transferred: { bg: "var(--color-verified-tint)", color: "var(--color-verified)" },
  flagged:     { bg: "var(--color-alert-tint)",    color: "var(--color-alert)" },
  suspended:   { bg: "var(--color-alert-tint)",    color: "var(--color-alert)" },
};

const BATCH_STATUS_STYLES: Record<string, { bg: string; color: string }> = {
  pending:   { bg: "var(--color-cream)",      color: "var(--color-slate)" },
  generated: { bg: "var(--color-soft-gold)",  color: "var(--color-deep-gold)" },
  written:   { bg: "#EFF6FF",                 color: "#1D4ED8" },
  shipped:   { bg: "#ECFDF5",                 color: "#065F46" },
};

type TagRow = {
  id: string;
  short_id: string;
  token: string;
  status: string;
  industry: string;
  created_at: string;
  activated_at: string | null;
  batch_id: string | null;
};

function TagTable({ rows }: { rows: TagRow[] }) {
  return (
    <table className="w-full">
      <thead>
        <tr style={{ backgroundColor: "var(--color-smoke)", borderBottom: "1px solid var(--color-cream)" }}>
          {["Short ID", "Industry", "Status", "Created", "Scan"].map((h) => (
            <th key={h} className="text-left px-5 py-3 text-micro font-medium uppercase tracking-wider" style={{ color: "var(--color-slate)" }}>
              {h}
            </th>
          ))}
        </tr>
      </thead>
      <tbody>
        {rows.map((tag, i) => {
          const badge = BADGE[tag.status] ?? BADGE.created;
          return (
            <tr
              key={tag.id}
              style={{
                backgroundColor: "var(--color-pearl)",
                borderBottom: i < rows.length - 1 ? "1px solid var(--color-cream)" : "none",
              }}
            >
              <td className="px-5 py-4">
                <span style={{ fontFamily: "var(--font-jetbrains-mono)", fontSize: "var(--text-body-sm)", color: "var(--color-charcoal)", letterSpacing: "0.05em" }}>
                  {tag.short_id}
                </span>
              </td>
              <td className="px-5 py-4">
                <span className="capitalize" style={{ fontSize: "var(--text-body-sm)", color: "var(--color-graphite)" }}>
                  {tag.industry}
                </span>
              </td>
              <td className="px-5 py-4">
                <span className="px-2 py-0.5 rounded-full text-micro font-medium capitalize" style={{ backgroundColor: badge.bg, color: badge.color }}>
                  {tag.status.replace(/_/g, " ")}
                </span>
              </td>
              <td className="px-5 py-4">
                <span style={{ color: "var(--color-slate)", fontSize: "var(--text-body-sm)" }}>
                  {format(new Date(tag.created_at), "MMM d, yyyy")}
                </span>
              </td>
              <td className="px-5 py-4">
                <Link
                  href={`/v/${tag.token}`}
                  target="_blank"
                  style={{ color: "var(--color-graphite)", fontSize: "var(--text-body-sm)", textDecoration: "underline" }}
                >
                  Preview
                </Link>
              </td>
            </tr>
          );
        })}
      </tbody>
    </table>
  );
}

type BatchRow = {
  id: string;
  industry: string;
  batch_size: number;
  status: string;
  created_at: string;
  shipped_at: string | null;
};

export default async function CompanyTagsPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string; page?: string; q?: string; view?: string; batch?: string }>;
}) {
  const supabase = await createClient();
  const user = await getUser();
  if (!user) redirect("/auth/login");

  const params = await searchParams;
  const statusFilter = STATUS_FILTERS.includes(params.status ?? "") ? params.status : "all";
  const q = params.q?.trim() ?? "";
  const page = Math.max(1, parseInt(params.page ?? "1", 10));
  const view = params.view === "batch" ? "batch" : "list";
  const batchFilter = params.batch ?? null;
  const perPage = 25;
  const from = (page - 1) * perPage;
  const to = from + perPage - 1;

  // Fetch batches for this company (for the batch view)
  const { data: batchData } = await supabase
    .from("tag_batches")
    .select("id, industry, batch_size, status, created_at, shipped_at")
    .eq("company_id", user.id)
    .order("created_at", { ascending: false });

  const batches = (batchData ?? []) as BatchRow[];

  let query = supabase
    .from("tags")
    .select("id, short_id, token, status, industry, created_at, activated_at, batch_id", { count: "exact" })
    .eq("company_id", user.id)
    .order("created_at", { ascending: false })
    .range(from, to);

  if (statusFilter && statusFilter !== "all") {
    query = query.eq("status", statusFilter as TagStatus);
  }
  if (q) {
    query = query.ilike("short_id", `%${q}%`);
  }
  if (batchFilter) {
    query = query.eq("batch_id", batchFilter);
  }

  const { data, count } = await query;
  const tags = (data ?? []) as TagRow[];
  const totalPages = Math.ceil((count ?? 0) / perPage);

  // In batch view, group tags by batch_id
  const batchMap = new Map(batches.map((b) => [b.id, b]));
  const tagsByBatch = new Map<string | null, TagRow[]>();
  for (const tag of tags) {
    const key = tag.batch_id ?? null;
    if (!tagsByBatch.has(key)) tagsByBatch.set(key, []);
    tagsByBatch.get(key)!.push(tag);
  }

  return (
    <div className="p-8 max-w-5xl mx-auto">
      <div className="page-header mb-8">
        <p className="text-micro font-semibold uppercase tracking-widest mb-2" style={{ color: "var(--color-gold)" }}>
          Inventory
        </p>
        <h1 className="font-display" style={{ fontSize: "32px", color: "var(--color-charcoal)", lineHeight: 1.15, letterSpacing: "-0.02em" }}>
          Tags
        </h1>
        <p className="mt-1" style={{ color: "var(--color-slate)", fontSize: "var(--text-body-sm)" }}>
          {count ?? 0} tags in your account
        </p>
      </div>

      {/* View toggle + search + filter */}
      <div className="flex flex-wrap items-center gap-3 mb-6">
        {/* View toggle */}
        <div className="flex gap-1 p-1 rounded-lg" style={{ backgroundColor: "var(--color-linen)" }}>
          <Link
            href="/dashboard/tags"
            className="px-3 py-1.5 rounded-md text-caption font-medium flex items-center gap-1.5"
            style={{
              backgroundColor: view === "list" ? "var(--color-pearl)" : "transparent",
              color: view === "list" ? "var(--color-charcoal)" : "var(--color-slate)",
              boxShadow: view === "list" ? "var(--shadow-sm)" : "none",
              textDecoration: "none",
            }}
          >
            <Tag size={11} />
            List
          </Link>
          <Link
            href="/dashboard/tags?view=batch"
            className="px-3 py-1.5 rounded-md text-caption font-medium flex items-center gap-1.5"
            style={{
              backgroundColor: view === "batch" ? "var(--color-pearl)" : "transparent",
              color: view === "batch" ? "var(--color-charcoal)" : "var(--color-slate)",
              boxShadow: view === "batch" ? "var(--shadow-sm)" : "none",
              textDecoration: "none",
            }}
          >
            <Layers size={11} />
            Batches
          </Link>
        </div>

        {view === "list" && (
          <>
            <Suspense>
              <SearchInput placeholder="Search by tag ID…" />
            </Suspense>
            <div className="flex flex-wrap gap-1 p-1 rounded-lg" style={{ backgroundColor: "var(--color-linen)" }}>
              {STATUS_FILTERS.map((s) => (
                <Link
                  key={s}
                  href={`/dashboard/tags${s === "all" ? "" : `?status=${s}`}`}
                  className="px-3 py-1.5 rounded-md text-caption font-medium capitalize transition-colors"
                  style={{
                    backgroundColor: statusFilter === s ? "var(--color-pearl)" : "transparent",
                    color: statusFilter === s ? "var(--color-charcoal)" : "var(--color-slate)",
                    boxShadow: statusFilter === s ? "var(--shadow-sm)" : "none",
                    textDecoration: "none",
                  }}
                >
                  {s.replace("_", " ")}
                </Link>
              ))}
            </div>
          </>
        )}

        {view === "batch" && batchFilter && (
          <Link
            href="/dashboard/tags?view=batch"
            className="px-3 py-1.5 rounded-md text-caption font-medium"
            style={{
              backgroundColor: "var(--color-linen)",
              color: "var(--color-graphite)",
              textDecoration: "none",
            }}
          >
            ← All batches
          </Link>
        )}
      </div>

      {/* ── Batch view ─────────────────────────────────────── */}
      {view === "batch" && !batchFilter && (
        <div className="space-y-3">
          {batches.length === 0 ? (
            <div className="rounded-xl card-raised py-16 text-center" style={{ color: "var(--color-mist)" }}>
              <Layers size={32} className="mx-auto mb-3 opacity-30" />
              <p style={{ fontSize: "var(--text-body-sm)" }}>No batches yet</p>
            </div>
          ) : (
            batches.map((batch) => {
              const s = BATCH_STATUS_STYLES[batch.status] ?? BATCH_STATUS_STYLES.pending;
              return (
                <Link
                  key={batch.id}
                  href={`/dashboard/tags?view=batch&batch=${batch.id}`}
                  className="card-raised rounded-xl p-5 flex items-center gap-4 group transition-all"
                  style={{ textDecoration: "none" }}
                >
                  <div
                    className="w-10 h-10 rounded-lg flex items-center justify-center shrink-0"
                    style={{ backgroundColor: "var(--color-linen)" }}
                  >
                    <Layers size={16} style={{ color: "var(--color-gold)" }} />
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <p className="font-semibold capitalize" style={{ fontSize: "var(--text-body-sm)", color: "var(--color-charcoal)" }}>
                      {batch.industry} — {batch.batch_size.toLocaleString()} tags
                    </p>
                    <p style={{ fontSize: "var(--text-caption)", color: "var(--color-slate)" }}>
                      Created {format(new Date(batch.created_at), "MMM d, yyyy")}
                      {batch.shipped_at ? ` · Shipped ${format(new Date(batch.shipped_at), "MMM d, yyyy")}` : ""}
                    </p>
                  </div>
                  <span
                    className="px-2.5 py-1 rounded-full text-micro font-medium capitalize shrink-0"
                    style={{ backgroundColor: s.bg, color: s.color }}
                  >
                    {batch.status}
                  </span>
                </Link>
              );
            })
          )}
        </div>
      )}

      {/* ── Batch detail view (tags in one batch) ──────────── */}
      {view === "batch" && batchFilter && (() => {
        const batch = batchMap.get(batchFilter);
        const s = batch ? (BATCH_STATUS_STYLES[batch.status] ?? BATCH_STATUS_STYLES.pending) : null;
        return (
          <>
            {batch && (
              <div className="card-raised rounded-xl p-5 mb-4 flex items-center gap-4">
                <div className="w-10 h-10 rounded-lg flex items-center justify-center" style={{ backgroundColor: "var(--color-linen)" }}>
                  <Layers size={16} style={{ color: "var(--color-gold)" }} />
                </div>
                <div style={{ flex: 1 }}>
                  <p className="font-semibold capitalize" style={{ fontSize: "var(--text-body-sm)", color: "var(--color-charcoal)" }}>
                    {batch.industry} batch — {batch.batch_size.toLocaleString()} tags
                  </p>
                  <p style={{ fontSize: "var(--text-caption)", color: "var(--color-slate)" }}>
                    Created {format(new Date(batch.created_at), "MMM d, yyyy")}
                  </p>
                </div>
                {s && (
                  <span className="px-2.5 py-1 rounded-full text-micro font-medium capitalize" style={{ backgroundColor: s.bg, color: s.color }}>
                    {batch.status}
                  </span>
                )}
              </div>
            )}
            <div className="rounded-xl overflow-hidden card-raised" style={{ padding: 0 }}>
              {tags.length === 0 ? (
                <div className="py-16 text-center" style={{ color: "var(--color-mist)" }}>
                  <Tag size={32} className="mx-auto mb-3 opacity-30" />
                  <p style={{ fontSize: "var(--text-body-sm)" }}>No tags in this batch</p>
                </div>
              ) : (
                <TagTable rows={tags} />
              )}
            </div>
          </>
        );
      })()}

      {/* ── List view ──────────────────────────────────────── */}
      {view === "list" && (
        <div className="rounded-xl overflow-hidden card-raised" style={{ padding: 0 }}>
          {tags.length === 0 ? (
            <div className="py-16 text-center" style={{ color: "var(--color-mist)" }}>
              <Tag size={32} className="mx-auto mb-3 opacity-30" />
              <p style={{ fontSize: "var(--text-body-sm)" }}>
                {q ? `No tags matching "${q}"` : "No tags found"}
              </p>
            </div>
          ) : (
            <>
              <TagTable rows={tags} />

              {totalPages > 1 && (
                <div
                  className="flex items-center justify-between px-5 py-3"
                  style={{ borderTop: "1px solid var(--color-cream)", backgroundColor: "var(--color-smoke)" }}
                >
                  <p style={{ fontSize: "var(--text-caption)", color: "var(--color-slate)" }}>
                    Page {page} of {totalPages}
                  </p>
                  <div className="flex gap-2">
                    {page > 1 && (
                      <Link
                        href={`/dashboard/tags?${statusFilter !== "all" ? `status=${statusFilter}&` : ""}page=${page - 1}`}
                        className="px-3 py-1.5 rounded-lg text-caption font-medium"
                        style={{ backgroundColor: "var(--color-linen)", color: "var(--color-graphite)", textDecoration: "none" }}
                      >
                        Previous
                      </Link>
                    )}
                    {page < totalPages && (
                      <Link
                        href={`/dashboard/tags?${statusFilter !== "all" ? `status=${statusFilter}&` : ""}page=${page + 1}`}
                        className="px-3 py-1.5 rounded-lg text-caption font-medium"
                        style={{ backgroundColor: "var(--color-linen)", color: "var(--color-graphite)", textDecoration: "none" }}
                      >
                        Next
                      </Link>
                    )}
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      )}
    </div>
  );
}
