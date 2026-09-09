"use client";
import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "motion/react";
import { GRADE, c } from "../styles";

const EASE = [0.16, 1, 0.3, 1] as const;

/** The piece being scanned. Kept consistent with the card shown in the hero
 *  so the page tells one story about one object. */
const PIECE = {
  brand: "Maison Lagos",
  name: "The Meridian Automatic",
  category: "Timepieces",
  price: "₦ 4,200,000",
  shortId: "X7F3C9",
  photo: "/img/watch.jpg",
  specs: [
    ["Movement", "In-house automatic"],
    ["Case", "38mm, brushed steel"],
    ["Origin", "Lagos Atelier, 2024"],
  ],
  owners: [
    { name: "Maison Lagos", sub: "Brand origin, 12 Feb 2024", current: false },
    { name: "Adaeze Okonkwo", sub: "First owner, 05 Mar 2024", current: false },
    { name: "You", sub: "Verified just now", current: true },
  ],
};

const STEPS = [
  {
    title: "Set up at manufacture",
    body: "A chip goes into the piece, or a signed card travels with it, before either leaves the workshop. Neither can be added later, or moved onto a fake.",
  },
  {
    title: "A customer taps their phone",
    body: "No app, no account. Any phone with NFC reads it the same way it reads a contactless card.",
  },
  {
    title: "Your page opens, branded as yours",
    body: "Not a Tagit page. Your name, your typeface, your colours, your photography, and proof the piece is genuine.",
  },
  {
    title: "The tap joins the record",
    body: "Owner, date and piece are added to a history that cannot be edited or deleted, by anyone, including us.",
  },
];

/* ── The phone screen: a faithful miniature of the real /v/ scan page ───── */

function ScreenHeader() {
  return (
    <div style={{ backgroundColor: "#0F3D28", flexShrink: 0 }}>
      <div style={{ padding: "10px 12px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <span style={{ fontFamily: "var(--font-display)", fontSize: 14, fontStyle: "italic", color: "#FAFAF8", letterSpacing: "-0.02em" }}>
          {PIECE.brand}
        </span>
        <div style={{ padding: "2px 7px 2px 5px", border: "1px solid rgba(184,148,93,0.5)", borderRadius: 99, display: "flex", alignItems: "center", gap: 4 }}>
          <div style={{ width: 3, height: 3, borderRadius: "50%", backgroundColor: c.gold }} />
          <span style={{ fontFamily: "var(--font-mono)", fontSize: 7, color: c.gold, letterSpacing: "0.08em", textTransform: "uppercase" }}>Tagit</span>
        </div>
      </div>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.45, duration: 0.3 }}
        style={{
          padding: "5px 12px",
          backgroundColor: "rgba(45,106,79,0.32)",
          borderTop: "1px solid rgba(255,255,255,0.06)",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
          <svg width="9" height="9" viewBox="0 0 16 16" fill="none">
            <path d="M8 1.5 L13.5 3.5 V8 c0 3.2 -2.4 5.6 -5.5 6.5 C4.9 13.6 2.5 11.2 2.5 8 V3.5 Z" stroke="#4ADE80" strokeWidth="1.6" />
            <path d="M5.6 8 L7.3 9.7 L10.6 6.3" stroke="#4ADE80" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          <span style={{ fontFamily: "var(--font-mono)", fontSize: 8, color: "#4ADE80", letterSpacing: "0.05em", textTransform: "uppercase" }}>
            Verified authentic
          </span>
        </div>
        <span style={{ fontFamily: "var(--font-mono)", fontSize: 7.5, color: "#4ADE80", opacity: 0.7 }}>#{PIECE.shortId}</span>
      </motion.div>
    </div>
  );
}

function ScreenBody() {
  return (
    <div style={{ padding: "12px 12px 20px" }}>
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.55, duration: 0.45, ease: EASE }}
        style={{ borderRadius: 8, overflow: "hidden", backgroundColor: "#EFEBE2", height: 116, marginBottom: 12 }}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={PIECE.photo} alt="" style={{ width: "100%", height: "100%", objectFit: "cover", objectPosition: "center 35%" }} />
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.68, duration: 0.45, ease: EASE }}
      >
        <p style={{ fontFamily: "var(--font-mono)", fontSize: 7.5, color: c.gold, letterSpacing: "0.14em", textTransform: "uppercase", margin: "0 0 5px" }}>
          {PIECE.category}
        </p>
        <p style={{ fontFamily: "var(--font-display)", fontSize: 17, fontStyle: "italic", color: "#0A0A0B", letterSpacing: "-0.02em", lineHeight: 1.1, margin: "0 0 5px" }}>
          {PIECE.name}
        </p>
        <p style={{ fontFamily: "var(--font-mono)", fontSize: 9.5, color: "#1F1F22", fontWeight: 500, margin: "0 0 12px" }}>{PIECE.price}</p>
      </motion.div>

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.82, duration: 0.4 }}
        style={{ borderTop: "1px solid #F0EDE8" }}
      >
        {PIECE.specs.map(([k, v]) => (
          <div key={k} style={{ display: "flex", justifyContent: "space-between", gap: 8, padding: "6px 0", borderBottom: "1px solid #F0EDE8" }}>
            <span style={{ fontFamily: "var(--font-mono)", fontSize: 7.5, color: "#9E9EA3", letterSpacing: "0.06em", textTransform: "uppercase" }}>{k}</span>
            <span style={{ fontSize: 9, color: "#1F1F22", fontWeight: 500, textAlign: "right" }}>{v}</span>
          </div>
        ))}
      </motion.div>
    </div>
  );
}

