"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Loader2, Truck } from "lucide-react";

export default function ShipBatchButton({ batchId }: { batchId: string }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function ship() {
    setLoading(true);
    const res = await fetch(`/api/admin/batches/${batchId}/ship`, { method: "POST" });
    const json = await res.json().catch(() => ({}));
    setLoading(false);
    if (!res.ok) {
      toast.error(json.error ?? "Failed to mark shipped");
      return;
    }
    toast.success("Batch marked as shipped");
    router.refresh();
  }

  return (
    <button
      onClick={ship}
      disabled={loading}
      className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg font-medium"
      style={{
        fontSize: "var(--text-caption)",
        backgroundColor: loading ? "var(--color-stone)" : "var(--color-onyx)",
        color: "var(--color-pearl)",
        border: "none",
        cursor: loading ? "not-allowed" : "pointer",
        transition: "background-color 0.15s",
      }}
    >
      {loading ? <Loader2 size={12} className="animate-spin" /> : <Truck size={12} />}
      Mark shipped
    </button>
  );
}
