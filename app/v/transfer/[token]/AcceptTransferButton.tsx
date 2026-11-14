"use client";

import { useState } from "react";
import { Loader2, CheckCircle2, AlertCircle } from "lucide-react";
import s from "@/components/consumer/consumer.module.css";

export default function AcceptTransferButton({
  acceptanceToken,
}: {
  acceptanceToken: string;
}) {
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState("");

  async function handleAccept() {
    setLoading(true);
    setError("");

    const res = await fetch("/api/transfer/accept", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ acceptance_token: acceptanceToken }),
    });

    const data = await res.json();
    if (!res.ok) {
      setError(data.error || "We couldn't complete the transfer. Try again in a moment.");
      setLoading(false);
      return;
    }

    setDone(true);
    setLoading(false);
  }

  if (done) {
    return (
      <div className={`${s.notice} ${s.noticeOk}`} role="status">
        <CheckCircle2 size={18} aria-hidden />
        <p>
          <strong>It&apos;s yours.</strong> You&apos;re now the owner on the record. Your certificate is on its way by email.
        </p>
      </div>
    );
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
      {error && (
        <div className={`${s.notice} ${s.noticeAlert}`} role="alert">
          <AlertCircle size={17} aria-hidden />
          <p>{error}</p>
        </div>
      )}
      <button type="button" onClick={handleAccept} disabled={loading} className={s.button}>
        {loading && <Loader2 size={16} className={s.spin} aria-hidden />}
        {loading ? "Adding you to the record" : "Accept the piece"}
      </button>
    </div>
  );
}
