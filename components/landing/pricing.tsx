"use client";
import { motion } from "motion/react";
import Link from "next/link";

const INCLUDED = [
  "NFC tag provisioning & pairing",
  "Product registration & photography",
  "Cryptographic authentication (HMAC)",
  "Ownership tracking & transfer flows",
  "Branded consumer scan pages",
  "AI voice persona",
  "Scan analytics & provenance reports",
  "EU Digital Product Passport compliance",
];

export default function Pricing() {
  return (
    <section
      id="pricing"
      className="lp-section-padding"
      style={{ padding: "112px 32px", backgroundColor: "#FAFAF8", borderTop: "1px solid #E8E2D5" }}
    >
      <div style={{ maxWidth: 900, margin: "0 auto" }}>
        <motion.div
          initial={{ opacity: 0, y: 28 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-80px" }}
          transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
          style={{ textAlign: "center", marginBottom: 56 }}
        >
          <p style={{ margin: "0 0 12px", fontFamily: "var(--font-mono)", fontSize: 10, color: "#B8945D", letterSpacing: "0.12em", textTransform: "uppercase" }}>
            Pricing
          </p>
          <h2
            style={{
              fontFamily: "var(--font-display)",
              fontSize: "clamp(32px, 3.8vw, 50px)",
              fontWeight: 400,
              color: "#0A0A0B",
              letterSpacing: "-0.03em",
              lineHeight: 1.08,
              margin: "0 0 14px",
            }}
          >
            Priced for your{" "}
            <em style={{ fontStyle: "italic", color: "#8B6F3F" }}>catalogue.</em>
          </h2>
          <p style={{ margin: 0, fontSize: 15, color: "#6E6E73", letterSpacing: "-0.005em", maxWidth: 480, marginInline: "auto", lineHeight: 1.65 }}>
            Every brand is different. Pricing is based on catalogue size and tag volume.
            Talk to us and we&apos;ll build the right structure together.
          </p>
        </motion.div>

        {/* Single card */}
        <motion.div
          initial={{ opacity: 0, y: 28 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-60px" }}
          transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
          className="pricing-card"
          style={{
            display: "grid",
            gridTemplateColumns: "1fr 1fr",
            gap: 0,
            backgroundColor: "#fff",
            border: "1px solid #E8E2D5",
            borderRadius: 20,
            overflow: "hidden",
            boxShadow: "0 4px 24px rgba(10,10,11,0.06)",
          }}
        >
          {/* Left — what's included */}
          <div className="pricing-left" style={{ padding: "44px 40px", borderRight: "1px solid #E8E2D5" }}>
            <p style={{ margin: "0 0 24px", fontFamily: "var(--font-mono)", fontSize: 10, color: "#9E9EA3", letterSpacing: "0.1em", textTransform: "uppercase" }}>
              Everything included
            </p>
            <ul style={{ listStyle: "none", padding: 0, margin: 0, display: "flex", flexDirection: "column", gap: 11 }}>
              {INCLUDED.map((item) => (
                <li key={item} style={{ display: "flex", alignItems: "center", gap: 12 }}>
                  <svg width="14" height="14" viewBox="0 0 14 14" fill="none" style={{ flexShrink: 0 }}>
                    <circle cx="7" cy="7" r="6" stroke="#2D6A4F" strokeWidth="1.2" />
                    <path d="M 4 7 L 6.2 9.2 L 10 5" stroke="#2D6A4F" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                  <span style={{ fontSize: 13, color: "#4A4A4F", letterSpacing: "-0.003em" }}>{item}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* Right — CTA */}
          <div
            style={{
              padding: "44px 40px",
              backgroundColor: "#0A0A0B",
              display: "flex",
              flexDirection: "column",
              justifyContent: "center",
              position: "relative",
              overflow: "hidden",
            }}
          >
            {/* Glow */}
            <div
              style={{
                position: "absolute",
                top: 0,
                left: "50%",
                transform: "translateX(-50%)",
                width: 400,
                height: 300,
                background: "radial-gradient(ellipse at 50% 0%, rgba(184,148,93,0.14) 0%, transparent 70%)",
                pointerEvents: "none",
              }}
            />
            <div style={{ position: "relative" }}>
              <p style={{ margin: "0 0 8px", fontFamily: "var(--font-mono)", fontSize: 10, color: "#B8945D", letterSpacing: "0.1em", textTransform: "uppercase" }}>
                Custom pricing
              </p>
              <p
                style={{
                  fontFamily: "var(--font-display)",
                  fontSize: 36,
                  fontStyle: "italic",
                  color: "#FAFAF8",
                  letterSpacing: "-0.025em",
                  lineHeight: 1.15,
                  margin: "0 0 16px",
                }}
              >
                Built around<br />your brand.
              </p>
              <p style={{ fontSize: 13, color: "#71717A", lineHeight: 1.65, margin: "0 0 32px", letterSpacing: "-0.003em" }}>
                No fixed tiers. No per-seat fees. We structure pricing around the number of tags
                you activate — so it scales exactly with your product catalogue.
              </p>
              <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                <Link
                  href="/auth/register"
                  style={{
                    display: "block",
                    textAlign: "center",
                    padding: "12px 20px",
                    borderRadius: 8,
                    fontWeight: 550,
                    fontSize: 13,
                    textDecoration: "none",
                    letterSpacing: "-0.005em",
                    backgroundColor: "#B8945D",
                    color: "#fff",
                  }}
                >
                  Apply for access
                </Link>
                <a
                  href="mailto:info@tagitlux.com"
                  style={{
                    display: "block",
                    textAlign: "center",
                    padding: "12px 20px",
                    borderRadius: 8,
                    fontWeight: 450,
                    fontSize: 13,
                    textDecoration: "none",
                    letterSpacing: "-0.005em",
                    backgroundColor: "transparent",
                    color: "#9E9EA3",
                    border: "1px solid rgba(212,182,138,0.15)",
                  }}
                >
                  Talk to us first
                </a>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
