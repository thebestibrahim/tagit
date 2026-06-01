"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Loader2, Send, XCircle } from "lucide-react";

type Status = "new" | "contacted" | "converted" | "declined";

export default function InquiryActions({
  inquiryId,
  status,
}: {
  inquiryId: string;
  status: Status;
}) {
  const router = useRouter();
  const [loading, setLoading] = useState<"invite" | "decline" | null>(null);

  const isDone = status === "converted" || status === "declined";

  async function handleInvite() {
    setLoading("invite");
    const res = await fetch(`/api/admin/inquiries/${inquiryId}/invite`, {
      method: "POST",
    });
    const json = await res.json();
    setLoading(null);
    if (!res.ok) {
      toast.error(json.error ?? "Failed to send invitation.");
      return;
    }
    toast.success("Invitation sent.");
    router.refresh();
  }

  async function handleDecline() {
    setLoading("decline");
    const res = await fetch(`/api/admin/inquiries/${inquiryId}/decline`, {
      method: "POST",
    });
    const json = await res.json();
    setLoading(null);
    if (!res.ok) {
      toast.error(json.error ?? "Failed to decline inquiry.");
      return;
    }
    toast.success("Inquiry declined.");
    router.refresh();
  }

  if (isDone) return null;

  return (
    <div className="flex items-center gap-2">
      <button
        onClick={handleInvite}
        disabled={!!loading}
        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-micro font-semibold transition-colors"
        style={{
          backgroundColor: "#065F46",
          color: "#fff",
          border: "none",
          cursor: loading ? "not-allowed" : "pointer",
          opacity: loading === "decline" ? 0.4 : 1,
          fontSize: "12px",
        }}
      >
        {loading === "invite" ? (
          <Loader2 size={12} className="animate-spin" />
        ) : (
          <Send size={12} />
        )}
        Invite
      </button>

      <button
        onClick={handleDecline}
        disabled={!!loading}
        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-micro font-semibold transition-colors"
        style={{
          backgroundColor: "transparent",
          color: "var(--color-alert, #B85C5C)",
          border: "1px solid var(--color-alert, #B85C5C)",
          cursor: loading ? "not-allowed" : "pointer",
          opacity: loading === "invite" ? 0.4 : 1,
          fontSize: "12px",
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
