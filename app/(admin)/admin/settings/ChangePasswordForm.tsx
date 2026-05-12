"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { Loader2, Eye, EyeOff, CheckCircle2 } from "lucide-react";

const inputBase: React.CSSProperties = {
  width: "100%",
  border: "1px solid #E8E2D5",
  borderRadius: 8,
  padding: "11px 14px",
  fontSize: 14,
  color: "#0A0A0B",
  backgroundColor: "#fff",
  outline: "none",
  fontFamily: "inherit",
  letterSpacing: "-0.005em",
  transition: "border-color 0.2s, box-shadow 0.2s",
};

function strength(pw: string): { label: string; color: string; pct: number } {
  if (pw.length === 0) return { label: "", color: "#E8E2D5", pct: 0 };
  if (pw.length < 8)   return { label: "Too short", color: "#EF4444", pct: 25 };
  const score = [/[A-Z]/, /[0-9]/, /[^A-Za-z0-9]/].filter((r) => r.test(pw)).length;
  if (score === 0) return { label: "Fair",   color: "#F59E0B", pct: 50 };
  if (score === 1) return { label: "Good",   color: "#22C55E", pct: 75 };
  return              { label: "Strong", color: "#16A34A", pct: 100 };
}

export default function ChangePasswordForm() {
  const [newPassword, setNewPassword] = useState("");
  const [confirm, setConfirm]         = useState("");
  const [showNew, setShowNew]         = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [loading, setLoading]         = useState(false);
  const [error, setError]             = useState("");
  const [done, setDone]               = useState(false);

  const pw = strength(newPassword);
  const mismatch = confirm.length > 0 && confirm !== newPassword;

  function focusInput(e: React.FocusEvent<HTMLInputElement>) {
    e.currentTarget.style.borderColor = "#B8945D";
    e.currentTarget.style.boxShadow   = "0 0 0 3px rgba(184,148,93,0.12)";
  }
  function blurInput(e: React.FocusEvent<HTMLInputElement>) {
    e.currentTarget.style.borderColor = "#E8E2D5";
    e.currentTarget.style.boxShadow   = "none";
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (newPassword !== confirm) { setError("Passwords do not match."); return; }
    if (newPassword.length < 8)  { setError("Password must be at least 8 characters."); return; }
    setError("");
    setLoading(true);

    const supabase = createClient();
    const { error: err } = await supabase.auth.updateUser({ password: newPassword });
    setLoading(false);

    if (err) { setError(err.message); return; }
    setDone(true);
    setNewPassword("");
    setConfirm("");
  }

  if (done) {
    return (
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 12, padding: "40px 0", textAlign: "center" }}>
        <div style={{ width: 48, height: 48, borderRadius: "50%", backgroundColor: "#DCEEE3", display: "flex", alignItems: "center", justifyContent: "center" }}>
          <CheckCircle2 size={22} color="#2D6A4F" />
        </div>
        <p style={{ fontSize: 16, fontWeight: 550, color: "var(--color-charcoal)", letterSpacing: "-0.01em" }}>Password updated</p>
        <p style={{ fontSize: 13, color: "var(--color-slate)" }}>Your new password is active.</p>
        <button
          onClick={() => setDone(false)}
          style={{ marginTop: 8, fontSize: 13, color: "var(--color-slate)", background: "none", border: "none", cursor: "pointer", textDecoration: "underline", textUnderlineOffset: 3 }}
        >
          Change again
        </button>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 20, maxWidth: 400 }}>
      {error && (
        <div style={{ padding: "11px 14px", backgroundColor: "#F9DDDD", borderRadius: 8, border: "1px solid #F0C0C0" }}>
          <p style={{ margin: 0, fontSize: 13, color: "#B85C5C" }}>{error}</p>
        </div>
      )}

      {/* New password */}
      <div>
        <label style={{ display: "block", fontSize: 12, fontWeight: 500, color: "#4A4A4F", marginBottom: 8, letterSpacing: "-0.003em" }}>
          New password
        </label>
        <div style={{ position: "relative" }}>
          <input
            type={showNew ? "text" : "password"}
            placeholder="Min. 8 characters"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            required
            onFocus={focusInput}
            onBlur={blurInput}
            style={{ ...inputBase, paddingRight: 42 }}
          />
          <button
            type="button"
            onClick={() => setShowNew((v) => !v)}
            style={{ position: "absolute", right: 12, top: "50%", transform: "translateY(-50%)", background: "none", border: "none", cursor: "pointer", padding: 0, color: "#9E9EA3", display: "flex" }}
          >
            {showNew ? <EyeOff size={16} /> : <Eye size={16} />}
          </button>
        </div>
        {newPassword.length > 0 && (
          <div style={{ marginTop: 8 }}>
            <div style={{ height: 3, borderRadius: 99, backgroundColor: "#F0EDE8", overflow: "hidden" }}>
              <div style={{ height: "100%", width: `${pw.pct}%`, backgroundColor: pw.color, borderRadius: 99, transition: "width 0.3s, background-color 0.3s" }} />
            </div>
            <p style={{ marginTop: 5, fontSize: 11, color: pw.color, letterSpacing: "-0.003em" }}>{pw.label}</p>
          </div>
        )}
      </div>

      {/* Confirm password */}
      <div>
        <label style={{ display: "block", fontSize: 12, fontWeight: 500, color: "#4A4A4F", marginBottom: 8, letterSpacing: "-0.003em" }}>
          Confirm password
        </label>
        <div style={{ position: "relative" }}>
          <input
            type={showConfirm ? "text" : "password"}
            placeholder="Re-enter new password"
            value={confirm}
            onChange={(e) => setConfirm(e.target.value)}
            required
            onFocus={focusInput}
            onBlur={(e) => {
              e.currentTarget.style.borderColor = mismatch ? "#EF4444" : "#E8E2D5";
              e.currentTarget.style.boxShadow   = "none";
            }}
            style={{ ...inputBase, paddingRight: 42, borderColor: mismatch ? "#EF4444" : undefined }}
          />
          <button
            type="button"
            onClick={() => setShowConfirm((v) => !v)}
            style={{ position: "absolute", right: 12, top: "50%", transform: "translateY(-50%)", background: "none", border: "none", cursor: "pointer", padding: 0, color: "#9E9EA3", display: "flex" }}
          >
            {showConfirm ? <EyeOff size={16} /> : <Eye size={16} />}
          </button>
        </div>
        {mismatch && <p style={{ marginTop: 5, fontSize: 11, color: "#EF4444" }}>Passwords don&apos;t match</p>}
      </div>

      <button
        type="submit"
        disabled={loading}
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          gap: 8,
          padding: "12px 24px",
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
        {loading ? "Updating…" : "Update password"}
      </button>

      <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
    </form>
  );
}
