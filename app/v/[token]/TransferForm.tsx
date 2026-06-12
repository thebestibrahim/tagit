"use client";

import { useState } from "react";
import { Loader2, CheckCircle2, ArrowRightLeft, MailWarning } from "lucide-react";

const CURRENCIES = ["NGN", "USD", "EUR", "GBP", "GHS", "KES", "ZAR", "AED", "CHF"];

// Hint of the expected owner email without exposing it in full, e.g.
// "fa****z@gmail.com" — enough for the real owner to recognise their address.
function maskEmail(email: string): string {
  const [local, domain] = email.split("@");
  if (!domain) return email;
  const head = local.slice(0, 2);
  const tail = local.length > 3 ? local.slice(-1) : "";
  return `${head}${"*".repeat(Math.max(2, local.length - head.length - tail.length))}${tail}@${domain}`;
}

type Step = "closed" | "verify" | "otp" | "details" | "success";

export default function TransferForm({
  tagId,
  currentOwnerEmail,
  currentOwnerName,
  defaultCurrency = "NGN",
  accent,
  primary,
}: {
  tagId: string;
  currentOwnerEmail: string;
  currentOwnerName: string;
  defaultCurrency?: string;
  accent: string;
  primary: string;
}) {
  const [step, setStep] = useState<Step>("closed");
  const [ownerEmail, setOwnerEmail] = useState("");
  const [recipientName, setRecipientName] = useState("");
  const [recipientEmail, setRecipientEmail] = useState("");
  const [salePrice, setSalePrice] = useState("");
  const [currency, setCurrency] = useState(defaultCurrency);
  const [otp, setOtp] = useState("");
  const [verification, setVerification] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [transferId, setTransferId] = useState("");
  const [otpEmailSent, setOtpEmailSent] = useState(false);
  const [emailError, setEmailError] = useState<string | null>(null);
  const [acceptanceUrl, setAcceptanceUrl] = useState("");
  const [acceptanceEmailSent, setAcceptanceEmailSent] = useState(false);
  const [copied, setCopied] = useState(false);
  const [cancelling, setCancelling] = useState(false);
  const [cancelError, setCancelError] = useState("");

  // Step 1 → 2: verify the owner email and send the identity code.
  async function handleVerifyOwner(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    if (ownerEmail.toLowerCase().trim() !== currentOwnerEmail.toLowerCase().trim()) {
      setError(`That email doesn't match ${currentOwnerName}, the current owner. Only the current owner can transfer this item.`);
      return;
    }

    setLoading(true);

    const res = await fetch("/api/transfer/initiate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ tag_id: tagId, owner_email: ownerEmail }),
    });

    const data = await res.json();
    if (!res.ok) {
      setError(data.error || "Failed to send verification code");
      setLoading(false);
      return;
    }

    setOtpEmailSent(data.emailSent ?? false);
    setEmailError(data.emailError ?? null);
    setStep("otp");
    setLoading(false);
  }

  async function handleResendOtp() {
    setError("");
    setLoading(true);

    const res = await fetch("/api/transfer/resend-otp", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ tag_id: tagId, owner_email: ownerEmail }),
    });

    const data = await res.json();
    if (!res.ok) {
      setError(data.error || "Failed to resend code");
      setLoading(false);
      return;
    }

    setOtpEmailSent(data.emailSent ?? false);
    setEmailError(data.emailError ?? null);
    setLoading(false);
  }

  // Step 2 → 3: confirm the code, then collect recipient details.
  async function handleVerifyOtp(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);

    const confirmRes = await fetch("/api/transfer/confirm", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: ownerEmail, code: otp.trim() }),
    });

    const confirmData = await confirmRes.json();
    if (!confirmRes.ok) {
      setError(confirmData.error || "Failed to verify code");
      setLoading(false);
      return;
    }

    setVerification(confirmData.verification ?? "");
    setStep("details");
    setLoading(false);
  }

  // Step 3 → success: create the transfer and email the acceptance link.
  async function handleFinalize(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);

    const res = await fetch("/api/transfer/finalize", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        tag_id: tagId,
        owner_email: ownerEmail,
        verification,
        recipient_name: recipientName,
        recipient_email: recipientEmail,
        sale_price: salePrice ? parseFloat(salePrice) : null,
        currency,
      }),
    });

    const data = await res.json();
    if (!res.ok) {
      setError(data.error || "Failed to complete transfer");
      setLoading(false);
      return;
    }

    setTransferId(data.transfer_id ?? "");
    setAcceptanceUrl(data.acceptanceUrl ?? "");
    setAcceptanceEmailSent(data.emailSent ?? false);
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

  async function handleCancelFromSuccess() {
    setCancelError("");
    setCancelling(true);
    const res = await fetch("/api/transfer/cancel", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ transfer_id: transferId, owner_email: ownerEmail }),
    });
    setCancelling(false);
    if (res.ok) {
      setStep("closed");
      setTransferId("");
      setAcceptanceUrl("");
    } else {
      const d = await res.json();
      setCancelError(d.error || "Failed to cancel transfer");
    }
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
          onClick={() => setStep("verify")}
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

        {acceptanceEmailSent ? (
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

        {!acceptanceEmailSent && acceptanceUrl && (
          <div
            style={{
              backgroundColor: "rgba(255,255,255,0.6)",
              border: "1px solid #B5D9C5",
              borderRadius: "10px",
              padding: "12px 14px",
              marginBottom: 12,
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

        {/* Inline cancel option */}
        <div style={{ borderTop: "1px solid #B5D9C5", paddingTop: 12, marginTop: acceptanceEmailSent ? 4 : 0 }}>
          {cancelError && (
            <p style={{ margin: "0 0 8px", fontSize: "12px", color: "#B85C5C" }}>{cancelError}</p>
          )}
          <button
            onClick={handleCancelFromSuccess}
            disabled={cancelling}
            style={{
              background: "none",
              border: "none",
              cursor: cancelling ? "not-allowed" : "pointer",
              fontSize: "12px",
              color: "#2D6A4F",
              textDecoration: "underline",
              padding: 0,
              opacity: cancelling ? 0.6 : 1,
            }}
          >
            {cancelling ? "Cancelling…" : "Cancel this transfer"}
          </button>
        </div>
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
            {step === "verify"
              ? "First, let's confirm you're the current owner."
              : step === "otp"
                ? `Enter the code sent to ${ownerEmail}`
                : "You're verified. Now enter the recipient's details."}
          </p>
        </div>
      </div>

      {error && (
        <div style={{ marginBottom: "14px", padding: "10px 14px", backgroundColor: "#F9DDDD", borderRadius: "8px" }}>
          <p style={{ margin: 0, fontSize: "13px", color: "#B85C5C" }}>{error}</p>
        </div>
      )}

      {step === "verify" && (
        <form onSubmit={handleVerifyOwner} style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
          <div
            style={{
              padding: "10px 14px",
              backgroundColor: "#F5F2EC",
              borderRadius: "8px",
              marginBottom: "4px",
            }}
          >
            <p style={{ margin: 0, fontSize: "12px", color: "#6E6E73", lineHeight: 1.55 }}>
              This item is owned by <strong style={{ color: "#1F1F22" }}>{currentOwnerName}</strong>{" "}
              (<span style={{ fontFamily: "monospace" }}>{maskEmail(currentOwnerEmail)}</span>). Only the
              current owner can transfer it. Enter that email and we&apos;ll send a one-time code to confirm.
            </p>
          </div>

          <div>
            <label style={labelStyle}>Current owner&apos;s email</label>
            <input
              type="email"
              value={ownerEmail}
              onChange={(e) => setOwnerEmail(e.target.value)}
              required
              placeholder="owner@example.com"
              style={inputStyle}
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            style={{ ...btnStyle(primary), marginTop: "4px" }}
          >
            {loading ? <Loader2 size={16} className="animate-spin" style={{ display: "inline" }} /> : null}
            {loading ? "Sending code…" : "Send verification code"}
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

      {step === "details" && (
        <form onSubmit={handleFinalize} style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "8px",
              padding: "10px 14px",
              backgroundColor: "#DCEEE3",
              borderRadius: "8px",
              marginBottom: "4px",
            }}
          >
            <CheckCircle2 size={15} color="#2D6A4F" style={{ flexShrink: 0 }} />
            <p style={{ margin: 0, fontSize: "12px", color: "#2D6A4F", lineHeight: 1.5 }}>
              Identity verified as <strong>{currentOwnerName}</strong>. Enter who you&apos;re transferring to.
            </p>
          </div>

          <p style={{ margin: "0 0 2px", fontSize: "12px", fontWeight: "700", color: "#9E9EA3", textTransform: "uppercase", letterSpacing: "0.05em" }}>
            Recipient
          </p>
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
            <div style={{ display: "flex", gap: 8 }}>
              <select
                value={currency}
                onChange={(e) => setCurrency(e.target.value)}
                style={{
                  ...inputStyle,
                  width: "auto",
                  paddingLeft: 10,
                  paddingRight: 10,
                  flexShrink: 0,
                  cursor: "pointer",
                }}
              >
                {CURRENCIES.map((c) => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
              <input
                type="number"
                value={salePrice}
                onChange={(e) => setSalePrice(e.target.value)}
                min="0"
                step="0.01"
                placeholder="e.g. 150000"
                style={{ ...inputStyle, flex: 1 }}
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            style={{ ...btnStyle(primary), marginTop: "4px" }}
          >
            {loading ? <Loader2 size={16} className="animate-spin" style={{ display: "inline" }} /> : null}
            {loading ? "Completing…" : "Complete transfer"}
          </button>
        </form>
      )}

      {step === "otp" && (
        <form onSubmit={handleVerifyOtp} style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
          {/* Email delivery warning */}
          {!otpEmailSent && (
            <div
              style={{
                display: "flex",
                gap: "10px",
                alignItems: "flex-start",
                padding: "12px 14px",
                backgroundColor: "#FEF3C7",
                borderRadius: "8px",
                border: "1px solid #FCD34D",
              }}
            >
              <MailWarning size={16} color="#B45309" style={{ flexShrink: 0, marginTop: "1px" }} />
              <div>
                <p style={{ margin: "0 0 4px", fontSize: "13px", fontWeight: "600", color: "#92400E" }}>
                  Email delivery issue
                </p>
                <p style={{ margin: "0 0 4px", fontSize: "12px", color: "#92400E", lineHeight: 1.5 }}>
                  We couldn&apos;t send the code to <strong>{ownerEmail}</strong>. Check your spam folder,
                  or tap <em>Resend code</em> to try again.
                </p>
                {emailError && (
                  <p style={{ margin: "0 0 8px", fontSize: "11px", color: "#92400E", fontFamily: "monospace", wordBreak: "break-all", opacity: 0.8 }}>
                    {emailError}
                  </p>
                )}
                <button
                  type="button"
                  onClick={handleResendOtp}
                  disabled={loading}
                  style={{
                    padding: "5px 12px",
                    fontSize: "12px",
                    fontWeight: "600",
                    color: "#92400E",
                    backgroundColor: "rgba(255,255,255,0.7)",
                    border: "1px solid #FCD34D",
                    borderRadius: "6px",
                    cursor: loading ? "not-allowed" : "pointer",
                  }}
                >
                  {loading ? "Sending…" : "Resend code"}
                </button>
              </div>
            </div>
          )}

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
            {loading ? "Verifying…" : "Verify identity"}
          </button>
          <button
            type="button"
            onClick={() => { setStep("verify"); setError(""); setOtp(""); }}
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
