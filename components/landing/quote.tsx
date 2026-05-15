"use client";
import { motion } from "motion/react";

const EASE = [0.16, 1, 0.3, 1] as const;

export default function Quote() {
  return (
    <section className="lp-section-padding" style={{ padding: "128px 32px", backgroundColor: "#0A0A0B", position: "relative", overflow: "hidden" }}>
      {/* Subtle glow */}
      <div style={{ position: "absolute", bottom: 0, left: "50%", transform: "translateX(-50%)", width: 600, height: 300, background: "radial-gradient(ellipse at 50% 100%, rgba(184,148,93,0.07) 0%, transparent 70%)", pointerEvents: "none" }} />

      <div style={{ maxWidth: 960, margin: "0 auto", position: "relative", textAlign: "center" }}>

        {/* Giant decorative mark */}
        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 1.2, ease: EASE }}
          style={{
            fontFamily: "var(--font-display)",
            fontSize: "clamp(120px, 16vw, 220px)",
            fontStyle: "italic",
            color: "#B8945D",
            opacity: 0.07,
            lineHeight: 0.7,
            marginBottom: -32,
            userSelect: "none",
            pointerEvents: "none",
          }}
        >
          &ldquo;
        </motion.div>

        <blockquote style={{ margin: 0 }}>
          {[
            "The next decade of luxury",
            "will be defined not by what",
            "brands make, but by how they",
            "remain present in everything",
            "they've ever made.",
          ].map((line, i) => (
            <motion.p
              key={i}
              initial={{ opacity: 0, y: 18 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-40px" }}
              transition={{ delay: i * 0.1, duration: 0.85, ease: EASE }}
              style={{
                fontFamily: "var(--font-display)",
                fontSize: "clamp(24px, 3.2vw, 48px)",
                fontWeight: 400,
                fontStyle: "italic",
                color: i < 4 ? "#FAFAF8" : "#C9A66B",
                letterSpacing: "-0.025em",
                lineHeight: 1.25,
                margin: 0,
              }}
            >
              {line}
            </motion.p>
          ))}

          <motion.footer
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8, ease: EASE, delay: 0.6 }}
            style={{ marginTop: 40 }}
          >
            <div style={{ width: 32, height: 1, backgroundColor: "#B8945D", margin: "0 auto 16px", opacity: 0.5 }} />
            <p style={{ margin: 0, fontFamily: "var(--font-mono)", fontSize: 9, color: "#B8945D", letterSpacing: "0.14em", textTransform: "uppercase" }}>
              — Tagit, Founding Principle
            </p>
          </motion.footer>
        </blockquote>
      </div>
    </section>
  );
}
