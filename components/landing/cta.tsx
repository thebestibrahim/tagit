"use client";
import { motion } from "motion/react";
import Link from "next/link";
import MagneticButton from "./interactive/magnetic-button";

export default function CtaSection() {
  return (
    <section style={{ padding: "96px 32px", backgroundColor: "#F5F2EC", borderTop: "1px solid #E8E2D5" }}>
      <div style={{ maxWidth: 1120, margin: "0 auto" }}>
        <motion.div
          initial={{ opacity: 0, y: 32 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-80px" }}
          transition={{ duration: 0.9, ease: [0.16, 1, 0.3, 1] }}
          className="cta-inner"
          style={{
            backgroundColor: "#0A0A0B",
            borderRadius: 20,
            padding: "72px 80px",
            textAlign: "center",
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
              width: 700,
              height: 400,
              background: "radial-gradient(ellipse at 50% 0%, rgba(184,148,93,0.15) 0%, transparent 65%)",
              pointerEvents: "none",
            }}
          />

          <div style={{ position: "relative" }}>
            <p
              style={{
                margin: "0 0 16px",
                fontFamily: "var(--font-mono)",
                fontSize: 10,
                color: "#D4B68A",
                letterSpacing: "0.12em",
                textTransform: "uppercase",
              }}
            >
              Founding Partners
            </p>
            <h2
              style={{
                fontFamily: "var(--font-display)",
                fontSize: "clamp(28px, 3.5vw, 50px)",
                fontWeight: 400,
                color: "#FAFAF8",
                letterSpacing: "-0.03em",
                lineHeight: 1.1,
                margin: "0 0 20px",
              }}
            >
              Become part of the{" "}
              <em style={{ fontStyle: "italic", color: "#C9A66B" }}>network</em>{" "}
              defining the next era of luxury.
            </h2>
            <p
              style={{
                fontSize: 15,
                color: "#71717A",
                maxWidth: 520,
                margin: "0 auto 40px",
                lineHeight: 1.7,
                letterSpacing: "-0.005em",
              }}
            >
              Tagit is currently onboarding founding brand partners. Apply for access and we'll be in
              touch within 48 hours.
            </p>
            <div style={{ display: "flex", gap: 12, justifyContent: "center", flexWrap: "wrap" }}>
              <MagneticButton>
                <Link
                  href="/auth/register"
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    padding: "13px 28px",
                    backgroundColor: "#B8945D",
                    color: "#fff",
                    borderRadius: 8,
                    textDecoration: "none",
                    fontWeight: 550,
                    fontSize: 14,
                    letterSpacing: "-0.01em",
                  }}
                >
                  Apply for Brand Access
                </Link>
              </MagneticButton>
              <a
                href="mailto:hello@tagit.co"
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  padding: "13px 24px",
                  backgroundColor: "transparent",
                  color: "#9E9EA3",
                  border: "1px solid rgba(212,182,138,0.2)",
                  borderRadius: 8,
                  textDecoration: "none",
                  fontWeight: 450,
                  fontSize: 14,
                  letterSpacing: "-0.005em",
                }}
              >
                Schedule a conversation
              </a>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
