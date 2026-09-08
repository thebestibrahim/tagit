"use client";

import { useState } from "react";
import Link from "next/link";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
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

const INDUSTRIES = [
  { value: "fashion", label: "Fashion", sub: "Garments, accessories, leather goods" },
  { value: "arts", label: "Arts", sub: "Original works, editions, sculpture" },
  { value: "collectibles", label: "Collectibles", sub: "Watches, sneakers, jewellery" },
];

export default function RegisterForm() {
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);
  const [form, setForm] = useState({ name: "", email: "", password: "", industry: "", contact_name: "", contact_phone: "" });

  function set(field: string, value: string) {
    setForm((f) => ({ ...f, [field]: value }));
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
    <div style={authOuter}>
      <AuthLeftPanel
        eyebrow="Founding partners"
        heading={
          <>
            Give every piece you make a{" "}
            <em style={{ fontStyle: "italic", color: c.champagne }}>permanent digital identity.</em>
          </>
        }
        features={[
          "Tag and card authentication",
          "A permanent, append-only ownership ledger",
          "An AI voice persona that speaks for your brand",
          "Built for the EU DPP mandate, 2026–2030",
        ]}
        note="Applications are reviewed within 24 hours."
      />

      <AuthRightPanel backHref="/" backLabel="Back to site" wide>
        <AnimatePresence mode="wait">
          {done ? (
            <motion.div
              key="success"
              initial={{ opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, ease: EASE }}
            >
              <motion.div
                initial={{ scale: 0.7, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ duration: 0.5, ease: EASE, delay: 0.1 }}
                style={{ marginBottom: 28 }}
              >
                <svg width="48" height="48" viewBox="0 0 48 48" fill="none" aria-hidden="true">
                  <circle cx="24" cy="24" r="22" stroke={c.gold} strokeWidth="1.5" />
                  <motion.path
                    d="M 14 24 L 21 31 L 34 17"
                    stroke={c.gold}
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    initial={{ pathLength: 0 }}
                    animate={{ pathLength: 1 }}
                    transition={{ duration: 0.6, ease: "easeOut", delay: 0.3 }}
                  />
                </svg>
              </motion.div>

              <AuthEyebrow>Application submitted</AuthEyebrow>
              <AuthHeading tight>You&apos;re in the queue.</AuthHeading>
              <p style={{ fontSize: 16, color: c.body, lineHeight: 1.7, margin: "0 0 32px", letterSpacing: "-0.005em" }}>
                We&apos;ve received the application for <strong style={{ color: c.inkSoft, fontWeight: 550 }}>{form.name}</strong>.
                Our team will review it and reach out at{" "}
                <strong style={{ color: c.inkSoft, fontWeight: 550 }}>{form.email}</strong> within 24 hours.
              </p>
              <Link
                href="/auth/login"
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 6,
                  padding: "13px 24px",
                  backgroundColor: c.ink,
                  color: c.paper,
                  borderRadius: 8,
                  textDecoration: "none",
                  fontWeight: 550,
                  fontSize: 15,
                  letterSpacing: "-0.005em",
                }}
              >
                Go to sign in
              </Link>
            </motion.div>
          ) : (
            <motion.div
              key="form"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, ease: EASE }}
            >
              <AuthEyebrow>Brand application</AuthEyebrow>
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
                Apply to join Tagit.
              </h1>
              <p style={{ fontSize: 16, color: c.quiet, margin: "0 0 36px", letterSpacing: "-0.005em" }}>
                We review every application. Not every brand is accepted.
              </p>

              <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 22 }}>
                <div>
                  <FieldLabel htmlFor="name">Brand or company name</FieldLabel>
                  <input
                    id="name"
                    type="text"
                    placeholder="e.g. Maison Lagos"
                    value={form.name}
                    onChange={(e) => set("name", e.target.value)}
                    required
                    onFocus={authFocusInput}
                    onBlur={authBlurInput}
                    style={authInputBase}
                  />
                </div>

                <div>
                  <FieldLabel htmlFor="contact_name">Your full name</FieldLabel>
                  <input
                    id="contact_name"
                    type="text"
                    placeholder="e.g. Amara Okonkwo"
                    value={form.contact_name}
                    onChange={(e) => set("contact_name", e.target.value)}
                    required
                    onFocus={authFocusInput}
                    onBlur={authBlurInput}
                    style={authInputBase}
                  />
                </div>

                <div>
                  <FieldLabel htmlFor="email">Business email</FieldLabel>
                  <input
                    id="email"
                    type="email"
                    placeholder="hello@yourbrand.com"
                    value={form.email}
                    onChange={(e) => set("email", e.target.value)}
                    required
                    onFocus={authFocusInput}
                    onBlur={authBlurInput}
                    style={authInputBase}
                  />
                </div>

                <div>
                  <FieldLabel htmlFor="contact_phone">
                    Phone or WhatsApp <span style={{ color: c.quiet, fontWeight: 400 }}>(optional)</span>
                  </FieldLabel>
                  <input
                    id="contact_phone"
                    type="tel"
                    placeholder="+234 800 000 0000"
                    value={form.contact_phone}
                    onChange={(e) => set("contact_phone", e.target.value)}
                    onFocus={authFocusInput}
                    onBlur={authBlurInput}
                    style={authInputBase}
                  />
                </div>

                <div>
                  <FieldLabel htmlFor="industry">Industry</FieldLabel>
                  <div id="industry" style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 8 }}>
                    {INDUSTRIES.map((ind) => {
                      const selected = form.industry === ind.value;
                      return (
                        <button
                          key={ind.value}
                          type="button"
                          onClick={() => set("industry", ind.value)}
                          style={{
                            padding: "13px 12px",
                            border: `1px solid ${selected ? c.gold : c.line}`,
                            borderRadius: 8,
                            backgroundColor: selected ? "#EDDFC0" : "#fff",
                            cursor: "pointer",
                            textAlign: "left",
                            transition: "border-color 0.15s, background-color 0.15s",
                            fontFamily: "inherit",
                          }}
                        >
                          <p style={{ margin: "0 0 3px", fontSize: 14, fontWeight: 600, color: selected ? "#6B4C1E" : c.inkSoft, letterSpacing: "-0.005em" }}>
                            {ind.label}
                          </p>
                          <p style={{ margin: 0, fontSize: 13, color: selected ? "#8B6F3F" : c.quiet, lineHeight: 1.4 }}>
                            {ind.sub}
                          </p>
                        </button>
                      );
                    })}
                  </div>
                  <p style={{ margin: "10px 0 0", fontSize: 13, color: c.quiet }}>
                    Restaurants and hotels are coming soon.
                  </p>
                </div>

                <div>
                  <FieldLabel htmlFor="password">Password</FieldLabel>
                  <input
                    id="password"
                    type="password"
                    placeholder="Minimum 8 characters"
                    value={form.password}
                    onChange={(e) => set("password", e.target.value)}
                    required
                    minLength={8}
                    onFocus={authFocusInput}
                    onBlur={authBlurInput}
                    style={authInputBase}
                  />
                </div>

                <AuthSubmitButton loading={loading}>
                  {loading && <Loader2 size={14} style={{ animation: "spin 1s linear infinite" }} />}
                  {loading ? "Submitting application…" : "Submit application"}
                </AuthSubmitButton>

                <p style={{ marginTop: 6, fontSize: 13.5, color: c.quiet, lineHeight: 1.6, textAlign: "center", letterSpacing: "-0.003em" }}>
                  By submitting, you agree to Tagit&apos;s{" "}
                  <Link href="/terms" target="_blank" style={{ color: c.body, borderBottom: `1px solid ${c.line}`, textDecoration: "none" }}>Terms of Service</Link>{" "}
                  and{" "}
                  <Link href="/privacy" target="_blank" style={{ color: c.body, borderBottom: `1px solid ${c.line}`, textDecoration: "none" }}>Privacy Policy</Link>.
                </p>
              </form>

              <p style={{ marginTop: 24, fontSize: 15, color: c.quiet, letterSpacing: "-0.003em" }}>
                Already approved?{" "}
                <Link href="/auth/login" style={{ color: c.body, textDecoration: "none", borderBottom: `1px solid ${c.line}` }}>
                  Sign in →
                </Link>
              </p>
            </motion.div>
          )}
        </AnimatePresence>
      </AuthRightPanel>

      <style>{authResponsiveCss}</style>
    </div>
  );
}
