"use client";
import { motion, useInView } from "motion/react";
import { useRef } from "react";
import { c } from "../styles";

const ENTRIES = [
  { name: "Maison Lagos", sub: "Brand origin", date: "12 Feb 2024", current: false },
  { name: "Adaeze Okonkwo", sub: "First owner", date: "05 Mar 2024", current: false },
  { name: "Chidinma Eze", sub: "Transfer accepted", date: "18 Nov 2024", current: true },
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
        border: "1px solid rgba(212,182,138,0.18)",
        padding: "18px 20px",
        width: 244,
        boxShadow: "0 20px 48px rgba(10,10,11,0.34), 0 4px 12px rgba(10,10,11,0.2)",
      }}
    >
      <p style={{ margin: "0 0 14px", fontSize: 14, fontWeight: 600, color: c.champagne, letterSpacing: "-0.005em" }}>
        Ownership history
      </p>

      <div style={{ display: "flex", flexDirection: "column", gap: 13 }}>
        {ENTRIES.map((entry, i) => (
          <motion.div
            key={entry.name}
            initial={{ opacity: 0, x: -10 }}
            animate={inView ? { opacity: 1, x: 0 } : {}}
            transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1], delay: 0.7 + i * 0.15 }}
            style={{ display: "flex", gap: 10, alignItems: "flex-start" }}
          >
            <span
              style={{
                width: 6,
                height: 6,
                borderRadius: "50%",
                backgroundColor: entry.current ? c.gold : "#4A443A",
                marginTop: 6,
                flexShrink: 0,
              }}
            />
            <div style={{ flex: 1, minWidth: 0 }}>
              <p
                style={{
                  margin: 0,
                  fontSize: 14.5,
                  fontWeight: 550,
                  color: entry.current ? c.onDark : "#ABA69C",
                  letterSpacing: "-0.008em",
                  lineHeight: 1.3,
                }}
              >
                {entry.name}
              </p>
              <p style={{ margin: 0, fontSize: 13, color: "#8B857A", lineHeight: 1.4 }}>
                {entry.sub}, {entry.date}
              </p>
            </div>
          </motion.div>
        ))}
      </div>
    </motion.div>
  );
}
