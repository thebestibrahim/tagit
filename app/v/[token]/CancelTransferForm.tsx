"use client";

import { useState, useEffect } from "react";
import { Clock, Loader2, CheckCircle2 } from "lucide-react";
import s from "@/components/consumer/consumer.module.css";
import { ErrorNote } from "./ClaimForm";

export default function CancelTransferForm({
  transferId,
  toName,
  toEmail,
  onCancelled,
}: {
  transferId: string;
  toName: string;
  toEmail: string;
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
      setError(data.error || "We couldn't cancel it. Check the email and try again.");
      setLoading(false);
      return;
    }

    setCancelled(true);
    setLoading(false);
  }

  if (cancelled) {
    return (
      <section className={s.section}>
        <div className={`${s.notice} ${s.noticeOk}`} role="status">
          <CheckCircle2 size={17} aria-hidden />
          <p>
            <strong>Transfer cancelled.</strong> The piece is still yours.
          </p>
        </div>
      </section>
    );
  }

  return (
    <section className={s.section} aria-label="Transfer in progress">
      <div className={`${s.panel} ${s.panelPad}`}>
        <div className={`${s.notice} ${s.noticeWait}`}>
          <Clock size={17} aria-hidden />
          <p>
            <strong>On its way to {toName}.</strong> The transfer completes when they accept the link we sent to {toEmail}.
          </p>
        </div>

        {!showForm ? (
          <button type="button" className={s.textButton} style={{ marginTop: 12, paddingLeft: 0 }} onClick={() => setShowForm(true)}>
            Cancel this transfer
          </button>
        ) : (
          <form onSubmit={handleCancel} className={s.form}>
            <p className={s.formLead} style={{ margin: 0, fontSize: 14 }}>
              Enter the email on the record to confirm it&apos;s you.
            </p>
            {error && <ErrorNote>{error}</ErrorNote>}
            <div>
              <label htmlFor="cancel-email" className={s.label}>Your email</label>
              <input id="cancel-email" className={s.input} type="email" value={email} onChange={(e) => setEmail(e.target.value)} required autoComplete="email" inputMode="email" />
            </div>
            <div className={s.row}>
              <button type="submit" disabled={loading} className={s.button} style={{ flex: 1 }}>
                {loading && <Loader2 size={16} className={s.spin} aria-hidden />}
                {loading ? "Cancelling" : "Cancel the transfer"}
              </button>
              <button type="button" className={s.buttonQuiet} style={{ height: 48 }} onClick={() => { setShowForm(false); setError(""); }}>
                Keep it
              </button>
            </div>
          </form>
        )}
      </div>
    </section>
  );
}
