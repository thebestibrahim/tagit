"use client";

import { useState } from "react";
import { Loader2, CheckCircle2, UserCircle } from "lucide-react";

type Step = "form" | "otp" | "success";

export default function ClaimForm({
  tagId,
  productName,
  accent,
  primary,
}: {
  tagId: string;
  productName: string;
  accent: string;
  primary: string;
}) {
  const [step, setStep] = useState<Step>("form");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleSendOtp(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);

    const res = await fetch("/api/otp/send", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, purpose: "claim" }),
    });

    const data = await res.json();
    if (!res.ok) {
      setError(data.error || "Failed to send code");
      setLoading(false);
      return;
    }

    setStep("otp");
    setLoading(false);
  }

  async function handleVerifyAndClaim(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);

    // Verify OTP
    const verifyRes = await fetch("/api/otp/verify", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, code: otp.trim(), purpose: "claim" }),
    });

    const verifyData = await verifyRes.json();
    if (!verifyRes.ok) {
      setError(verifyData.error || "Invalid code");
      setLoading(false);
      return;
    }

    // Submit claim
    const claimRes = await fetch("/api/claim", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ tag_id: tagId, claimant_name: name, claimant_email: email }),
    });

    const claimData = await claimRes.json();
    if (!claimRes.ok) {
      setError(claimData.error || "Failed to submit claim");
      setLoading(false);
      return;
    }

    setStep("success");
    setLoading(false);
  }

  if (step === "success") {
    return (
      <div
        style={{
          padding: "28px 24px",
          backgroundColor: "#DCEEE3",
          borderRadius: "16px",
          border: "1px solid #B5D9C5",
          textAlign: "center",
        }}
      >
        <CheckCircle2 size={36} color="#2D6A4F" style={{ margin: "0 auto 12px" }} />
        <p style={{ margin: "0 0 6px", fontSize: "16px", fontWeight: "700", color: "#1E4D3A" }}>
          Claim submitted
        </p>
        <p style={{ margin: 0, fontSize: "13px", color: "#2D6A4F", lineHeight: 1.5 }}>
          Your ownership claim for <strong>{productName}</strong> is under review. You&apos;ll receive an email once it&apos;s approved.
        </p>
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
        <UserCircle size={20} color={accent} style={{ marginTop: "2px", flexShrink: 0 }} />
        <div>
          <p style={{ margin: "0 0 2px", fontSize: "15px", fontWeight: "700", color: "#0A0A0B" }}>
            Claim ownership
          </p>
          <p style={{ margin: 0, fontSize: "13px", color: "#6E6E73" }}>
            {step === "form"
              ? "Enter your details to claim this item."
              : `Enter the 6-digit code sent to ${email}`}
          </p>
        </div>
      </div>

      {error && (
        <div style={{ marginBottom: "14px", padding: "10px 14px", backgroundColor: "#F9DDDD", borderRadius: "8px" }}>
          <p style={{ margin: 0, fontSize: "13px", color: "#B85C5C" }}>{error}</p>
        </div>
      )}

      {step === "form" && (
        <form onSubmit={handleSendOtp} style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
          <div>
            <label style={labelStyle}>Your name</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              placeholder="Full name"
              style={inputStyle}
            />
          </div>
          <div>
            <label style={labelStyle}>Email address</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              placeholder="you@example.com"
              style={inputStyle}
            />
          </div>
          <button
            type="submit"
            disabled={loading}
            style={{ ...btnStyle(primary), marginTop: "4px" }}
          >
            {loading ? <Loader2 size={16} className="animate-spin" style={{ display: "inline" }} /> : null}
            {loading ? "Sending code…" : "Continue"}
          </button>
        </form>
      )}

      {step === "otp" && (
        <form onSubmit={handleVerifyAndClaim} style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
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
            {loading ? "Submitting…" : "Claim ownership"}
          </button>
          <button
            type="button"
            onClick={() => { setStep("form"); setError(""); setOtp(""); }}
            style={{ background: "none", border: "none", cursor: "pointer", fontSize: "13px", color: "#6E6E73", textDecoration: "underline" }}
          >
            Use a different email
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
