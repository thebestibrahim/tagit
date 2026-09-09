"use client";
import { useRef } from "react";
import { motion, useMotionValue, useReducedMotion, useSpring, useTransform } from "motion/react";
import { EASE } from "../styles";

/**
 * The certificate.
 *
 * The headline promises proof that stays with the piece, so the hero shows the
 * proof: the document a buyer is holding seconds after they tap, with the piece
 * named, the maker's seal stamped on it, every owner listed, and the line that
 * says it was confirmed by a scan and cannot be copied.
 *
 * Luxury houses have issued warranty cards and certificates for a century. This
 * is that object, in the form that cannot be forged, which is a far more direct
 * argument than an abstract mark.
 *
 * The card is dark stock with gold foil in both themes, because it is an object
 * in the room rather than a surface of the page.
 */

const W = 660;
const H = 412;

/* Engine-turned guilloché, the pattern on a share certificate or a watch dial.
   A hypotrochoid closes after `r / gcd(R, r)` turns, so with a prime r it draws
   one continuous rosette. Cheap to generate once at module load, and it is what
   makes the card read as a document of value rather than a UI panel. */
function rosette(R: number, r: number, d: number, steps = 620) {
  const turns = r;
  const pts: string[] = [];
  for (let i = 0; i <= steps; i++) {
    const t = (i / steps) * turns * 2 * Math.PI;
    const k = (R - r) / r;
    const x = (R - r) * Math.cos(t) + d * Math.cos(k * t);
    const y = (R - r) * Math.sin(t) - d * Math.sin(k * t);
    pts.push(`${x.toFixed(1)} ${y.toFixed(1)}`);
  }
  return "M" + pts.join("L");
}

const GUILLOCHE = [rosette(190, 7, 76), rosette(146, 11, 52)];

const DETAILS = [
  ["Reference", "X7F3C9"],
  ["Origin", "Lagos Atelier, 2024"],
  ["Issued", "12 February 2024"],
];

const OWNERS = [
  ["Maison Lagos", "Brand origin"],
  ["Adaeze Okonkwo", "First owner"],
  ["Chidinma Eze", "Current owner"],
];

/** The maker's seal, stamped on the card. */
function Seal({ x, y, r, foil }: { x: number; y: number; r: number; foil: string }) {
  const ticks = Array.from({ length: 36 }, (_, i) => {
    const rad = (i * 10 - 90) * (Math.PI / 180);
    const inner = i % 3 === 0 ? r * 0.74 : r * 0.82;
    return {
      i,
      x1: x + Math.cos(rad) * inner,
      y1: y + Math.sin(rad) * inner,
      x2: x + Math.cos(rad) * (r * 0.92),
      y2: y + Math.sin(rad) * (r * 0.92),
    };
  });

  return (
    <g>
      <circle cx={x} cy={y} r={r} fill="#0F0C05" stroke={`url(#${foil})`} strokeWidth={1.6} />
      {ticks.map((t) => (
        <line key={t.i} x1={t.x1} y1={t.y1} x2={t.x2} y2={t.y2} stroke="#C8A464" strokeOpacity={t.i % 3 === 0 ? 0.85 : 0.4} strokeWidth={1} strokeLinecap="round" />
      ))}
      <circle cx={x} cy={y} r={r * 0.6} stroke="#C8A464" strokeOpacity={0.35} strokeWidth={0.9} fill="none" />
      <text
        x={x}
        y={y + 1}
        textAnchor="middle"
        dominantBaseline="central"
        fill={`url(#${foil})`}
        style={{ fontFamily: "var(--font-display)", fontSize: r * 0.92, fontStyle: "italic" }}
      >
        T
      </text>
    </g>
  );
}


/* ── The phone card ───────────────────────────────────────────────
   At 390px the full certificate's small print lands around 7px, which is
   not a document anyone can read. This is the same object with the same
   voice, carrying only what the hero has to say: the piece, the maker's
   seal, who holds it, and that a tap proved it. The details block moves
   to the scan sequence below, where there is room for it. */

const CW = 420;
const CH = 332;

