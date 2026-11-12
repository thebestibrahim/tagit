"use client";

import { motion, AnimatePresence, useReducedMotion } from "motion/react";
import { rosette } from "@/components/landing/interactive/guilloche";
import { EASE } from "@/components/landing/styles";

/**
 * The certificate a brand is applying to issue.
 *
 * On the landing page the certificate belongs to someone else's house. Here it
 * is drafted from the application as it is filled in: the house's name goes on
 * it, its initial goes in the seal, and the piece reads like something that
 * house would make. Submitting stamps the seal. It is the one moment of motion
 * in the flow, and it answers the brand's own action.
 *
 * Stock, foil and ink match the landing certificate exactly, so it is the same
 * object a buyer will hold.
 */

const STOCK = "linear-gradient(152deg, #23201a 0%, #14120e 46%, #1e1b15 100%)";
const FOIL = "#c8a464";
const FOIL_HI = "#f0dcaf";
const CREAM = "#f0ede6";
const MUTED = "#a39b8d";
const FAINT = "#7d766a";

const ENGRAVING = [rosette(190, 7, 76), rosette(146, 11, 52)];

export type Industry = "" | "fashion" | "arts" | "collectibles";

const PIECE: Record<Industry, string> = {
  "": "Your first piece",
  fashion: "Atelier coat, No. 001",
  arts: "Untitled, edition 1 of 12",
  collectibles: "Reference piece, No. 001",
};

const CATEGORY: Record<Industry, string> = {
  "": "Not chosen yet",
  fashion: "Fashion",
  arts: "Arts",
  collectibles: "Collectibles",
};

/** A stable six-character reference from the house name, so it settles as they type. */
function referenceFor(name: string) {
  let h = 2166136261;
  for (const ch of name.trim().toLowerCase()) {
    h ^= ch.codePointAt(0)!;
    h = Math.imul(h, 16777619);
  }
  const alphabet = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let out = "";
  let n = h >>> 0;
  for (let i = 0; i < 6; i++) {
    out += alphabet[n % alphabet.length];
    n = Math.floor(n / alphabet.length) ^ (i * 2654435761);
    n >>>= 0;
  }
  return out;
}

const round = (n: number) => Math.round(n * 100) / 100;

/** The maker's seal: a dial of ticks around the house's initial. */
export function Seal({ letter, size = 76 }: { letter: string; size?: number }) {
  const r = 38;
  const ticks = Array.from({ length: 36 }, (_, i) => {
    const a = ((i * 10 - 90) * Math.PI) / 180;
    const inner = i % 3 === 0 ? r * 0.74 : r * 0.82;
    // Rounded: Node and the browser disagree on the last digits of cos/sin,
    // and unrounded values fail hydration.
    return { i, x1: round(40 + Math.cos(a) * inner), y1: round(40 + Math.sin(a) * inner), x2: round(40 + Math.cos(a) * r * 0.92), y2: round(40 + Math.sin(a) * r * 0.92) };
  });
  return (
    <svg width={size} height={size} viewBox="0 0 80 80" fill="none" aria-hidden style={{ display: "block", color: FOIL }}>
      <circle cx="40" cy="40" r={r} fill="#0f0c05" stroke="currentColor" strokeWidth="1.4" />
      {ticks.map((t) => (
        <line key={t.i} x1={t.x1} y1={t.y1} x2={t.x2} y2={t.y2} stroke="currentColor" strokeOpacity={t.i % 3 === 0 ? 0.85 : 0.4} strokeLinecap="round" />
      ))}
      <circle cx="40" cy="40" r={r * 0.6} stroke="currentColor" strokeOpacity="0.35" strokeWidth="0.9" />
      {letter ? (
        <text
          x="40"
          y="41"
          textAnchor="middle"
          dominantBaseline="central"
          fill={FOIL_HI}
          style={{ fontFamily: "var(--font-display)", fontSize: 34, fontStyle: "italic" }}
        >
          {letter}
        </text>
      ) : (
        <circle cx="40" cy="40" r="10" stroke="currentColor" strokeOpacity="0.4" strokeDasharray="2 3" />
      )}
    </svg>
  );
}

function Engraving({ draw }: { draw: boolean }) {
  return (
    <svg aria-hidden viewBox="-240 -240 480 480" preserveAspectRatio="xMidYMid slice" style={{ position: "absolute", inset: 0, width: "100%", height: "100%", opacity: 0.3, color: FOIL }}>
      {ENGRAVING.map((d, i) => (
        <motion.path
          key={i}
          d={d}
          stroke="currentColor"
          strokeOpacity={0.22 - i * 0.05}
          strokeWidth={0.6}
          fill="none"
          initial={draw ? { pathLength: 0 } : false}
          animate={{ pathLength: 1 }}
          transition={{ duration: 2.4, ease: "easeOut", delay: 0.3 + i * 0.2 }}
        />
      ))}
    </svg>
  );
}

function Detail({ term, children }: { term: string; children: React.ReactNode }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 2, minWidth: 0 }}>
      <dt style={{ fontSize: 12.5, color: FAINT }}>{term}</dt>
      <dd style={{ margin: 0, fontSize: 14.5, color: CREAM, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{children}</dd>
    </div>
  );
}

