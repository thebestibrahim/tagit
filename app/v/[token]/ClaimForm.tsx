"use client";

import { useState } from "react";
import { Loader2, CheckCircle2, AlertCircle } from "lucide-react";
import s from "@/components/consumer/consumer.module.css";

type Step = "form" | "otp" | "success";

export default function ClaimForm({
  tagId,
  productName,
}: {
  tagId: string;
  productName: string;
  /** Kept for callers; the theme now comes from the page's custom properties. */
  accent?: string;
  primary?: string;
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
      setError(data.error || "We couldn't send the code. Check the email and try again.");
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

    // OTP verification and claim creation happen atomically server-side
    const claimRes = await fetch("/api/claim", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ tag_id: tagId, claimant_name: name, claimant_email: email, otp_code: otp.trim() }),
    });

    const claimData = await claimRes.json();
    if (!claimRes.ok) {
      setError(claimData.error || "That code didn't work. Check it and try again.");
      setLoading(false);
      return;
    }

    setStep("success");
    setLoading(false);
  }

  if (step === "success") {
    return (
      <div className={`${s.notice} ${s.noticeOk}`} role="status" style={{ marginTop: 20 }}>
        <CheckCircle2 size={18} aria-hidden />
        <p>
          <strong>Your claim is in.</strong> {productName} will carry your name once it&apos;s confirmed, within 24 hours. We&apos;ll email {email} when it is.
        </p>
      </div>
    );
  }

  return (
    <div>
      {step === "form" && (
        <form onSubmit={handleSendOtp} className={s.form}>
          {error && <ErrorNote>{error}</ErrorNote>}
          <div>
            <label htmlFor="claim-name" className={s.label}>Your name</label>
            <input id="claim-name" className={s.input} type="text" value={name} onChange={(e) => setName(e.target.value)} required autoComplete="name" placeholder="As you'd like it on the record" />
          </div>
          <div>
            <label htmlFor="claim-email" className={s.label}>Email</label>
            <input id="claim-email" className={s.input} type="email" value={email} onChange={(e) => setEmail(e.target.value)} required autoComplete="email" inputMode="email" placeholder="you@example.com" />
          </div>
          <button type="submit" disabled={loading} className={s.button} style={{ marginTop: 4 }}>
            {loading && <Loader2 size={16} className={s.spin} aria-hidden />}
            {loading ? "Sending the code" : "Send me a code"}
          </button>
          <p className={s.fine}>
            By continuing you agree to the <a href="/terms" target="_blank" rel="noopener noreferrer">Terms</a> and{" "}
            <a href="/privacy" target="_blank" rel="noopener noreferrer">Privacy Policy</a>, including recording your approximate location from your IP address.
          </p>
        </form>
      )}

      {step === "otp" && (
        <form onSubmit={handleVerifyAndClaim} className={s.form}>
          <p className={s.formLead} style={{ margin: 0 }}>
            We sent a 6-digit code to <strong style={{ color: "var(--ink)" }}>{email}</strong>.
          </p>
          {error && <ErrorNote>{error}</ErrorNote>}
          <div>
            <label htmlFor="claim-code" className={s.label}>Code</label>
            <input
              id="claim-code"
              className={`${s.input} ${s.code}`}
              type="text"
              inputMode="numeric"
              autoComplete="one-time-code"
              pattern="[0-9]{6}"
              maxLength={6}
              value={otp}
              onChange={(e) => setOtp(e.target.value.replace(/\D/g, ""))}
              required
              placeholder="000000"
            />
          </div>
          <button type="submit" disabled={loading || otp.length !== 6} className={s.button} style={{ marginTop: 4 }}>
            {loading && <Loader2 size={16} className={s.spin} aria-hidden />}
            {loading ? "Adding you to the record" : "Claim this piece"}
          </button>
          <button type="button" className={s.textButton} onClick={() => { setStep("form"); setError(""); setOtp(""); }}>
            Use a different email
          </button>
        </form>
      )}
    </div>
  );
}

export function ErrorNote({ children }: { children: React.ReactNode }) {
  return (
    <div className={`${s.notice} ${s.noticeAlert}`} role="alert">
      <AlertCircle size={17} aria-hidden />
      <p>{children}</p>
    </div>
  );
}
