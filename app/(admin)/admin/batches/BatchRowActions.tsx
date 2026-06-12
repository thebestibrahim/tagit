"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { toast } from "sonner";
import { Loader2, Truck, Layers, ArrowRight } from "lucide-react";

// Per-row fulfilment actions for batches that have moved past payment.
//   processing (paid) → generate tag records          → generated
//   generated          → write each link (detail page) → written
//   written            → mark chips shipped            → shipped
// The link-writing is a manual internal step done on the batch detail page,
// which is why `generated` routes there rather than shipping directly.
export default function BatchRowActions({
  batchId,
  status,
  batchSize,
}: {
  batchId: string;
  status: string;
  batchSize: number;
}) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function generate() {
    setLoading(true);
    const res = await fetch(`/api/admin/batches/${batchId}/approve`, { method: "POST" });
    const json = await res.json().catch(() => ({}));
    setLoading(false);
    if (!res.ok) { toast.error(json.error ?? "Generation failed"); return; }
    toast.success(`${(json.count ?? batchSize).toLocaleString()} chips generated`);
    router.refresh();
  }

  async function ship() {
    setLoading(true);
    const res = await fetch(`/api/admin/batches/${batchId}/ship`, { method: "POST" });
    const json = await res.json().catch(() => ({}));
    setLoading(false);
    if (!res.ok) { toast.error(json.error ?? "Failed to mark shipped"); return; }
    toast.success("Batch marked as shipped");
    router.refresh();
  }

  if (status === "processing") {
    return (
      <ActionButton onClick={generate} loading={loading} icon={<Layers size={12} />}>
        Generate chips
      </ActionButton>
    );
  }
  if (status === "generated") {
    // Links must be written (on the detail page) before shipping.
    return <ViewLink batchId={batchId} label="Write links" emphasis />;
  }
  if (status === "written") {
    return (
      <div className="flex items-center gap-2 justify-end">
        <ViewLink batchId={batchId} label="View" />
        <ActionButton onClick={ship} loading={loading} icon={<Truck size={12} />}>
          Mark shipped
        </ActionButton>
      </div>
    );
  }
  if (status === "shipped") {
    return <ViewLink batchId={batchId} label="View" />;
  }
  return null;
}

function ViewLink({ batchId, label, emphasis = false }: { batchId: string; label: string; emphasis?: boolean }) {
  return (
    <Link
      href={`/admin/batches/${batchId}`}
      className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg font-medium whitespace-nowrap"
      style={{
        fontSize: "var(--text-caption)",
        backgroundColor: emphasis ? "var(--color-onyx)" : "var(--color-pearl)",
        color: emphasis ? "var(--color-pearl)" : "var(--color-graphite)",
        border: emphasis ? "none" : "1px solid var(--color-cream)",
        textDecoration: "none",
      }}
    >
      {label}
      <ArrowRight size={12} />
    </Link>
  );
}

function ActionButton({
  onClick,
  loading,
  icon,
  children,
}: {
  onClick: () => void;
  loading: boolean;
  icon: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      disabled={loading}
      className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg font-medium whitespace-nowrap"
      style={{
        fontSize: "var(--text-caption)",
        backgroundColor: loading ? "var(--color-stone)" : "var(--color-onyx)",
        color: "var(--color-pearl)",
        border: "none",
        cursor: loading ? "not-allowed" : "pointer",
        transition: "background-color 0.15s",
      }}
    >
      {loading ? <Loader2 size={12} className="animate-spin" /> : icon}
      {children}
    </button>
  );
}
