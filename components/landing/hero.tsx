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
        display: "flex",
        alignItems: "center",
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

      {/* Subtle dot-grid texture */}
      <div style={{
        position: "absolute",
        inset: 0,
        backgroundImage: "radial-gradient(circle, rgba(184,148,93,0.07) 1px, transparent 1px)",
        backgroundSize: "28px 28px",
        pointerEvents: "none",
      }} />

      {/* Ambient gradient — bleeds from right */}
      <div style={{
        position: "absolute",
        top: "-20%",
        right: "-8%",
        width: "60%",
        height: "140%",
        background: "radial-gradient(ellipse at 70% 40%, rgba(212,182,138,0.1) 0%, transparent 65%)",
        pointerEvents: "none",
      }} />

      <div
        className="hero-layout"
        style={{
          maxWidth: 1200,
          margin: "0 auto",
          padding: "120px 48px 80px",
          width: "100%",
          display: "grid",
          gridTemplateColumns: "1fr 1fr",
          gap: 72,
          alignItems: "center",
        }}
      >
        {/* ── Left: Copy ── */}
        <div>
          {/* Eyebrow pill */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2, duration: 0.6, ease: EASE }}
            style={{ marginBottom: 36 }}
          >
            <span style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 7,
              padding: "5px 13px 5px 9px",
              backgroundColor: "#F5F2EC",
              border: "1px solid #E8E2D5",
              borderRadius: 999,
              fontFamily: "var(--font-mono)",
              fontSize: 9,
              letterSpacing: "0.12em",
              color: "#8B6F3F",
              textTransform: "uppercase",
            }}>
              <motion.span
                animate={{ opacity: [1, 0.25, 1] }}
                transition={{ duration: 2.4, repeat: Infinity, ease: "easeInOut" }}
                style={{ width: 5, height: 5, borderRadius: "50%", backgroundColor: "#B8945D", flexShrink: 0 }}
              />
              Identity Infrastructure for Physical Luxury
            </span>
          </motion.div>

          {/* Headline */}
          <h1 style={{
            fontFamily: "var(--font-display)",
            fontSize: "clamp(42px, 5.2vw, 82px)",
            fontWeight: 400,
            lineHeight: 0.95,
            letterSpacing: "-0.04em",
            color: "#0A0A0B",
            margin: "0 0 40px",
          }}>
            {[
              { text: "Where your craft", italic: false, delay: 0.42 },
              { text: "continues to live", italic: true, delay: 0.54 },
              { text: "long after it", italic: false, delay: 0.66 },
              { text: "leaves your hands.", italic: false, delay: 0.78 },
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
                      transition={{ delay: 1.3, duration: 1.1, ease: "easeOut" }}
                      style={{ fontStyle: "italic" }}
                    >
                      {line.text}
                    </motion.em>
                  ) : line.text}
                </motion.span>
              </span>
            ))}
          </h1>

          <motion.div
            initial={{ opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 1.05, duration: 0.8, ease: EASE }}
          >
            {/* Thin gold rule */}
            <div style={{ width: 40, height: 1, backgroundColor: "#B8945D", opacity: 0.65, marginBottom: 24 }} />

            <p style={{
              fontSize: "clamp(15px, 1.25vw, 17px)",
              color: "#6E6E73",
              lineHeight: 1.72,
              margin: "0 0 36px",
              letterSpacing: "-0.005em",
              maxWidth: 420,
            }}>
              Tagit gives every luxury item a permanent digital identity —
              verifiable authenticity, traceable ownership, and a living
              connection that survives every owner, every market, every continent.
            </p>

            <div style={{ display: "flex", gap: 10, flexWrap: "wrap", marginBottom: 36 }}>
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
                  transition: "border-color 0.2s ease, color 0.2s ease",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.borderColor = "#C7C7CC";
                  e.currentTarget.style.color = "#1F1F22";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.borderColor = "#E8E2D5";
                  e.currentTarget.style.color = "#4A4A4F";
                }}
              >
                See how it works →
              </a>
            </div>

            {/* Trust badges */}
            <div style={{ display: "flex", flexWrap: "wrap", gap: 18, alignItems: "center" }}>
              {["EU DPP Ready", "HMAC Authenticated", "Append-only Ledger"].map((badge) => (
                <span key={badge} style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 6,
                  fontFamily: "var(--font-mono)",
                  fontSize: 9,
                  color: "#B8B8BD",
                  letterSpacing: "0.09em",
                  textTransform: "uppercase",
                }}>
                  <span style={{ width: 3, height: 3, borderRadius: "50%", backgroundColor: "#D4B68A", flexShrink: 0 }} />
                  {badge}
                </span>
              ))}
            </div>
          </motion.div>
        </div>

        {/* ── Right: Product UI Panel ── */}
        <motion.div
          className="hero-visual"
          initial={{ opacity: 0, scale: 0.98 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.7, duration: 0.8, ease: EASE }}
          style={{
            position: "relative",
            height: 540,
            borderRadius: 24,
            background: "linear-gradient(148deg, #F5F2EC 0%, #ECE7DC 100%)",
            border: "1px solid rgba(232,226,213,0.9)",
            boxShadow: "0 40px 80px rgba(10,10,11,0.09), 0 12px 32px rgba(10,10,11,0.05), inset 0 1px 0 rgba(255,255,255,0.75)",
            overflow: "hidden",
          }}
        >
          {/* Panel ambient glow — center */}
          <div style={{
            position: "absolute",
            top: "50%",
            left: "50%",
            transform: "translate(-50%, -50%)",
            width: 380,
            height: 380,
            borderRadius: "50%",
            background: "radial-gradient(circle, rgba(184,148,93,0.13) 0%, transparent 68%)",
            pointerEvents: "none",
          }} />

          {/* Top-right corner accent */}
          <div style={{
            position: "absolute",
            top: 0,
            right: 0,
            width: 180,
            height: 180,
            background: "radial-gradient(circle at 100% 0%, rgba(212,182,138,0.18) 0%, transparent 60%)",
            pointerEvents: "none",
          }} />

          {/* Bottom-left corner accent */}
          <div style={{
            position: "absolute",
            bottom: 0,
            left: 0,
            width: 140,
            height: 140,
            background: "radial-gradient(circle at 0% 100%, rgba(184,148,93,0.08) 0%, transparent 60%)",
            pointerEvents: "none",
          }} />

          {/* Panel header strip */}
          <div style={{
            position: "absolute",
            top: 0,
            left: 0,
            right: 0,
            height: 40,
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            padding: "0 20px",
            borderBottom: "1px solid rgba(212,182,138,0.12)",
            zIndex: 5,
          }}>
            <div style={{ display: "flex", gap: 6 }}>
              {["#E8C89A", "#E8D49A", "#B8D4A8"].map((c, i) => (
                <div key={i} style={{ width: 8, height: 8, borderRadius: "50%", backgroundColor: c, opacity: 0.7 }} />
              ))}
            </div>
            <span style={{ fontFamily: "var(--font-mono)", fontSize: 8, color: "rgba(158,158,163,0.6)", letterSpacing: "0.12em", textTransform: "uppercase" }}>
              TAGIT · IDENTITY OS
            </span>
            <div style={{ width: 48 }} />
          </div>

          {/* VerifiedCard — top-left */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 1.15, duration: 0.85, ease: EASE }}
            style={{ position: "absolute", top: 58, left: 44, zIndex: 3 }}
          >
            <VerifiedCard />
          </motion.div>

          {/* OwnershipLedger — bottom-right, overlapping */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 1.38, duration: 0.85, ease: EASE }}
            style={{ position: "absolute", bottom: 44, right: 32, zIndex: 2 }}
          >
            <OwnershipLedger />
          </motion.div>

          {/* Live protocol indicator */}
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 2.0, duration: 0.5, ease: EASE }}
            style={{
              position: "absolute",
              bottom: 14,
              left: 20,
              display: "inline-flex",
              alignItems: "center",
              gap: 7,
              padding: "5px 11px",
              backgroundColor: "rgba(250,250,248,0.88)",
              backdropFilter: "blur(10px)",
              WebkitBackdropFilter: "blur(10px)",
              border: "1px solid rgba(232,226,213,0.7)",
              borderRadius: 999,
              fontFamily: "var(--font-mono)",
              fontSize: 8,
              color: "#6E6E73",
              letterSpacing: "0.09em",
              textTransform: "uppercase",
              zIndex: 6,
            }}
          >
            <motion.span
              animate={{ opacity: [1, 0.2, 1] }}
              transition={{ duration: 1.9, repeat: Infinity, ease: "easeInOut" }}
              style={{ width: 5, height: 5, borderRadius: "50%", backgroundColor: "#2D6A4F", flexShrink: 0 }}
            />
            Protocol active · Verifying in real-time
          </motion.div>
        </motion.div>
      </div>

      {/* Scroll indicator */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 2.3, duration: 0.8 }}
        style={{
          position: "absolute",
          bottom: 32,
          left: "50%",
          transform: "translateX(-50%)",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: 7,
        }}
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
