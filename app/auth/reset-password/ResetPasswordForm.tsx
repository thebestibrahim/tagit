"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { Loader2, ArrowLeft, Eye, EyeOff, CheckCircle2 } from "lucide-react";
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

export default function ResetPasswordForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const isAdmin = searchParams.get("type") === "admin";
  const loginHref = isAdmin ? "/auth/login?type=admin" : "/auth/login";
  const forgotHref = isAdmin ? "/auth/forgot-password?type=admin" : "/auth/forgot-password";
  const [ready, setReady] = useState(false);
  const [sessionError, setSessionError] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [done, setDone] = useState(false);

  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getSession().then(({ data }) => {
      if (data.session) {
        setReady(true);
      } else {
        setSessionError("This reset link is invalid or has already been used.");
      }
    });
  }, []);

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

    if (password.length < 8) {
      setError("Password must be at least 8 characters.");
      return;
    }
    if (password !== confirm) {
      setError("Passwords don't match.");
      return;
    }

    setLoading(true);
    const supabase = createClient();
    const { error: err } = await supabase.auth.updateUser({ password });

    if (err) {
      setError(err.message);
      setLoading(false);
      return;
    }

    await supabase.auth.signOut();
    setDone(true);
    setLoading(false);

    setTimeout(() => router.push(loginHref), 3000);
  }

  const passwordStrength = (() => {
    if (password.length === 0) return null;
    if (password.length < 8) return { label: "Too short", color: "#B85C5C", width: "25%" };
    if (password.length < 12) return { label: "Fair", color: "#B87C00", width: "55%" };
    if (/[A-Z]/.test(password) && /[0-9]/.test(password) && /[^A-Za-z0-9]/.test(password)) {
      return { label: "Strong", color: "#2D6A4F", width: "100%" };
    }
    return { label: "Good", color: "#2D6A4F", width: "80%" };
  })();

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
          <span style={{ fontFamily: "var(--font-display)", fontSize: 20, fontStyle: "italic", color: "#FAFAF8", letterSpacing: "-0.02em" }}>Tagit</span>
        </div>

        <div style={{ position: "relative" }}>
          <p style={{ fontFamily: "var(--font-mono)", fontSize: 9, color: "#D4B68A", letterSpacing: "0.12em", textTransform: "uppercase", marginBottom: 24 }}>
            {isAdmin ? "Internal Dashboard" : "New Password"}
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
            Almost there.<br />
            <em style={{ color: "#C9A66B" }}>You&apos;re nearly back.</em>
          </h2>
          <p style={{ fontSize: 14, color: "#4A4A4F", lineHeight: 1.7, margin: 0, letterSpacing: "-0.003em" }}>
            Choose a strong password. Your identity infrastructure and brand data will be waiting exactly as you left them.
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
            href={loginHref}
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
            <span style={{ fontFamily: "var(--font-display)", fontSize: 18, fontStyle: "italic", color: "#0A0A0B", letterSpacing: "-0.02em" }}>Tagit</span>
          </div>

          {done ? (
            /* ── Success state ── */
            <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, ease: EASE }}>
              <div style={{ width: 48, height: 48, borderRadius: "50%", backgroundColor: "#DCEEE3", display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 24 }}>
                <CheckCircle2 size={22} color="#2D6A4F" />
              </div>
              <p style={{ fontFamily: "var(--font-mono)", fontSize: 10, color: "#B8945D", letterSpacing: "0.12em", textTransform: "uppercase", marginBottom: 10 }}>
                Password updated
              </p>
              <h1 style={{ fontFamily: "var(--font-display)", fontSize: "clamp(28px, 3vw, 38px)", fontWeight: 400, color: "#0A0A0B", letterSpacing: "-0.025em", lineHeight: 1.1, margin: "0 0 16px" }}>
                You&apos;re all set.
              </h1>
              <p style={{ fontSize: 14, color: "#6E6E73", lineHeight: 1.7, margin: "0 0 24px", letterSpacing: "-0.003em" }}>
                Your password has been updated. Redirecting you to sign in…
              </p>
              <Link
                href={loginHref}
                style={{ fontSize: 13, color: "#4A4A4F", textDecoration: "none", borderBottom: "1px solid #E8E2D5" }}
              >
                Sign in now →
              </Link>
            </motion.div>
          ) : sessionError ? (
            /* ── Invalid session state ── */
            <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, ease: EASE }}>
              <p style={{ fontFamily: "var(--font-mono)", fontSize: 10, color: "#B85C5C", letterSpacing: "0.12em", textTransform: "uppercase", marginBottom: 10 }}>
                Link invalid
              </p>
              <h1 style={{ fontFamily: "var(--font-display)", fontSize: "clamp(28px, 3vw, 38px)", fontWeight: 400, color: "#0A0A0B", letterSpacing: "-0.025em", lineHeight: 1.1, margin: "0 0 16px" }}>
                Link expired.
              </h1>
              <p style={{ fontSize: 14, color: "#6E6E73", lineHeight: 1.7, margin: "0 0 28px", letterSpacing: "-0.003em" }}>
                {sessionError} Reset links are single-use and expire after 1 hour.
              </p>
              <Link
                href={forgotHref}
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  padding: "12px 20px",
                  backgroundColor: "#0A0A0B",
                  color: "#FAFAF8",
                  borderRadius: 8,
                  textDecoration: "none",
                  fontSize: 14,
                  fontWeight: 550,
                  letterSpacing: "-0.01em",
                }}
              >
                Request a new link
              </Link>
            </motion.div>
          ) : !ready ? (
            /* ── Loading state ── */
            <div style={{ display: "flex", alignItems: "center", gap: 10, color: "#9E9EA3" }}>
              <Loader2 size={16} style={{ animation: "spin 1s linear infinite" }} />
              <span style={{ fontSize: 14 }}>Verifying reset link…</span>
            </div>
          ) : (
            /* ── Password form ── */
            <>
              <p style={{ fontFamily: "var(--font-mono)", fontSize: 10, color: "#B8945D", letterSpacing: "0.12em", textTransform: "uppercase", marginBottom: 10 }}>
                New password
              </p>
              <h1
                style={{
                  fontFamily: "var(--font-display)",
                  fontSize: "clamp(28px, 3vw, 38px)",
                  fontWeight: 400,
                  color: "#0A0A0B",
                  letterSpacing: "-0.025em",
                  lineHeight: 1.1,
                  margin: "0 0 36px",
                }}
              >
                Choose a new password.
              </h1>

              {error && (
                <div style={{ marginBottom: 20, padding: "12px 14px", backgroundColor: "#F9DDDD", borderRadius: 8, border: "1px solid #F0C0C0" }}>
                  <p style={{ margin: 0, fontSize: 13, color: "#B85C5C", letterSpacing: "-0.003em" }}>{error}</p>
                </div>
              )}

              <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 20 }}>
                {/* New password */}
                <div>
                  <label htmlFor="password" style={{ display: "block", fontSize: 12, fontWeight: 500, color: "#4A4A4F", marginBottom: 8, letterSpacing: "-0.003em" }}>
                    New password
                  </label>
                  <div style={{ position: "relative" }}>
                    <input
                      id="password"
                      type={showPassword ? "text" : "password"}
                      placeholder="Min. 8 characters"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                      onFocus={focusInput}
                      onBlur={blurInput}
                      style={{ ...inputBase, paddingRight: 44 }}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword((v) => !v)}
                      style={{ position: "absolute", right: 12, top: "50%", transform: "translateY(-50%)", background: "none", border: "none", cursor: "pointer", color: "#9E9EA3", padding: 2, display: "flex", alignItems: "center" }}
                    >
                      {showPassword ? <EyeOff size={15} /> : <Eye size={15} />}
                    </button>
                  </div>

                  {/* Strength bar */}
                  {passwordStrength && (
                    <div style={{ marginTop: 8 }}>
                      <div style={{ height: 3, backgroundColor: "#F0EDE8", borderRadius: 99, overflow: "hidden" }}>
                        <div style={{ height: "100%", width: passwordStrength.width, backgroundColor: passwordStrength.color, borderRadius: 99, transition: "width 0.3s ease, background-color 0.3s ease" }} />
                      </div>
                      <p style={{ margin: "4px 0 0", fontSize: 11, color: passwordStrength.color, fontFamily: "var(--font-mono)", letterSpacing: "0.04em" }}>
                        {passwordStrength.label}
                      </p>
                    </div>
                  )}
                </div>

                {/* Confirm password */}
                <div>
                  <label htmlFor="confirm" style={{ display: "block", fontSize: 12, fontWeight: 500, color: "#4A4A4F", marginBottom: 8, letterSpacing: "-0.003em" }}>
                    Confirm password
                  </label>
                  <div style={{ position: "relative" }}>
                    <input
                      id="confirm"
                      type={showConfirm ? "text" : "password"}
                      placeholder="Repeat your password"
                      value={confirm}
                      onChange={(e) => setConfirm(e.target.value)}
                      required
                      onFocus={focusInput}
                      onBlur={blurInput}
                      style={{
                        ...inputBase,
                        paddingRight: 44,
                        borderColor: confirm && confirm !== password ? "#B85C5C" : confirm && confirm === password ? "#2D6A4F" : "#E8E2D5",
                      }}
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirm((v) => !v)}
                      style={{ position: "absolute", right: 12, top: "50%", transform: "translateY(-50%)", background: "none", border: "none", cursor: "pointer", color: "#9E9EA3", padding: 2, display: "flex", alignItems: "center" }}
                    >
                      {showConfirm ? <EyeOff size={15} /> : <Eye size={15} />}
                    </button>
                  </div>
                  {confirm && confirm !== password && (
                    <p style={{ margin: "5px 0 0", fontSize: 12, color: "#B85C5C", letterSpacing: "-0.003em" }}>Passwords don&apos;t match</p>
                  )}
                </div>

                <button
                  type="submit"
                  disabled={loading || password !== confirm || password.length < 8}
                  style={{
                    width: "100%",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: 8,
                    padding: "13px 24px",
                    backgroundColor: loading || password !== confirm || password.length < 8 ? "#2A2A2B" : "#0A0A0B",
                    color: "#FAFAF8",
                    border: "none",
                    borderRadius: 8,
                    fontSize: 14,
                    fontWeight: 550,
                    letterSpacing: "-0.01em",
                    cursor: loading || password !== confirm || password.length < 8 ? "not-allowed" : "pointer",
                    transition: "background-color 0.2s",
                    marginTop: 4,
                    fontFamily: "inherit",
                    opacity: password !== confirm || password.length < 8 ? 0.5 : 1,
                  }}
                >
                  {loading && <Loader2 size={14} style={{ animation: "spin 1s linear infinite" }} />}
                  {loading ? "Updating…" : "Set new password"}
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
