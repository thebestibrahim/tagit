"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Loader2, CheckCircle2, XCircle } from "lucide-react";

export default function BatchActions({
  batchId,
  batchSize,
}: {
  batchId: string;
  batchSize: number;
}) {
  const router = useRouter();
  const [loading, setLoading] = useState<"approve" | "decline" | null>(null);

  async function approve() {
    setLoading("approve");
    const res = await fetch(`/api/admin/batches/${batchId}/approve`, { method: "POST" });
    const json = await res.json();
    setLoading(null);
    if (!res.ok) { toast.error(json.error ?? "Approval failed"); return; }
    toast.success(`${batchSize.toLocaleString()} tags generated`);
    router.refresh();
  }

  async function decline() {
    setLoading("decline");
    const res = await fetch(`/api/admin/batches/${batchId}/decline`, { method: "DELETE" });
    const json = await res.json();
    setLoading(null);
    if (!res.ok) { toast.error(json.error ?? "Failed to decline"); return; }
    toast.success("Request declined");
    router.refresh();
  }

  return (
    <div className="flex items-center gap-2">
      <button
        onClick={approve}
        disabled={loading !== null}
        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-medium"
        style={{
          fontSize: "var(--text-caption)",
          backgroundColor: loading !== null ? "var(--color-stone)" : "var(--color-onyx)",
          color: "var(--color-pearl)",
          border: "none",
          cursor: loading !== null ? "not-allowed" : "pointer",
          transition: "background-color 0.15s",
        }}
      >
        {loading === "approve" ? (
          <Loader2 size={12} className="animate-spin" />
        ) : (
          <CheckCircle2 size={12} />
        )}
        Approve & Generate
      </button>
      <button
        onClick={decline}
        disabled={loading !== null}
        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-medium"
        style={{
          fontSize: "var(--text-caption)",
          backgroundColor: "transparent",
          color: loading !== null ? "var(--color-mist)" : "var(--color-alert)",
          border: `1px solid ${loading !== null ? "var(--color-cream)" : "var(--color-alert-tint)"}`,
          cursor: loading !== null ? "not-allowed" : "pointer",
          transition: "all 0.15s",
        }}
      >
        {loading === "decline" ? (
          <Loader2 size={12} className="animate-spin" />
        ) : (
          <XCircle size={12} />
        )}
        Decline
      </button>
    </div>
  );
}
