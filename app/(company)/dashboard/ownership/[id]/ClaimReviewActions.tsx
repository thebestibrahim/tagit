"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { CheckCircle2, XCircle, Loader2 } from "lucide-react";
import { toast } from "sonner";

export default function ClaimReviewActions({
  claimId,
}: {
  claimId: string;
}) {
  const router = useRouter();
  const [rejecting, setRejecting] = useState(false);
  const [rejectionReason, setRejectionReason] = useState("");
  const [loading, setLoading] = useState<"approve" | "reject" | null>(null);

  async function handleApprove() {
    setLoading("approve");
    const res = await fetch(`/api/company/claims/${claimId}/review`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "approve" }),
    });
    const data = await res.json();
    if (!res.ok) {
      toast.error(data.error || "Failed to approve claim");
      setLoading(null);
      return;
    }
    toast.success("Claim approved — ownership confirmed");
    router.push("/dashboard/ownership");
    router.refresh();
  }

  async function handleReject() {
    setLoading("reject");
    const res = await fetch(`/api/company/claims/${claimId}/review`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "reject", rejection_reason: rejectionReason }),
    });
    const data = await res.json();
    if (!res.ok) {
      toast.error(data.error || "Failed to reject claim");
      setLoading(null);
      return;
    }
    toast.success("Claim rejected");
    router.push("/dashboard/ownership");
    router.refresh();
  }

  return (
    <div className="p-5 rounded-xl" style={{ border: "1px solid var(--color-cream)", backgroundColor: "var(--color-pearl)" }}>
      <p className="text-micro font-medium uppercase tracking-wider mb-4" style={{ color: "var(--color-slate)" }}>
        Review decision
      </p>

      {!rejecting ? (
        <div className="flex gap-3">
          <button
            onClick={handleApprove}
            disabled={!!loading}
            className="flex items-center gap-2 px-5 py-2.5 rounded-lg font-medium"
            style={{
              backgroundColor: "var(--color-verified)",
              color: "#fff",
              border: "none",
              cursor: loading ? "not-allowed" : "pointer",
              fontSize: "var(--text-body-sm)",
              opacity: loading ? 0.7 : 1,
            }}
          >
            {loading === "approve" ? <Loader2 size={14} className="animate-spin" /> : <CheckCircle2 size={14} />}
            Approve
          </button>

          <button
            onClick={() => setRejecting(true)}
            disabled={!!loading}
            className="flex items-center gap-2 px-5 py-2.5 rounded-lg font-medium"
            style={{
              backgroundColor: "var(--color-alert-tint)",
              color: "var(--color-alert)",
              border: "1px solid #F0C0C0",
              cursor: loading ? "not-allowed" : "pointer",
              fontSize: "var(--text-body-sm)",
              opacity: loading ? 0.7 : 1,
            }}
          >
            <XCircle size={14} />
            Reject
          </button>
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
          <div>
            <label
              className="text-body-sm font-medium mb-1.5 block"
              style={{ color: "var(--color-graphite)" }}
            >
              Reason for rejection (optional — will be sent to claimant)
            </label>
            <textarea
              value={rejectionReason}
              onChange={(e) => setRejectionReason(e.target.value)}
              rows={3}
              placeholder="e.g. Proof of purchase required, or this item has not been sold through our verified channels."
              className="w-full rounded-lg p-3"
              style={{
                border: "1px solid var(--color-stone)",
                fontSize: "var(--text-body-sm)",
                color: "var(--color-onyx)",
                backgroundColor: "var(--color-pearl)",
                resize: "vertical",
                fontFamily: "inherit",
              }}
            />
          </div>

          <div className="flex gap-3">
            <button
              onClick={handleReject}
              disabled={loading === "reject"}
              className="flex items-center gap-2 px-5 py-2.5 rounded-lg font-medium"
              style={{
                backgroundColor: "var(--color-alert)",
                color: "#fff",
                border: "none",
                cursor: loading ? "not-allowed" : "pointer",
                fontSize: "var(--text-body-sm)",
                opacity: loading ? 0.7 : 1,
              }}
            >
              {loading === "reject" ? <Loader2 size={14} className="animate-spin" /> : <XCircle size={14} />}
              Confirm rejection
            </button>
            <button
              onClick={() => setRejecting(false)}
              style={{
                background: "none",
                border: "none",
                cursor: "pointer",
                fontSize: "var(--text-body-sm)",
                color: "var(--color-slate)",
                textDecoration: "underline",
              }}
            >
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
