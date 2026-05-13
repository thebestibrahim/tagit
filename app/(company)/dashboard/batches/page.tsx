import { createClient } from "@/lib/supabase/server";
import { getUser } from "@/lib/auth";
import { redirect } from "next/navigation";
import Link from "next/link";
import { format } from "date-fns";
import { Layers, Plus, Clock, CheckCircle2, Truck } from "lucide-react";

type Batch = {
  id: string;
  industry: string;
  batch_size: number;
  batch_name: string | null;
  status: "pending" | "generated" | "written" | "shipped";
  notes: string | null;
  created_at: string;
  shipped_at: string | null;
};

const STATUS_STYLES: Record<string, { bg: string; color: string; icon: React.FC<{ size: number }> }> = {
  pending:   { bg: "var(--color-cream)",      color: "var(--color-slate)",     icon: Clock as React.FC<{ size: number }> },
  generated: { bg: "var(--color-soft-gold)",  color: "var(--color-deep-gold)", icon: CheckCircle2 as React.FC<{ size: number }> },
  written:   { bg: "#EFF6FF",                 color: "#1D4ED8",                icon: CheckCircle2 as React.FC<{ size: number }> },
  shipped:   { bg: "#ECFDF5",                 color: "#065F46",                icon: Truck as React.FC<{ size: number }> },
};

const STATUS_LABELS: Record<string, string> = {
  pending:   "Request received — awaiting Tagit",
  generated: "Tags generated",
  written:   "Tags programmed",
  shipped:   "Shipped to you",
};

