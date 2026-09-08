"use client";
import { motion } from "motion/react";
import { c, type, rise } from "./styles";

const PILLARS = [
  {
    name: "Identity",
    description:
      "A chip embedded in every piece at the moment it is made. It cannot be copied, and it outlasts the piece it sits in.",
    points: [
      "Every piece carries a mark only you can create",
      "Fakes are caught the moment they are scanned",
      "Embedded during manufacture, not bolted on after",
      "Built to last the lifetime of the piece",
    ],
  },
  {
    name: "Ownership",
    description:
      "A living record of every owner and every transfer. Both sides confirm the handover, so both sides are protected.",
    points: [
      "Brand and buyer both confirm first ownership",
      "Secure, confirmed transfers between owners",
      "A history that cannot be altered or deleted",
      "Permanent proof of origin at resale",
    ],
  },
  {
    name: "Intelligence",
    description:
      "For the first time, you can see where your work travels, who holds it, and what it is worth in the world.",
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
    <section className="lp-section-padding" style={{ backgroundColor: c.night, padding: "120px 32px", position: "relative", overflow: "hidden" }}>
      <div style={{ maxWidth: 1120, margin: "0 auto", position: "relative" }}>
        <motion.div {...rise()} style={{ marginBottom: 72, maxWidth: 660 }}>
          <h2 style={{ ...type.h2, color: c.onDark, marginBottom: 20 }}>
            Three things every piece carries.
          </h2>
          <p style={{ ...type.lead, color: c.onDarkBody }}>
            One chip, doing three jobs at once, for as long as the object exists.
          </p>
        </motion.div>

        <div className="pillars-grid" style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 1 }}>
          {PILLARS.map((pillar, i) => (
            <motion.div
              key={pillar.name}
              className="pillars-item"
              {...rise(i * 0.1)}
              style={{
                padding: "44px 40px 44px 0",
                paddingLeft: i > 0 ? 40 : 0,
                borderLeft: i > 0 ? `1px solid ${c.lineDark}` : "none",
                borderTop: `1px solid ${c.lineDark}`,
              }}
            >
              <h3
                style={{
                  fontFamily: "var(--font-display)",
                  fontSize: 30,
                  fontWeight: 400,
                  color: c.onDark,
                  letterSpacing: "-0.022em",
                  lineHeight: 1.15,
                  margin: "0 0 16px",
                }}
              >
                {pillar.name}
              </h3>

              <p style={{ ...type.body, color: c.onDarkBody, margin: "0 0 28px" }}>
                {pillar.description}
              </p>

              <ul style={{ listStyle: "none", padding: 0, margin: 0, display: "flex", flexDirection: "column", gap: 12 }}>
                {pillar.points.map((point) => (
                  <li key={point} style={{ display: "flex", gap: 12 }}>
                    <span
                      style={{
                        width: 5,
                        height: 5,
                        borderRadius: "50%",
                        backgroundColor: c.gold,
                        flexShrink: 0,
                        marginTop: 8,
                      }}
                    />
                    <span style={{ ...type.small, color: c.onDarkQuiet }}>{point}</span>
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
