"use client";
import { useState, useTransition, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "motion/react";
import { submitBrandInquiry } from "@/app/actions/submit-brand-inquiry";

const EASE = [0.16, 1, 0.3, 1] as const;

interface Props {
  onClose: () => void;
}

function RequestAccessModal({ onClose }: Props) {
  const [status, setStatus] = useState<"idle" | "success" | "error">("idle");
  const [isPending, startTransition] = useTransition();
  const overlayRef = useRef<HTMLDivElement>(null);

  // Close on Escape
  useEffect(() => {
    const handler = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [onClose]);

  // Lock body scroll
  useEffect(() => {
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = ""; };
  }, []);

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const data = {
      name: fd.get("name") as string,
      email: fd.get("email") as string,
      company: fd.get("company") as string,
      phone: (fd.get("phone") as string) || undefined,
    };
    startTransition(async () => {
      try {
        await submitBrandInquiry(data);
        setStatus("success");
      } catch {
        setStatus("error");
      }
    });
  }

  return (
    <div
      ref={overlayRef}
      onClick={(e) => e.target === overlayRef.current && onClose()}
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 1000,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "24px",
      }}
    >
      {/* Backdrop */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.3 }}
        style={{
          position: "absolute",
          inset: 0,
          backgroundColor: "rgba(10,10,11,0.72)",
          backdropFilter: "blur(12px)",
          WebkitBackdropFilter: "blur(12px)",
        }}
        onClick={onClose}
      />

      {/* Panel */}
      <motion.div
        initial={{ opacity: 0, y: 32, scale: 0.97 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 16, scale: 0.98 }}
        transition={{ duration: 0.45, ease: EASE }}
        style={{
          position: "relative",
          width: "100%",
          maxWidth: 480,
          backgroundColor: "#0A0A0B",
          borderRadius: 20,
          border: "1px solid rgba(212,182,138,0.15)",
          overflow: "hidden",
          boxShadow: "0 40px 80px rgba(0,0,0,0.5), 0 0 0 1px rgba(255,255,255,0.04)",
        }}
      >
        {/* Top gold glow */}
        <div style={{
          position: "absolute", top: 0, left: "50%", transform: "translateX(-50%)",
          width: 400, height: 200,
          background: "radial-gradient(ellipse at 50% 0%, rgba(184,148,93,0.18) 0%, transparent 70%)",
          pointerEvents: "none",
        }} />

        <div style={{ position: "relative", padding: "40px 40px 40px" }}>
          {/* Close */}
          <button
            onClick={onClose}
            style={{
              position: "absolute", top: 20, right: 20,
              width: 32, height: 32, borderRadius: "50%",
              backgroundColor: "rgba(255,255,255,0.06)",
              border: "1px solid rgba(255,255,255,0.08)",
              cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center",
              color: "#71717A", fontSize: 16, lineHeight: 1,
            }}
            aria-label="Close"
          >
            ×
          </button>

          {status === "success" ? (
            /* ── Success state ── */
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, ease: EASE }}
              style={{ textAlign: "center", padding: "16px 0 8px" }}
            >
              {/* Animated check */}
              <motion.div
                initial={{ scale: 0.5, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ duration: 0.5, ease: EASE }}
                style={{
                  width: 56, height: 56, borderRadius: "50%",
                  background: "radial-gradient(circle, rgba(184,148,93,0.2) 0%, transparent 70%)",
                  border: "1px solid rgba(184,148,93,0.4)",
                  margin: "0 auto 24px",
                  display: "flex", alignItems: "center", justifyContent: "center",
                }}
              >
                <svg width="22" height="22" viewBox="0 0 22 22" fill="none">
                  <motion.path
                    d="M 5 11 L 9 15 L 17 7"
                    stroke="#B8945D"
                    strokeWidth="1.8"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    initial={{ pathLength: 0 }}
                    animate={{ pathLength: 1 }}
                    transition={{ duration: 0.4, delay: 0.2, ease: "easeOut" }}
                  />
                </svg>
              </motion.div>

              <h3 style={{
                fontFamily: "var(--font-display)", fontSize: 26, fontWeight: 400,
                fontStyle: "italic", color: "#FAFAF8", letterSpacing: "-0.02em",
                margin: "0 0 12px",
              }}>
                Request received.
              </h3>
              <p style={{ fontSize: 14, color: "#6E6E73", lineHeight: 1.7, margin: "0 0 32px" }}>
                We&apos;ll review your request and be in touch within 48 hours. Check your inbox for a confirmation.
              </p>
              <button
                onClick={onClose}
                style={{
                  padding: "11px 28px",
                  backgroundColor: "rgba(255,255,255,0.06)",
                  border: "1px solid rgba(255,255,255,0.1)",
                  borderRadius: 8, color: "#9E9EA3", fontSize: 13,
                  cursor: "pointer", letterSpacing: "-0.005em",
                }}
              >
                Close
              </button>
            </motion.div>
          ) : (
            /* ── Form state ── */
            <>
              <p style={{
                fontFamily: "var(--font-mono)", fontSize: 9, color: "#B8945D",
                letterSpacing: "0.14em", textTransform: "uppercase", margin: "0 0 16px",
              }}>
                Brand Access
              </p>
              <h2 style={{
                fontFamily: "var(--font-display)", fontSize: 28, fontWeight: 400,
                fontStyle: "italic", color: "#FAFAF8", letterSpacing: "-0.02em",
                lineHeight: 1.15, margin: "0 0 8px",
              }}>
                Request access to Tagit.
              </h2>
              <p style={{ fontSize: 13, color: "#6E6E73", lineHeight: 1.65, margin: "0 0 32px" }}>
                We&apos;re selective about the brands we work with. Tell us about your work and we&apos;ll be in touch within 48 hours.
              </p>

              {status === "error" && (
                <div style={{
                  padding: "10px 14px", backgroundColor: "rgba(184,92,92,0.12)",
                  border: "1px solid rgba(184,92,92,0.25)", borderRadius: 8,
                  marginBottom: 20, fontSize: 13, color: "#E09090",
                }}>
                  Something went wrong. Please email us at business@tagitlux.com
                </div>
              )}

              <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 14 }}>
                <Field label="Full name" name="name" type="text" placeholder="Your full name" required />
                <Field label="Email" name="email" type="email" placeholder="your@brand.com" required />
                <Field label="Brand / Company" name="company" type="text" placeholder="Your brand name" required />
                <Field label="Phone / WhatsApp" name="phone" type="tel" placeholder="+1 (optional)" />

                <button
                  type="submit"
                  disabled={isPending}
                  style={{
                    marginTop: 6,
                    padding: "13px 24px",
                    backgroundColor: isPending ? "#4A3E2A" : "#B8945D",
                    color: "#fff",
                    borderRadius: 8,
                    fontWeight: 550,
                    fontSize: 14,
                    letterSpacing: "-0.01em",
                    border: "none",
                    cursor: isPending ? "not-allowed" : "pointer",
                    transition: "background-color 0.2s ease",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: 8,
                  }}
                >
                  {isPending ? (
                    <>
                      <SpinnerIcon />
                      Sending…
                    </>
                  ) : "Request Access"}
                </button>

                <p style={{ textAlign: "center", margin: "4px 0 0", fontSize: 11, color: "#3A3A3F", letterSpacing: "-0.003em" }}>
                  We review every application and respond within 48 hours.
                </p>
              </form>
            </>
          )}
        </div>
      </motion.div>
    </div>
  );
}

