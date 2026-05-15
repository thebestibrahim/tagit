"use client";
import { motion, useInView } from "motion/react";
import { useRef } from "react";

export default function VerifiedCard() {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, margin: "-60px" });

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 32 }}
      animate={inView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.9, ease: [0.16, 1, 0.3, 1], delay: 0.2 }}
      style={{
        backgroundColor: "#fff",
        borderRadius: 16,
        border: "1px solid #E8E2D5",
        padding: "22px 24px",
        width: 270,
        boxShadow: "0 20px 48px rgba(10,10,11,0.1), 0 4px 12px rgba(10,10,11,0.06)",
        position: "relative",
        overflow: "hidden",
      }}
    >
      {/* Brand header */}
      <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 16 }}>
        <div
          style={{
            width: 28,
            height: 28,
            borderRadius: 6,
            background: "linear-gradient(135deg, #C9A66B, #8B6F3F)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            flexShrink: 0,
          }}
        >
          <span style={{ fontFamily: "var(--font-display)", fontSize: 13, fontStyle: "italic", color: "#FAFAF8" }}>M</span>
        </div>
        <span style={{ fontFamily: "var(--font-mono)", fontSize: 9, letterSpacing: "0.1em", color: "#9E9EA3", textTransform: "uppercase" }}>
          MAISON LAGOS
        </span>
      </div>

      {/* Product name */}
      <p style={{ fontFamily: "var(--font-display)", fontSize: 22, color: "#1F1F22", lineHeight: 1.15, letterSpacing: "-0.015em", margin: "0 0 16px" }}>
        The Aso-Oke<br />Heritage Jacket
      </p>

      {/* Details */}
      <div style={{ display: "flex", flexDirection: "column", gap: 5, marginBottom: 18 }}>
        {[
          ["MATERIAL", "Hand-woven Aso-Oke"],
          ["ORIGIN", "Lagos Atelier, 2024"],
          ["RETAIL", "₦ 4,200,000"],
        ].map(([label, value]) => (
          <div key={label} style={{ display: "flex", gap: 8 }}>
            <span style={{ fontFamily: "var(--font-mono)", fontSize: 9, color: "#9E9EA3", letterSpacing: "0.08em", width: 60, flexShrink: 0, paddingTop: 1 }}>
              {label}
            </span>
            <span style={{ fontSize: 12, color: "#4A4A4F", lineHeight: 1.4 }}>{value}</span>
          </div>
        ))}
      </div>

      {/* Verified badge — the emotional climax */}
      <motion.div
        initial={{ opacity: 0, y: 12, scale: 0.95 }}
        animate={inView ? { opacity: 1, y: 0, scale: 1 } : {}}
        transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1], delay: 1.4 }}
      >
        <motion.div
          initial={{ boxShadow: "0 0 0px rgba(184,148,93,0)" }}
          animate={inView ? { boxShadow: ["0 0 0px rgba(184,148,93,0)", "0 0 32px rgba(184,148,93,0.35)", "0 0 16px rgba(184,148,93,0.15)"] } : {}}
          transition={{ duration: 1.2, delay: 1.6, times: [0, 0.4, 1] }}
          style={{
            display: "flex",
            alignItems: "center",
            gap: 10,
            backgroundColor: "#DCEEE3",
            border: "1px solid rgba(45,106,79,0.25)",
            borderRadius: 8,
            padding: "9px 13px",
          }}
        >
          {/* SVG checkmark draw animation */}
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
            <circle cx="8" cy="8" r="7" stroke="#2D6A4F" strokeWidth="1.5" />
            <motion.path
              d="M 4.5 8 L 7 10.5 L 11.5 6"
              stroke="#2D6A4F"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
              initial={{ pathLength: 0 }}
              animate={inView ? { pathLength: 1 } : {}}
              transition={{ duration: 0.5, ease: "easeOut", delay: 1.65 }}
            />
          </svg>
          <div>
            <p style={{ margin: 0, fontSize: 11, fontWeight: 600, color: "#2D6A4F", letterSpacing: "0.04em" }}>VERIFIED AUTHENTIC</p>
            <p style={{ margin: 0, fontSize: 10, color: "#4A8C6A", letterSpacing: "0.02em" }}>Cryptographic HMAC · passed</p>
          </div>
        </motion.div>
      </motion.div>

      {/* Tag ID footer */}
      <p style={{ margin: "10px 0 0", fontFamily: "var(--font-mono)", fontSize: 9, color: "#C7C7CC", letterSpacing: "0.06em", textAlign: "right" }}>
        TAGIT · #X7F3C9
      </p>
    </motion.div>
  );
}
