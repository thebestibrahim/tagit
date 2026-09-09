"use client";
import { useRef, useState } from "react";
import {
  AnimatePresence,
  motion,
  useMotionValue,
  useReducedMotion,
  useSpring,
  useTransform,
} from "motion/react";
import { EASE, c, type } from "../styles";

/**
 * The two things a brand actually holds in its hand.
 *
 * Drawn rather than photographed, because the chip is 4mm across and a photo of
 * one tells you nothing. Both objects tilt to the cursor and nothing rotates on
 * a timer: the visitor turns the object over, the page does not do it for them.
 */

const ARTIFACTS = [
  {
    id: "chip",
    label: "The chip",
    headline: "Set inside the piece, at the workshop.",
    body:
      "A passive NFC inlay a few millimetres across, closed into the case back, the lining or the setting before the piece ever leaves you. No battery, nothing to charge, and no way to lift it onto a counterfeit without destroying it.",
    spec: [
      ["Fitted", "Case back, lining or setting"],
      ["Power", "None. It draws from the phone"],
      ["Life", "As long as the piece"],
    ],
  },
  {
    id: "card",
    label: "The card",
    headline: "For pieces that cannot be opened.",
    body:
      "A signed card issued to one piece and one piece only, travelling with it in the box or the wallet. The same silicon, the same key, for objects where an inlay has nowhere to go.",
    spec: [
      ["Fitted", "Issued with the piece"],
      ["Power", "None. It draws from the phone"],
      ["Life", "Replaceable, re-signed to the piece"],
    ],
  },
] as const;

/* ── The chip ─────────────────────────────────────────────────────── */

function Chip({ drawn }: { drawn: boolean }) {
  /* Five coil traces with a break at the top and two radial jumpers, which is
     roughly how a real inlay antenna is laid out. */
  const radii = [96, 84, 72, 60, 48];

  return (
    <svg width="260" height="260" viewBox="0 0 260 260" fill="none" aria-hidden style={{ display: "block" }}>
      <defs>
        <linearGradient id="chipFace" x1="16%" y1="4%" x2="86%" y2="98%">
          <stop offset="0%" stopColor="#F0DCAF" />
          <stop offset="26%" stopColor="#C8A464" />
          <stop offset="52%" stopColor="#8A6C39" />
          <stop offset="74%" stopColor="#D9BC83" />
          <stop offset="100%" stopColor="#7A5F31" />
        </linearGradient>
        <radialGradient id="chipDie" cx="34%" cy="30%">
          <stop offset="0%" stopColor="#3A2E15" />
          <stop offset="100%" stopColor="#100C04" />
        </radialGradient>
        <linearGradient id="chipSheen" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#fff" stopOpacity="0.42" />
          <stop offset="42%" stopColor="#fff" stopOpacity="0" />
        </linearGradient>
      </defs>

      <circle cx="130" cy="130" r="112" fill="url(#chipFace)" />
      <circle cx="130" cy="130" r="112" fill="url(#chipSheen)" />
      <circle cx="130" cy="130" r="112" stroke="rgba(255,255,255,0.28)" strokeWidth="1" />

      {radii.map((r, i) => (
        <motion.circle
          key={r}
          cx="130"
          cy="130"
          r={r}
          stroke="rgba(37,25,6,0.45)"
          strokeWidth="1.6"
          strokeLinecap="round"
          /* the break at the top is where the coil steps inward */
          strokeDasharray={`${2 * Math.PI * r - 16} 16`}
          strokeDashoffset={2 * Math.PI * r * 0.75 - 8}
          initial={{ pathLength: 0 }}
          animate={{ pathLength: drawn ? 1 : 0 }}
          transition={{ duration: 0.9, ease: EASE, delay: 0.1 + i * 0.07 }}
        />
      ))}
      <path d="M130 34 L130 46 M130 46 L142 46" stroke="rgba(37,25,6,0.45)" strokeWidth="1.6" strokeLinecap="round" />

      <circle cx="130" cy="130" r="34" fill="url(#chipDie)" stroke="rgba(240,220,175,0.34)" strokeWidth="1" />
      <text
        x="130"
        y="130"
        textAnchor="middle"
        dominantBaseline="central"
        fill="#E4C88F"
        style={{ fontFamily: "var(--font-display)", fontSize: 30, fontStyle: "italic" }}
      >
        T
      </text>
    </svg>
  );
}

