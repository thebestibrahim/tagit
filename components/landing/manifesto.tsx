"use client";
import { motion } from "motion/react";

const EASE = [0.16, 1, 0.3, 1] as const;

export default function Manifesto() {
  return (
    <section
      style={{
        backgroundColor: "#0D0B08",
        padding: "128px 32px",
        position: "relative",
        overflow: "hidden",
      }}
    >
      {/* Subtle radial glow */}
      <div style={{ position: "absolute", top: 0, left: "50%", transform: "translateX(-50%)", width: 800, height: 500, background: "radial-gradient(ellipse at 50% 0%, rgba(184,148,93,0.09) 0%, transparent 65%)", pointerEvents: "none" }} />

      <div style={{ maxWidth: 900, margin: "0 auto", position: "relative" }}>

        {/* Eyebrow */}
        <motion.p
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true, margin: "-80px" }}
          transition={{ duration: 0.8, ease: EASE }}
          style={{ fontFamily: "var(--font-mono)", fontSize: 9, color: "#D4B68A", letterSpacing: "0.16em", textTransform: "uppercase", margin: "0 0 56px", textAlign: "center" }}
        >
          A Founding Belief
        </motion.p>

        {/* Large statement */}
        <div style={{ textAlign: "center", marginBottom: 64 }}>
          {[
            { text: "The most extraordinary things", delay: 0.1 },
            { text: "made by human hands deserve", delay: 0.2 },
            { text: "a record as permanent", delay: 0.3 },
            { text: "as the craft itself.", delay: 0.4, gold: true },
          ].map((line, i) => (
            <div key={i} style={{ overflow: "hidden" }}>
              <motion.p
                initial={{ y: "105%", opacity: 0 }}
                whileInView={{ y: 0, opacity: 1 }}
                viewport={{ once: true, margin: "-60px" }}
                transition={{ delay: line.delay, duration: 1, ease: EASE }}
                style={{
                  fontFamily: "var(--font-display)",
                  fontSize: "clamp(32px, 4.5vw, 64px)",
                  fontWeight: 400,
                  fontStyle: "italic",
                  color: line.gold ? "#C9A66B" : "#FAFAF8",
                  letterSpacing: "-0.03em",
                  lineHeight: 1.1,
                  margin: 0,
                }}
              >
                {line.text}
              </motion.p>
            </div>
          ))}
        </div>

        {/* Gold rule */}
        <motion.div
          initial={{ scaleX: 0 }}
          whileInView={{ scaleX: 1 }}
          viewport={{ once: true, margin: "-60px" }}
          transition={{ duration: 0.9, ease: EASE, delay: 0.5 }}
          style={{ width: 48, height: 1, backgroundColor: "#B8945D", margin: "0 auto 48px", transformOrigin: "center" }}
        />

        {/* Supporting body */}
        <motion.p
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-60px" }}
          transition={{ duration: 0.8, ease: EASE, delay: 0.55 }}
          style={{
            fontSize: 16,
            color: "#71717A",
            lineHeight: 1.8,
            textAlign: "center",
            maxWidth: 580,
            margin: "0 auto 40px",
            letterSpacing: "-0.005em",
          }}
        >
          Tagit is built on a single belief: that every piece of craftsmanship —
          every stitch, every brushstroke, every complication — deserves to carry
          its maker's name, its origin, its journey forward. Permanently.
        </motion.p>

        {/* Attribution */}
        <motion.p
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true, margin: "-60px" }}
          transition={{ duration: 0.8, ease: EASE, delay: 0.65 }}
          style={{ fontFamily: "var(--font-mono)", fontSize: 9, color: "#3A3A3F", letterSpacing: "0.12em", textTransform: "uppercase", textAlign: "center", margin: 0 }}
        >
          — Tagit
        </motion.p>
      </div>
    </section>
  );
}