function Field({
  label, name, type, placeholder, required,
}: {
  label: string; name: string; type: string; placeholder: string; required?: boolean;
}) {
  return (
    <div>
      <label style={{
        display: "block", marginBottom: 6,
        fontFamily: "var(--font-mono)", fontSize: 9, color: "#6E6E73",
        letterSpacing: "0.1em", textTransform: "uppercase",
      }}>
        {label}{required && <span style={{ color: "#B8945D", marginLeft: 3 }}>*</span>}
      </label>
      <input
        name={name}
        type={type}
        placeholder={placeholder}
        required={required}
        className="tagit-modal-input"
        style={{
          width: "100%",
          padding: "10px 14px",
          backgroundColor: "rgba(255,255,255,0.04)",
          border: "1px solid rgba(255,255,255,0.1)",
          borderRadius: 8,
          color: "#FAFAF8",
          fontSize: 14,
          outline: "none",
          boxSizing: "border-box",
          letterSpacing: "-0.005em",
          transition: "border-color 0.15s ease",
        }}
        onFocus={(e) => { e.currentTarget.style.borderColor = "rgba(184,148,93,0.5)"; }}
        onBlur={(e) => { e.currentTarget.style.borderColor = "rgba(255,255,255,0.1)"; }}
      />
    </div>
  );
}

function SpinnerIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 14 14" fill="none" style={{ animation: "spin 0.8s linear infinite" }}>
      <circle cx="7" cy="7" r="5.5" stroke="rgba(255,255,255,0.3)" strokeWidth="1.5" />
      <path d="M 7 1.5 A 5.5 5.5 0 0 1 12.5 7" stroke="#fff" strokeWidth="1.5" strokeLinecap="round" />
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </svg>
  );
}

/* ── Trigger button — wraps any CTA and shows the modal ── */
export function RequestAccessButton({
  children,
  style,
  className,
}: {
  children: React.ReactNode;
  style?: React.CSSProperties;
  className?: string;
}) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        style={{ background: "none", border: "none", padding: 0, cursor: "pointer", ...style }}
        className={className}
      >
        {children}
      </button>
      <AnimatePresence>
        {open && <RequestAccessModal onClose={() => setOpen(false)} />}
      </AnimatePresence>
    </>
  );
}

export default RequestAccessModal;