/* ── The card ─────────────────────────────────────────────────────── */

function Card({ drawn }: { drawn: boolean }) {
  return (
    <svg width="300" height="260" viewBox="0 0 300 260" fill="none" aria-hidden style={{ display: "block" }}>
      <defs>
        <linearGradient id="cardFace" x1="8%" y1="0%" x2="92%" y2="100%">
          <stop offset="0%" stopColor="#26241F" />
          <stop offset="46%" stopColor="#14130F" />
          <stop offset="100%" stopColor="#201E18" />
        </linearGradient>
        <linearGradient id="cardEdge" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="#C8A464" stopOpacity="0" />
          <stop offset="42%" stopColor="#EBD3A0" stopOpacity="0.85" />
          <stop offset="100%" stopColor="#C8A464" stopOpacity="0" />
        </linearGradient>
        <linearGradient id="foil" x1="10%" y1="10%" x2="90%" y2="90%">
          <stop offset="0%" stopColor="#F2E0B8" />
          <stop offset="55%" stopColor="#C8A464" />
          <stop offset="100%" stopColor="#8A6C39" />
        </linearGradient>
      </defs>

      <rect x="18" y="46" width="264" height="168" rx="12" fill="url(#cardFace)" stroke="rgba(243,240,233,0.12)" />
      <rect x="18" y="46" width="264" height="1.4" fill="url(#cardEdge)" />

      {/* Foil monogram */}
      <rect x="42" y="72" width="38" height="38" rx="9" fill="url(#foil)" />
      <text
        x="61"
        y="92"
        textAnchor="middle"
        dominantBaseline="central"
        fill="#17130A"
        style={{ fontFamily: "var(--font-display)", fontSize: 20 }}
      >
        M
      </text>

      {/* Etched piece name and serial */}
      <text x="42" y="140" fill="#D8D3C8" style={{ fontFamily: "var(--font-display)", fontSize: 21, letterSpacing: "-0.02em" }}>
        The Meridian
      </text>
      <text x="42" y="166" fill="#7C7972" style={{ fontFamily: "var(--font-mono)", fontSize: 11, letterSpacing: "0.14em" }}>
        NO. X7F3C9
      </text>

      {/* Hairline rule and NFC arcs */}
      <path d="M42 184 H150" stroke="rgba(243,240,233,0.12)" strokeWidth="1" />
      <g transform="translate(228 168)">
        {[0, 1, 2].map((i) => (
          <motion.path
            key={i}
            d={`M0 ${-9 - i * 9} a ${9 + i * 9} ${9 + i * 9} 0 0 1 0 ${18 + i * 18}`}
            stroke="#C8A464"
            strokeWidth="1.8"
            strokeLinecap="round"
            fill="none"
            initial={{ pathLength: 0, opacity: 0 }}
            animate={{ pathLength: drawn ? 1 : 0, opacity: drawn ? 1 - i * 0.22 : 0 }}
            transition={{ duration: 0.6, ease: EASE, delay: 0.35 + i * 0.12 }}
          />
        ))}
      </g>
    </svg>
  );
}

/* ── The stage ────────────────────────────────────────────────────── */