function CompactCard({ reduce }: { reduce: boolean | null }) {
  const rise = (delay: number) =>
    reduce
      ? { initial: false as const }
      : { initial: { opacity: 0, y: 8 }, animate: { opacity: 1, y: 0 }, transition: { duration: 0.6, ease: EASE, delay } };

  return (
    <motion.svg
      viewBox={`0 0 ${CW} ${CH}`}
      width="100%"
      height="100%"
      fill="none"
      role="img"
      aria-label="A Tagit certificate of authenticity for The Meridian Automatic by Maison Lagos, currently owned by Chidinma Eze and confirmed authentic by scan."
      initial={reduce ? false : { opacity: 0, y: 22, scale: 0.97 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 1.1, ease: EASE, delay: 0.5 }}
      style={{ display: "block" }}
    >
      <defs>
        <linearGradient id="stockC" x1="6%" y1="0%" x2="94%" y2="100%">
          <stop offset="0%" stopColor="#23201A" />
          <stop offset="46%" stopColor="#14120E" />
          <stop offset="100%" stopColor="#1E1B15" />
        </linearGradient>
        <linearGradient id="foilC" x1="8%" y1="6%" x2="92%" y2="94%">
          <stop offset="0%" stopColor="#F5E6C0" />
          <stop offset="48%" stopColor="#C8A464" />
          <stop offset="100%" stopColor="#8A6C39" />
        </linearGradient>
        <linearGradient id="topEdgeC" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="#C8A464" stopOpacity="0" />
          <stop offset="46%" stopColor="#F0DCAF" stopOpacity="0.9" />
          <stop offset="100%" stopColor="#C8A464" stopOpacity="0" />
        </linearGradient>
        <clipPath id="cardClipC">
          <rect x="0" y="0" width={CW} height={CH} rx="14" />
        </clipPath>
      </defs>

      <rect x="0" y="0" width={CW} height={CH} rx="14" fill="url(#stockC)" />
      <g clipPath="url(#cardClipC)" opacity="0.26">
        {GUILLOCHE.map((d, i) => (
          <path key={i} d={d} transform={`translate(${CW / 2} ${CH / 2}) scale(0.78)`} stroke="#C8A464" strokeOpacity={0.22 - i * 0.05} strokeWidth={0.7} fill="none" />
        ))}
      </g>
      <rect x="0" y="0" width={CW} height={CH} rx="14" stroke="rgba(243,240,233,0.12)" />
      <rect x="0.5" y="0.5" width={CW - 1} height="1.4" fill="url(#topEdgeC)" />
      <rect x="14" y="14" width={CW - 28} height={CH - 28} rx="6" stroke="#C8A464" strokeOpacity="0.2" />

      <motion.g {...rise(0.85)}>
        <text x="34" y="56" fill="#C8A464" style={{ fontFamily: "var(--font-mono)", fontSize: 11.5, letterSpacing: "0.18em" }}>
          CERTIFICATE OF AUTHENTICITY
        </text>
        <text x="34" y="100" fill="#F0EDE6" style={{ fontFamily: "var(--font-display)", fontSize: 36, letterSpacing: "-0.022em" }}>
          The Meridian
        </text>
        <text x="34" y="134" fill="#F0EDE6" style={{ fontFamily: "var(--font-display)", fontSize: 36, letterSpacing: "-0.022em" }}>
          Automatic
        </text>
        <text x="34" y="162" fill="#B3ACA0" style={{ fontSize: 16 }}>
          Maison Lagos &middot; X7F3C9
        </text>
      </motion.g>

      <motion.g
        initial={reduce ? false : { opacity: 0, scale: 1.7 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5, ease: [0.34, 1.3, 0.5, 1], delay: 1.5 }}
        style={{ originX: "352px", originY: "66px" }}
      >
        <Seal x={352} y={66} r={38} foil="foilC" />
      </motion.g>

      <motion.g {...rise(1.1)}>
        <line x1="34" y1="192" x2={CW - 34} y2="192" stroke="#C8A464" strokeOpacity="0.22" />
        <circle cx="38" cy="220" r="4" fill="#C8A464" />
        <text x="56" y="220" dominantBaseline="middle" fill="#F0EDE6" style={{ fontSize: 16, fontWeight: 600 }}>
          Chidinma Eze
        </text>
        <text x="56" y="241" dominantBaseline="middle" fill="#8C8578" style={{ fontSize: 13.5 }}>
          Current owner, third in the record
        </text>
      </motion.g>

      <motion.g {...rise(1.5)}>
        <circle cx="40" cy={CH - 44} r="8" stroke="#5FBF8F" strokeWidth="1.4" fill="none" />
        <motion.path
          d={`M 36 ${CH - 44} L 39 ${CH - 41} L 44.5 ${CH - 47.5}`}
          stroke="#5FBF8F"
          strokeWidth="1.6"
          strokeLinecap="round"
          strokeLinejoin="round"
          initial={reduce ? false : { pathLength: 0 }}
          animate={{ pathLength: 1 }}
          transition={{ duration: 0.4, ease: "easeOut", delay: 1.9 }}
        />
        <text x="60" y={CH - 48} fill="#6FCF9F" style={{ fontSize: 15.5, fontWeight: 600 }}>
          Verified authentic
        </text>
        <text x="60" y={CH - 31} fill="#9A9385" style={{ fontSize: 13 }}>
          Confirmed by tap, moments ago
        </text>
      </motion.g>
    </motion.svg>
  );
}

