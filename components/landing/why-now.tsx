"use client";
import { motion } from "motion/react";

export default function WhyNow() {
  return (
    <section className="lp-section-padding" style={{ padding: "112px 32px", backgroundColor: "#FAFAF8", borderTop: "1px solid #E8E2D5" }}>
      <div className="whynow-grid" style={{ maxWidth: 1120, margin: "0 auto", display: "grid", gridTemplateColumns: "1fr 1fr", gap: 96, alignItems: "center" }}>
        <motion.div
          initial={{ opacity: 0, y: 28 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-80px" }}
          transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
        >
          <p style={{ margin: "0 0 14px", fontFamily: "var(--font-mono)", fontSize: 10, color: "#B8945D", letterSpacing: "0.12em", textTransform: "uppercase" }}>
            Why This Matters Now
          </p>
          <h2
            style={{
              fontFamily: "var(--font-display)",
              fontSize: "clamp(32px, 3.8vw, 52px)",
              fontWeight: 400,
              color: "#0A0A0B",
              letterSpacing: "-0.03em",
              lineHeight: 1.08,
              margin: 0,
            }}
          >
            The industry is{" "}
            <em style={{ fontStyle: "italic", color: "#8B6F3F" }}>changing.</em>{" "}
            Quietly, then all at once.
          </h2>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 28 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-80px" }}
          transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1], delay: 0.12 }}
        >
          <p
            style={{
              fontSize: 15,
              color: "#4A4A4F",
              lineHeight: 1.75,
              margin: "0 0 24px",
              letterSpacing: "-0.005em",
            }}
          >
            Between 2026 and 2030, the European Union will require every luxury product sold
            in its market to carry a verifiable digital identity.{" "}
            <strong style={{ color: "#1F1F22", fontWeight: 550 }}>
              Brands without this infrastructure will lose access to the world&apos;s largest luxury market.
            </strong>{" "}
            Tagit is built to be that infrastructure — and to give you everything else that comes with it.
          </p>

          {/* Timeline */}
          <div style={{ display: "flex", flexDirection: "column", gap: 0 }}>
            {[
              { year: "2026", label: "EU DPP pilot begins — textiles and fashion" },
              { year: "2028", label: "Expanded to electronics and batteries" },
              { year: "2030", label: "Full mandate — all applicable product categories" },
            ].map((item, i) => (
              <motion.div
                key={item.year}
                initial={{ opacity: 0, x: 16 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true, margin: "-40px" }}
                transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1], delay: 0.2 + i * 0.08 }}
                style={{
                  display: "flex",
                  gap: 20,
                  padding: "14px 0",
                  borderBottom: i < 2 ? "1px solid #F0EDE8" : "none",
                  alignItems: "center",
                }}
              >
                <span
                  style={{
                    fontFamily: "var(--font-mono)",
                    fontSize: 12,
                    color: "#B8945D",
                    letterSpacing: "0.04em",
                    width: 40,
                    flexShrink: 0,
                    fontWeight: 500,
                  }}
                >
                  {item.year}
                </span>
                <span style={{ fontSize: 13, color: "#6E6E73", letterSpacing: "-0.003em" }}>{item.label}</span>
              </motion.div>
            ))}
          </div>
        </motion.div>
      </div>
    </section>
  );
}
