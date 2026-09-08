"use client";
import { motion } from "motion/react";
import { c, type, rise } from "./styles";

const PROBLEMS = [
  {
    title: "You cannot prove what is yours.",
    body: "The moment a piece leaves your atelier, proving it is genuine becomes your customer's problem, and they have no reliable way to do it. A good counterfeit becomes indistinguishable from your work.",
  },
  {
    title: "You see nothing after the sale.",
    body: "Where your products travel, who owns them, what they trade for. You have no visibility into any of it. The relationship ends the moment money changes hands.",
  },
  {
    title: "Resale wealth flows past you.",
    body: "Your work appreciates. Collectors trade your pieces for multiples of retail. None of that value returns to the brand that made them.",
  },
  {
    title: "Regulation is coming either way.",
    body: "The EU Digital Product Passport will require verifiable identity for products sold in Europe between 2026 and 2030. Brands without the infrastructure lose access to the market.",
  },
];

export default function Problem() {
  return (
    <section className="lp-section-padding" style={{ padding: "128px 32px", backgroundColor: c.paper }}>
      <div style={{ maxWidth: 1120, margin: "0 auto" }}>
        <motion.div {...rise()} style={{ marginBottom: 80, maxWidth: 760 }}>
          <h2 style={{ ...type.h2, color: c.ink, marginBottom: 20 }}>
            After the sale, the trail goes cold.
          </h2>
          <p style={{ ...type.lead, color: c.body, maxWidth: 560 }}>
            Four problems that every luxury brand lives with, and has quietly
            accepted as the cost of doing business.
          </p>
        </motion.div>

        <div style={{ display: "flex", flexDirection: "column" }}>
          {PROBLEMS.map((p, i) => (
            <motion.div
              key={p.title}
              className="problem-row"
              {...rise(i * 0.06)}
              style={{
                display: "grid",
                gridTemplateColumns: "1fr 1.2fr",
                gap: "0 64px",
                padding: "44px 0",
                borderTop: `1px solid ${c.line}`,
                alignItems: "start",
              }}
            >
              <h3 style={{ ...type.h3, color: c.inkSoft }}>{p.title}</h3>
              <p style={{ ...type.body, color: c.body, paddingTop: 4 }}>{p.body}</p>
            </motion.div>
          ))}
          <div style={{ borderTop: `1px solid ${c.line}` }} />
        </div>
      </div>
    </section>
  );
}
