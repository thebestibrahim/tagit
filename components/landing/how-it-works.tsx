"use client";
import { motion } from "motion/react";
import TagChip3D from "./interactive/tag-chip-3d";

const STEPS = [
  { num: "I", title: "You apply, we verify", body: "Tagit doesn't onboard everyone. Every brand passes verification before accessing the platform." },
  { num: "II", title: "Tags arrive ready", body: "We program, package, and ship pre-paired chips. Your team simply embeds them at the point of manufacture." },
  { num: "III", title: "You fill in the story", body: "Through your branded dashboard, attach photography, origin, materials, and the maker's voice to every piece." },
  { num: "IV", title: "Customers connect, forever", body: "A single tap reveals authenticity, ownership history, and a personalised AI persona that speaks for your brand." },
];

export default function HowItWorks() {
  return (
    <section
      id="how-it-works"
      className="lp-section-padding"
      style={{ padding: "112px 32px", backgroundColor: "#FAFAF8", borderTop: "1px solid #E8E2D5" }}
    >
      <div className="hiw-grid" style={{ maxWidth: 1120, margin: "0 auto", display: "grid", gridTemplateColumns: "1fr 1fr", gap: 80, alignItems: "center" }}>
        {/* Left — steps */}
        <div>
          <motion.div
            initial={{ opacity: 0, y: 28 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-80px" }}
            transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
            style={{ marginBottom: 56 }}
          >
            <p style={{ margin: "0 0 14px", fontFamily: "var(--font-mono)", fontSize: 10, color: "#B8945D", letterSpacing: "0.12em", textTransform: "uppercase" }}>
              How It Works
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
              From atelier to{" "}
              <em style={{ fontStyle: "italic", color: "#8B6F3F" }}>archive.</em>
            </h2>
            <p style={{ margin: "16px 0 0", fontSize: 15, color: "#6E6E73", lineHeight: 1.65, maxWidth: 420, letterSpacing: "-0.005em" }}>
              A piece embedded with Tagit becomes part of a verifiable record that lasts longer than the piece itself.
            </p>
          </motion.div>

          <div style={{ display: "flex", flexDirection: "column", gap: 0 }}>
            {STEPS.map((step, i) => (
              <motion.div
                key={step.num}
                initial={{ opacity: 0, x: -24 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true, margin: "-60px" }}
                transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1], delay: i * 0.08 }}
                style={{
                  display: "flex",
                  gap: 24,
                  padding: "24px 0",
                  borderBottom: i < STEPS.length - 1 ? "1px solid #F0EDE8" : "none",
                }}
              >
                <em
                  style={{
                    fontFamily: "var(--font-display)",
                    fontSize: 18,
                    fontStyle: "italic",
                    color: "#B8945D",
                    width: 28,
                    flexShrink: 0,
                    paddingTop: 2,
                    letterSpacing: "-0.01em",
                  }}
                >
                  {step.num}
                </em>
                <div>
                  <h4
                    style={{
                      fontSize: 15,
                      fontWeight: 550,
                      color: "#1F1F22",
                      margin: "0 0 6px",
                      letterSpacing: "-0.01em",
                    }}
                  >
                    {step.title}
                  </h4>
                  <p style={{ fontSize: 13, color: "#6E6E73", lineHeight: 1.65, margin: 0, letterSpacing: "-0.003em" }}>
                    {step.body}
                  </p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>

        {/* Right — 3D chip */}
        <motion.div
          className="hiw-chip"
          initial={{ opacity: 0, scale: 0.92 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true, margin: "-80px" }}
          transition={{ duration: 1, ease: [0.16, 1, 0.3, 1] }}
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: "48px",
            backgroundColor: "#F5F2EC",
            borderRadius: 20,
            border: "1px solid #E8E2D5",
          }}
        >
          <TagChip3D />
        </motion.div>
      </div>
    </section>
  );
}
