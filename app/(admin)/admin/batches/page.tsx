import { createServiceClient } from "@/lib/supabase/server";
import Link from "next/link";
import { Plus, Package, Inbox, Layers } from "lucide-react";
import BatchActions from "./BatchActions";
import BatchRowActions from "./BatchRowActions";

import { batchQuantityLabel, BATCH_TYPE_BADGE, prettyBatchStatus } from "@/components/company/batch-display";
import Pagination from "@/components/ui/Pagination";
import type { BatchType } from "@/types/database";
import LocalTime from "@/components/ui/LocalTime";

type Batch = {
  id: string;
  company_id: string;
  industry: string;
  batch_size: number;
  cards_quantity: number;
  batch_type: BatchType;
  batch_name: string | null;
  status: "pending" | "awaiting_payment" | "processing" | "generated" | "written" | "shipped";
  notes: string | null;
  created_at: string;
  shipped_at: string | null;
  companies: { name: string } | null;
};

const STATUS_STYLES: Record<string, { bg: string; color: string }> = {
  pending:          { bg: "var(--color-cream)",     color: "var(--color-slate)" },
  awaiting_payment: { bg: "var(--color-soft-gold)", color: "var(--color-deep-gold)" },
  processing:       { bg: "#EFF6FF",                color: "#1D4ED8" },
  generated:        { bg: "var(--color-soft-gold)", color: "var(--color-deep-gold)" },
  written:          { bg: "#EFF6FF",                color: "#1D4ED8" },
  shipped:          { bg: "#ECFDF5",                color: "#065F46" },
};

const PER_PAGE = 25;

