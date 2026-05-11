"use client";
import { motion } from "motion/react";
import Counter from "./interactive/counter";

const EASE = [0.16, 1, 0.3, 1] as const;

const STATS = [
  { prefix: "$", value: 4.5, suffix: "T", decimals: 1, label: "Annual counterfeit trade globally", sub: "Luxury sector accounts for 60%" },
  { prefix: "$", value: 350, suffix: "B", decimals: 0, label: "Luxury resale market by 2030", sub: "Currently untraceable" },
  { prefix: "", value: 0, suffix: "%", decimals: 0, label: "Revenue brands earn on resale", sub: "Of items they created" },
  { prefix: "", value: 2030, suffix: "", decimals: 0, label: "EU Digital Product Passport", sub: "Full mandate by this year" },
];

export default function Stats() {
  return (
    <section style={{ backgroundColor: "#F5F2EC", borderTop: "1px solid #E8E2D5" }}>
      <div className="stats-inner" style={{ maxWidth: 1120, margin: "0 auto", padding: "96px 32px" }}>

        {/* Header row */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-80px" }}
          transition={{ duration: 0.7, ease: EASE }}
          style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", marginBottom: 64, flexWrap: "wrap", gap: 12 }}
        >
          <p style={{ fontFamily: "var(--font-mono)", fontSize: 10, color: "#9E9EA3", letterSpacing: "0.12em", textTransform: "uppercase", margin: 0 }}>
            The Market
          </p>
          <p style={{ fontFamily: "var(--font-mono)", fontSize: 9, color: "#C7C7CC", letterSpacing: "0.08em", margin: 0 }}>
            Sources: Statista, Bain & Company, EU Commission — 2024
          </p>
        </motion.div>

        {/* Stats grid */}
        <div
          className="stats-grid"
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(4, 1fr)",
            gap: 0,
          }}
        >
          {STATS.map((stat, i) => (
            <motion.div
              key={stat.label}
              className="stats-item"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-80px" }}
              transition={{ duration: 0.75, ease: EASE, delay: i * 0.08 }}
              style={{
                padding: "0 0 0 32px",
                borderLeft: i > 0 ? "1px solid #E8E2D5" : "none",
              }}
            >
              {/* Number */}
              <div
                style={{
                  display: "flex",
                  alignItems: "flex-start",
                  gap: 2,
                  marginBottom: 16,
                }}
              >
                {stat.prefix && (
                  <span
                    style={{
                      fontFamily: "var(--font-display)",
                      fontSize: "clamp(20px, 2vw, 28px)",
                      fontStyle: "italic",
                      color: "#9E9EA3",
                      lineHeight: 1,
                      paddingTop: "clamp(10px, 1.2vw, 16px)",
                    }}
                  >
                    {stat.prefix}
                  </span>
                )}
                <Counter
                  to={stat.value}
                  suffix={stat.suffix}
                  decimals={stat.decimals}
                  duration={2.2}
                  style={{
                    fontFamily: "var(--font-display)",
                    fontSize: "clamp(48px, 5.5vw, 76px)",
                    fontStyle: "italic",
                    color: "#0A0A0B",
                    letterSpacing: "-0.04em",
                    lineHeight: 1,
                    display: "inline-block",
                  }}
                />
              </div>

              {/* Thin rule */}
              <div style={{ width: 24, height: 1, backgroundColor: "#D4B68A", marginBottom: 14, opacity: 0.6 }} />

              <p style={{ margin: "0 0 5px", fontSize: 13, fontWeight: 500, color: "#1F1F22", letterSpacing: "-0.008em", lineHeight: 1.4 }}>
                {stat.label}
              </p>
              <p style={{ margin: 0, fontFamily: "var(--font-mono)", fontSize: 10, color: "#9E9EA3", letterSpacing: "0.04em" }}>
                {stat.sub}
              </p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
