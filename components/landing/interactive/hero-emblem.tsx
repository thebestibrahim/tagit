"use client";
import { useRef } from "react";
import { motion, useMotionValue, useReducedMotion, useSpring, useTransform } from "motion/react";
import { EASE, c } from "../styles";

/**
 * The mark.
 *
 * A photograph of a wristwatch says "luxury" and nothing else. This says the
 * whole proposition in one object, read from the outside in:
 *
 *   bezel and ticks   the piece, and the precision it was made to
 *   the coil          the chip closed inside it
 *   the die           an identity only the maker can issue
 *   the orbit         every hand it passes through, the last one lit
 *
 * It is drawn rather than rendered so it themes with the page, stays sharp at
 * any size, and carries no other brand's logo on its face. The one orchestrated
 * entrance on the page happens here: it assembles itself once, outside in, and
 * then only answers the cursor.
 */

const CX = 260;
const CY = 260;

/* Bezel graduations. Every 5°, with a longer mark at each 30°, the way a
   chronometer bezel is divided. */
const TICKS = Array.from({ length: 72 }, (_, i) => {
  const deg = i * 5;
  const major = deg % 30 === 0;
  const rad = (deg - 90) * (Math.PI / 180);
  const outer = 240;
  const inner = major ? 226 : 233;
  return {
    deg,
    major,
    x1: CX + Math.cos(rad) * inner,
    y1: CY + Math.sin(rad) * inner,
    x2: CX + Math.cos(rad) * outer,
    y2: CY + Math.sin(rad) * outer,
  };
});

/* The coil, drawn from the outside in so it reads as winding down to the die. */
const COIL = [150, 132, 114, 96, 78];

/* Three hands: the maker, a collector, and whoever holds it now. */
const ORBIT_R = 196;
const OWNERS = [-120, -30, 60].map((deg) => {
  const rad = deg * (Math.PI / 180);
  return { x: CX + Math.cos(rad) * ORBIT_R, y: CY + Math.sin(rad) * ORBIT_R };
});

