"use client";

import { useState } from "react";
import { Loader2, CheckCircle2, ArrowRightLeft } from "lucide-react";

type Step = "closed" | "form" | "otp" | "success";

export default function TransferForm({
  tagId,
  currentOwnerEmail,
  currentOwnerName,
  accent,
  primary,
}: {
  tagId: string;
  currentOwnerEmail: string;
  currentOwnerName: string;
  accent: string;
  primary: string;
}) {
  const [step, setStep] = useState<Step>("closed");
  const [ownerEmail, setOwnerEmail] = useState("");
  const [recipientName, setRecipientName] = useState("");
  const [recipientEmail, setRecipientEmail] = useState("");
  const [salePrice, setSalePrice] = useState("");
  const [otp, setOtp] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [transferId, setTransferId] = useState("");
  const [acceptanceUrl, setAcceptanceUrl] = useState("");
  const [emailSent, setEmailSent] = useState(false);
  const [copied, setCopied] = useState(false);

  async function handleInitiate(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    if (ownerEmail.toLowerCase().trim() !== currentOwnerEmail.toLowerCase().trim()) {
      setError("Email does not match the current owner.");
      return;
    }

    setLoading(true);

    const res = await fetch("/api/transfer/initiate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        tag_id: tagId,
        owner_email: ownerEmail,
        recipient_name: recipientName,
        recipient_email: recipientEmail,
        sale_price: salePrice ? parseFloat(salePrice) : null,
      }),
    });

    const data = await res.json();
    if (!res.ok) {
      setError(data.error || "Failed to initiate transfer");
      setLoading(false);
      return;
    }

    setTransferId(data.transfer_id);
    setStep("otp");
    setLoading(false);
  }

  async function handleVerifyOtp(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);

    // OTP verification and transfer confirmation happen atomically server-side
    const confirmRes = await fetch("/api/transfer/confirm", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ transfer_id: transferId, email: ownerEmail, code: otp.trim() }),
    });

    const confirmData = await confirmRes.json();
    if (!confirmRes.ok) {
      setError(confirmData.error || "Failed to confirm transfer");
      setLoading(false);
      return;
    }

    setAcceptanceUrl(confirmData.acceptanceUrl ?? "");
    setEmailSent(confirmData.emailSent ?? false);
    setStep("success");
    setLoading(false);
  }

  function handleCopy() {
    if (!acceptanceUrl) return;
    navigator.clipboard.writeText(acceptanceUrl).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }

  if (step === "closed") {
    return (
      <div
        style={{
          padding: "20px 24px",
          backgroundColor: "#fff",
          borderRadius: "16px",
          border: "1px solid #E8E2D5",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
        }}
      >
        <div>
          <p style={{ margin: "0 0 2px", fontSize: "14px", fontWeight: "600", color: "#0A0A0B" }}>
            Owned by {currentOwnerName}
          </p>
          <p style={{ margin: 0, fontSize: "12px", color: "#9E9EA3" }}>Current verified owner</p>
        </div>
        <button
          onClick={() => setStep("form")}
          style={{
            padding: "9px 16px",
            fontSize: "13px",
            fontWeight: "600",
            color: primary,
            backgroundColor: "transparent",
            border: `1px solid ${primary}`,
            borderRadius: "8px",
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            gap: "6px",
          }}
        >
          <ArrowRightLeft size={14} />
          Transfer
        </button>
      </div>
    );
  }

  if (step === "success") {
    return (
      <div
        style={{
          padding: "24px",
          backgroundColor: "#DCEEE3",
          borderRadius: "16px",
          border: "1px solid #B5D9C5",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "12px" }}>
          <CheckCircle2 size={22} color="#2D6A4F" style={{ flexShrink: 0 }} />
          <p style={{ margin: 0, fontSize: "15px", fontWeight: "700", color: "#1E4D3A" }}>
            Transfer initiated
          </p>
        </div>

        {emailSent ? (
          <p style={{ margin: "0 0 16px", fontSize: "13px", color: "#2D6A4F", lineHeight: 1.55 }}>
            An acceptance email has been sent to <strong>{recipientEmail}</strong>.
            The transfer completes once they click the link.
          </p>
        ) : (
          <p style={{ margin: "0 0 16px", fontSize: "13px", color: "#2D6A4F", lineHeight: 1.55 }}>
            The email could not be delivered automatically. Share the link below
            directly with <strong>{recipientEmail}</strong> via WhatsApp, SMS, or any
            other channel. The transfer completes once they accept.
          </p>
        )}

        {acceptanceUrl && (
          <div
            style={{
              backgroundColor: "rgba(255,255,255,0.6)",
              border: "1px solid #B5D9C5",
              borderRadius: "10px",
              padding: "12px 14px",
            }}
          >
            <p style={{ margin: "0 0 6px", fontSize: "10px", fontWeight: "700", color: "#2D6A4F", textTransform: "uppercase", letterSpacing: "0.06em" }}>
              Acceptance link
            </p>
            <p style={{ margin: "0 0 10px", fontSize: "12px", color: "#1E4D3A", wordBreak: "break-all", lineHeight: 1.5, fontFamily: "monospace" }}>
              {acceptanceUrl}
            </p>
            <button
              onClick={handleCopy}
              style={{
                padding: "7px 16px",
                fontSize: "12px",
                fontWeight: "600",
                color: "#1E4D3A",
                backgroundColor: copied ? "#B5D9C5" : "rgba(255,255,255,0.8)",
                border: "1px solid #2D6A4F",
                borderRadius: "6px",
                cursor: "pointer",
                transition: "all 0.15s",
              }}
            >
              {copied ? "Copied!" : "Copy link"}
            </button>
          </div>
        )}
      </div>
    );
  }

  return (
    <div
      style={{
        padding: "24px",
        backgroundColor: "#fff",
        borderRadius: "16px",
        border: "1px solid #E8E2D5",
      }}
    >
      <div style={{ display: "flex", gap: "10px", alignItems: "flex-start", marginBottom: "20px" }}>
        <ArrowRightLeft size={20} color={accent} style={{ marginTop: "2px", flexShrink: 0 }} />
        <div>
          <p style={{ margin: "0 0 2px", fontSize: "15px", fontWeight: "700", color: "#0A0A0B" }}>
            Transfer ownership
          </p>
          <p style={{ margin: 0, fontSize: "13px", color: "#6E6E73" }}>
            {step === "form"
              ? "Verify your identity and enter the recipient's details."
              : `Enter the code sent to ${ownerEmail}`}
          </p>
        </div>
      </div>

      {error && (
        <div style={{ marginBottom: "14px", padding: "10px 14px", backgroundColor: "#F9DDDD", borderRadius: "8px" }}>
          <p style={{ margin: 0, fontSize: "13px", color: "#B85C5C" }}>{error}</p>
        </div>
      )}

      {step === "form" && (
        <form onSubmit={handleInitiate} style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
          <div
            style={{
              padding: "10px 14px",
              backgroundColor: "#F5F2EC",
              borderRadius: "8px",
              marginBottom: "4px",
            }}
          >
            <p style={{ margin: 0, fontSize: "12px", color: "#6E6E73" }}>
              You must be the current owner to initiate a transfer. Your email will be verified with a code.
            </p>
          </div>

          <div>
            <label style={labelStyle}>Your email (owner)</label>
            <input
              type="email"
              value={ownerEmail}
              onChange={(e) => setOwnerEmail(e.target.value)}
              required
              placeholder="owner@example.com"
              style={inputStyle}
            />
          </div>

          <div style={{ borderTop: "1px solid #E8E2D5", paddingTop: "12px", marginTop: "4px" }}>
            <p style={{ margin: "0 0 10px", fontSize: "12px", fontWeight: "700", color: "#9E9EA3", textTransform: "uppercase", letterSpacing: "0.05em" }}>
              Recipient
            </p>
            <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
              <div>
                <label style={labelStyle}>Recipient name</label>
                <input
                  type="text"
                  value={recipientName}
                  onChange={(e) => setRecipientName(e.target.value)}
                  required
                  placeholder="Full name"
                  style={inputStyle}
                />
              </div>
              <div>
                <label style={labelStyle}>Recipient email</label>
                <input
                  type="email"
                  value={recipientEmail}
                  onChange={(e) => setRecipientEmail(e.target.value)}
                  required
                  placeholder="recipient@example.com"
                  style={inputStyle}
                />
              </div>
              <div>
                <label style={labelStyle}>Sale price (optional)</label>
                <input
                  type="number"
                  value={salePrice}
                  onChange={(e) => setSalePrice(e.target.value)}
                  min="0"
                  step="0.01"
                  placeholder="e.g. 150000"
                  style={inputStyle}
                />
              </div>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            style={{ ...btnStyle(primary), marginTop: "4px" }}
          >
            {loading ? <Loader2 size={16} className="animate-spin" style={{ display: "inline" }} /> : null}
            {loading ? "Sending code…" : "Continue"}
          </button>
          <button
            type="button"
            onClick={() => { setStep("closed"); setError(""); }}
            style={{ background: "none", border: "none", cursor: "pointer", fontSize: "13px", color: "#6E6E73", textDecoration: "underline" }}
          >
            Cancel
          </button>
        </form>
      )}

      {step === "otp" && (
        <form onSubmit={handleVerifyOtp} style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
          <div>
            <label style={labelStyle}>Verification code</label>
            <input
              type="text"
              inputMode="numeric"
              pattern="[0-9]{6}"
              maxLength={6}
              value={otp}
              onChange={(e) => setOtp(e.target.value.replace(/\D/g, ""))}
              required
              placeholder="000000"
              style={{ ...inputStyle, textAlign: "center", fontSize: "24px", letterSpacing: "0.2em", fontFamily: "monospace" }}
            />
          </div>
          <button
            type="submit"
            disabled={loading || otp.length !== 6}
            style={{ ...btnStyle(primary), marginTop: "4px" }}
          >
            {loading ? <Loader2 size={16} className="animate-spin" style={{ display: "inline" }} /> : null}
            {loading ? "Processing…" : "Confirm transfer"}
          </button>
          <button
            type="button"
            onClick={() => { setStep("form"); setError(""); setOtp(""); }}
            style={{ background: "none", border: "none", cursor: "pointer", fontSize: "13px", color: "#6E6E73", textDecoration: "underline" }}
          >
            Go back
          </button>
        </form>
      )}
    </div>
  );
}

const labelStyle: React.CSSProperties = {
  display: "block",
  marginBottom: "4px",
  fontSize: "12px",
  fontWeight: "600",
  color: "#4A4A4F",
  textTransform: "uppercase",
  letterSpacing: "0.05em",
};

const inputStyle: React.CSSProperties = {
  width: "100%",
  padding: "11px 14px",
  fontSize: "14px",
  color: "#0A0A0B",
  backgroundColor: "#FAFAF8",
  border: "1px solid #C7C7CC",
  borderRadius: "8px",
  outline: "none",
  boxSizing: "border-box",
};

function btnStyle(primary: string): React.CSSProperties {
  return {
    width: "100%",
    padding: "13px",
    fontSize: "14px",
    fontWeight: "600",
    color: "#FAFAF8",
    backgroundColor: primary,
    border: "none",
    borderRadius: "8px",
    cursor: "pointer",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    gap: "8px",
  };
}
