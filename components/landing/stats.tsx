"use client";
import { motion } from "motion/react";
import Counter from "./interactive/counter";
import { c, type, rise } from "./styles";

const STATS = [
  {
    prefix: "$",
    value: 4.5,
    suffix: "T",
    decimals: 1,
    label: "Counterfeit goods traded every year",
    sub: "Luxury accounts for roughly 60% of it",
  },
  {
    prefix: "$",
    value: 350,
    suffix: "B",
    decimals: 0,
    label: "Luxury resale market by 2030",
    sub: "Almost none of it traceable today",
  },
  {
    prefix: "",
    value: 0,
    suffix: "%",
    decimals: 0,
    label: "Of resale value reaches the brand",
    sub: "On pieces they made themselves",
  },
  {
    prefix: "",
    value: 2030,
    suffix: "",
    decimals: 0,
    animate: false,
    label: "EU Digital Product Passport deadline",
    sub: "Verifiable identity required to sell",
  },
];

export default function Stats() {
  return (
    <section style={{ backgroundColor: c.ivory, borderTop: `1px solid ${c.line}` }}>
      <div className="stats-inner" style={{ maxWidth: 1120, margin: "0 auto", padding: "104px 32px" }}>
        <motion.h2 {...rise()} style={{ ...type.h2, color: c.ink, maxWidth: 620, marginBottom: 72 }}>
          The market moved. The proof never followed.
        </motion.h2>

        <div className="stats-grid" style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 0 }}>
          {STATS.map((stat, i) => (
            <motion.div
              key={stat.label}
              className="stats-item"
              {...rise(i * 0.08)}
              style={{
                padding: "0 24px 0 32px",
                borderLeft: i > 0 ? `1px solid ${c.line}` : "none",
              }}
            >
              <div style={{ display: "flex", alignItems: "flex-start", gap: 2, marginBottom: 18 }}>
                {stat.prefix && (
                  <span
                    style={{
                      fontFamily: "var(--font-display)",
                      fontSize: "clamp(20px, 2vw, 28px)",
                      fontStyle: "italic",
                      color: c.quiet,
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
                  animate={stat.animate !== false}
                  duration={2.2}
                  style={{
                    fontFamily: "var(--font-display)",
                    fontSize: "clamp(48px, 5.5vw, 74px)",
                    fontStyle: "italic",
                    color: c.ink,
                    letterSpacing: "-0.04em",
                    lineHeight: 1,
                    display: "inline-block",
                  }}
                />
              </div>

              <p style={{ ...type.body, fontWeight: 500, color: c.inkSoft, margin: "0 0 6px" }}>
                {stat.label}
              </p>
              <p style={{ ...type.small, color: c.quiet }}>{stat.sub}</p>
            </motion.div>
          ))}
        </div>

        <motion.p
          {...rise(0.3)}
          style={{ ...type.small, color: c.quiet, marginTop: 56, paddingTop: 24, borderTop: `1px solid ${c.line}` }}
        >
          Sources: Statista, Bain &amp; Company and the European Commission, 2024.
        </motion.p>
      </div>
    </section>
  );
}
