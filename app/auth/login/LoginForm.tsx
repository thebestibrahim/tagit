"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { toast } from "sonner";
import { Loader2, ArrowLeft } from "lucide-react";
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

export default function LoginForm() {
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  function focusInput(e: React.FocusEvent<HTMLInputElement>) {
    e.currentTarget.style.borderColor = "#B8945D";
    e.currentTarget.style.boxShadow = "0 0 0 3px rgba(184,148,93,0.12)";
  }
  function blurInput(e: React.FocusEvent<HTMLInputElement>) {
    e.currentTarget.style.borderColor = "#E8E2D5";
    e.currentTarget.style.boxShadow = "none";
  }

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    const supabase = createClient();
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });

    if (error) {
      // Generic message — don't reveal whether the email exists or is confirmed.
      toast.error("Invalid email or password.");
      setLoading(false);
      return;
    }

    // This is the brand partner portal — companies only. Staff sign in elsewhere.
    const role = data.user?.app_metadata?.role;
    if (role === "company") {
      router.push("/dashboard");
    } else {
      await supabase.auth.signOut();
      toast.error("Invalid email or password.");
      setLoading(false);
      return;
    }
    setLoading(false);
  }

  return (
    <div style={{ minHeight: "100vh", display: "flex", backgroundColor: "#FAFAF8" }}>

      {/* ── Left panel — dark editorial ── */}
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
        {/* Radial glow */}
        <div style={{ position: "absolute", top: 0, left: "50%", transform: "translateX(-50%)", width: 500, height: 360, background: "radial-gradient(ellipse at 50% 0%, rgba(184,148,93,0.11) 0%, transparent 70%)", pointerEvents: "none" }} />

        {/* Logo */}
        <div style={{ display: "flex", alignItems: "center", gap: 6, position: "relative" }}>
          <span style={{ width: 6, height: 6, borderRadius: "50%", backgroundColor: "#B8945D", display: "inline-block" }} />
          <span style={{ fontFamily: "var(--font-display)", fontSize: 20, fontStyle: "italic", color: "#FAFAF8", letterSpacing: "-0.02em" }}>Tagit</span>
        </div>

        {/* Quote */}
        <div style={{ position: "relative" }}>
          <p style={{ fontFamily: "var(--font-mono)", fontSize: 9, color: "#D4B68A", letterSpacing: "0.12em", textTransform: "uppercase", marginBottom: 24 }}>
            Brand Partner Portal
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
            Where your craft<br />
            <em style={{ color: "#C9A66B" }}>continues to live</em><br />
            long after it leaves<br />your hands.
          </h2>

          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {[
              "Cryptographic authentication",
              "Permanent ownership ledger",
              "AI voice persona",
              "EU DPP compliant infrastructure",
            ].map((item) => (
              <div key={item} style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <span style={{ width: 4, height: 4, borderRadius: "50%", backgroundColor: "#B8945D", opacity: 0.7, flexShrink: 0 }} />
                <span style={{ fontFamily: "var(--font-mono)", fontSize: 11, color: "#4A4A4F", letterSpacing: "0.03em" }}>{item}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Footer */}
        <p style={{ fontFamily: "var(--font-mono)", fontSize: 9, color: "#2E2A1E", letterSpacing: "0.08em", textTransform: "uppercase", position: "relative" }}>
          © {new Date().getFullYear()} Tagit · Identity infrastructure for luxury
        </p>
      </div>

      {/* ── Right panel — form ── */}
      <div style={{ flex: 1, display: "flex", flexDirection: "column", justifyContent: "center", padding: "48px clamp(24px, 6vw, 96px)" }}>

        {/* Back link */}
        <div style={{ marginBottom: 48 }}>
          <Link
            href="/"
            style={{ display: "inline-flex", alignItems: "center", gap: 6, fontSize: 13, color: "#9E9EA3", textDecoration: "none", letterSpacing: "-0.005em" }}
          >
            <ArrowLeft size={13} />
            Back to site
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

          <p style={{ fontFamily: "var(--font-mono)", fontSize: 10, color: "#B8945D", letterSpacing: "0.12em", textTransform: "uppercase", marginBottom: 10 }}>
            Sign in
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
            Welcome back.
          </h1>

          <form onSubmit={handleLogin} style={{ display: "flex", flexDirection: "column", gap: 20 }}>
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

            <div>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 8 }}>
                <label htmlFor="password" style={{ display: "block", fontSize: 12, fontWeight: 500, color: "#4A4A4F", letterSpacing: "-0.003em" }}>
                  Password
                </label>
                <Link href="/auth/forgot-password" style={{ fontSize: 12, color: "#9E9EA3", textDecoration: "none", letterSpacing: "-0.003em" }}>
                  Forgot password?
                </Link>
              </div>
              <input
                id="password"
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
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
                marginTop: 4,
                fontFamily: "inherit",
              }}
            >
              {loading && <Loader2 size={14} style={{ animation: "spin 1s linear infinite" }} />}
              {loading ? "Signing in…" : "Sign in"}
            </button>
          </form>

          <p style={{ marginTop: 24, fontSize: 13, color: "#9E9EA3", letterSpacing: "-0.003em" }}>
            New brand partner?{" "}
            <Link href="/auth/register" style={{ color: "#4A4A4F", textDecoration: "none", borderBottom: "1px solid #E8E2D5" }}>
              Apply for access →
            </Link>
          </p>
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
