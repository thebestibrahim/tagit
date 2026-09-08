"use client";
import { motion } from "motion/react";
import TagChip3D from "./interactive/tag-chip-3d";
import { c, type, rise } from "./styles";

const STEPS = [
  {
    title: "You apply, we verify",
    body: "Tagit does not onboard everyone. Every brand passes verification before getting access to the platform.",
  },
  {
    title: "Tags arrive ready to use",
    body: "We program, package and ship the chips already paired to your account. Your team embeds them during manufacture.",
  },
  {
    title: "You add the story",
    body: "In your dashboard, attach photography, origin, materials and your own words to every piece you make.",
  },
  {
    title: "Customers tap, and keep tapping",
    body: "One tap shows authenticity, the full ownership history, and your brand speaking in its own voice.",
  },
];

export default function HowItWorks() {
  return (
    <section
      id="how-it-works"
      className="lp-section-padding"
      style={{ padding: "120px 32px", backgroundColor: c.paper, borderTop: `1px solid ${c.line}` }}
    >
      <div
        className="hiw-grid"
        style={{ maxWidth: 1120, margin: "0 auto", display: "grid", gridTemplateColumns: "1fr 1fr", gap: 80, alignItems: "center" }}
      >
        <div>
          <motion.div {...rise()} style={{ marginBottom: 48 }}>
            <h2 style={{ ...type.h2, color: c.ink, marginBottom: 18 }}>
              How a piece gets its identity.
            </h2>
            <p style={{ ...type.lead, color: c.body, maxWidth: 440 }}>
              Four steps, and then it runs on its own for the life of the object.
            </p>
          </motion.div>

          <div>
            {STEPS.map((step, i) => (
              <motion.div
                key={step.title}
                {...rise(i * 0.07)}
                style={{
                  display: "flex",
                  gap: 20,
                  padding: "26px 0",
                  borderBottom: i < STEPS.length - 1 ? `1px solid ${c.line}` : "none",
                }}
              >
                <span
                  style={{
                    fontSize: 14,
                    fontWeight: 600,
                    color: c.goldText,
                    width: 22,
                    flexShrink: 0,
                    paddingTop: 3,
                    fontVariantNumeric: "tabular-nums",
                  }}
                >
                  {i + 1}
                </span>
                <div>
                  <h3 style={{ fontSize: 18, fontWeight: 550, color: c.inkSoft, margin: "0 0 6px", letterSpacing: "-0.012em" }}>
                    {step.title}
                  </h3>
                  <p style={{ ...type.small, color: c.body }}>{step.body}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>

        <motion.div
          className="hiw-chip"
          {...rise(0.1)}
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: 48,
            backgroundColor: c.ivory,
            borderRadius: 20,
            border: `1px solid ${c.line}`,
          }}
        >
          <TagChip3D />
        </motion.div>
      </div>
    </section>
  );
}
