import { createClient } from "@/lib/supabase/server";
import { getUser } from "@/lib/auth";
import { redirect, notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Layers } from "lucide-react";
import IDKeyTable, { type IDKeyRow } from "@/components/company/IDKeyTable";
import { batchQuantityLabel, BATCH_TYPE_BADGE, BATCH_STATUS_STYLES, BATCH_STATUS_LABELS, prettyBatchStatus, type BatchRow } from "@/components/company/batch-display";
import LocalTime from "@/components/ui/LocalTime";

export default async function BatchDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const supabase = await createClient();
  const user = await getUser();
  if (!user) redirect("/auth/login");

  const { id } = await params;

  const { data: batchData } = await supabase
    .from("tag_batches")
    .select("id, industry, batch_size, cards_quantity, batch_type, batch_name, status, notes, created_at, shipped_at, company_id")
    .eq("id", id)
    .single();

  const batch = batchData as (BatchRow & { company_id: string }) | null;
  if (!batch || batch.company_id !== user.id) notFound();

  const { data: tagData } = await supabase
    .from("tags")
    .select("id, short_id, token, status, medium, created_at, products(name)")
    .eq("batch_id", id)
    .order("created_at", { ascending: false });

  const rows = (tagData ?? []) as unknown as (IDKeyRow & { medium: string })[];
  const tagRows = rows.filter((r) => r.medium === "tag");
  const cardRows = rows.filter((r) => r.medium === "card");

  const s = BATCH_STATUS_STYLES[batch.status] ?? BATCH_STATUS_STYLES.pending;
  const typeBadge = BATCH_TYPE_BADGE[batch.batch_type] ?? BATCH_TYPE_BADGE.tags;

  return (
    <div className="p-8 max-w-5xl mx-auto">
      <Link
        href="/dashboard/id-keys/batches"
        className="inline-flex items-center gap-2 mb-8"
        style={{ fontSize: "var(--text-body-sm)", color: "var(--color-slate)", textDecoration: "none" }}
      >
        <ArrowLeft size={14} />
        Back to batches
      </Link>

      <div className="card-raised rounded-2xl p-6 mb-8 flex items-start gap-4">
        <div className="w-12 h-12 rounded-xl flex items-center justify-center shrink-0" style={{ backgroundColor: "var(--color-linen)" }}>
          <Layers size={20} style={{ color: "var(--color-gold)" }} />
        </div>
        <div style={{ flex: 1 }}>
          <div className="flex items-center gap-2 mb-1 flex-wrap">
            <h1 className="font-display capitalize" style={{ fontSize: "24px", color: "var(--color-charcoal)", letterSpacing: "-0.02em" }}>
              {batch.batch_name || `${batch.industry} batch`}
            </h1>
            <span className="px-2 py-0.5 rounded-full text-micro font-medium" style={{ backgroundColor: typeBadge.bg, color: typeBadge.color }}>
              {typeBadge.label}
            </span>
            <span className="px-2 py-0.5 rounded-full text-micro font-medium" style={{ backgroundColor: s.bg, color: s.color }}>
              {prettyBatchStatus(batch.status)}
            </span>
          </div>
          <p style={{ fontSize: "var(--text-body-sm)", color: "var(--color-slate)" }}>
            {batchQuantityLabel(batch)} · {BATCH_STATUS_LABELS[batch.status] ?? prettyBatchStatus(batch.status)}
          </p>
          <p className="mt-1" style={{ fontSize: "var(--text-caption)", color: "var(--color-mist)" }}>
            Ordered <LocalTime iso={batch.created_at} pattern="MMM d, yyyy" />
            {batch.shipped_at && (
              <> · Shipped <LocalTime iso={batch.shipped_at} pattern="MMM d, yyyy" /></>
            )}
          </p>
          {batch.notes && (
            <p className="mt-2" style={{ fontSize: "var(--text-caption)", color: "var(--color-mist)", fontStyle: "italic" }}>
              &ldquo;{batch.notes}&rdquo;
            </p>
          )}
        </div>
      </div>

      {batch.batch_type !== "cards" && (
        <section className="mb-8">
          <h2 className="font-semibold mb-3" style={{ fontSize: "var(--text-body)", color: "var(--color-charcoal)" }}>
            Tags <span style={{ color: "var(--color-mist)", fontWeight: 400 }}>({tagRows.length})</span>
          </h2>
          <div className="rounded-xl overflow-hidden card-raised" style={{ padding: 0 }}>
            <IDKeyTable rows={tagRows} medium="tag" />
          </div>
        </section>
      )}

      {batch.batch_type !== "tags" && (
        <section>
          <h2 className="font-semibold mb-3" style={{ fontSize: "var(--text-body)", color: "var(--color-charcoal)" }}>
            Cards <span style={{ color: "var(--color-mist)", fontWeight: 400 }}>({cardRows.length})</span>
          </h2>
          <div className="rounded-xl overflow-hidden card-raised" style={{ padding: 0 }}>
            <IDKeyTable rows={cardRows} medium="card" />
          </div>
        </section>
      )}
    </div>
  );
}
