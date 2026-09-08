"use client";

import { useState } from "react";
import { useSearchParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Loader2, Mail } from "lucide-react";
import { motion } from "motion/react";
import { c, EASE } from "@/components/landing/styles";
import {
  AuthLeftPanel,
  AuthRightPanel,
  AuthEyebrow,
  AuthHeading,
  AuthSubmitButton,
  FieldLabel,
  authInputBase,
  authFocusInput,
  authBlurInput,
  authOuter,
  authResponsiveCss,
} from "@/components/auth/auth-chrome";

export default function ForgotPasswordForm() {
  const searchParams = useSearchParams();
  const linkExpired = searchParams.get("error") === "link_expired";
  const isAdmin = searchParams.get("type") === "admin";

  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState(linkExpired ? "That reset link has expired. Enter your email to send a new one." : "");

  // Admins have their own portal — /auth/login is the brand-only form and
  // rejects non-company roles outright.
  const loginHref = isAdmin ? "/control/signin" : "/auth/login";

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);

    const supabase = createClient();
    const next = isAdmin ? "/auth/reset-password?type=admin" : "/auth/reset-password";
    const redirectTo = `${window.location.origin}/auth/callback?next=${encodeURIComponent(next)}${isAdmin ? "&type=admin" : ""}`;

    const { error: err } = await supabase.auth.resetPasswordForEmail(email, { redirectTo });

    if (err) {
      setError(err.message);
      setLoading(false);
      return;
    }

    setSent(true);
    setLoading(false);
  }

  return (
    <div style={authOuter}>
      <AuthLeftPanel
        eyebrow={isAdmin ? "Internal dashboard" : "Account recovery"}
        heading="Reclaim your access."
        body={
          isAdmin
            ? "We'll send a secure link to your admin email. Follow it to set a new password and return to the dashboard."
            : "We'll send a secure link to your email. Follow it to set a new password and return to your dashboard."
        }
      />

      <AuthRightPanel backHref={loginHref} backLabel="Back to sign in">
        {sent ? (
          <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, ease: EASE }}>
            <div style={{ width: 48, height: 48, borderRadius: "50%", backgroundColor: "#DCEEE3", display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 24 }}>
              <Mail size={20} color={c.verified} />
            </div>
            <AuthEyebrow>Email sent</AuthEyebrow>
            <AuthHeading tight>Check your inbox.</AuthHeading>
            <p style={{ fontSize: 16, color: c.body, lineHeight: 1.7, margin: "0 0 8px", letterSpacing: "-0.005em" }}>
              We sent a reset link to <span style={{ color: c.inkSoft, fontWeight: 550 }}>{email}</span>.
              Follow the link in the email to set a new password.
            </p>
            <p style={{ fontSize: 15, color: c.quiet, lineHeight: 1.6, margin: "0 0 28px" }}>
              The link expires in an hour. Check your spam folder if you don&apos;t see it.
            </p>
            <button
              onClick={() => { setSent(false); setEmail(""); }}
              style={{ background: "none", border: "none", cursor: "pointer", fontSize: 15, color: c.body, padding: 0, textDecoration: "underline", textUnderlineOffset: 3 }}
            >
              Use a different email
            </button>
          </motion.div>
        ) : (
          <>
            <AuthEyebrow>Forgot password</AuthEyebrow>
            <h1
              style={{
                fontFamily: "var(--font-display)",
                fontSize: "clamp(28px, 3vw, 38px)",
                fontWeight: 400,
                color: c.ink,
                letterSpacing: "-0.028em",
                lineHeight: 1.1,
                margin: "0 0 10px",
              }}
            >
              Reset your password.
            </h1>
            <p style={{ fontSize: 16, color: c.quiet, margin: "0 0 36px", letterSpacing: "-0.005em" }}>
              Enter your email and we&apos;ll send you a reset link.
            </p>

            {error && (
              <div style={{ marginBottom: 20, padding: "13px 15px", backgroundColor: "#F9DDDD", borderRadius: 8, border: "1px solid #F0C0C0" }}>
                <p style={{ margin: 0, fontSize: 14.5, color: "#B85C5C", letterSpacing: "-0.003em" }}>{error}</p>
              </div>
            )}

            <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 20 }}>
              <div>
                <FieldLabel htmlFor="email">Email address</FieldLabel>
                <input
                  id="email"
                  type="email"
                  placeholder="you@brand.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  onFocus={authFocusInput}
                  onBlur={authBlurInput}
                  style={authInputBase}
                />
              </div>

              <AuthSubmitButton loading={loading}>
                {loading && <Loader2 size={14} style={{ animation: "spin 1s linear infinite" }} />}
                {loading ? "Sending…" : "Send reset link"}
              </AuthSubmitButton>
            </form>
          </>
        )}
      </AuthRightPanel>

      <style>{authResponsiveCss}</style>
    </div>
  );
}