export default async function CompanyBatchesPage() {
  const supabase = await createClient();
  const user = await getUser();
  if (!user) redirect("/auth/login");

  const { data } = await supabase
    .from("tag_batches")
    .select("id, industry, batch_size, batch_name, status, notes, created_at, shipped_at")
    .eq("company_id", user.id)
    .order("created_at", { ascending: false });

  const batches = (data ?? []) as Batch[];

  return (
    <div className="p-8 max-w-3xl mx-auto">
      <div className="flex items-start justify-between mb-8">
        <div className="page-header">
          <p className="text-micro font-semibold uppercase tracking-widest mb-2" style={{ color: "var(--color-gold)" }}>
            Inventory
          </p>
          <h1 className="font-display" style={{ fontSize: "32px", color: "var(--color-charcoal)", lineHeight: 1.15, letterSpacing: "-0.02em" }}>
            Tag Batches
          </h1>
          <p className="mt-1" style={{ color: "var(--color-slate)", fontSize: "var(--text-body-sm)" }}>
            Your tag batch requests and delivery status
          </p>
        </div>
        <Link
          href="/dashboard/batches/request"
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl font-medium text-body-sm shrink-0 mt-1"
          style={{
            backgroundColor: "var(--color-onyx)",
            color: "var(--color-pearl)",
            textDecoration: "none",
            fontSize: "var(--text-body-sm)",
          }}
        >
          <Plus size={14} />
          Request batch
        </Link>
      </div>

      {batches.length === 0 ? (
        <div
          className="rounded-2xl p-10 text-center"
          style={{ border: "1px solid var(--color-cream)", backgroundColor: "var(--color-pearl)" }}
        >
          <div
            className="w-14 h-14 rounded-2xl flex items-center justify-center mx-auto mb-4"
            style={{ backgroundColor: "var(--color-linen)" }}
          >
            <Layers size={24} style={{ color: "var(--color-gold)" }} />
          </div>
          <h2 className="font-semibold mb-2" style={{ fontSize: "var(--text-body)", color: "var(--color-charcoal)" }}>
            No batch requests yet
          </h2>
          <p className="mb-6" style={{ fontSize: "var(--text-body-sm)", color: "var(--color-slate)" }}>
            Request your first tag batch and we&apos;ll have them ready for you.
          </p>
          <Link
            href="/dashboard/batches/request"
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl font-medium"
            style={{
              backgroundColor: "var(--color-onyx)",
              color: "var(--color-pearl)",
              textDecoration: "none",
              fontSize: "var(--text-body-sm)",
            }}
          >
            <Plus size={14} />
            Request your first batch
          </Link>
        </div>
      ) : (
        <div className="space-y-3">
          {batches.map((batch) => {
            const s = STATUS_STYLES[batch.status] ?? STATUS_STYLES.pending;
            const StatusIcon = s.icon;
            return (
              <div
                key={batch.id}
                className="card-raised rounded-2xl p-5"
              >
                <div className="flex items-start gap-4">
                  <div
                    className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
                    style={{ backgroundColor: "var(--color-linen)" }}
                  >
                    <Layers size={16} style={{ color: "var(--color-gold)" }} />
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div className="flex items-center gap-2 mb-1 flex-wrap">
                      <p className="font-semibold capitalize" style={{ fontSize: "var(--text-body-sm)", color: "var(--color-charcoal)" }}>
                        {batch.batch_name || `${batch.industry} — ${batch.batch_size.toLocaleString()} tags`}
                      </p>
                      {batch.batch_name && (
                        <span style={{ fontSize: "var(--text-caption)", color: "var(--color-slate)" }}>
                          {batch.industry} · {batch.batch_size.toLocaleString()} tags
                        </span>
                      )}
                      <span
                        className="px-2 py-0.5 rounded-full text-micro font-medium capitalize flex items-center gap-1"
                        style={{ backgroundColor: s.bg, color: s.color }}
                      >
                        <StatusIcon size={10} />
                        {batch.status}
                      </span>
                    </div>
                    <p style={{ fontSize: "var(--text-caption)", color: "var(--color-slate)" }}>
                      {STATUS_LABELS[batch.status] ?? batch.status}
                    </p>
                    {batch.notes && (
                      <p className="mt-1" style={{ fontSize: "var(--text-caption)", color: "var(--color-mist)", fontStyle: "italic" }}>
                        &ldquo;{batch.notes}&rdquo;
                      </p>
                    )}
                  </div>
                  <div className="text-right shrink-0">
                    <p style={{ fontSize: "var(--text-caption)", color: "var(--color-mist)" }}>
                      {format(new Date(batch.created_at), "MMM d, yyyy")}
                    </p>
                    {batch.shipped_at && (
                      <p style={{ fontSize: "var(--text-caption)", color: "var(--color-verified)" }}>
                        Shipped {format(new Date(batch.shipped_at), "MMM d")}
                      </p>
                    )}
                  </div>
                </div>

                {/* Progress steps */}
                <div className="mt-4 flex items-center gap-1">
                  {["pending", "generated", "written", "shipped"].map((step, i, arr) => {
                    const steps = ["pending", "generated", "written", "shipped"];
                    const currentIdx = steps.indexOf(batch.status);
                    const stepIdx = steps.indexOf(step);
                    const done = stepIdx <= currentIdx;
                    const isCurrent = stepIdx === currentIdx;
                    return (
                      <div key={step} className="flex items-center flex-1">
                        <div
                          style={{
                            flex: 1,
                            height: 3,
                            borderRadius: 99,
                            backgroundColor: done ? "var(--color-gold)" : "var(--color-cream)",
                            transition: "background-color 0.3s",
                          }}
                        />
                        <div
                          style={{
                            width: 8,
                            height: 8,
                            borderRadius: "50%",
                            backgroundColor: done ? "var(--color-gold)" : "var(--color-cream)",
                            border: isCurrent ? "2px solid var(--color-gold)" : "none",
                            flexShrink: 0,
                            transition: "background-color 0.3s",
                          }}
                        />
                        {i === arr.length - 1 && (
                          <div
                            style={{
                              flex: 1,
                              height: 3,
                              borderRadius: 99,
                              backgroundColor: done ? "var(--color-gold)" : "var(--color-cream)",
                            }}
                          />
                        )}
                      </div>
                    );
                  })}
                </div>
                <div className="flex justify-between mt-1">
                  {["Requested", "Generated", "Written", "Shipped"].map((label) => (
                    <span key={label} style={{ fontSize: 9, color: "var(--color-mist)", letterSpacing: "0.02em" }}>{label}</span>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
