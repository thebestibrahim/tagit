import { createClient } from "@/lib/supabase/server";
import Link from "next/link";
import { format } from "date-fns";
import { Plus, Package } from "lucide-react";

type Batch = {
  id: string;
  company_id: string;
  industry: string;
  batch_size: number;
  status: "pending" | "generated" | "written" | "shipped";
  notes: string | null;
  created_at: string;
  shipped_at: string | null;
  companies: { name: string } | null;
};

const STATUS_STYLES: Record<string, { bg: string; color: string }> = {
  pending:   { bg: "var(--color-cream)",      color: "var(--color-slate)" },
  generated: { bg: "var(--color-soft-gold)",  color: "var(--color-deep-gold)" },
  written:   { bg: "#EFF6FF",                 color: "#1D4ED8" },
  shipped:   { bg: "#ECFDF5",                 color: "#065F46" },
};

export default async function AdminBatchesPage() {
  const supabase = await createClient();

  const { data } = await supabase
    .from("tag_batches")
    .select("*, companies(name)")
    .order("created_at", { ascending: false });

  const batches = (data ?? []) as Batch[];

  return (
    <div className="p-8 max-w-5xl mx-auto">
      <div className="flex items-start justify-between mb-8">
        <div>
          <h1 className="text-h2 font-semibold" style={{ color: "var(--color-charcoal)" }}>
            Tag Batches
          </h1>
          <p className="mt-1" style={{ color: "var(--color-slate)", fontSize: "var(--text-body-sm)" }}>
            {batches.length} batch{batches.length !== 1 ? "es" : ""} total
          </p>
        </div>
        <Link
          href="/admin/batches/new"
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg font-medium text-body-sm"
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

      <div
        className="rounded-xl overflow-hidden"
        style={{ border: "1px solid var(--color-cream)", boxShadow: "var(--shadow-sm)" }}
      >
        {batches.length === 0 ? (
          <div className="py-16 text-center" style={{ color: "var(--color-mist)" }}>
            <Package size={32} className="mx-auto mb-3 opacity-30" />
            <p style={{ fontSize: "var(--text-body-sm)" }}>No batches generated yet</p>
            <Link
              href="/admin/batches/new"
              className="mt-3 inline-block"
              style={{ color: "var(--color-graphite)", fontSize: "var(--text-body-sm)", textDecoration: "underline" }}
            >
              Generate first batch →
            </Link>
          </div>
        ) : (
          <table className="w-full">
            <thead>
              <tr style={{ backgroundColor: "var(--color-smoke)", borderBottom: "1px solid var(--color-cream)" }}>
                {["Company", "Industry", "Size", "Status", "Created", "Shipped"].map((h) => (
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
              {batches.map((batch, i) => {
                const s = STATUS_STYLES[batch.status] ?? STATUS_STYLES.pending;
                return (
                  <tr
                    key={batch.id}
                    style={{
                      backgroundColor: "var(--color-pearl)",
                      borderBottom: i < batches.length - 1 ? "1px solid var(--color-cream)" : "none",
                    }}
                  >
                    <td className="px-5 py-4">
                      <p className="font-medium" style={{ color: "var(--color-charcoal)", fontSize: "var(--text-body-sm)" }}>
                        {batch.companies?.name ?? "—"}
                      </p>
                      {batch.notes && (
                        <p style={{ color: "var(--color-mist)", fontSize: "var(--text-caption)" }}>{batch.notes}</p>
                      )}
                    </td>
                    <td className="px-5 py-4">
                      <span style={{ color: "var(--color-graphite)", fontSize: "var(--text-body-sm)", textTransform: "capitalize" }}>
                        {batch.industry}
                      </span>
                    </td>
                    <td className="px-5 py-4">
                      <span style={{ color: "var(--color-charcoal)", fontSize: "var(--text-body-sm)", fontWeight: 600 }}>
                        {batch.batch_size.toLocaleString()}
                      </span>
                    </td>
                    <td className="px-5 py-4">
                      <span
                        className="px-2.5 py-1 rounded-full text-micro font-medium capitalize"
                        style={{ backgroundColor: s.bg, color: s.color }}
                      >
                        {batch.status}
                      </span>
                    </td>
                    <td className="px-5 py-4">
                      <span style={{ color: "var(--color-slate)", fontSize: "var(--text-body-sm)" }}>
                        {format(new Date(batch.created_at), "MMM d, yyyy")}
                      </span>
                    </td>
                    <td className="px-5 py-4">
                      <span style={{ color: "var(--color-slate)", fontSize: "var(--text-body-sm)" }}>
                        {batch.shipped_at ? format(new Date(batch.shipped_at), "MMM d, yyyy") : "—"}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