function ScreenProvenance() {
  return (
    <div style={{ padding: "0 12px 24px" }}>
      <div style={{ backgroundColor: "#fff", border: "1px solid #E8E2D5", borderRadius: 10, padding: "12px 12px 14px" }}>
        <p style={{ fontFamily: "var(--font-mono)", fontSize: 7.5, color: "#4A4A4F", letterSpacing: "0.1em", textTransform: "uppercase", margin: "0 0 10px", fontWeight: 600 }}>
          Ownership history
        </p>
        {PIECE.owners.map((o, i) => (
          <motion.div
            key={o.name}
            initial={{ opacity: 0, x: -6 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.15 + i * 0.16, duration: 0.35, ease: EASE }}
            style={{ display: "flex", gap: 8, alignItems: "flex-start", padding: "7px 0", borderTop: i > 0 ? "1px solid #F5F2EC" : "none" }}
          >
            <span style={{ width: 5, height: 5, borderRadius: "50%", backgroundColor: o.current ? c.gold : "#D6D0C4", flexShrink: 0, marginTop: 4 }} />
            <div>
              <p style={{ margin: 0, fontSize: 9.5, fontWeight: 600, color: o.current ? "#0A0A0B" : "#4A4A4F" }}>{o.name}</p>
              <p style={{ margin: 0, fontSize: 8, color: "#9E9EA3" }}>{o.sub}</p>
            </div>
            {o.current && (
              <span style={{ marginLeft: "auto", fontSize: 7.5, fontWeight: 600, color: "#2D6A4F", backgroundColor: "#DCEEE3", padding: "2px 6px", borderRadius: 99 }}>
                Current
              </span>
            )}
          </motion.div>
        ))}
      </div>
    </div>
  );
}

/* ── The device ─────────────────────────────────────────────────────────── */

