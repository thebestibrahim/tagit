"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { Loader2, Eye, EyeOff, CheckCircle2 } from "lucide-react";
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

export default function ResetPasswordForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const isAdmin = searchParams.get("type") === "admin";
  // Admins have their own portal — /auth/login is the brand-only form and
  // rejects non-company roles outright.
  const loginHref = isAdmin ? "/control/signin" : "/auth/login";
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
      return { label: "Strong", color: c.verified, width: "100%" };
    }
    return { label: "Good", color: c.verified, width: "80%" };
  })();

  return (
    <div style={authOuter}>
      <AuthLeftPanel
        eyebrow={isAdmin ? "Internal dashboard" : "New password"}
        heading="Almost there."
        body="Choose a strong password. Your identity infrastructure and brand data will be waiting exactly as you left them."
      />

      <AuthRightPanel backHref={loginHref} backLabel="Back to sign in">
        {done ? (
          <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, ease: EASE }}>
            <div style={{ width: 48, height: 48, borderRadius: "50%", backgroundColor: "#DCEEE3", display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 24 }}>
              <CheckCircle2 size={22} color={c.verified} />
            </div>
            <AuthEyebrow>Password updated</AuthEyebrow>
            <AuthHeading tight>You&apos;re all set.</AuthHeading>
            <p style={{ fontSize: 16, color: c.body, lineHeight: 1.7, margin: "0 0 24px", letterSpacing: "-0.005em" }}>
              Your password has been updated. Redirecting you to sign in…
            </p>
            <Link href={loginHref} style={{ fontSize: 15, color: c.body, textDecoration: "none", borderBottom: `1px solid ${c.line}` }}>
              Sign in now →
            </Link>
          </motion.div>
        ) : sessionError ? (
          <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, ease: EASE }}>
            <AuthEyebrow tone="alert">Link invalid</AuthEyebrow>
            <AuthHeading tight>Link expired.</AuthHeading>
            <p style={{ fontSize: 16, color: c.body, lineHeight: 1.7, margin: "0 0 28px", letterSpacing: "-0.005em" }}>
              {sessionError} Reset links are single-use and expire after an hour.
            </p>
            <Link
              href={forgotHref}
              style={{
                display: "inline-flex",
                alignItems: "center",
                padding: "13px 22px",
                backgroundColor: c.ink,
                color: c.paper,
                borderRadius: 8,
                textDecoration: "none",
                fontSize: 15,
                fontWeight: 550,
                letterSpacing: "-0.008em",
              }}
            >
              Request a new link
            </Link>
          </motion.div>
        ) : !ready ? (
          <div style={{ display: "flex", alignItems: "center", gap: 10, color: c.quiet }}>
            <Loader2 size={16} style={{ animation: "spin 1s linear infinite" }} />
            <span style={{ fontSize: 15 }}>Verifying reset link…</span>
          </div>
        ) : (
          <>
            <AuthEyebrow>New password</AuthEyebrow>
            <AuthHeading>Choose a new password.</AuthHeading>

            {error && (
              <div style={{ marginBottom: 20, padding: "13px 15px", backgroundColor: "#F9DDDD", borderRadius: 8, border: "1px solid #F0C0C0" }}>
                <p style={{ margin: 0, fontSize: 14.5, color: "#B85C5C", letterSpacing: "-0.003em" }}>{error}</p>
              </div>
            )}

            <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 20 }}>
              <div>
                <FieldLabel htmlFor="password">New password</FieldLabel>
                <div style={{ position: "relative" }}>
                  <input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    placeholder="Min. 8 characters"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    onFocus={authFocusInput}
                    onBlur={authBlurInput}
                    style={{ ...authInputBase, paddingRight: 44 }}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((v) => !v)}
                    aria-label={showPassword ? "Hide password" : "Show password"}
                    style={{ position: "absolute", right: 12, top: "50%", transform: "translateY(-50%)", background: "none", border: "none", cursor: "pointer", color: c.quiet, padding: 2, display: "flex", alignItems: "center" }}
                  >
                    {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>

                {passwordStrength && (
                  <div style={{ marginTop: 8 }}>
                    <div style={{ height: 3, backgroundColor: "#F0EDE8", borderRadius: 99, overflow: "hidden" }}>
                      <div style={{ height: "100%", width: passwordStrength.width, backgroundColor: passwordStrength.color, borderRadius: 99, transition: "width 0.3s ease, background-color 0.3s ease" }} />
                    </div>
                    <p style={{ margin: "5px 0 0", fontSize: 13, color: passwordStrength.color, fontWeight: 550 }}>
                      {passwordStrength.label}
                    </p>
                  </div>
                )}
              </div>

              <div>
                <FieldLabel htmlFor="confirm">Confirm password</FieldLabel>
                <div style={{ position: "relative" }}>
                  <input
                    id="confirm"
                    type={showConfirm ? "text" : "password"}
                    placeholder="Repeat your password"
                    value={confirm}
                    onChange={(e) => setConfirm(e.target.value)}
                    required
                    onFocus={authFocusInput}
                    onBlur={authBlurInput}
                    style={{
                      ...authInputBase,
                      paddingRight: 44,
                      borderColor: confirm && confirm !== password ? "#B85C5C" : confirm && confirm === password ? c.verified : c.line,
                    }}
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirm((v) => !v)}
                    aria-label={showConfirm ? "Hide password" : "Show password"}
                    style={{ position: "absolute", right: 12, top: "50%", transform: "translateY(-50%)", background: "none", border: "none", cursor: "pointer", color: c.quiet, padding: 2, display: "flex", alignItems: "center" }}
                  >
                    {showConfirm ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
                {confirm && confirm !== password && (
                  <p style={{ margin: "6px 0 0", fontSize: 13.5, color: "#B85C5C", letterSpacing: "-0.003em" }}>Passwords don&apos;t match</p>
                )}
              </div>

              <AuthSubmitButton loading={loading} disabled={password !== confirm || password.length < 8}>
                {loading && <Loader2 size={14} style={{ animation: "spin 1s linear infinite" }} />}
                {loading ? "Updating…" : "Set new password"}
              </AuthSubmitButton>
            </form>
          </>
        )}
      </AuthRightPanel>

      <style>{authResponsiveCss}</style>
    </div>
  );
}
