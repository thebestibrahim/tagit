"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Loader2, CheckCircle, XCircle } from "lucide-react";

export default function ReviewActions({ companyId }: { companyId: string }) {
  const router = useRouter();
  const [loading, setLoading] = useState<"approve" | "reject" | null>(null);
  const [rejecting, setRejecting] = useState(false);
  const [reason, setReason] = useState("");

  async function handleAction(action: "approve" | "reject") {
    if (action === "reject" && !rejecting) {
      setRejecting(true);
      return;
    }
    if (action === "reject" && !reason.trim()) {
      toast.error("Please provide a rejection reason.");
      return;
    }

    setLoading(action);

    const res = await fetch(`/api/admin/companies/${companyId}/review`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action, reason: action === "reject" ? reason : undefined }),
    });

    const json = await res.json();

    if (!res.ok) {
      toast.error(json.error ?? "Action failed.");
      setLoading(null);
      return;
    }

    toast.success(action === "approve" ? "Company approved." : "Company rejected.");
    router.push("/admin/companies");
    router.refresh();
  }

  return (
    <div className="space-y-3">
      {rejecting && (
        <div className="space-y-2">
          <label
            className="text-body-sm font-medium"
            style={{ color: "var(--color-graphite)", display: "block" }}
          >
            Rejection reason
          </label>
          <textarea
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder="Explain why this application is being rejected…"
            rows={3}
            style={{
              width: "100%",
              border: "1px solid var(--color-stone)",
              borderRadius: "var(--radius-sm)",
              padding: "10px 12px",
              fontSize: "var(--text-body-sm)",
              color: "var(--color-onyx)",
              backgroundColor: "var(--color-pearl)",
              resize: "vertical",
              outline: "none",
            }}
          />
        </div>
      )}

      <div className="flex gap-3">
        <button
          onClick={() => handleAction("approve")}
          disabled={!!loading}
          className="flex items-center gap-2 px-5 py-2.5 rounded-lg font-medium text-body-sm transition-colors"
          style={{
            backgroundColor: "#065F46",
            color: "#fff",
            border: "none",
            cursor: loading ? "not-allowed" : "pointer",
            opacity: loading === "reject" ? 0.5 : 1,
          }}
        >
          {loading === "approve" ? <Loader2 size={14} className="animate-spin" /> : <CheckCircle size={14} />}
          Approve
        </button>

        <button
          onClick={() => handleAction("reject")}
          disabled={!!loading}
          className="flex items-center gap-2 px-5 py-2.5 rounded-lg font-medium text-body-sm transition-colors"
          style={{
            backgroundColor: rejecting ? "#991B1B" : "var(--color-pearl)",
            color: rejecting ? "#fff" : "var(--color-alert)",
            border: `1px solid ${rejecting ? "#991B1B" : "var(--color-alert)"}`,
            cursor: loading ? "not-allowed" : "pointer",
            opacity: loading === "approve" ? 0.5 : 1,
          }}
        >
          {loading === "reject" ? <Loader2 size={14} className="animate-spin" /> : <XCircle size={14} />}
          {rejecting ? "Confirm reject" : "Reject"}
        </button>

        {rejecting && (
          <button
            onClick={() => { setRejecting(false); setReason(""); }}
            style={{
              background: "none",
              border: "none",
              color: "var(--color-slate)",
              fontSize: "var(--text-body-sm)",
              cursor: "pointer",
            }}
          >
            Cancel
          </button>
        )}
      </div>
    </div>
  );
}