export function ApplicationCertificate({
  house,
  industry,
  submitted,
}: {
  house: string;
  industry: Industry;
  submitted: boolean;
}) {
  const reduce = useReducedMotion();
  const name = house.trim();
  const letter = name ? name.match(/\p{L}|\p{N}/u)?.[0]?.toUpperCase() ?? "" : "";

  return (
    <div
      role="img"
      aria-label={`Preview of a Tagit certificate for ${PIECE[industry]}${name ? `, made by ${name}` : ""}. ${submitted ? "Application under review." : "Draft."}`}
      style={{
        position: "relative",
        width: "100%",
        maxWidth: 480,
        minHeight: 320,
        borderRadius: 14,
        background: STOCK,
        boxShadow: "0 40px 80px -24px rgba(0,0,0,0.7), 0 0 0 1px rgba(243,240,233,0.1)",
        overflow: "hidden",
        isolation: "isolate",
        fontFamily: "var(--font-body)",
      }}
    >
      <Engraving draw={!reduce} />
      {/* The foil catching the light along the top edge */}
      <div aria-hidden style={{ position: "absolute", top: 0, left: 0, right: 0, height: 1.5, background: `linear-gradient(90deg, transparent, ${FOIL_HI}e6 46%, transparent)` }} />
      {/* The inner keyline every certificate is bordered by */}
      <div aria-hidden style={{ position: "absolute", inset: 14, borderRadius: 6, border: `1px solid ${FOIL}33` }} />

      <div style={{ position: "relative", height: "100%", display: "flex", flexDirection: "column", padding: "clamp(24px, 6%, 34px)" }}>
        <div style={{ display: "flex", justifyContent: "space-between", gap: 16, alignItems: "flex-start" }}>
          <div style={{ minWidth: 0 }}>
            <p style={{ margin: 0, fontFamily: "var(--font-display)", fontStyle: "italic", fontSize: 16, color: FOIL }}>
              Certificate of Authenticity
            </p>
            <AnimatePresence mode="wait" initial={false}>
              <motion.p
                key={industry}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.25 }}
                style={{ margin: "8px 0 0", fontFamily: "var(--font-display)", fontSize: "clamp(26px, 2.5vw, 34px)", lineHeight: 1.05, letterSpacing: "-0.022em", color: CREAM }}
              >
                {PIECE[industry]}
              </motion.p>
            </AnimatePresence>
            <p style={{ margin: "8px 0 0", fontSize: 15.5, color: name ? MUTED : FAINT, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
              {name || "Your house"}
            </p>
          </div>

          <motion.div
            key={submitted ? "stamped" : "draft"}
            initial={submitted && !reduce ? { scale: 1.7, opacity: 0, rotate: -12 } : false}
            animate={{ scale: 1, opacity: 1, rotate: 0 }}
            transition={{ duration: 0.5, ease: [0.34, 1.3, 0.5, 1] }}
            style={{ flexShrink: 0, opacity: submitted ? 1 : 0.85 }}
          >
            <Seal letter={letter} size={72} />
          </motion.div>
        </div>

        <dl style={{ margin: "auto 0 0", paddingTop: 20, borderTop: `1px solid ${FOIL}38`, display: "grid", gridTemplateColumns: "minmax(0,1fr) minmax(0,1fr)", gap: "14px 20px" }}>
          <Detail term="Reference">{name ? referenceFor(name) : "Set on approval"}</Detail>
          <Detail term="Category">{CATEGORY[industry]}</Detail>
          <Detail term="Origin">{name ? `${name}, brand origin` : "Your house, brand origin"}</Detail>
          <Detail term="Owner">Awaiting first owner</Detail>
        </dl>

        <div style={{ display: "flex", alignItems: "center", gap: 10, marginTop: 20, fontSize: 13.5, color: submitted ? CREAM : MUTED }}>
          <span
            aria-hidden
            style={{
              width: 8,
              height: 8,
              borderRadius: "50%",
              flexShrink: 0,
              border: `1px solid ${FOIL}`,
              background: submitted ? FOIL : "transparent",
              transition: "background 0.3s",
            }}
          />
          {submitted ? "Under review. Issued in your name once approved." : "Draft. Your details fill this in as you go."}
        </div>
      </div>
    </div>
  );
}

/** The room on the sign-in pages: the engraving and the seal, with nothing else to sell. */
export function RoomSeal() {
  const reduce = useReducedMotion();
  return (
    <div style={{ position: "relative", width: "min(100%, 420px)", aspectRatio: "1", color: FOIL }} aria-hidden>
      <svg viewBox="-240 -240 480 480" style={{ position: "absolute", inset: 0, width: "100%", height: "100%" }}>
        {ENGRAVING.map((d, i) => (
          <motion.path
            key={i}
            d={d}
            stroke="currentColor"
            strokeOpacity={0.28 - i * 0.08}
            strokeWidth={0.7}
            fill="none"
            initial={reduce ? false : { pathLength: 0 }}
            animate={{ pathLength: 1 }}
            transition={{ duration: 2.8, ease: "easeOut", delay: 0.2 + i * 0.25 }}
          />
        ))}
      </svg>
      <motion.div
        initial={reduce ? false : { opacity: 0, scale: 0.92 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 1, ease: EASE, delay: 0.6 }}
        style={{ position: "absolute", inset: 0, display: "grid", placeItems: "center" }}
      >
        <Seal letter="T" size={132} />
      </motion.div>
    </div>
  );
}
