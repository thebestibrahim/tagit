"use client";
import { motion, useInView } from "motion/react";
import { useRef } from "react";
import { c } from "../styles";

const DETAILS = [
  ["Material", "Hand-woven Aso-Oke"],
  ["Origin", "Lagos Atelier, 2024"],
  ["Retail", "₦ 4,200,000"],
];

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
        border: `1px solid ${c.line}`,
        padding: "24px 26px",
        width: 268,
        boxShadow: "0 20px 48px rgba(10,10,11,0.12), 0 4px 12px rgba(10,10,11,0.06)",
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 16 }}>
        <div
          style={{
            width: 30,
            height: 30,
            borderRadius: 7,
            background: "linear-gradient(135deg, #C9A66B, #8B6F3F)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            flexShrink: 0,
          }}
        >
          <span style={{ fontFamily: "var(--font-display)", fontSize: 15, color: "#FAFAF8" }}>M</span>
        </div>
        <span style={{ fontSize: 14, fontWeight: 550, color: c.body, letterSpacing: "-0.005em" }}>
          Maison Lagos
        </span>
      </div>

      <p style={{ fontFamily: "var(--font-display)", fontSize: 24, color: c.inkSoft, lineHeight: 1.15, letterSpacing: "-0.02em", margin: "0 0 18px" }}>
        The Aso-Oke
        <br />
        Heritage Jacket
      </p>

      <div style={{ display: "flex", flexDirection: "column", gap: 7, marginBottom: 20 }}>
        {DETAILS.map(([label, value]) => (
          <div key={label} style={{ display: "flex", gap: 10 }}>
            <span style={{ fontSize: 14, color: c.quiet, width: 66, flexShrink: 0 }}>{label}</span>
            <span style={{ fontSize: 14, color: c.body, lineHeight: 1.4 }}>{value}</span>
          </div>
        ))}
      </div>

      <motion.div
        initial={{ opacity: 0, y: 12, scale: 0.95 }}
        animate={inView ? { opacity: 1, y: 0, scale: 1 } : {}}
        transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1], delay: 1.2 }}
        style={{
          display: "flex",
          alignItems: "center",
          gap: 11,
          backgroundColor: "#DCEEE3",
          border: "1px solid rgba(45,106,79,0.25)",
          borderRadius: 8,
          padding: "11px 14px",
        }}
      >
        <svg width="18" height="18" viewBox="0 0 16 16" fill="none" style={{ flexShrink: 0 }} aria-hidden="true">
          <circle cx="8" cy="8" r="7" stroke={c.verified} strokeWidth="1.5" />
          <motion.path
            d="M 4.5 8 L 7 10.5 L 11.5 6"
            stroke={c.verified}
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
            initial={{ pathLength: 0 }}
            animate={inView ? { pathLength: 1 } : {}}
            transition={{ duration: 0.5, ease: "easeOut", delay: 1.4 }}
          />
        </svg>
        <div>
          <p style={{ margin: 0, fontSize: 14, fontWeight: 600, color: c.verified, letterSpacing: "-0.005em" }}>
            Verified authentic
          </p>
          <p style={{ margin: 0, fontSize: 13, color: "#3F7D5E" }}>Checked against the brand record</p>
        </div>
      </motion.div>
    </motion.div>
  );
}
