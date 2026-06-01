"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { toast } from "sonner";
import { Loader2, ShieldCheck } from "lucide-react";

const inputBase: React.CSSProperties = {
  width: "100%",
  border: "1px solid #2A2A2E",
  borderRadius: 8,
  padding: "12px 14px",
  fontSize: 14,
  color: "#FAFAF8",
  backgroundColor: "#141416",
  outline: "none",
  fontFamily: "inherit",
  letterSpacing: "-0.005em",
  transition: "border-color 0.2s, box-shadow 0.2s",
};

export default function AdminSignInForm() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  function focusInput(e: React.FocusEvent<HTMLInputElement>) {
    e.currentTarget.style.borderColor = "#B8945D";
    e.currentTarget.style.boxShadow = "0 0 0 3px rgba(184,148,93,0.15)";
  }
  function blurInput(e: React.FocusEvent<HTMLInputElement>) {
    e.currentTarget.style.borderColor = "#2A2A2E";
    e.currentTarget.style.boxShadow = "none";
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);

    // Same proven client-side path as the brand portal — reliably sets the
    // session cookies. Security comes from the generic error + hard role gate
    // below, the unlinked/noindex URL, and Supabase's native auth rate limits.
    const supabase = createClient();
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });

    if (error || !data.user) {
      toast.error("Invalid credentials.");
      setLoading(false);
      return;
    }

    // Staff portal — admins only. Anything else is torn down immediately,
    // with the same generic message (no account/role enumeration).
    if (data.user.app_metadata?.role !== "tagit_admin") {
      await supabase.auth.signOut();
      toast.error("Invalid credentials.");
      setLoading(false);
      return;
    }

    router.push("/admin");
    router.refresh();
  }

  return (
    <div
      style={{
        minHeight: "100vh",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        backgroundColor: "#0A0A0B",
        padding: "24px",
      }}
    >
      <div style={{ width: "100%", maxWidth: 380 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 28 }}>
          <ShieldCheck size={18} color="#B8945D" />
          <span
            style={{
              fontFamily: "var(--font-mono)",
              fontSize: 11,
              color: "#B8945D",
              letterSpacing: "0.14em",
              textTransform: "uppercase",
            }}
          >
            Tagit · Staff Access
          </span>
        </div>

        <h1
          style={{
            fontFamily: "var(--font-display)",
            fontSize: 30,
            fontWeight: 400,
            color: "#FAFAF8",
            letterSpacing: "-0.025em",
            margin: "0 0 8px",
          }}
        >
          Internal sign in
        </h1>
        <p style={{ fontSize: 13, color: "#6E6E73", margin: "0 0 32px", lineHeight: 1.5 }}>
          Restricted to authorized Tagit personnel. All access is logged.
        </p>

        <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 18 }}>
          <div>
            <label
              htmlFor="email"
              style={{ display: "block", fontSize: 12, fontWeight: 500, color: "#9E9EA3", marginBottom: 8 }}
            >
              Email
            </label>
            <input
              id="email"
              type="email"
              autoComplete="username"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              onFocus={focusInput}
              onBlur={blurInput}
              style={inputBase}
            />
          </div>

          <div>
            <label
              htmlFor="password"
              style={{ display: "block", fontSize: 12, fontWeight: 500, color: "#9E9EA3", marginBottom: 8 }}
            >
              Password
            </label>
            <input
              id="password"
              type="password"
              autoComplete="current-password"
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
              backgroundColor: loading ? "#2A2A2B" : "#B8945D",
              color: "#0A0A0B",
              border: "none",
              borderRadius: 8,
              fontSize: 14,
              fontWeight: 600,
              letterSpacing: "-0.01em",
              cursor: loading ? "not-allowed" : "pointer",
              transition: "background-color 0.2s",
              marginTop: 4,
              fontFamily: "inherit",
            }}
          >
            {loading && <Loader2 size={14} style={{ animation: "spin 1s linear infinite" }} />}
            {loading ? "Verifying…" : "Sign in"}
          </button>
        </form>
      </div>

      <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}