export default function HeroCertificate() {
  const ref = useRef<HTMLDivElement>(null);
  const reduce = useReducedMotion();

  const mx = useMotionValue(0);
  const my = useMotionValue(0);
  const spring = { stiffness: 60, damping: 20, mass: 0.7 };
  const sx = useSpring(mx, spring);
  const sy = useSpring(my, spring);
  const rotateY = useTransform(sx, (v) => v * 11);
  const rotateX = useTransform(sy, (v) => v * -8);
  const gx = useTransform(sx, (v) => `${50 + v * 32}%`);
  const gy = useTransform(sy, (v) => `${46 + v * 28}%`);
  const glare = useTransform(
    [gx, gy],
    ([x, y]) => `radial-gradient(44% 60% at ${x} ${y}, var(--lp-specular) 0%, transparent 66%)`,
  );

  function onMove(e: React.MouseEvent) {
    if (reduce) return;
    const r = ref.current?.getBoundingClientRect();
    if (!r) return;
    mx.set((e.clientX - (r.left + r.width / 2)) / (r.width / 2));
    my.set((e.clientY - (r.top + r.height / 2)) / (r.height / 2));
  }

  const rise = (delay: number) =>
    reduce
      ? { initial: false as const }
      : { initial: { opacity: 0, y: 8 }, animate: { opacity: 1, y: 0 }, transition: { duration: 0.6, ease: EASE, delay } };

  return (
    <div
      ref={ref}
      onMouseMove={onMove}
      onMouseLeave={() => {
        mx.set(0);
        my.set(0);
      }}
      className="hero-cert"
      style={{ position: "relative", perspective: 1600 }}
    >
      <motion.div
        style={{
          rotateX: reduce ? 0 : rotateX,
          rotateY: reduce ? 0 : rotateY,
          transformStyle: "preserve-3d",
          filter: "var(--lp-object-shadow)",
        }}
      >
        <motion.svg
          className="cert-full"
          viewBox={`0 0 ${W} ${H}`}
          width="100%"
          height="100%"
          fill="none"
          role="img"
          aria-label="A Tagit certificate of authenticity for The Meridian Automatic by Maison Lagos: reference X7F3C9, issued February 2024, three recorded owners, confirmed authentic by scan."
          initial={reduce ? false : { opacity: 0, y: 26, scale: 0.97 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ duration: 1.1, ease: EASE, delay: 0.5 }}
        >
          <defs>
            <linearGradient id="stock" x1="6%" y1="0%" x2="94%" y2="100%">
              <stop offset="0%" stopColor="#23201A" />
              <stop offset="46%" stopColor="#14120E" />
              <stop offset="100%" stopColor="#1E1B15" />
            </linearGradient>
            <linearGradient id="foil" x1="8%" y1="6%" x2="92%" y2="94%">
              <stop offset="0%" stopColor="#F5E6C0" />
              <stop offset="48%" stopColor="#C8A464" />
              <stop offset="100%" stopColor="#8A6C39" />
            </linearGradient>
            <linearGradient id="topEdge" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#C8A464" stopOpacity="0" />
              <stop offset="46%" stopColor="#F0DCAF" stopOpacity="0.9" />
              <stop offset="100%" stopColor="#C8A464" stopOpacity="0" />
            </linearGradient>
            <clipPath id="cardClip">
              <rect x="0" y="0" width={W} height={H} rx="14" />
            </clipPath>
          </defs>

          {/* Card stock */}
          <rect x="0" y="0" width={W} height={H} rx="14" fill="url(#stock)" />

          {/* The engine-turned ground, held inside the card edge */}
          <g clipPath="url(#cardClip)" opacity="0.28">
            {GUILLOCHE.map((d, i) => (
              <motion.path
                key={i}
                d={d}
                transform={`translate(${W / 2} ${H / 2})`}
                stroke="#C8A464"
                strokeOpacity={0.22 - i * 0.05}
                strokeWidth={0.6}
                fill="none"
                initial={reduce ? false : { pathLength: 0 }}
                animate={{ pathLength: 1 }}
                transition={{ duration: 2.4, ease: "easeOut", delay: 0.9 + i * 0.2 }}
              />
            ))}
          </g>

          <rect x="0" y="0" width={W} height={H} rx="14" stroke="rgba(243,240,233,0.12)" />
          <rect x="0.5" y="0.5" width={W - 1} height="1.4" fill="url(#topEdge)" />
          {/* An inner keyline, the way a certificate is bordered */}
          <rect x="18" y="18" width={W - 36} height={H - 36} rx="6" stroke="#C8A464" strokeOpacity="0.2" />

          {/* ── Head: who made it, and the fact it checked out ── */}
          <motion.g {...rise(0.85)}>
            <text x="44" y="62" fill="#C8A464" style={{ fontFamily: "var(--font-mono)", fontSize: 12.5, letterSpacing: "0.2em" }}>
              CERTIFICATE OF AUTHENTICITY
            </text>
            <text x="44" y="104" fill="#F0EDE6" style={{ fontFamily: "var(--font-display)", fontSize: 40, letterSpacing: "-0.022em" }}>
              The Meridian Automatic
            </text>
            <text x="44" y="136" fill="#B3ACA0" style={{ fontSize: 17.5 }}>
              Maison Lagos
            </text>
          </motion.g>

          {/* ── The particulars ── */}
          <motion.g {...rise(1.0)}>
            <line x1="44" y1="158" x2="330" y2="158" stroke="#C8A464" strokeOpacity="0.24" />
            {DETAILS.map(([k, v], i) => (
              <g key={k} transform={`translate(44 ${186 + i * 30})`}>
                <text fill="#8C8578" style={{ fontFamily: "var(--font-mono)", fontSize: 11.5, letterSpacing: "0.14em" }}>
                  {k.toUpperCase()}
                </text>
                <text x="128" fill="#E2DDD2" style={{ fontSize: 16 }}>
                  {v}
                </text>
              </g>
            ))}
          </motion.g>

          {/* ── Every hand it has passed through ── */}
          <motion.g {...rise(1.18)}>
            <text x="382" y="186" fill="#8C8578" style={{ fontFamily: "var(--font-mono)", fontSize: 11.5, letterSpacing: "0.14em" }}>
              OWNERSHIP
            </text>
            {OWNERS.map(([name, role], i) => {
              const current = i === OWNERS.length - 1;
              return (
                <g key={name} transform={`translate(382 ${214 + i * 34})`}>
                  <circle cx="4" cy="6" r={current ? 4 : 3} fill={current ? "#C8A464" : "none"} stroke="#C8A464" strokeOpacity={current ? 1 : 0.45} strokeWidth="1.2" />
                  <text x="20" y="6" dominantBaseline="middle" fill={current ? "#F0EDE6" : "#A8A196"} style={{ fontSize: 16, fontWeight: current ? 600 : 400 }}>
                    {name}
                  </text>
                  <text x="20" y="22" dominantBaseline="middle" fill="#8C8578" style={{ fontSize: 13.5 }}>
                    {role}
                  </text>
                </g>
              );
            })}
          </motion.g>

          {/* ── The seal, stamped last ── */}
          <motion.g
            initial={reduce ? false : { opacity: 0, scale: 1.7 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5, ease: [0.34, 1.3, 0.5, 1], delay: 1.5 }}
            style={{ originX: "560px", originY: "78px" }}
          >
            <Seal x={560} y={78} r={44} foil="foil" />
          </motion.g>

          {/* ── The line that makes it proof rather than a label ── */}
          <motion.g {...rise(1.75)}>
            <line x1="44" y1={H - 74} x2={W - 44} y2={H - 74} stroke="#C8A464" strokeOpacity="0.2" />
            <circle cx="52" cy={H - 46} r="8" stroke="#5FBF8F" strokeWidth="1.4" fill="none" />
            <motion.path
              d={`M 48 ${H - 46} L 51 ${H - 43} L 56.5 ${H - 49.5}`}
              stroke="#5FBF8F"
              strokeWidth="1.6"
              strokeLinecap="round"
              strokeLinejoin="round"
              initial={reduce ? false : { pathLength: 0 }}
              animate={{ pathLength: 1 }}
              transition={{ duration: 0.4, ease: "easeOut", delay: 2.0 }}
            />
            <text x="72" y={H - 50} fill="#6FCF9F" style={{ fontSize: 16, fontWeight: 600 }}>
              Verified authentic
            </text>
            <text x="72" y={H - 31} fill="#9A9385" style={{ fontSize: 14 }}>
              Confirmed by tap. The chip signed a challenge no copy can answer.
            </text>
          </motion.g>
        </motion.svg>

        <div className="cert-compact">
          <CompactCard reduce={reduce} />
        </div>

        <motion.div
          aria-hidden
          style={{
            position: "absolute",
            inset: 0,
            borderRadius: 14,
            pointerEvents: "none",
            background: reduce ? "none" : glare,
            mixBlendMode: "screen",
          }}
        />
      </motion.div>
    </div>
  );
}
