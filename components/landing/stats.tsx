"use client";
import { motion } from "motion/react";
import Counter from "./interactive/counter";
import { KeyLight, Parallax } from "./interactive/cinema";
import { c, type, rise } from "./styles";

/** Depth and drop are set per figure so the four sit at four distances from the
 *  camera rather than in a row. The order is deliberate: the largest number is
 *  nearest and highest, the deadline furthest and lowest. */
const STATS = [
  {
    prefix: "$",
    value: 4.5,
    suffix: "T",
    decimals: 1,
    label: "Counterfeit goods traded every year",
    sub: "Luxury accounts for roughly 60% of it",
    drop: 0,
    depth: 0.62,
  },
  {
    prefix: "$",
    value: 350,
    suffix: "B",
    decimals: 0,
    label: "Luxury resale market by 2030",
    sub: "Almost none of it traceable today",
    drop: 76,
    depth: 0.2,
  },
  {
    prefix: "",
    value: 0,
    suffix: "%",
    decimals: 0,
    label: "Of resale value reaches the brand",
    sub: "On pieces they made themselves",
    drop: 30,
    depth: 0.46,
  },
  {
    prefix: "",
    value: 2030,
    suffix: "",
    decimals: 0,
    animate: false,
    label: "EU Digital Product Passport deadline",
    sub: "Verifiable identity required to sell",
    drop: 104,
    depth: 0.08,
  },
];

export default function Stats() {
  return (
    <section style={{ backgroundColor: c.abyss, position: "relative", overflow: "hidden" }}>
      <KeyLight x="18%" y="18%" size={80} intensity={0.1} travel={40} />

      <div className="stats-inner" style={{ position: "relative", maxWidth: 1280, margin: "0 auto", padding: "104px 56px 140px" }}>
        <motion.h2 {...rise()} style={{ ...type.h2, color: c.bone, maxWidth: "16ch", marginBottom: 96 }}>
          The market moved. The proof never followed.
        </motion.h2>

        <div className="stats-grid" style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 40 }}>
          {STATS.map((stat) => (
            <Parallax key={stat.label} depth={stat.depth} style={{ marginTop: stat.drop }}>
              <div className="stats-item">
                <div style={{ display: "flex", alignItems: "flex-start", gap: 2, marginBottom: 20 }}>
                  {stat.prefix && (
                    <span
                      style={{
                        fontFamily: "var(--font-display)",
                        fontSize: "clamp(20px, 2vw, 30px)",
                        fontStyle: "italic",
                        color: c.key,
                        lineHeight: 1,
                        paddingTop: "clamp(10px, 1.2vw, 18px)",
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
                      fontSize: "clamp(52px, 6vw, 88px)",
                      fontStyle: "italic",
                      color: c.bone,
                      letterSpacing: "-0.045em",
                      lineHeight: 1,
                      display: "inline-block",
                    }}
                  />
                </div>

                <div
                  aria-hidden
                  style={{ height: 1, width: 44, marginBottom: 16, background: `linear-gradient(90deg, ${c.key}, transparent)` }}
                />

                <p style={{ ...type.body, fontWeight: 500, color: c.bone, margin: "0 0 6px" }}>{stat.label}</p>
                <p style={{ ...type.small, color: c.patina }}>{stat.sub}</p>
              </div>
            </Parallax>
          ))}
        </div>

        <motion.p {...rise(0.2)} style={{ ...type.small, color: c.patina, marginTop: 92 }}>
          Sources: Statista, Bain &amp; Company and the European Commission, 2024.
        </motion.p>
      </div>
    </section>
  );
}
