"use client";

import { useState } from "react";
import { Loader2, CheckCircle2, ArrowRightLeft, MailWarning } from "lucide-react";
import s from "@/components/consumer/consumer.module.css";
import { ErrorNote } from "./ClaimForm";

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
}: {
  tagId: string;
  currentOwnerEmail: string;
  currentOwnerName: string;
  defaultCurrency?: string;
  /** Kept for callers; the theme now comes from the page's custom properties. */
  accent?: string;
  primary?: string;
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
      setError(`That isn't the email on the record for ${currentOwnerName}. Only the current owner can pass this piece on.`);
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
      <section className={s.section} aria-label="Owner">
        <div className={`${s.panel} ${s.panelPad} ${s.owner}`}>
          <div style={{ minWidth: 0 }}>
            <p className={s.ownerLabel}>Owned by</p>
            <p className={s.ownerName}>{currentOwnerName}</p>
          </div>
          <button type="button" className={s.buttonQuiet} onClick={() => setStep("verify")}>
            <ArrowRightLeft size={15} aria-hidden />
            Pass it on
          </button>
        </div>
      </section>
    );
  }

  if (step === "success") {
    return (
      <section className={s.section} aria-live="polite">
        <div className={`${s.panel} ${s.panelPad}`}>
          <div className={`${s.notice} ${s.noticeOk}`}>
            <CheckCircle2 size={18} aria-hidden />
            <p>
              <strong>Transfer started.</strong>{" "}
              {acceptanceEmailSent
                ? `We've emailed ${recipientEmail}. The piece becomes theirs once they accept.`
                : `We couldn't email ${recipientEmail}, so send them the link below yourself. The piece becomes theirs once they accept.`}
            </p>
          </div>

          {!acceptanceEmailSent && acceptanceUrl && (
            <div style={{ marginTop: 16, display: "flex", flexDirection: "column", gap: 10 }}>
              <p className={s.label} style={{ margin: 0 }}>Their link to accept</p>
              <p className={s.linkBox}>{acceptanceUrl}</p>
              <button type="button" className={s.buttonQuiet} onClick={handleCopy} style={{ alignSelf: "flex-start" }}>
                {copied ? "Copied" : "Copy link"}
              </button>
            </div>
          )}

          <div style={{ marginTop: 18, paddingTop: 14, borderTop: "1px solid var(--edge)", display: "flex", flexDirection: "column", gap: 8 }}>
            {cancelError && <ErrorNote>{cancelError}</ErrorNote>}
            <button type="button" className={s.textButton} style={{ alignSelf: "flex-start", paddingLeft: 0 }} onClick={handleCancelFromSuccess} disabled={cancelling}>
              {cancelling ? "Cancelling" : "Cancel this transfer"}
            </button>
          </div>
        </div>
      </section>
    );
  }

  const lead =
    step === "verify"
      ? "First we confirm you're the owner on the record."
      : step === "otp"
        ? `We sent a 6-digit code to ${ownerEmail}.`
        : "You're confirmed. Who is the piece going to?";

  return (
    <section className={s.section} aria-labelledby="transfer-heading">
      <div className={`${s.panel} ${s.panelPad}`}>
        <h2 id="transfer-heading" className={s.formTitle}>Pass this piece on</h2>
        <p className={s.formLead}>{lead}</p>

        {step === "verify" && (
          <form onSubmit={handleVerifyOwner} className={s.form}>
            {error && <ErrorNote>{error}</ErrorNote>}
            <p className={s.formLead} style={{ margin: 0, fontSize: 14 }}>
              The record lists <strong style={{ color: "var(--ink)" }}>{currentOwnerName}</strong> at{" "}
              <span style={{ fontFamily: "var(--mono)", fontSize: 13 }}>{maskEmail(currentOwnerEmail)}</span>.
            </p>
            <div>
              <label htmlFor="owner-email" className={s.label}>Your email</label>
              <input id="owner-email" className={s.input} type="email" value={ownerEmail} onChange={(e) => setOwnerEmail(e.target.value)} required autoComplete="email" inputMode="email" placeholder="The email on the record" />
            </div>
            <button type="submit" disabled={loading} className={s.button} style={{ marginTop: 4 }}>
              {loading && <Loader2 size={16} className={s.spin} aria-hidden />}
              {loading ? "Sending the code" : "Send me a code"}
            </button>
            <button type="button" className={s.textButton} onClick={() => { setStep("closed"); setError(""); }}>
              Not now
            </button>
          </form>
        )}

        {step === "otp" && (
          <form onSubmit={handleVerifyOtp} className={s.form}>
            {!otpEmailSent && (
              <div className={`${s.notice} ${s.noticeWait}`}>
                <MailWarning size={17} aria-hidden />
                <div>
                  <p>
                    <strong>The code may not have arrived.</strong> Check your spam folder, or send it again.
                  </p>
                  {emailError && (
                    <p style={{ marginTop: 4, fontFamily: "var(--mono)", fontSize: 11.5, opacity: 0.8, wordBreak: "break-all" }}>{emailError}</p>
                  )}
                  <button type="button" className={s.textButton} style={{ padding: "6px 0 0", color: "inherit" }} onClick={handleResendOtp} disabled={loading}>
                    {loading ? "Sending" : "Send it again"}
                  </button>
                </div>
              </div>
            )}
            {error && <ErrorNote>{error}</ErrorNote>}
            <div>
              <label htmlFor="transfer-code" className={s.label}>Code</label>
              <input
                id="transfer-code"
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
              {loading ? "Checking" : "Confirm it's me"}
            </button>
            <button type="button" className={s.textButton} onClick={() => { setStep("verify"); setError(""); setOtp(""); }}>
              Go back
            </button>
          </form>
        )}

        {step === "details" && (
          <form onSubmit={handleFinalize} className={s.form}>
            {error && <ErrorNote>{error}</ErrorNote>}
            <div>
              <label htmlFor="to-name" className={s.label}>Their name</label>
              <input id="to-name" className={s.input} type="text" value={recipientName} onChange={(e) => setRecipientName(e.target.value)} required placeholder="Full name" />
            </div>
            <div>
              <label htmlFor="to-email" className={s.label}>Their email</label>
              <input id="to-email" className={s.input} type="email" value={recipientEmail} onChange={(e) => setRecipientEmail(e.target.value)} required inputMode="email" placeholder="name@example.com" />
            </div>
            <div>
              <label htmlFor="sale-price" className={s.label}>
                Sale price <span style={{ fontWeight: 400, color: "var(--quiet)" }}>(optional, shown on the record)</span>
              </label>
              <div className={s.row}>
                <select aria-label="Currency" className={s.input} style={{ width: 96, flexShrink: 0, cursor: "pointer" }} value={currency} onChange={(e) => setCurrency(e.target.value)}>
                  {CURRENCIES.map((c) => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </select>
                <input id="sale-price" className={s.input} type="number" inputMode="decimal" value={salePrice} onChange={(e) => setSalePrice(e.target.value)} min="0" step="0.01" placeholder="0" />
              </div>
            </div>
            <button type="submit" disabled={loading} className={s.button} style={{ marginTop: 4 }}>
              {loading && <Loader2 size={16} className={s.spin} aria-hidden />}
              {loading ? "Starting the transfer" : "Send it to them"}
            </button>
          </form>
        )}
      </div>
    </section>
  );
}
