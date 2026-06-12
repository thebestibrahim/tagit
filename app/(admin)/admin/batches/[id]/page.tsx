import { createServiceClient } from "@/lib/supabase/server";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ChevronLeft, Info } from "lucide-react";
import {
  batchQuantityLabel,
  BATCH_STATUS_STYLES,
  prettyBatchStatus,
} from "@/components/company/batch-display";
import type { BatchType } from "@/types/database";
import LocalTime from "@/components/ui/LocalTime";
import CopyLinkButton from "@/components/ui/CopyLinkButton";
import BatchChipsExport from "../BatchChipsExport";
import BatchFulfilActions from "../BatchFulfilActions";
import { toDisplayChips, type RawChip } from "@/lib/batch-chips";

type Batch = {
  id: string;
  company_id: string;
  industry: string;
  batch_size: number;
  cards_quantity: number;
  batch_type: BatchType;
  batch_name: string | null;
  status: string;
  notes: string | null;
  created_at: string;
  shipped_at: string | null;
  companies: { name: string } | null;
};

export default async function AdminBatchDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = createServiceClient();

  const { data: batchData } = await supabase
    .from("tag_batches")
    .select("id, company_id, industry, batch_size, cards_quantity, batch_type, batch_name, status, notes, created_at, shipped_at, companies(name)")
    .eq("id", id)
    .single();

  if (!batchData) notFound();
  const batch = batchData as Batch;

  const { data: tagData } = await supabase
    .from("tags")
    .select("id, short_id, medium, token, status")
    .eq("batch_id", id);

  // Resolve each chip's working scan link from its token (tags first, then
  // cards). Mirrors the brand product page exactly; never the stored `url`.
  const chips = toDisplayChips((tagData ?? []) as RawChip[]);
  const exportChips = chips.map((c) => ({ short_id: c.short_id, medium: c.medium, url: c.url }));

  const s = BATCH_STATUS_STYLES[batch.status] ?? BATCH_STATUS_STYLES.pending;
  const batchLabel = batch.batch_name || `${batch.companies?.name ?? "batch"}-${batch.id.slice(0, 8)}`;
  const generatedYet = ["generated", "written", "shipped"].includes(batch.status);

  return (
    <div className="p-4 sm:p-8 max-w-4xl mx-auto">
      <Link
        href="/admin/batches"
        className="inline-flex items-center gap-1.5 mb-6"
        style={{ color: "var(--color-slate)", fontSize: "var(--text-body-sm)", textDecoration: "none" }}
      >
        <ChevronLeft size={14} />
        All batches
      </Link>

      {/* ── Header ── */}
      <div className="card-raised rounded-xl p-5 sm:p-6 mb-6">
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div className="min-w-0">
            <div className="flex items-center gap-2 flex-wrap mb-1">
              <span
                className="px-2.5 py-1 rounded-full text-micro font-medium"
                style={{ backgroundColor: s.bg, color: s.color }}
              >
                {prettyBatchStatus(batch.status)}
              </span>
              <span className="capitalize" style={{ fontSize: "var(--text-caption)", color: "var(--color-slate)" }}>
                {batch.industry}
              </span>
            </div>
            <h1 className="font-display" style={{ fontSize: "26px", color: "var(--color-charcoal)", lineHeight: 1.15, letterSpacing: "-0.02em" }}>
              {batch.companies?.name ?? "Unknown company"}
            </h1>
            {batch.batch_name && (
              <p className="mt-0.5" style={{ fontSize: "var(--text-body-sm)", color: "var(--color-graphite)" }}>
                &ldquo;{batch.batch_name}&rdquo;
              </p>
            )}
            <p className="mt-2" style={{ fontSize: "var(--text-body-sm)", color: "var(--color-slate)" }}>
              <span className="font-semibold" style={{ color: "var(--color-charcoal)" }}>
                {batchQuantityLabel(batch)}
              </span>
              {" · created "}
              <LocalTime iso={batch.created_at} pattern="MMM d, yyyy" />
              {batch.shipped_at && (
                <>
                  {" · shipped "}
                  <LocalTime iso={batch.shipped_at} pattern="MMM d, yyyy" />
                </>
              )}
            </p>
          </div>
          <BatchFulfilActions batchId={batch.id} status={batch.status} />
        </div>
      </div>

      {/* ── Chips: IDs + links to write ── */}
      {generatedYet ? (
        <div className="card-raised rounded-xl p-5 sm:p-6">
          <div className="flex items-start justify-between gap-3 flex-wrap mb-4">
            <div>
              <h2 className="text-body font-semibold" style={{ color: "var(--color-charcoal)" }}>
                Chips to program
              </h2>
              <p style={{ fontSize: "var(--text-caption)", color: "var(--color-slate)", marginTop: 2 }}>
                {chips.length.toLocaleString()} {chips.length === 1 ? "chip" : "chips"} · write each link onto its physical tag or card
              </p>
            </div>
            <BatchChipsExport chips={exportChips} batchLabel={batchLabel} />
          </div>

          {batch.status === "generated" && (
            <div
              className="flex items-start gap-2 p-3 rounded-lg mb-4"
              style={{ backgroundColor: "var(--color-smoke)", border: "1px solid var(--color-cream)" }}
            >
              <Info size={14} style={{ color: "var(--color-gold)", marginTop: 1, flexShrink: 0 }} />
              <p style={{ fontSize: "var(--text-caption)", color: "var(--color-slate)", lineHeight: 1.5 }}>
                Write each link below onto its matching chip (the ID is printed on the chip). When every link is
                written, use <strong>I&apos;ve written all links</strong> above, then mark the batch shipped.
              </p>
            </div>
          )}

          {chips.length === 0 ? (
            <p style={{ fontSize: "var(--text-body-sm)", color: "var(--color-mist)" }}>
              No chips found for this batch.
            </p>
          ) : (
            <div className="overflow-x-auto rounded-lg" style={{ border: "1px solid var(--color-cream)" }}>
              <table className="w-full">
                <thead>
                  <tr style={{ backgroundColor: "var(--color-smoke)", borderBottom: "1px solid var(--color-cream)" }}>
                    {["#", "Type", "ID", "Link to write", ""].map((h) => (
                      <th key={h} className="text-left px-4 py-2.5 text-micro font-medium uppercase tracking-wider" style={{ color: "var(--color-slate)" }}>
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {chips.map((c, i) => {
                    const isCard = c.medium === "card";
                    return (
                      <tr
                        key={c.id}
                        style={{
                          backgroundColor: "var(--color-pearl)",
                          borderBottom: i < chips.length - 1 ? "1px solid var(--color-cream)" : "none",
                        }}
                      >
                        <td className="px-4 py-2.5" style={{ fontSize: "var(--text-caption)", color: "var(--color-mist)" }}>
                          {i + 1}
                        </td>
                        <td className="px-4 py-2.5">
                          <span
                            className="px-1.5 py-0.5 rounded text-micro font-medium"
                            style={
                              isCard
                                ? { backgroundColor: "#EFF6FF", color: "#1D4ED8" }
                                : { backgroundColor: "var(--color-linen)", color: "var(--color-graphite)" }
                            }
                          >
                            {isCard ? "Card" : "Tag"}
                          </span>
                        </td>
                        <td className="px-4 py-2.5">
                          <span style={{ fontFamily: "var(--font-jetbrains-mono)", fontSize: "var(--text-body-sm)", color: "var(--color-charcoal)", letterSpacing: "0.05em" }}>
                            {c.short_id}
                          </span>
                        </td>
                        <td className="px-4 py-2.5" style={{ maxWidth: 0, width: "100%" }}>
                          <span
                            title={c.url ?? ""}
                            style={{
                              fontFamily: "var(--font-jetbrains-mono)",
                              fontSize: "var(--text-caption)",
                              color: "var(--color-slate)",
                              display: "block",
                              overflow: "hidden",
                              textOverflow: "ellipsis",
                              whiteSpace: "nowrap",
                            }}
                          >
                            {c.url ?? "—"}
                          </span>
                        </td>
                        <td className="px-4 py-2.5 text-right">
                          {c.url && <CopyLinkButton url={c.url} label="Copy" />}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      ) : (
        <div className="card-raised rounded-xl p-6 text-center">
          <p style={{ fontSize: "var(--text-body-sm)", color: "var(--color-slate)" }}>
            Chips have not been generated for this batch yet.
            {batch.status === "processing" && " Generate them from the batches list to see the links to write."}
          </p>
        </div>
      )}
    </div>
  );
}