export default function TagArtifact() {
  const [active, setActive] = useState(0);
  const stageRef = useRef<HTMLDivElement>(null);
  const reduce = useReducedMotion();

  const mx = useMotionValue(0);
  const my = useMotionValue(0);
  const spring = { stiffness: 90, damping: 18, mass: 0.6 };
  const sx = useSpring(mx, spring);
  const sy = useSpring(my, spring);
  const rotateY = useTransform(sx, (v) => v * 17);
  const rotateX = useTransform(sy, (v) => v * -13);
  const glareX = useTransform(sx, (v) => `${50 + v * 34}%`);
  const glareY = useTransform(sy, (v) => `${50 + v * 30}%`);
  const glare = useTransform(
    [glareX, glareY],
    ([gx, gy]) => `radial-gradient(46% 46% at ${gx} ${gy}, var(--lp-specular) 0%, transparent 62%)`,
  );

  function onMove(e: React.MouseEvent) {
    if (reduce) return;
    const r = stageRef.current?.getBoundingClientRect();
    if (!r) return;
    mx.set((e.clientX - (r.left + r.width / 2)) / (r.width / 2));
    my.set((e.clientY - (r.top + r.height / 2)) / (r.height / 2));
  }

  const artifact = ARTIFACTS[active];

  return (
    <div className="artifact-grid" style={{ display: "grid", gridTemplateColumns: "0.9fr 1.1fr", gap: 64, alignItems: "center" }}>
      {/* The object */}
      <div
        ref={stageRef}
        onMouseMove={onMove}
        onMouseLeave={() => {
          mx.set(0);
          my.set(0);
        }}
        className="artifact-stage"
        style={{
          position: "relative",
          minHeight: 340,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          perspective: 1100,
          backgroundImage: "radial-gradient(58% 50% at 50% 86%, rgba(200,164,100,0.16) 0%, transparent 66%)",
        }}
      >
        <AnimatePresence mode="wait">
          <motion.div
            key={artifact.id}
            initial={{ opacity: 0, scale: 0.94, rotateY: -14 }}
            animate={{ opacity: 1, scale: 1, rotateY: 0 }}
            exit={{ opacity: 0, scale: 0.96, rotateY: 12 }}
            transition={{ duration: 0.5, ease: EASE }}
            style={{ transformStyle: "preserve-3d" }}
          >
            <motion.div
              style={{
                position: "relative",
                rotateX: reduce ? 0 : rotateX,
                rotateY: reduce ? 0 : rotateY,
                transformStyle: "preserve-3d",
                filter: "var(--lp-object-shadow)",
              }}
            >
              {artifact.id === "chip" ? <Chip drawn /> : <Card drawn />}
              {/* The specular, following the hand rather than a loop. */}
              <motion.div
                aria-hidden
                style={{
                  position: "absolute",
                  inset: 0,
                  pointerEvents: "none",
                  borderRadius: artifact.id === "chip" ? "50%" : 12,
                  background: reduce ? "none" : glare,
                  mixBlendMode: "screen",
                }}
              />
            </motion.div>
          </motion.div>
        </AnimatePresence>
      </div>

      {/* What it is */}
      <div>
        <div role="tablist" aria-label="Chip or card" style={{ display: "flex", gap: 4, marginBottom: 28 }}>
          {ARTIFACTS.map((a, i) => (
            <button
              key={a.id}
              role="tab"
              aria-selected={i === active}
              onClick={() => setActive(i)}
              className={i === active ? "artifact-tab artifact-tab-on" : "artifact-tab"}
            >
              {a.label}
            </button>
          ))}
        </div>

        <AnimatePresence mode="wait">
          <motion.div
            key={artifact.id}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            transition={{ duration: 0.35, ease: EASE }}
          >
            <h4 style={{ ...type.h3, color: c.bone, marginBottom: 16 }}>{artifact.headline}</h4>
            <p style={{ ...type.body, color: c.patina, margin: "0 0 28px", maxWidth: "52ch" }}>{artifact.body}</p>

            <dl style={{ margin: 0, display: "flex", flexDirection: "column" }}>
              {artifact.spec.map(([k, v]) => (
                <div key={k} style={{ display: "flex", gap: 20, padding: "11px 0", borderTop: `1px solid ${c.hairline}` }}>
                  <dt style={{ fontSize: 14, color: c.ash, width: 82, flexShrink: 0 }}>{k}</dt>
                  <dd style={{ fontSize: 14.5, color: c.patina, margin: 0 }}>{v}</dd>
                </div>
              ))}
            </dl>
          </motion.div>
        </AnimatePresence>

        <p style={{ ...type.small, color: c.patina, marginTop: 28, maxWidth: "56ch" }}>
          Both hold a private key set once at manufacture. A scan asks it to sign a
          challenge; a copy has no key to sign with, so it fails.
        </p>
      </div>
    </div>
  );
}
