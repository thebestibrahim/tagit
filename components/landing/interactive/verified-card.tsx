"use client";
import { motion, useInView } from "motion/react";
import { useRef } from "react";
import { EASE, c } from "../styles";

const DETAILS = [
  ["Movement", "In-house automatic"],
  ["Origin", "Lagos Atelier, 2024"],
  ["Retail", "₦ 4,200,000"],
];

/**
 * The proof panel, as it appears to whoever taps the piece.
 *
 * Deliberately not a white card floating on a dark photograph: it is a pane of
 * the same dark glass the room is made of, lit along one edge. The only saturated
 * colour on it is the seal, because that is the one thing it exists to say.
 */
export default function VerifiedCard() {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, margin: "-40px" });

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 28 }}
      animate={inView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 1, ease: EASE, delay: 0.9 }}
      style={{
        width: 300,
        maxWidth: "100%",
        padding: "26px 26px 24px",
        borderRadius: 18,
        backgroundColor: "rgba(16,16,19,0.72)",
        backdropFilter: "blur(22px) saturate(1.1)",
        WebkitBackdropFilter: "blur(22px) saturate(1.1)",
        border: "1px solid rgba(243,240,233,0.09)",
        boxShadow: "0 40px 90px rgba(0,0,0,0.6), inset 0 1px 0 rgba(243,240,233,0.07)",
      }}
    >
      {/* The lit edge */}
      <div
        aria-hidden
        style={{
          height: 1,
          margin: "-26px -26px 22px",
          background: `linear-gradient(90deg, transparent, ${c.hairlineWarm} 30%, rgba(235,211,160,0.45) 55%, transparent)`,
        }}
      />

      <div style={{ display: "flex", alignItems: "center", gap: 11, marginBottom: 20 }}>
        <div
          style={{
            width: 30,
            height: 30,
            borderRadius: 8,
            background: `linear-gradient(140deg, ${c.ember}, ${c.key} 45%, #7C6231)`,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            flexShrink: 0,
            boxShadow: "0 2px 10px rgba(200,164,100,0.28)",
          }}
        >
          <span style={{ fontFamily: "var(--font-display)", fontSize: 16, color: "#17130A" }}>M</span>
        </div>
        <span style={{ fontSize: 14.5, fontWeight: 500, color: c.patina, letterSpacing: "-0.005em" }}>
          Maison Lagos
        </span>
      </div>

      <p
        style={{
          fontFamily: "var(--font-display)",
          fontSize: 27,
          color: c.bone,
          lineHeight: 1.1,
          letterSpacing: "-0.026em",
          margin: "0 0 20px",
        }}
      >
        The Meridian
        <br />
        Automatic
      </p>

      <div style={{ display: "flex", flexDirection: "column", marginBottom: 22 }}>
        {DETAILS.map(([label, value]) => (
          <div
            key={label}
            style={{
              display: "flex",
              gap: 14,
              padding: "9px 0",
              borderTop: `1px solid ${c.hairline}`,
            }}
          >
            <span style={{ fontSize: 14, color: c.ash, width: 74, flexShrink: 0 }}>{label}</span>
            <span style={{ fontSize: 14, color: c.patina, lineHeight: 1.4 }}>{value}</span>
          </div>
        ))}
      </div>

      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={inView ? { opacity: 1, y: 0 } : {}}
        transition={{ duration: 0.7, ease: EASE, delay: 1.9 }}
        style={{
          display: "flex",
          alignItems: "center",
          gap: 12,
          backgroundColor: "rgba(95,191,143,0.10)",
          border: "1px solid rgba(95,191,143,0.28)",
          borderRadius: 10,
          padding: "12px 14px",
        }}
      >
        <svg width="18" height="18" viewBox="0 0 16 16" fill="none" style={{ flexShrink: 0 }} aria-hidden="true">
          <circle cx="8" cy="8" r="7" stroke={c.seal} strokeWidth="1.4" />
          <motion.path
            d="M 4.5 8 L 7 10.5 L 11.5 6"
            stroke={c.seal}
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
            initial={{ pathLength: 0 }}
            animate={inView ? { pathLength: 1 } : {}}
            transition={{ duration: 0.5, ease: "easeOut", delay: 2.1 }}
          />
        </svg>
        <div>
          <p style={{ margin: 0, fontSize: 14, fontWeight: 600, color: c.seal, letterSpacing: "-0.005em" }}>
            Verified authentic
          </p>
          <p style={{ margin: 0, fontSize: 13, color: "rgba(168,164,156,0.9)" }}>
            Checked against the brand record
          </p>
        </div>
      </motion.div>
    </motion.div>
  );
}
