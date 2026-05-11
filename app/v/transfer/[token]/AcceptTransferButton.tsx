"use client";

import { useState } from "react";
import { Loader2, CheckCircle2 } from "lucide-react";

export default function AcceptTransferButton({
  acceptanceToken,
  primary,
}: {
  acceptanceToken: string;
  primary: string;
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
      setError(data.error || "Something went wrong");
      setLoading(false);
      return;
    }

    setDone(true);
    setLoading(false);
  }

  if (done) {
    return (
      <div
        style={{
          padding: "16px",
          backgroundColor: "#DCEEE3",
          borderRadius: "10px",
          display: "flex",
          alignItems: "center",
          gap: "10px",
        }}
      >
        <CheckCircle2 size={20} color="#2D6A4F" />
        <p style={{ margin: 0, fontSize: "14px", fontWeight: "600", color: "#1E4D3A" }}>
          You are now the verified owner. Check your email for confirmation.
        </p>
      </div>
    );
  }

  return (
    <div>
      {error && (
        <div style={{ marginBottom: "12px", padding: "10px 14px", backgroundColor: "#F9DDDD", borderRadius: "8px" }}>
          <p style={{ margin: 0, fontSize: "13px", color: "#B85C5C" }}>{error}</p>
        </div>
      )}
      <button
        onClick={handleAccept}
        disabled={loading}
        style={{
          width: "100%",
          padding: "14px",
          fontSize: "15px",
          fontWeight: "700",
          color: "#FAFAF8",
          backgroundColor: loading ? "#4A4A4F" : primary,
          border: "none",
          borderRadius: "10px",
          cursor: loading ? "not-allowed" : "pointer",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          gap: "8px",
          transition: "background-color 0.15s",
        }}
      >
        {loading && <Loader2 size={16} className="animate-spin" />}
        {loading ? "Processing…" : "Accept ownership"}
      </button>
    </div>
  );
}
