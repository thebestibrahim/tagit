"use client";
import { motion } from "motion/react";

const PILLARS = [
  {
    name: "Identity",
    description: "A chip embedded in every piece at the moment of creation. Impossible to copy. Impossible to fake. Built to outlast the piece itself.",
    points: [
      "Every piece carries a mark only you can create",
      "Fakes are caught the moment they're scanned",
      "Embedded at the point of creation",
      "Built to last the lifetime of the piece",
    ],
  },
  {
    name: "Ownership",
    description: "A living record of every owner, every transfer, every hand that carried your work forward. Both parties confirm. Both are protected.",
    points: [
      "Brand and buyer both confirm first ownership",
      "Secure, confirmed transfers between owners",
      "A history that can never be altered or deleted",
      "Permanent proof of origin for resale",
    ],
  },
  {
    name: "Intelligence",
    description: "For the first time, see where your craft travels. Who owns what. What pieces are worth. Real visibility into your work in the world.",
    points: [
      "See where your pieces travel globally",
      "Track what your work is worth over time",
      "Know when someone tries to fake your pieces",
      "Your own market data, finally yours",
    ],
  },
];

export default function Pillars() {
  return (
    <section
      className="lp-section-padding"
      style={{
        backgroundColor: "#0A0A0B",
        padding: "112px 32px",
        position: "relative",
        overflow: "hidden",
      }}
    >
      {/* Radial gold glow */}
      <div
        style={{
          position: "absolute",
          top: 0,
          left: "50%",
          transform: "translateX(-50%)",
          width: 600,
          height: 400,
          background: "radial-gradient(ellipse at 50% 0%, rgba(184,148,93,0.12) 0%, transparent 70%)",
          pointerEvents: "none",
        }}
      />

      <div style={{ maxWidth: 1120, margin: "0 auto", position: "relative" }}>
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 32 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-80px" }}
          transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
          style={{ marginBottom: 72, maxWidth: 640 }}
        >
          <p style={{ margin: "0 0 14px", fontFamily: "var(--font-mono)", fontSize: 10, color: "#D4B68A", letterSpacing: "0.12em", textTransform: "uppercase" }}>
            What Tagit Provides
          </p>
          <h2
            style={{
              fontFamily: "var(--font-display)",
              fontSize: "clamp(34px, 4vw, 56px)",
              fontWeight: 400,
              color: "#FAFAF8",
              letterSpacing: "-0.03em",
              lineHeight: 1.08,
              margin: 0,
            }}
          >
            Three layers that make every piece{" "}
            <em style={{ fontStyle: "italic", color: "#C9A66B" }}>permanent.</em>
          </h2>
        </motion.div>

        {/* Pillars */}
        <div className="pillars-grid" style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 1 }}>
          {PILLARS.map((pillar, i) => (
            <motion.div
              key={pillar.name}
              className="pillars-item"
              initial={{ opacity: 0, y: 32 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-60px" }}
              transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1], delay: i * 0.1 }}
              style={{
                padding: "40px 36px",
                borderLeft: i > 0 ? "1px solid rgba(212,182,138,0.1)" : "none",
                borderTop: "1px solid rgba(212,182,138,0.1)",
              }}
            >
              {/* Pillar number + name */}
              <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 20 }}>
                <span
                  style={{
                    fontFamily: "var(--font-mono)",
                    fontSize: 9,
                    color: "#B8945D",
                    letterSpacing: "0.1em",
                    border: "1px solid rgba(184,148,93,0.3)",
                    padding: "3px 7px",
                    borderRadius: 3,
                  }}
                >
                  0{i + 1}
                </span>
              </div>

              <h3
                style={{
                  fontFamily: "var(--font-display)",
                  fontSize: 28,
                  fontWeight: 400,
                  fontStyle: "italic",
                  color: "#FAFAF8",
                  letterSpacing: "-0.02em",
                  lineHeight: 1.15,
                  margin: "0 0 16px",
                }}
              >
                {pillar.name}
              </h3>
              <p
                style={{
                  fontSize: 14,
                  color: "#71717A",
                  lineHeight: 1.7,
                  margin: "0 0 28px",
                  letterSpacing: "-0.003em",
                }}
              >
                {pillar.description}
              </p>

              <ul style={{ listStyle: "none", padding: 0, margin: 0, display: "flex", flexDirection: "column", gap: 8 }}>
                {pillar.points.map((point) => (
                  <li key={point} style={{ display: "flex", alignItems: "center", gap: 10 }}>
                    <span
                      style={{
                        width: 4,
                        height: 4,
                        borderRadius: "50%",
                        backgroundColor: "#B8945D",
                        flexShrink: 0,
                        opacity: 0.6,
                      }}
                    />
                    <span
                      style={{
                        fontFamily: "var(--font-mono)",
                        fontSize: 11,
                        color: "#4A4A4F",
                        letterSpacing: "0.03em",
                        lineHeight: 1.4,
                      }}
                    >
                      {point}
                    </span>
                  </li>
                ))}
              </ul>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
