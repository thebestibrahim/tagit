"use client";
import { motion, useInView } from "motion/react";
import { useRef } from "react";

const ENTRIES = [
  { num: "01", name: "BRAND ORIGIN", sub: "Maison Lagos Atelier", date: "FEB 12, 2024", current: false },
  { num: "02", name: "ADAEZE OKONKWO", sub: "First verified owner", date: "MAR 05, 2024", current: false },
  { num: "03", name: "CHIDINMA EZE", sub: "Transfer accepted", date: "NOV 18, 2024", current: true },
];

export default function OwnershipLedger() {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, margin: "-60px" });

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 32 }}
      animate={inView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.9, ease: [0.16, 1, 0.3, 1], delay: 0.45 }}
      style={{
        backgroundColor: "#1C1A14",
        borderRadius: 16,
        border: "1px solid rgba(212,182,138,0.15)",
        padding: "22px 24px",
        width: 238,
        boxShadow: "0 20px 48px rgba(10,10,11,0.28), 0 4px 12px rgba(10,10,11,0.2)",
      }}
    >
      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 20 }}>
        <span style={{ fontFamily: "var(--font-mono)", fontSize: 9, color: "#D4B68A", letterSpacing: "0.12em", textTransform: "uppercase" }}>
          Ownership Ledger
        </span>
        <span style={{ fontFamily: "var(--font-display)", fontSize: 11, fontStyle: "italic", color: "#71717A" }}>Tagit</span>
      </div>

      <div style={{ width: "100%", height: 1, backgroundColor: "rgba(212,182,138,0.12)", marginBottom: 18 }} />

      {/* Entries */}
      <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
        {ENTRIES.map((entry, i) => (
          <motion.div
            key={entry.num}
            initial={{ opacity: 0, x: -12 }}
            animate={inView ? { opacity: 1, x: 0 } : {}}
            transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1], delay: 0.7 + i * 0.15 }}
            style={{ display: "flex", gap: 12, alignItems: "flex-start" }}
          >
            <span style={{ fontFamily: "var(--font-mono)", fontSize: 9, color: entry.current ? "#B8945D" : "#4A4A4F", letterSpacing: "0.06em", paddingTop: 2, flexShrink: 0 }}>
              {entry.num}
            </span>
            <div style={{ flex: 1 }}>
              <p style={{ margin: 0, fontSize: 11, fontWeight: 600, color: entry.current ? "#FAFAF8" : "#9E9EA3", letterSpacing: "0.03em", marginBottom: 2 }}>
                {entry.name}
              </p>
              <p style={{ margin: 0, fontSize: 10, color: entry.current ? "#9E9EA3" : "#4A4A4F", lineHeight: 1.4 }}>{entry.sub}</p>
              <p style={{ margin: "3px 0 0", fontFamily: "var(--font-mono)", fontSize: 9, color: entry.current ? "#B8945D" : "#3A3A3F", letterSpacing: "0.05em" }}>
                {entry.date}
              </p>
            </div>
            {/* Status dot */}
            <motion.div
              initial={{ scale: 0 }}
              animate={inView ? { scale: 1 } : {}}
              transition={{ duration: 0.3, delay: 0.9 + i * 0.15, type: "spring" }}
              style={{
                width: 6,
                height: 6,
                borderRadius: "50%",
                backgroundColor: entry.current ? "#B8945D" : "#2E2A1E",
                border: `1px solid ${entry.current ? "#D4B68A" : "#3A3630"}`,
                marginTop: 4,
                flexShrink: 0,
              }}
            />
          </motion.div>
        ))}
      </div>

      {/* Footer */}
      <div style={{ marginTop: 18, paddingTop: 14, borderTop: "1px solid rgba(212,182,138,0.1)" }}>
        <p style={{ margin: 0, fontFamily: "var(--font-mono)", fontSize: 9, color: "#3A3A3F", letterSpacing: "0.06em" }}>
          PERMANENT · PROTECTED
        </p>
      </div>
    </motion.div>
  );
}
