"use client";

import { Wordmark } from "@/components/ui/Wordmark";
import { useState } from "react";
import Link from "next/link";
import { toast } from "sonner";
import { Loader2, ArrowLeft } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";

const EASE = [0.16, 1, 0.3, 1] as const;

const INDUSTRIES = [
  { value: "fashion", label: "Fashion", sub: "Garments, accessories, leather goods" },
  { value: "arts", label: "Arts", sub: "Original works, editions, sculpture" },
  { value: "collectibles", label: "Collectibles", sub: "Watches, sneakers, jewellery" },
];

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

export default function RegisterForm() {
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);
  const [form, setForm] = useState({ name: "", email: "", password: "", industry: "", contact_name: "", contact_phone: "" });

  function set(field: string, value: string) {
    setForm((f) => ({ ...f, [field]: value }));
  }

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
    if (!form.industry) { toast.error("Please select your industry."); return; }
    setLoading(true);
    const res = await fetch("/api/auth/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    const json = await res.json();
    if (!res.ok) { toast.error(json.error ?? "Registration failed."); setLoading(false); return; }
    setDone(true);
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
        <div style={{ position: "absolute", top: 0, left: "50%", transform: "translateX(-50%)", width: 500, height: 360, background: "radial-gradient(ellipse at 50% 0%, rgba(184,148,93,0.11) 0%, transparent 70%)", pointerEvents: "none" }} />

        <div style={{ display: "flex", alignItems: "center", gap: 6, position: "relative" }}>
          <span style={{ width: 6, height: 6, borderRadius: "50%", backgroundColor: "#B8945D", display: "inline-block" }} />
          <Wordmark tone="light" height={20} />
        </div>

        <div style={{ position: "relative" }}>
          <p style={{ fontFamily: "var(--font-mono)", fontSize: 9, color: "#D4B68A", letterSpacing: "0.12em", textTransform: "uppercase", marginBottom: 20 }}>
            Founding Partners
          </p>
          <h2
            style={{
              fontFamily: "var(--font-display)",
              fontSize: "clamp(26px, 2.6vw, 38px)",
              fontWeight: 400,
              fontStyle: "italic",
              color: "#FAFAF8",
              letterSpacing: "-0.025em",
              lineHeight: 1.2,
              margin: "0 0 32px",
            }}
          >
            Give every piece<br />you make a{" "}
            <em style={{ color: "#C9A66B" }}>permanent<br />digital identity.</em>
          </h2>

          <div style={{ display: "flex", flexDirection: "column", gap: 12, marginBottom: 40 }}>
            {[
              ["Tag & card authentication", "Cryptographically signed, tamper-evident"],
              ["Ownership ledger", "Append-only, permanent provenance"],
              ["AI voice persona", "Your brand speaks for itself"],
              ["EU DPP compliant", "Ready for 2026–2030 mandates"],
            ].map(([title, sub]) => (
              <div key={title} style={{ display: "flex", gap: 12, alignItems: "flex-start" }}>
                <span style={{ width: 4, height: 4, borderRadius: "50%", backgroundColor: "#B8945D", flexShrink: 0, marginTop: 6, opacity: 0.8 }} />
                <div>
                  <p style={{ margin: 0, fontSize: 12, fontWeight: 500, color: "#9E9EA3", letterSpacing: "-0.005em" }}>{title}</p>
                  <p style={{ margin: 0, fontFamily: "var(--font-mono)", fontSize: 10, color: "#3A3A3F", letterSpacing: "0.02em" }}>{sub}</p>
                </div>
              </div>
            ))}
          </div>

          <div style={{ padding: "16px 0", borderTop: "1px solid rgba(212,182,138,0.1)" }}>
            <p style={{ margin: 0, fontFamily: "var(--font-mono)", fontSize: 10, color: "#4A4A4F", letterSpacing: "0.04em" }}>
              APPLICATIONS REVIEWED WITHIN 24 HOURS
            </p>
          </div>
        </div>

        <p style={{ fontFamily: "var(--font-mono)", fontSize: 9, color: "#2E2A1E", letterSpacing: "0.08em", textTransform: "uppercase", position: "relative" }}>
          © {new Date().getFullYear()} Tagit · Identity infrastructure for luxury
        </p>
      </div>

      {/* ── Right panel ── */}
      <div style={{ flex: 1, display: "flex", flexDirection: "column", justifyContent: "center", padding: "48px clamp(24px, 6vw, 80px)", overflowY: "auto" }}>

        <div style={{ marginBottom: 40 }}>
          <Link href="/" style={{ display: "inline-flex", alignItems: "center", gap: 6, fontSize: 13, color: "#9E9EA3", textDecoration: "none", letterSpacing: "-0.005em" }}>
            <ArrowLeft size={13} />
            Back to site
          </Link>
        </div>

        <AnimatePresence mode="wait">
          {done ? (
            /* ── Success state ── */
            <motion.div
              key="success"
              initial={{ opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, ease: EASE }}
              style={{ maxWidth: 420, width: "100%" }}
            >
              {/* Gold check */}
              <motion.div
                initial={{ scale: 0.7, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ duration: 0.5, ease: EASE, delay: 0.1 }}
                style={{ marginBottom: 28 }}
              >
                <svg width="48" height="48" viewBox="0 0 48 48" fill="none">
                  <circle cx="24" cy="24" r="22" stroke="#B8945D" strokeWidth="1.5" />
                  <motion.path
                    d="M 14 24 L 21 31 L 34 17"
                    stroke="#B8945D"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    initial={{ pathLength: 0 }}
                    animate={{ pathLength: 1 }}
                    transition={{ duration: 0.6, ease: "easeOut", delay: 0.3 }}
                  />
                </svg>
              </motion.div>

              <p style={{ fontFamily: "var(--font-mono)", fontSize: 10, color: "#B8945D", letterSpacing: "0.12em", textTransform: "uppercase", marginBottom: 10 }}>
                Application submitted
              </p>
              <h1
                style={{
                  fontFamily: "var(--font-display)",
                  fontSize: "clamp(26px, 3vw, 36px)",
                  fontWeight: 400,
                  fontStyle: "italic",
                  color: "#0A0A0B",
                  letterSpacing: "-0.025em",
                  lineHeight: 1.15,
                  margin: "0 0 16px",
                }}
              >
                You&apos;re in the queue.
              </h1>
              <p style={{ fontSize: 14, color: "#6E6E73", lineHeight: 1.7, margin: "0 0 32px", letterSpacing: "-0.005em" }}>
                We&apos;ve received the application for <strong style={{ color: "#1F1F22", fontWeight: 550 }}>{form.name}</strong>.
                Our team will review it and be in touch at{" "}
                <strong style={{ color: "#1F1F22", fontWeight: 550 }}>{form.email}</strong> within 24 hours.
              </p>
              <Link
                href="/auth/login"
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 6,
                  padding: "12px 22px",
                  backgroundColor: "#0A0A0B",
                  color: "#FAFAF8",
                  borderRadius: 8,
                  textDecoration: "none",
                  fontWeight: 550,
                  fontSize: 13,
                  letterSpacing: "-0.005em",
                }}
              >
                Go to sign in
              </Link>
            </motion.div>
          ) : (
            /* ── Application form ── */
            <motion.div
              key="form"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, ease: EASE }}
              style={{ maxWidth: 460, width: "100%" }}
            >
              {/* Mobile logo */}
              <div style={{ display: "flex", alignItems: "center", gap: 5, marginBottom: 32 }} className="lg:hidden">
                <span style={{ width: 5, height: 5, borderRadius: "50%", backgroundColor: "#B8945D", display: "inline-block" }} />
                <Wordmark tone="ink" height={18} />
              </div>

              <p style={{ fontFamily: "var(--font-mono)", fontSize: 10, color: "#B8945D", letterSpacing: "0.12em", textTransform: "uppercase", marginBottom: 10 }}>
                Brand application
              </p>
              <h1
                style={{
                  fontFamily: "var(--font-display)",
                  fontSize: "clamp(26px, 3vw, 36px)",
                  fontWeight: 400,
                  color: "#0A0A0B",
                  letterSpacing: "-0.025em",
                  lineHeight: 1.1,
                  margin: "0 0 6px",
                }}
              >
                Apply to join Tagit.
              </h1>
              <p style={{ fontSize: 13, color: "#9E9EA3", margin: "0 0 36px", letterSpacing: "-0.003em" }}>
                We review every application. Not all brands are accepted.
              </p>

              <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 22 }}>

                {/* Brand name */}
                <div>
                  <label style={{ display: "block", fontSize: 12, fontWeight: 500, color: "#4A4A4F", marginBottom: 8, letterSpacing: "-0.003em" }}>
                    Brand / company name
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Maison Lagos"
                    value={form.name}
                    onChange={(e) => set("name", e.target.value)}
                    required
                    onFocus={focusInput}
                    onBlur={blurInput}
                    style={inputBase}
                  />
                </div>

                {/* Contact name */}
                <div>
                  <label style={{ display: "block", fontSize: 12, fontWeight: 500, color: "#4A4A4F", marginBottom: 8, letterSpacing: "-0.003em" }}>
                    Your full name
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Amara Okonkwo"
                    value={form.contact_name}
                    onChange={(e) => set("contact_name", e.target.value)}
                    required
                    onFocus={focusInput}
                    onBlur={blurInput}
                    style={inputBase}
                  />
                </div>

                {/* Email */}
                <div>
                  <label style={{ display: "block", fontSize: 12, fontWeight: 500, color: "#4A4A4F", marginBottom: 8, letterSpacing: "-0.003em" }}>
                    Business email
                  </label>
                  <input
                    type="email"
                    placeholder="hello@yourbrand.com"
                    value={form.email}
                    onChange={(e) => set("email", e.target.value)}
                    required
                    onFocus={focusInput}
                    onBlur={blurInput}
                    style={inputBase}
                  />
                </div>

                {/* Phone */}
                <div>
                  <label style={{ display: "block", fontSize: 12, fontWeight: 500, color: "#4A4A4F", marginBottom: 8, letterSpacing: "-0.003em" }}>
                    Phone / WhatsApp <span style={{ color: "#C7C7CC", fontWeight: 400 }}>(optional)</span>
                  </label>
                  <input
                    type="tel"
                    placeholder="+234 800 000 0000"
                    value={form.contact_phone}
                    onChange={(e) => set("contact_phone", e.target.value)}
                    onFocus={focusInput}
                    onBlur={blurInput}
                    style={inputBase}
                  />
                </div>

                {/* Industry — clickable cards */}
                <div>
                  <label style={{ display: "block", fontSize: 12, fontWeight: 500, color: "#4A4A4F", marginBottom: 10, letterSpacing: "-0.003em" }}>
                    Industry
                  </label>
                  <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 8 }}>
                    {INDUSTRIES.map((ind) => {
                      const selected = form.industry === ind.value;
                      return (
                        <button
                          key={ind.value}
                          type="button"
                          onClick={() => set("industry", ind.value)}
                          style={{
                            padding: "12px 10px",
                            border: `1px solid ${selected ? "#B8945D" : "#E8E2D5"}`,
                            borderRadius: 8,
                            backgroundColor: selected ? "#EDDFC0" : "#fff",
                            cursor: "pointer",
                            textAlign: "left",
                            transition: "border-color 0.15s, background-color 0.15s",
                            fontFamily: "inherit",
                          }}
                        >
                          <p style={{ margin: "0 0 3px", fontSize: 12, fontWeight: 550, color: selected ? "#6B4C1E" : "#1F1F22", letterSpacing: "-0.005em" }}>
                            {ind.label}
                          </p>
                          <p style={{ margin: 0, fontSize: 10, color: selected ? "#8B6F3F" : "#9E9EA3", lineHeight: 1.4 }}>
                            {ind.sub}
                          </p>
                        </button>
                      );
                    })}
                  </div>
                  <p style={{ margin: "8px 0 0", fontFamily: "var(--font-mono)", fontSize: 9, color: "#C7C7CC", letterSpacing: "0.06em" }}>
                    RESTAURANTS & HOTELS — COMING SOON
                  </p>
                </div>

                {/* Password */}
                <div>
                  <label style={{ display: "block", fontSize: 12, fontWeight: 500, color: "#4A4A4F", marginBottom: 8, letterSpacing: "-0.003em" }}>
                    Password
                  </label>
                  <input
                    type="password"
                    placeholder="Minimum 8 characters"
                    value={form.password}
                    onChange={(e) => set("password", e.target.value)}
                    required
                    minLength={8}
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
                    marginTop: 2,
                  }}
                >
                  {loading && <Loader2 size={14} style={{ animation: "spin 1s linear infinite" }} />}
                  {loading ? "Submitting application…" : "Submit application"}
                </button>
                <p style={{ marginTop: 14, fontSize: 12, color: "#9E9EA3", lineHeight: 1.6, textAlign: "center", letterSpacing: "-0.003em" }}>
                  By submitting, you agree to Tagit&apos;s{" "}
                  <Link href="/terms" target="_blank" style={{ color: "#4A4A4F", borderBottom: "1px solid #E8E2D5", textDecoration: "none" }}>Terms of Service</Link>{" "}
                  and{" "}
                  <Link href="/privacy" target="_blank" style={{ color: "#4A4A4F", borderBottom: "1px solid #E8E2D5", textDecoration: "none" }}>Privacy Policy</Link>.
                </p>
              </form>

              <p style={{ marginTop: 24, fontSize: 13, color: "#9E9EA3", letterSpacing: "-0.003em" }}>
                Already approved?{" "}
                <Link href="/auth/login" style={{ color: "#4A4A4F", textDecoration: "none", borderBottom: "1px solid #E8E2D5" }}>
                  Sign in →
                </Link>
              </p>
            </motion.div>
          )}
        </AnimatePresence>
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