function Phone({ step }: { step: number }) {
  const awake = step >= 2;
  return (
    <div
      style={{
        width: 208,
        height: 424,
        borderRadius: 34,
        padding: 7,
        background: "linear-gradient(150deg, #6A6455 0%, #2E2B23 38%, #57503F 68%, #23211A 100%)",
        boxShadow:
          "0 0 0 1px rgba(235,211,160,0.14), 0 46px 90px rgba(0,0,0,0.66), 0 8px 20px rgba(0,0,0,0.4)",
        flexShrink: 0,
        position: "relative",
      }}
    >
      <div style={{ width: "100%", height: "100%", borderRadius: 28, overflow: "hidden", backgroundColor: awake ? "#FAFAF8" : "#141419", backgroundImage: awake ? undefined : "linear-gradient(158deg, rgba(243,240,233,0.10) 0%, transparent 42%)", position: "relative", display: "flex", flexDirection: "column" }}>
        {/* Dynamic island */}
        <div style={{ position: "absolute", top: 7, left: "50%", transform: "translateX(-50%)", width: 54, height: 15, borderRadius: 99, backgroundColor: "#0B0B0C", zIndex: 10 }} />

        <AnimatePresence mode="wait">
          {!awake ? (
            <motion.div
              key="asleep"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              style={{ position: "absolute", inset: 0, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 14 }}
            >
              {step === 1 && (
                <>
                  <motion.div
                    animate={{ scale: [1, 1.14, 1], opacity: [0.85, 1, 0.85] }}
                    transition={{ duration: 1.3, repeat: Infinity, ease: "easeInOut" }}
                    style={{ width: 46, height: 46, borderRadius: "50%", background: "conic-gradient(from 20deg, #C9A66B, #E8CC99, #9A7340, #C9A66B)" }}
                  />
                  <p style={{ fontSize: 10.5, color: "#8A8A90", margin: 0 }}>Reading…</p>
                </>
              )}
            </motion.div>
          ) : (
            <motion.div
              key="awake"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.3 }}
              style={{ position: "absolute", inset: 0, overflow: "hidden", display: "flex", flexDirection: "column" }}
            >
              <ScreenHeader />
              {/* The page "scrolls" to provenance on the last step. The wrapper
                  clips it, so content never rides up over the fixed header. */}
              <div style={{ flex: 1, overflow: "hidden", position: "relative" }}>
                <motion.div
                  animate={{ y: step >= 3 ? -196 : 0 }}
                  transition={{ duration: 0.7, ease: EASE }}
                >
                  <ScreenBody />
                  <ScreenProvenance />
                </motion.div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}

/* ── The scene: piece + phone + the tap between them ────────────────────── */

export default function ScanSequence() {
  const [step, setStep] = useState(0);
  const userDriven = useRef(false);

  useEffect(() => {
    const id = setInterval(() => {
      if (userDriven.current) return;
      setStep((s) => (s + 1) % STEPS.length);
    }, 3600);
    return () => clearInterval(id);
  }, []);

  function select(i: number) {
    userDriven.current = true;
    setStep(i);
  }

  const tapping = step === 1;

  return (
    <div className="scan-demo-grid" style={{ display: "grid", gridTemplateColumns: "0.85fr 1fr", gap: 64, alignItems: "center" }}>
      {/* Steps */}
      <div role="tablist" aria-label="How a scan works" style={{ display: "flex", flexDirection: "column" }}>
        {STEPS.map((s, i) => {
          const active = i === step;
          return (
            <button
              key={s.title}
              role="tab"
              aria-selected={active}
              onClick={() => select(i)}
              style={{
                display: "flex",
                gap: 18,
                textAlign: "left",
                padding: "20px 4px",
                border: "none",
                borderBottom: i < STEPS.length - 1 ? `1px solid ${c.hairline}` : "none",
                backgroundColor: "transparent",
                cursor: "pointer",
                fontFamily: "inherit",
                width: "100%",
              }}
            >
              <span
                style={{
                  fontSize: 14,
                  fontWeight: 600,
                  color: active ? c.key : c.ash,
                  width: 20,
                  flexShrink: 0,
                  paddingTop: 3,
                  fontVariantNumeric: "tabular-nums",
                  transition: "color 0.25s ease",
                }}
              >
                {i + 1}
              </span>
              <div>
                <h3 style={{ fontSize: 17.5, fontWeight: 550, color: active ? c.bone : c.patina, margin: "0 0 6px", letterSpacing: "-0.012em", transition: "color 0.25s ease" }}>
                  {s.title}
                </h3>
                <AnimatePresence initial={false}>
                  {active && (
                    <motion.p
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: "auto" }}
                      exit={{ opacity: 0, height: 0 }}
                      transition={{ duration: 0.3, ease: EASE }}
                      style={{ fontSize: 14.5, color: c.patina, lineHeight: 1.6, margin: 0, overflow: "hidden" }}
                    >
                      {s.body}
                    </motion.p>
                  )}
                </AnimatePresence>
              </div>
            </button>
          );
        })}
      </div>

      {/* Stage */}
      <div
        className="scan-demo-stage"
        style={{
          position: "relative",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          gap: 0,
          padding: "56px 32px",
          backgroundColor: c.plate,
          backgroundImage:
            "radial-gradient(70% 50% at 50% 88%, rgba(200,164,100,0.16) 0%, transparent 64%)",
          border: `1px solid ${c.hairline}`,
          borderRadius: 4,
          minHeight: 540,
          overflow: "hidden",
        }}
      >
        {/* The scene scales as one unit so it never overflows a narrow stage. */}
        <div className="scan-scene" style={{ position: "relative", display: "flex", alignItems: "center", justifyContent: "center" }}>
        {/* The piece */}
        <motion.div
          animate={{ x: tapping ? -14 : 0, opacity: step >= 2 ? 0.35 : 1 }}
          transition={{ duration: 0.7, ease: EASE }}
          style={{
            width: 196,
            height: 250,
            borderRadius: 10,
            overflow: "hidden",
            boxShadow: "0 24px 48px rgba(10,10,11,0.22)",
            flexShrink: 0,
            marginRight: -34,
          }}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={PIECE.photo} alt="A luxury timepiece carrying a Tagit chip" style={{ width: "100%", height: "100%", objectFit: "cover", objectPosition: "center 35%", filter: GRADE }} />
        </motion.div>

        {/* NFC arcs, only while the tap is happening */}
        <AnimatePresence>
          {tapping && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              style={{ position: "absolute", left: "calc(50% - 46px)", top: "50%", transform: "translateY(-50%)", zIndex: 4, pointerEvents: "none" }}
            >
              {[0, 1, 2].map((i) => (
                <motion.span
                  key={i}
                  animate={{ scale: [0.6, 1.5], opacity: [0.7, 0] }}
                  transition={{ duration: 1.6, repeat: Infinity, delay: i * 0.5, ease: "easeOut" }}
                  style={{
                    position: "absolute",
                    width: 46,
                    height: 46,
                    marginLeft: -23,
                    marginTop: -23,
                    borderRadius: "50%",
                    border: `2px solid ${c.gold}`,
                  }}
                />
              ))}
            </motion.div>
          )}
        </AnimatePresence>

        {/* The device */}
        <motion.div
          animate={{ x: tapping ? 12 : 0, rotate: tapping ? -3 : 0 }}
          transition={{ duration: 0.7, ease: EASE }}
          style={{ zIndex: 5 }}
        >
          <Phone step={step} />
        </motion.div>
        </div>
      </div>
    </div>
  );
}
