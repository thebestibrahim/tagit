"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Loader2, PencilLine, Truck, CheckCircle2 } from "lucide-react";

// Fulfilment controls on the batch detail page. The link-writing happens between
// these steps: generated → (write each link) → written → shipped.
export default function BatchFulfilActions({
  batchId,
  status,
}: {
  batchId: string;
  status: string;
}) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function post(path: string, okMsg: string) {
    setLoading(true);
    const res = await fetch(`/api/admin/batches/${batchId}/${path}`, { method: "POST" });
    const json = await res.json().catch(() => ({}));
    setLoading(false);
    if (!res.ok) {
      toast.error(json.error ?? "Action failed");
      return;
    }
    toast.success(okMsg);
    router.refresh();
  }

  if (status === "shipped") {
    return (
      <div
        className="inline-flex items-center gap-2 px-3 py-2 rounded-lg"
        style={{ backgroundColor: "#ECFDF5", color: "#065F46", fontSize: "var(--text-body-sm)", fontWeight: 600 }}
      >
        <CheckCircle2 size={15} />
        Shipped
      </div>
    );
  }

  if (status === "generated") {
    return (
      <button
        type="button"
        onClick={() => post("written", "Marked as programmed — links written")}
        disabled={loading}
        className="inline-flex items-center gap-2 px-4 py-2 rounded-lg font-medium"
        style={{
          fontSize: "var(--text-body-sm)",
          backgroundColor: "var(--color-onyx)",
          color: "var(--color-pearl)",
          border: "none",
          cursor: loading ? "not-allowed" : "pointer",
        }}
      >
        {loading ? <Loader2 size={14} className="animate-spin" /> : <PencilLine size={14} />}
        I&apos;ve written all links
      </button>
    );
  }

  if (status === "written") {
    return (
      <button
        type="button"
        onClick={() => post("ship", "Batch marked as shipped")}
        disabled={loading}
        className="inline-flex items-center gap-2 px-4 py-2 rounded-lg font-medium"
        style={{
          fontSize: "var(--text-body-sm)",
          backgroundColor: "var(--color-onyx)",
          color: "var(--color-pearl)",
          border: "none",
          cursor: loading ? "not-allowed" : "pointer",
        }}
      >
        {loading ? <Loader2 size={14} className="animate-spin" /> : <Truck size={14} />}
        Mark shipped
      </button>
    );
  }

  return null;
}
