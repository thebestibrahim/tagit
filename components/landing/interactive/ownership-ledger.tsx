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
      /* Same pane of dark glass as the proof panel in the hero: one material
         for anything the product itself would show you. */
      style={{
        backgroundColor: "rgba(16,16,19,0.72)",
        backdropFilter: "blur(22px) saturate(1.1)",
        WebkitBackdropFilter: "blur(22px) saturate(1.1)",
        borderRadius: 18,
        border: "1px solid rgba(243,240,233,0.09)",
        padding: "22px 24px",
        width: 268,
        boxShadow: "0 40px 90px rgba(0,0,0,0.6), inset 0 1px 0 rgba(243,240,233,0.07)",
      }}
    >
      <div
        aria-hidden
        style={{
          height: 1,
          margin: "-22px -24px 18px",
          background: `linear-gradient(90deg, transparent, ${c.hairlineWarm} 30%, rgba(235,211,160,0.45) 55%, transparent)`,
        }}
      />

      <p style={{ margin: "0 0 16px", fontSize: 14, fontWeight: 600, color: c.key, letterSpacing: "-0.005em" }}>
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
                backgroundColor: entry.current ? c.key : "rgba(243,240,233,0.22)",
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
                  color: entry.current ? c.bone : c.patina,
                  letterSpacing: "-0.008em",
                  lineHeight: 1.3,
                }}
              >
                {entry.name}
              </p>
              <p style={{ margin: 0, fontSize: 13, color: "rgba(168,164,156,0.85)", lineHeight: 1.4 }}>
                {entry.sub}, {entry.date}
              </p>
            </div>
          </motion.div>
        ))}
      </div>
    </motion.div>
  );
}