export default function HeroEmblem() {
  const ref = useRef<HTMLDivElement>(null);
  const reduce = useReducedMotion();

  const mx = useMotionValue(0);
  const my = useMotionValue(0);
  const spring = { stiffness: 60, damping: 20, mass: 0.7 };
  const sx = useSpring(mx, spring);
  const sy = useSpring(my, spring);
  const rotateY = useTransform(sx, (v) => v * 13);
  const rotateX = useTransform(sy, (v) => v * -10);
  const glareX = useTransform(sx, (v) => `${50 + v * 30}%`);
  const glareY = useTransform(sy, (v) => `${44 + v * 26}%`);
  const glare = useTransform(
    [glareX, glareY],
    ([gx, gy]) =>
      `radial-gradient(40% 40% at ${gx} ${gy}, var(--lp-specular) 0%, transparent 68%)`,
  );

  function onMove(e: React.MouseEvent) {
    if (reduce) return;
    const r = ref.current?.getBoundingClientRect();
    if (!r) return;
    mx.set((e.clientX - (r.left + r.width / 2)) / (r.width / 2));
    my.set((e.clientY - (r.top + r.height / 2)) / (r.height / 2));
  }

  /* With motion off the mark is simply present, fully drawn. */
  const enter = (delay: number, duration = 0.9) =>
    reduce
      ? { initial: false as const }
      : { initial: { pathLength: 0, opacity: 0 }, animate: { pathLength: 1, opacity: 1 }, transition: { duration, ease: EASE, delay } };

  return (
    <div
      ref={ref}
      onMouseMove={onMove}
      onMouseLeave={() => {
        mx.set(0);
        my.set(0);
      }}
      className="hero-emblem"
      style={{ position: "relative", perspective: 1400, color: c.key }}
    >
      {/* The lamp behind the mark, so it sits in the room rather than on it. */}
      <div
        aria-hidden
        style={{
          position: "absolute",
          inset: "-30%",
          background: `radial-gradient(50% 50% at 50% 52%, ${c.keyGlow} 0%, transparent 70%)`,
          pointerEvents: "none",
        }}
      />

      <motion.svg
        viewBox="0 0 520 520"
        width="100%"
        height="100%"
        fill="none"
        role="img"
        aria-label="The Tagit mark: a bezel and its graduations, the chip coil closed inside it, the maker's die at the centre, and the ring of owners it passes through."
        style={{
          display: "block",
          position: "relative",
          rotateX: reduce ? 0 : rotateX,
          rotateY: reduce ? 0 : rotateY,
          transformStyle: "preserve-3d",
        }}
      >
        <defs>
          <radialGradient id="emblemDie" cx="34%" cy="30%">
            <stop offset="0%" stopColor="#2E2512" />
            <stop offset="100%" stopColor="#0B0904" />
          </radialGradient>
          <linearGradient id="emblemRim" x1="12%" y1="0%" x2="88%" y2="100%">
            <stop offset="0%" stopColor="#F2E1B6" />
            <stop offset="46%" stopColor="#C8A464" />
            <stop offset="100%" stopColor="#7C6231" />
          </linearGradient>
        </defs>

        {/* 1. The piece: bezel and graduations */}
        <motion.circle cx={CX} cy={CY} r={246} stroke="currentColor" strokeOpacity={0.72} strokeWidth={1.3} {...enter(0.25, 1.2)} />
        <motion.circle cx={CX} cy={CY} r={218} stroke="currentColor" strokeOpacity={0.38} strokeWidth={1.1} {...enter(0.4, 1.2)} />
        <motion.g
          initial={reduce ? false : { opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.9, ease: EASE, delay: 0.75 }}
        >
          {TICKS.map((t) => (
            <line
              key={t.deg}
              x1={t.x1}
              y1={t.y1}
              x2={t.x2}
              y2={t.y2}
              stroke="currentColor"
              strokeOpacity={t.major ? 0.95 : 0.48}
              strokeWidth={t.major ? 2 : 1.2}
              strokeLinecap="round"
            />
          ))}
        </motion.g>

        {/* 2. The chip closed inside it */}
        {COIL.map((r, i) => (
          <motion.circle
            key={r}
            cx={CX}
            cy={CY}
            r={r}
            stroke="currentColor"
            strokeOpacity={0.82 - i * 0.09}
            strokeWidth={1.7}
            {...enter(1.0 + i * 0.09, 0.8)}
          />
        ))}
        {/* the lead that steps the coil in to the die */}
        <motion.path d={`M ${CX} ${CY - 150} L ${CX} ${CY - 78}`} stroke="currentColor" strokeOpacity={0.6} strokeWidth={1.7} {...enter(1.5, 0.5)} />

        {/* 3. The maker's die */}
        <motion.g
          initial={reduce ? false : { opacity: 0, scale: 0.82 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.8, ease: EASE, delay: 1.55 }}
          style={{ originX: "260px", originY: "260px" }}
        >
          <circle cx={CX} cy={CY} r={54} fill="url(#emblemDie)" />
          <circle cx={CX} cy={CY} r={54} stroke="url(#emblemRim)" strokeWidth={2.6} />
          <text
            x={CX}
            y={CY + 2}
            textAnchor="middle"
            dominantBaseline="central"
            fill="url(#emblemRim)"
            style={{ fontFamily: "var(--font-display)", fontSize: 52, fontStyle: "italic" }}
          >
            T
          </text>
        </motion.g>

        {/* 4. Every hand it passes through */}
        <motion.circle
          cx={CX}
          cy={CY}
          r={ORBIT_R}
          stroke="currentColor"
          strokeOpacity={0.5}
          strokeWidth={1.2}
          strokeDasharray="2 7"
          {...enter(1.85, 1.1)}
        />
        {OWNERS.map((o, i) => {
          const current = i === OWNERS.length - 1;
          return (
            <motion.g
              key={i}
              initial={reduce ? false : { opacity: 0, scale: 0.4 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.55, ease: EASE, delay: 2.15 + i * 0.16 }}
              style={{ originX: `${o.x}px`, originY: `${o.y}px` }}
            >
              {current && <circle cx={o.x} cy={o.y} r={15} fill="currentColor" opacity={0.14} />}
              <circle
                cx={o.x}
                cy={o.y}
                r={6.5}
                fill={current ? "currentColor" : "var(--lp-abyss)"}
                stroke="currentColor"
                strokeOpacity={current ? 1 : 0.6}
                strokeWidth={1.4}
              />
            </motion.g>
          );
        })}
      </motion.svg>

      {/* The specular, following the hand rather than a loop. */}
      <motion.div
        aria-hidden
        style={{
          position: "absolute",
          inset: 0,
          borderRadius: "50%",
          pointerEvents: "none",
          background: reduce ? "none" : glare,
          mixBlendMode: "screen",
        }}
      />
    </div>
  );
}
