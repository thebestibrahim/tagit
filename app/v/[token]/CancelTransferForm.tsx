"use client";

import { useState, useEffect } from "react";
import { Clock, Loader2, XCircle } from "lucide-react";

export default function CancelTransferForm({
  transferId,
  toName,
  toEmail,
  primary,
  accent,
  onCancelled,
}: {
  transferId: string;
  toName: string;
  toEmail: string;
  primary: string;
  accent: string;
  onCancelled?: () => void;
}) {
  const [showForm, setShowForm] = useState(false);
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [cancelled, setCancelled] = useState(false);

  // Auto-switch back to TransferForm after showing the success banner
  useEffect(() => {
    if (cancelled && onCancelled) {
      const t = setTimeout(onCancelled, 1600);
      return () => clearTimeout(t);
    }
  }, [cancelled, onCancelled]);

  async function handleCancel(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);

    const res = await fetch("/api/transfer/cancel", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ transfer_id: transferId, owner_email: email }),
    });

    const data = await res.json();
    if (!res.ok) {
      setError(data.error || "Failed to cancel transfer");
      setLoading(false);
      return;
    }

    setCancelled(true);
    setLoading(false);
  }

  if (cancelled) {
    return (
      <div
        style={{
          margin: "16px 24px 0",
          padding: "18px 20px",
          backgroundColor: "#ECFDF5",
          borderRadius: 12,
          border: "1px solid #A7F3D0",
          display: "flex",
          gap: 12,
          alignItems: "flex-start",
        }}
      >
        <XCircle size={16} color="#065F46" style={{ marginTop: 2, flexShrink: 0 }} />
        <div>
          <p style={{ margin: "0 0 3px", fontSize: 13, fontWeight: 600, color: "#065F46" }}>
            Transfer cancelled
          </p>
          <p style={{ margin: 0, fontSize: 12, color: "#047857", lineHeight: 1.55 }}>
            The transfer to {toName} has been cancelled. This item is still yours.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div style={{ margin: "16px 24px 0" }}>
      <div
        style={{
          padding: "18px 20px",
          backgroundColor: "#FBE8D8",
          borderRadius: showForm ? "12px 12px 0 0" : 12,
          border: "1px solid #E8C99A",
          borderBottom: showForm ? "none" : "1px solid #E8C99A",
        }}
      >
        <div style={{ display: "flex", gap: 12, alignItems: "flex-start" }}>
          <Clock size={16} color="#B85C00" style={{ marginTop: 2, flexShrink: 0 }} />
          <div style={{ flex: 1 }}>
            <p style={{ margin: "0 0 3px", fontSize: 13, fontWeight: 600, color: "#B85C00" }}>
              Transfer in progress
            </p>
            <p style={{ margin: "0 0 10px", fontSize: 12, color: "#8B6F3F", lineHeight: 1.55 }}>
              Awaiting acceptance by <strong>{toName}</strong> ({toEmail})
            </p>
            {!showForm && (
              <button
                onClick={() => setShowForm(true)}
                style={{
                  padding: "6px 14px",
                  fontSize: 12,
                  fontWeight: 600,
                  color: "#B85C00",
                  backgroundColor: "rgba(255,255,255,0.6)",
                  border: "1px solid #E8C99A",
                  borderRadius: 6,
                  cursor: "pointer",
                }}
              >
                Cancel transfer
              </button>
            )}
          </div>
        </div>
      </div>

      {showForm && (
        <form
          onSubmit={handleCancel}
          style={{
            padding: "16px 20px",
            backgroundColor: "#fff",
            border: "1px solid #E8C99A",
            borderTop: "none",
            borderRadius: "0 0 12px 12px",
          }}
        >
          <p style={{ margin: "0 0 10px", fontSize: 12, color: "#6E6E73", lineHeight: 1.5 }}>
            Enter your email to confirm you are the current owner and cancel this transfer.
          </p>

          {error && (
            <p style={{ margin: "0 0 10px", fontSize: 12, color: "#B85C5C", padding: "8px 12px", backgroundColor: "#F9DDDD", borderRadius: 6 }}>
              {error}
            </p>
          )}

          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            placeholder="Your email address"
            style={{
              width: "100%",
              padding: "10px 12px",
              fontSize: 13,
              color: "#0A0A0B",
              backgroundColor: "#FAFAF8",
              border: "1px solid #C7C7CC",
              borderRadius: 8,
              outline: "none",
              boxSizing: "border-box",
              marginBottom: 10,
            }}
          />

          <div style={{ display: "flex", gap: 8 }}>
            <button
              type="submit"
              disabled={loading}
              style={{
                flex: 1,
                padding: "10px",
                fontSize: 13,
                fontWeight: 600,
                color: "#fff",
                backgroundColor: "#B85C5C",
                border: "none",
                borderRadius: 8,
                cursor: loading ? "not-allowed" : "pointer",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: 6,
              }}
            >
              {loading && <Loader2 size={13} className="animate-spin" />}
              {loading ? "Cancelling…" : "Yes, cancel transfer"}
            </button>
            <button
              type="button"
              onClick={() => { setShowForm(false); setError(""); }}
              style={{
                padding: "10px 16px",
                fontSize: 13,
                fontWeight: 600,
                color: "#6E6E73",
                backgroundColor: "transparent",
                border: "1px solid #C7C7CC",
                borderRadius: 8,
                cursor: "pointer",
              }}
            >
              Keep
            </button>
          </div>
        </form>
      )}
    </div>
  );
}
