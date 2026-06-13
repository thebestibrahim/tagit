"use client";

import { Wordmark } from "@/components/ui/Wordmark";
import { useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Loader2, ArrowLeft, Mail } from "lucide-react";
import { motion } from "motion/react";

const EASE = [0.16, 1, 0.3, 1] as const;

const inputBase: React.CSSProperties = {
  width: "100%",
  border: "1px solid #E8E2D5",
  borderRadius: 8,
  padding: "12px 14px",
  fontSize: 14,
  color: "#0A0A0B",
  backgroundColor: "#fff",
  outline: "none",
  fontFamily: "inherit",
  letterSpacing: "-0.005em",
  transition: "border-color 0.2s, box-shadow 0.2s",
};

export default function ForgotPasswordForm() {
  const searchParams = useSearchParams();
  const linkExpired = searchParams.get("error") === "link_expired";
  const isAdmin = searchParams.get("type") === "admin";

  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState(linkExpired ? "That reset link has expired. Enter your email to send a new one." : "");

  function focusInput(e: React.FocusEvent<HTMLInputElement>) {
    e.currentTarget.style.borderColor = "#B8945D";
    e.currentTarget.style.boxShadow = "0 0 0 3px rgba(184,148,93,0.12)";
  }
  function blurInput(e: React.FocusEvent<HTMLInputElement>) {
    e.currentTarget.style.borderColor = "#E8E2D5";
    e.currentTarget.style.boxShadow = "none";
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);

    const supabase = createClient();
    const next = isAdmin ? "/auth/reset-password?type=admin" : "/auth/reset-password";
    const redirectTo = `${window.location.origin}/auth/callback?next=${encodeURIComponent(next)}${isAdmin ? "&type=admin" : ""}`;

    const { error: err } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo,
    });

    if (err) {
      setError(err.message);
      setLoading(false);
      return;
    }

    setSent(true);
    setLoading(false);
  }

  return (
    <div style={{ minHeight: "100vh", display: "flex", backgroundColor: "#FAFAF8" }}>

      {/* ── Left panel ── */}
      <div
        style={{
          width: "42%",
          backgroundColor: "#0A0A0B",
          padding: "48px 56px",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          position: "relative",
          overflow: "hidden",
          flexShrink: 0,
        }}
        className="hidden lg:flex"
      >
        <div style={{ position: "absolute", top: 0, left: "50%", transform: "translateX(-50%)", width: 500, height: 360, background: "radial-gradient(ellipse at 50% 0%, rgba(184,148,93,0.11) 0%, transparent 70%)", pointerEvents: "none" }} />

        <div style={{ display: "flex", alignItems: "center", gap: 6, position: "relative" }}>
          <span style={{ width: 6, height: 6, borderRadius: "50%", backgroundColor: "#B8945D", display: "inline-block" }} />
          <Wordmark tone="light" height={20} />
        </div>

        <div style={{ position: "relative" }}>
          <p style={{ fontFamily: "var(--font-mono)", fontSize: 9, color: "#D4B68A", letterSpacing: "0.12em", textTransform: "uppercase", marginBottom: 24 }}>
            {isAdmin ? "Internal Dashboard" : "Account Recovery"}
          </p>
          <h2
            style={{
              fontFamily: "var(--font-display)",
              fontSize: "clamp(28px, 2.8vw, 40px)",
              fontWeight: 400,
              fontStyle: "italic",
              color: "#FAFAF8",
              letterSpacing: "-0.025em",
              lineHeight: 1.2,
              margin: "0 0 32px",
            }}
          >
            Reclaim your<br />
            <em style={{ color: "#C9A66B" }}>access.</em>
          </h2>
          <p style={{ fontSize: 14, color: "#4A4A4F", lineHeight: 1.7, margin: 0, letterSpacing: "-0.003em" }}>
            {isAdmin
              ? "We’ll send a secure link to your admin email. Click it to set a new password and return to the dashboard."
              : "We’ll send a secure link to your email. Click it to set a new password and return to your dashboard."}
          </p>
        </div>

        <p style={{ fontFamily: "var(--font-mono)", fontSize: 9, color: "#2E2A1E", letterSpacing: "0.08em", textTransform: "uppercase", position: "relative" }}>
          © {new Date().getFullYear()} Tagit · Identity infrastructure for luxury
        </p>
      </div>

      {/* ── Right panel ── */}
      <div style={{ flex: 1, display: "flex", flexDirection: "column", justifyContent: "center", padding: "48px clamp(24px, 6vw, 96px)" }}>

        <div style={{ marginBottom: 48 }}>
          <Link
            href="/auth/login"
            style={{ display: "inline-flex", alignItems: "center", gap: 6, fontSize: 13, color: "#9E9EA3", textDecoration: "none", letterSpacing: "-0.005em" }}
          >
            <ArrowLeft size={13} />
            Back to sign in
          </Link>
        </div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, ease: EASE }}
          style={{ maxWidth: 400, width: "100%" }}
        >
          {/* Mobile logo */}
          <div style={{ display: "flex", alignItems: "center", gap: 5, marginBottom: 32 }} className="lg:hidden">
            <span style={{ width: 5, height: 5, borderRadius: "50%", backgroundColor: "#B8945D", display: "inline-block" }} />
            <Wordmark tone="ink" height={18} />
          </div>

          {sent ? (
            /* ── Success state ── */
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, ease: EASE }}
            >
              <div
                style={{
                  width: 48,
                  height: 48,
                  borderRadius: "50%",
                  backgroundColor: "#DCEEE3",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  marginBottom: 24,
                }}
              >
                <Mail size={20} color="#2D6A4F" />
              </div>
              <p style={{ fontFamily: "var(--font-mono)", fontSize: 10, color: "#B8945D", letterSpacing: "0.12em", textTransform: "uppercase", marginBottom: 10 }}>
                Email sent
              </p>
              <h1
                style={{
                  fontFamily: "var(--font-display)",
                  fontSize: "clamp(28px, 3vw, 38px)",
                  fontWeight: 400,
                  color: "#0A0A0B",
                  letterSpacing: "-0.025em",
                  lineHeight: 1.1,
                  margin: "0 0 16px",
                }}
              >
                Check your inbox.
              </h1>
              <p style={{ fontSize: 14, color: "#6E6E73", lineHeight: 1.7, margin: "0 0 8px", letterSpacing: "-0.003em" }}>
                We sent a reset link to{" "}
                <span style={{ color: "#1F1F22", fontWeight: 550 }}>{email}</span>.
                Click the link in the email to set a new password.
              </p>
              <p style={{ fontSize: 13, color: "#9E9EA3", lineHeight: 1.6, margin: "0 0 28px" }}>
                The link expires in 1 hour. Check your spam folder if you don&apos;t see it.
              </p>
              <button
                onClick={() => { setSent(false); setEmail(""); }}
                style={{
                  background: "none",
                  border: "none",
                  cursor: "pointer",
                  fontSize: 13,
                  color: "#6E6E73",
                  padding: 0,
                  textDecoration: "underline",
                  textUnderlineOffset: 3,
                }}
              >
                Use a different email
              </button>
            </motion.div>
          ) : (
            /* ── Form state ── */
            <>
              <p style={{ fontFamily: "var(--font-mono)", fontSize: 10, color: "#B8945D", letterSpacing: "0.12em", textTransform: "uppercase", marginBottom: 10 }}>
                Forgot password
              </p>
              <h1
                style={{
                  fontFamily: "var(--font-display)",
                  fontSize: "clamp(28px, 3vw, 38px)",
                  fontWeight: 400,
                  color: "#0A0A0B",
                  letterSpacing: "-0.025em",
                  lineHeight: 1.1,
                  margin: "0 0 8px",
                }}
              >
                Reset your password.
              </h1>
              <p style={{ fontSize: 14, color: "#9E9EA3", margin: "0 0 36px", letterSpacing: "-0.003em" }}>
                Enter your email and we&apos;ll send you a reset link.
              </p>

              {error && (
                <div
                  style={{
                    marginBottom: 20,
                    padding: "12px 14px",
                    backgroundColor: "#F9DDDD",
                    borderRadius: 8,
                    border: "1px solid #F0C0C0",
                  }}
                >
                  <p style={{ margin: 0, fontSize: 13, color: "#B85C5C", letterSpacing: "-0.003em" }}>{error}</p>
                </div>
              )}

              <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 20 }}>
                <div>
                  <label htmlFor="email" style={{ display: "block", fontSize: 12, fontWeight: 500, color: "#4A4A4F", marginBottom: 8, letterSpacing: "-0.003em" }}>
                    Email address
                  </label>
                  <input
                    id="email"
                    type="email"
                    placeholder="you@brand.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    onFocus={focusInput}
                    onBlur={blurInput}
                    style={inputBase}
                  />
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  style={{
                    width: "100%",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: 8,
                    padding: "13px 24px",
                    backgroundColor: loading ? "#2A2A2B" : "#0A0A0B",
                    color: "#FAFAF8",
                    border: "none",
                    borderRadius: 8,
                    fontSize: 14,
                    fontWeight: 550,
                    letterSpacing: "-0.01em",
                    cursor: loading ? "not-allowed" : "pointer",
                    transition: "background-color 0.2s",
                    fontFamily: "inherit",
                  }}
                >
                  {loading && <Loader2 size={14} style={{ animation: "spin 1s linear infinite" }} />}
                  {loading ? "Sending…" : "Send reset link"}
                </button>
              </form>
            </>
          )}
        </motion.div>
      </div>

      <style>{`
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
        @media (max-width: 1023px) { .hidden.lg\\:flex { display: none !important; } }
        .lg\\:hidden { display: none; }
        @media (max-width: 1023px) { .lg\\:hidden { display: flex !important; } }
      `}</style>
    </div>
  );
}
