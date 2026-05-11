"use client";
import Link from "next/link";
import { motion } from "motion/react";
import MagneticButton from "./interactive/magnetic-button";
import VerifiedCard from "./interactive/verified-card";
import OwnershipLedger from "./interactive/ownership-ledger";

const EASE = [0.16, 1, 0.3, 1] as const;

export default function Hero() {
  return (
    <section
      style={{
        minHeight: "100vh",
        paddingTop: 96,
        paddingBottom: 80,
        display: "flex",
        flexDirection: "column",
        justifyContent: "center",
        position: "relative",
        overflow: "hidden",
        backgroundColor: "#FAFAF8",
      }}
    >
      {/* Curtain line */}
      <motion.div
        initial={{ scaleX: 0, opacity: 1 }}
        animate={{ scaleX: 1, opacity: 0 }}
        transition={{ duration: 0.75, ease: EASE, opacity: { delay: 0.7, duration: 0.3 } }}
        style={{ position: "absolute", top: 0, left: 0, right: 0, height: 1, backgroundColor: "#B8945D", transformOrigin: "left center" }}
      />

      <div style={{ maxWidth: 1120, margin: "0 auto", padding: "0 32px", width: "100%" }}>

        {/* Eyebrow */}
        <motion.p
          initial={{ opacity: 0, filter: "blur(8px)" }}
          animate={{ opacity: 1, filter: "blur(0px)" }}
          transition={{ delay: 0.2, duration: 0.7, ease: EASE }}
          style={{ fontFamily: "var(--font-mono)", fontSize: 10, letterSpacing: "0.14em", color: "#B8945D", textTransform: "uppercase", margin: "0 0 32px" }}
        >
          Identity Infrastructure for Physical Luxury
        </motion.p>

        {/* ── Headline — full container width, commanding scale ── */}
        <h1
          style={{
            fontFamily: "var(--font-display)",
            fontSize: "clamp(52px, 8.5vw, 116px)",
            fontWeight: 400,
            lineHeight: 0.95,
            letterSpacing: "-0.04em",
            color: "#0A0A0B",
            margin: "0 0 52px",
          }}
        >
          {[
            { text: "Where your craft", italic: false, delay: 0.45 },
            { text: "continues to live", italic: true, delay: 0.56 },
            { text: "long after it leaves", italic: false, delay: 0.67 },
            { text: "your hands.", italic: false, delay: 0.78 },
          ].map((line, i) => (
            <span key={i} style={{ display: "block", overflow: "hidden" }}>
              <motion.span
                initial={{ y: "108%", opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: line.delay, duration: 1, ease: EASE }}
                style={{ display: "block" }}
              >
                {line.italic ? (
                  <motion.em
                    initial={{ color: "#0A0A0B" }}
                    animate={{ color: "#8B6F3F" }}
                    transition={{ delay: 1.35, duration: 1, ease: "easeOut" }}
                    style={{ fontStyle: "italic" }}
                  >
                    {line.text}
                  </motion.em>
                ) : line.text}
              </motion.span>
            </span>
          ))}
        </h1>

        {/* ── Below headline: two columns ── */}
        <div
          className="hero-below"
          style={{
            display: "grid",
            gridTemplateColumns: "1fr 1fr",
            gap: 64,
            alignItems: "flex-start",
          }}
        >
          {/* Left — subhead + CTAs */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 1.1, duration: 0.8, ease: EASE }}
          >
            {/* Thin gold rule */}
            <div style={{ width: 40, height: 1, backgroundColor: "#B8945D", marginBottom: 24, opacity: 0.6 }} />

            <p
              style={{
                fontSize: "clamp(15px, 1.3vw, 17px)",
                color: "#6E6E73",
                lineHeight: 1.72,
                margin: "0 0 36px",
                letterSpacing: "-0.005em",
                maxWidth: 440,
              }}
            >
              Tagit gives every luxury item a permanent digital identity —
              verifiable authenticity, traceable ownership, and a living
              connection that survives every owner, every market, every continent.
            </p>

            <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
              <MagneticButton>
                <Link
                  href="/auth/register"
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: 8,
                    padding: "13px 24px",
                    backgroundColor: "#0A0A0B",
                    color: "#FAFAF8",
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
                href="#how-it-works"
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 6,
                  padding: "13px 22px",
                  backgroundColor: "transparent",
                  color: "#4A4A4F",
                  border: "1px solid #E8E2D5",
                  borderRadius: 8,
                  textDecoration: "none",
                  fontWeight: 450,
                  fontSize: 14,
                  letterSpacing: "-0.005em",
                }}
              >
                See how it works →
              </a>
            </div>

            {/* Trust note */}
            <p style={{ margin: "28px 0 0", fontFamily: "var(--font-mono)", fontSize: 9, color: "#C7C7CC", letterSpacing: "0.1em", textTransform: "uppercase" }}>
              EU DPP READY · HMAC AUTHENTICATED · APPEND-ONLY LEDGER
            </p>
          </motion.div>

          {/* Right — visual cards */}
          <div className="hero-cards" style={{ position: "relative", display: "flex", gap: 16, alignItems: "flex-start", justifyContent: "flex-end" }}>
            {/* Ambient glow */}
            <div style={{ position: "absolute", width: 360, height: 360, borderRadius: "50%", background: "radial-gradient(circle, rgba(184,148,93,0.07) 0%, transparent 70%)", top: "50%", left: "50%", transform: "translate(-50%,-50%)", pointerEvents: "none" }} />
            <motion.div
              initial={{ opacity: 0, y: 28 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 1.2, duration: 0.9, ease: EASE }}
              style={{ position: "relative", zIndex: 2, marginRight: -12 }}
            >
              <VerifiedCard />
            </motion.div>
            <motion.div
              initial={{ opacity: 0, y: 28 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 1.38, duration: 0.9, ease: EASE }}
              style={{ position: "relative", zIndex: 1, marginTop: 48 }}
            >
              <OwnershipLedger />
            </motion.div>
          </div>
        </div>
      </div>

      {/* Scroll indicator */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 2.2, duration: 0.8 }}
        style={{ position: "absolute", bottom: 36, left: "50%", transform: "translateX(-50%)", display: "flex", flexDirection: "column", alignItems: "center", gap: 7 }}
      >
        <span style={{ fontFamily: "var(--font-mono)", fontSize: 8, color: "#C7C7CC", letterSpacing: "0.14em" }}>SCROLL</span>
        <motion.div
          animate={{ y: [0, 7, 0] }}
          transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
          style={{ width: 1, height: 28, backgroundColor: "#C7C7CC" }}
        />
      </motion.div>
    </section>
  );
}
