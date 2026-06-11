"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Loader2, Truck, Layers } from "lucide-react";

// Per-row fulfilment actions for batches that have moved past payment.
//   processing (paid) → generate tag records      → generated
//   generated          → mark chips shipped        → shipped
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
  if (status === "generated" || status === "written") {
    return (
      <ActionButton onClick={ship} loading={loading} icon={<Truck size={12} />}>
        Mark shipped
      </ActionButton>
    );
  }
  return null;
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
