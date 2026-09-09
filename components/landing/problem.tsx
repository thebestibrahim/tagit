"use client";
import { motion } from "motion/react";
import { KeyLight } from "./interactive/cinema";
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

/**
 * The quietest part of the reel. No photography, one dim light, and the thesis
 * held in place on the left while the four costs of the status quo pass it.
 */
export default function Problem() {
  return (
    <section className="lp-section-padding" style={{ padding: "40px 0 136px", backgroundColor: c.abyss, position: "relative", overflow: "hidden" }}>
      <KeyLight x="86%" y="30%" size={70} intensity={0.09} travel={60} />

      <div className="problem-grid lp-inner" style={{ position: "relative", maxWidth: 1280, margin: "0 auto", padding: "0 56px", display: "grid", gridTemplateColumns: "0.85fr 1.15fr", gap: 80 }}>
        <div className="problem-thesis" style={{ position: "sticky", top: "22vh", alignSelf: "start" }}>
          <motion.div {...rise()}>
            <h2 style={{ ...type.h2, color: c.bone, marginBottom: 24, maxWidth: "12ch" }}>
              After the sale, the trail goes cold.
            </h2>
            <p style={{ ...type.lead, color: c.patina, maxWidth: "34ch" }}>
              Four problems every luxury brand lives with, and has quietly accepted as
              the cost of doing business.
            </p>
          </motion.div>
        </div>

        <div>
          {PROBLEMS.map((p, i) => (
            <motion.div
              key={p.title}
              className="problem-row"
              {...rise(0.04)}
              style={{ paddingTop: i === 0 ? 4 : 52 }}
            >
              <h3 style={{ ...type.h3, color: c.bone, marginBottom: 16 }}>{p.title}</h3>
              <p style={{ ...type.body, color: c.patina, maxWidth: "58ch" }}>{p.body}</p>
              {i < PROBLEMS.length - 1 && (
                <div
                  aria-hidden
                  style={{
                    height: 1,
                    marginTop: 52,
                    background: `linear-gradient(90deg, ${c.hairlineWarm}, ${c.hairline} 35%, transparent 85%)`,
                  }}
                />
              )}
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