export default async function AdminBatchesPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string }>;
}) {
  const supabase = createServiceClient();

  const { data } = await supabase
    .from("tag_batches")
    .select("id, company_id, industry, batch_size, cards_quantity, batch_type, batch_name, status, notes, created_at, shipped_at, companies(name)")
    .order("created_at", { ascending: false });

  const batches = (data ?? []) as Batch[];
  const pending = batches.filter((b) => b.status === "pending");
  const allProcessed = batches.filter((b) => b.status !== "pending");

  // Pending requests are always shown (they need action); the generated list is paginated.
  const { page: pageParam } = await searchParams;
  const page = Math.max(1, parseInt(pageParam ?? "1", 10));
  const totalPages = Math.ceil(allProcessed.length / PER_PAGE);
  const processed = allProcessed.slice((page - 1) * PER_PAGE, (page - 1) * PER_PAGE + PER_PAGE);
  const pageHref = (p: number) => (p > 1 ? `/admin/batches?page=${p}` : "/admin/batches");

  return (
    <div className="p-8 max-w-5xl mx-auto">
      <div className="flex items-start justify-between mb-8">
        <div>
          <h1 className="text-h2 font-semibold" style={{ color: "var(--color-charcoal)" }}>
            Tag Batches
          </h1>
          <p className="mt-1" style={{ color: "var(--color-slate)", fontSize: "var(--text-body-sm)" }}>
            {pending.length > 0 && (
              <span style={{ color: "var(--color-gold)", fontWeight: 600 }}>
                {pending.length} pending request{pending.length !== 1 ? "s" : ""} ·{" "}
              </span>
            )}
            {processed.length} batch{processed.length !== 1 ? "es" : ""} generated
          </p>
        </div>
        <Link
          href="/admin/batches/new"
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg font-medium"
          style={{
            backgroundColor: "var(--color-onyx)",
            color: "var(--color-pearl)",
            textDecoration: "none",
            fontSize: "var(--text-body-sm)",
          }}
        >
          <Plus size={14} />
          New batch
        </Link>
      </div>

      {/* ── Pending requests ─────────────────────────────── */}
      {pending.length > 0 && (
        <div className="mb-8">
          <div className="flex items-center gap-2 mb-3">
            <Inbox size={14} style={{ color: "var(--color-gold)" }} />
            <h2 className="font-semibold" style={{ fontSize: "var(--text-body-sm)", color: "var(--color-charcoal)" }}>
              Pending requests
            </h2>
            <span
              className="px-2 py-0.5 rounded-full font-semibold"
              style={{ fontSize: 10, backgroundColor: "var(--color-soft-gold)", color: "var(--color-deep-gold)" }}
            >
              {pending.length}
            </span>
          </div>

          <div className="space-y-3">
            {pending.map((batch) => (
              <div
                key={batch.id}
                className="rounded-xl p-5"
                style={{
                  border: "1px solid var(--color-champagne)",
                  backgroundColor: "var(--color-pearl)",
                  boxShadow: "var(--shadow-sm)",
                }}
              >
                <div className="flex items-start justify-between gap-4 flex-wrap">
                  <div className="flex items-start gap-3 min-w-0">
                    <div
                      className="w-9 h-9 rounded-lg flex items-center justify-center shrink-0"
                      style={{ backgroundColor: "var(--color-linen)" }}
                    >
                      <Layers size={15} style={{ color: "var(--color-gold)" }} />
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="font-semibold" style={{ fontSize: "var(--text-body-sm)", color: "var(--color-charcoal)" }}>
                          {batch.companies?.name ?? "Unknown company"}
                        </p>
                        <span
                          className="px-2 py-0.5 rounded-full font-medium capitalize"
                          style={{ fontSize: 10, backgroundColor: "var(--color-linen)", color: "var(--color-graphite)" }}
                        >
                          {batch.industry}
                        </span>
                        {(() => { const tb = BATCH_TYPE_BADGE[batch.batch_type] ?? BATCH_TYPE_BADGE.tags; return (
                        <span
                          className="px-2 py-0.5 rounded-full font-medium"
                          style={{ fontSize: 10, backgroundColor: tb.bg, color: tb.color }}
                        >
                          {tb.label}
                        </span>
                        ); })()}
                      </div>
                      {batch.batch_name && (
                        <p className="font-medium mt-0.5" style={{ fontSize: "var(--text-body-sm)", color: "var(--color-graphite)" }}>
                          &ldquo;{batch.batch_name}&rdquo;
                        </p>
                      )}
                      <p style={{ fontSize: "var(--text-caption)", color: "var(--color-slate)", marginTop: 2 }}>
                        <span className="font-semibold" style={{ color: "var(--color-charcoal)" }}>
                          {batchQuantityLabel(batch)}
                        </span>
                        {" · "}requested {<LocalTime iso={batch.created_at} pattern="MMM d, yyyy" />}
                      </p>
                      {batch.notes && (
                        <p style={{ fontSize: "var(--text-caption)", color: "var(--color-mist)", fontStyle: "italic", marginTop: 2 }}>
                          &ldquo;{batch.notes}&rdquo;
                        </p>
                      )}
                    </div>
                  </div>
                  <BatchActions batchId={batch.id} batchSize={batch.batch_size} />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── Generated / shipped batches ───────────────────── */}
      <div>
        {pending.length > 0 && (
          <h2 className="font-semibold mb-3" style={{ fontSize: "var(--text-body-sm)", color: "var(--color-charcoal)" }}>
            Generated batches
          </h2>
        )}
        <div
          className="rounded-xl overflow-hidden"
          style={{ border: "1px solid var(--color-cream)", boxShadow: "var(--shadow-sm)" }}
        >
          {processed.length === 0 ? (
            <div className="py-16 text-center" style={{ color: "var(--color-mist)" }}>
              <Package size={32} className="mx-auto mb-3 opacity-30" />
              <p style={{ fontSize: "var(--text-body-sm)" }}>
                {pending.length > 0 ? "Approve a request to generate your first batch" : "No batches generated yet"}
              </p>
              {pending.length === 0 && (
                <Link
                  href="/admin/batches/new"
                  className="mt-3 inline-block"
                  style={{ color: "var(--color-graphite)", fontSize: "var(--text-body-sm)", textDecoration: "underline" }}
                >
                  Generate first batch →
                </Link>
              )}
            </div>
          ) : (
            <div className="overflow-x-auto"><table className="w-full">
              <thead>
                <tr style={{ backgroundColor: "var(--color-smoke)", borderBottom: "1px solid var(--color-cream)" }}>
                  {["Company", "Batch", "Industry", "Size", "Status", "Created", "Shipped", ""].map((h) => (
                    <th
                      key={h}
                      className="text-left px-4 py-3 text-micro font-medium uppercase tracking-wider"
                      style={{ color: "var(--color-slate)" }}
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {processed.map((batch, i) => {
                  const s = STATUS_STYLES[batch.status] ?? STATUS_STYLES.pending;
                  return (
                    <tr
                      key={batch.id}
                      style={{
                        backgroundColor: "var(--color-pearl)",
                        borderBottom: i < processed.length - 1 ? "1px solid var(--color-cream)" : "none",
                      }}
                    >
                      <td className="px-4 py-3">
                        <p className="font-medium" style={{ color: "var(--color-charcoal)", fontSize: "var(--text-body-sm)" }}>
                          {batch.companies?.name ?? "—"}
                        </p>
                      </td>
                      <td className="px-4 py-3">
                        {batch.batch_name ? (
                          <p style={{ color: "var(--color-graphite)", fontSize: "var(--text-body-sm)" }}>
                            {batch.batch_name}
                          </p>
                        ) : (
                          batch.notes ? (
                            <p style={{ color: "var(--color-mist)", fontSize: "var(--text-caption)", fontStyle: "italic" }}>
                              {batch.notes}
                            </p>
                          ) : (
                            <span style={{ color: "var(--color-mist)", fontSize: "var(--text-caption)" }}>—</span>
                          )
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <span className="capitalize" style={{ color: "var(--color-graphite)", fontSize: "var(--text-body-sm)" }}>
                          {batch.industry}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <span style={{ color: "var(--color-charcoal)", fontSize: "var(--text-body-sm)", fontWeight: 600 }}>
                          {batchQuantityLabel(batch)}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className="px-2.5 py-1 rounded-full text-micro font-medium"
                          style={{ backgroundColor: s.bg, color: s.color }}
                        >
                          {prettyBatchStatus(batch.status)}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <span style={{ color: "var(--color-slate)", fontSize: "var(--text-body-sm)" }}>
                          {<LocalTime iso={batch.created_at} pattern="MMM d, yyyy" />}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <span style={{ color: "var(--color-slate)", fontSize: "var(--text-body-sm)" }}>
                          {batch.shipped_at ? <LocalTime iso={batch.shipped_at} pattern="MMM d, yyyy" /> : "—"}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right">
                        <BatchRowActions batchId={batch.id} status={batch.status} batchSize={(batch.batch_size ?? 0) + (batch.cards_quantity ?? 0)} />
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table></div>
          )}
          <Pagination page={page} totalPages={totalPages} makeHref={pageHref} totalLabel={`${allProcessed.length} total`} />
        </div>
      </div>
    </div>
  );
}
