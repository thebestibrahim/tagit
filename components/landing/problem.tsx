"use client";
import { motion } from "motion/react";

const EASE = [0.16, 1, 0.3, 1] as const;

const PROBLEMS = [
  {
    n: "01",
    title: "You cannot prove what is yours.",
    body: "The moment a piece leaves your atelier, the burden of proving authenticity falls to your customer — and they have no real way to do it. Counterfeits become indistinguishable from your work.",
  },
  {
    n: "02",
    title: "You see nothing after the sale.",
    body: "Where your products go, who owns them, what they're worth on the secondary market — you have zero visibility. The relationship ends the moment money changes hands.",
  },
  {
    n: "03",
    title: "Resale wealth flows past you.",
    body: "Your craftsmanship appreciates over time. Collectors trade your pieces for multiples of retail. None of that value returns to the brand that created it.",
  },
  {
    n: "04",
    title: "Regulation is coming, ready or not.",
    body: "The EU Digital Product Passport will mandate verifiable product identity for everything sold in Europe between 2026 and 2030. Brands without infrastructure will lose access to entire markets.",
  },
];

export default function Problem() {
  return (
    <section className="lp-section-padding" style={{ padding: "128px 32px", backgroundColor: "#FAFAF8" }}>
      <div style={{ maxWidth: 1120, margin: "0 auto" }}>

        {/* Section header */}
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-80px" }}
          transition={{ duration: 0.8, ease: EASE }}
          style={{ marginBottom: 96 }}
        >
          <p style={{ fontFamily: "var(--font-mono)", fontSize: 10, color: "#B8945D", letterSpacing: "0.14em", textTransform: "uppercase", margin: "0 0 16px" }}>
            The Problem Nobody Is Solving
          </p>
          <h2
            style={{
              fontFamily: "var(--font-display)",
              fontSize: "clamp(38px, 5vw, 68px)",
              fontWeight: 400,
              color: "#0A0A0B",
              letterSpacing: "-0.035em",
              lineHeight: 1.0,
              margin: 0,
            }}
          >
            Your craft{" "}
            <em style={{ fontStyle: "italic", color: "#8B6F3F" }}>dies</em>{" "}
            at point of sale.
          </h2>
        </motion.div>

        {/* Editorial problem list */}
        <div style={{ display: "flex", flexDirection: "column" }}>
          {PROBLEMS.map((p, i) => (
            <motion.div
              key={p.n}
              className="problem-row"
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              viewport={{ once: true, margin: "-60px" }}
              transition={{ duration: 0.7, ease: EASE, delay: i * 0.05 }}
              style={{
                display: "grid",
                gridTemplateColumns: "140px 1fr 1fr",
                gap: "0 56px",
                padding: "48px 0",
                borderTop: "1px solid #E8E2D5",
                alignItems: "start",
              }}
            >
              {/* Oversized decorative numeral */}
              <div className="problem-num" style={{ position: "relative" }}>
                <span
                  style={{
                    fontFamily: "var(--font-display)",
                    fontSize: 96,
                    fontStyle: "italic",
                    color: "#F0EDE8",
                    lineHeight: 0.85,
                    letterSpacing: "-0.05em",
                    userSelect: "none",
                    display: "block",
                  }}
                >
                  {p.n}
                </span>
              </div>

              {/* Title */}
              <motion.h3
                initial={{ opacity: 0, x: -16 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true, margin: "-40px" }}
                transition={{ duration: 0.7, ease: EASE, delay: 0.1 + i * 0.05 }}
                style={{
                  fontFamily: "var(--font-display)",
                  fontSize: "clamp(20px, 2vw, 28px)",
                  fontWeight: 400,
                  color: "#1F1F22",
                  letterSpacing: "-0.02em",
                  lineHeight: 1.2,
                  margin: 0,
                  paddingTop: 6,
                }}
              >
                {p.title}
              </motion.h3>

              {/* Body */}
              <motion.p
                initial={{ opacity: 0 }}
                whileInView={{ opacity: 1 }}
                viewport={{ once: true, margin: "-40px" }}
                transition={{ duration: 0.7, ease: EASE, delay: 0.18 + i * 0.05 }}
                style={{
                  fontSize: 14,
                  color: "#6E6E73",
                  lineHeight: 1.75,
                  margin: 0,
                  letterSpacing: "-0.005em",
                  paddingTop: 6,
                }}
              >
                {p.body}
              </motion.p>
            </motion.div>
          ))}

          {/* Bottom rule */}
          <div style={{ borderTop: "1px solid #E8E2D5" }} />
        </div>
      </div>
    </section>
  );
}
