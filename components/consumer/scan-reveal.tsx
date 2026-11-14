"use client";

import { useState } from "react";
import { TagitMarkGlyph } from "@/components/ui/TagitMarkGlyph";
import { ENGRAVING, scanStyles as s } from "./scan-chrome";

const round = (n: number) => Math.round(n * 100) / 100;
const R = 38;
const TICKS = Array.from({ length: 36 }, (_, i) => {
  const a = ((i * 10 - 90) * Math.PI) / 180;
  const inner = i % 3 === 0 ? R * 0.74 : R * 0.82;
  return {
    i,
    x1: round(40 + Math.cos(a) * inner),
    y1: round(40 + Math.sin(a) * inner),
    x2: round(40 + Math.cos(a) * R * 0.92),
    y2: round(40 + Math.sin(a) * R * 0.92),
  };
});

/**
 * The moment a tap lands: Tagit's seal draws itself in the brand's colour and
 * says the verdict, then lifts away to the page. It plays once per page load,
 * a tap skips it, and it never shows to people who ask for reduced motion.
 * Purely ceremonial: the verdict is also in the page's own hero, so this layer
 * is hidden from screen readers.
 */
export function ScanReveal({ verdict, house }: { verdict: string; house: string }) {
  const [state, setState] = useState<"on" | "leaving" | "gone">("on");
  if (state === "gone") return null;

  return (
    <div
      aria-hidden
      className={`${s.reveal} ${state === "leaving" ? s.revealLeaving : ""}`}
      onClick={() => setState("leaving")}
      onAnimationEnd={(e) => {
        if (e.target === e.currentTarget && e.animationName.includes("revealOut")) setState("gone");
      }}
    >
      <svg className={s.revealEngraving} viewBox="-260 -260 520 520">
        {ENGRAVING.map((d, i) => (
          <path key={i} d={d} stroke="currentColor" strokeWidth={0.7} fill="none" strokeOpacity={1 - i * 0.35} />
        ))}
      </svg>

      <svg className={s.revealSeal} width={132} height={132} viewBox="0 0 80 80" fill="none">
        <circle className={s.revealRing} cx="40" cy="40" r={R} stroke="currentColor" strokeWidth="1.3" pathLength={240} transform="rotate(-90 40 40)" />
        {TICKS.map((t) => (
          <line
            key={t.i}
            className={s.revealTick}
            style={{ animationDelay: `${0.2 + t.i * 0.02}s` }}
            x1={t.x1}
            y1={t.y1}
            x2={t.x2}
            y2={t.y2}
            stroke="currentColor"
            strokeOpacity={t.i % 3 === 0 ? 0.9 : 0.45}
            strokeLinecap="round"
          />
        ))}
        <g className={s.revealMark}>
          <TagitMarkGlyph cx={40} cy={40} size={44} paint="currentColor" />
        </g>
      </svg>

      <p className={s.revealWord}>{verdict}</p>
      <p className={s.revealHouse}>{house}</p>
    </div>
  );
}
