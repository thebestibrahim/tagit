"use client";

/**
 * The camera rig for the landing page.
 *
 * Everything here exists so the page reads as one continuous shot rather than a
 * stack of sections: a single grain and vignette pass over the whole reel, one
 * colour grade on every photograph, and depth produced by layers travelling at
 * different rates against the scroll.
 *
 * Two rules:
 *  - Nothing animates on its own timer. Motion is either scroll-linked or
 *    answers something the visitor did. The one exception is the hero's opening
 *    frame, which is the film starting.
 *  - Every effect here collapses to a static, legible page under
 *    `prefers-reduced-motion`. The parallax is the styling, not the content.
 */

import {
  motion,
  useInView,
  useScroll,
  useTransform,
  useReducedMotion,
  type MotionValue,
} from "motion/react";
import { useRef, type CSSProperties, type ReactNode } from "react";
import { GRADE, c } from "../styles";

/* ── Scroll plumbing ─────────────────────────────────────────────── */

/**
 * Progress from 0 (element's top edge entering the bottom of the viewport) to
 * 1 (its bottom edge leaving the top). The natural clock for anything that
 * should move while an element is on screen.
 */
function usePassage(ref: React.RefObject<HTMLElement | null>) {
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start end", "end start"],
  });
  return scrollYProgress;
}

/**
 * A layer that travels against the scroll. `depth` is how far behind the page
 * it sits: 0 is glued to the page, 1 drifts a full 100px over its passage.
 * Positive depth reads as further away, negative as closer to the camera.
 */
export function Parallax({
  children,
  depth = 0.5,
  style,
  className,
}: {
  children: ReactNode;
  depth?: number;
  style?: CSSProperties;
  className?: string;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const progress = usePassage(ref);
  const reduce = useReducedMotion();
  const y = useTransform(progress, [0, 1], [depth * 100, depth * -100]);

  return (
    <motion.div ref={ref} className={className} style={{ ...style, y: reduce ? 0 : y }}>
      {children}
    </motion.div>
  );
}

/* ── The grade ───────────────────────────────────────────────────── */

/**
 * Film grain over the entire page. Fixed, so it belongs to the lens rather than
 * to any one section, and stepped rather than eased so it flickers like stock
 * instead of breathing like a gradient.
 */
export function Grain({ opacity }: { opacity?: number }) {
  return (
    <div
      className="cine-grain"
      aria-hidden
      style={{
        position: "fixed",
        inset: "-120px",
        zIndex: 60,
        pointerEvents: "none",
        opacity: opacity ?? "var(--lp-grain)",
        mixBlendMode: "overlay",
        backgroundImage:
          "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='220' height='220'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.82' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='220' height='220' filter='url(%23n)'/%3E%3C/svg%3E\")",
      }}
    />
  );
}

/** Edge falloff. A real lens darkens its corners; a flat page does not.
 *  In the lit room it becomes a warm falloff rather than a black one. */
export function Vignette() {
  return (
    <div
      aria-hidden
      className="cine-vignette"
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 59,
        pointerEvents: "none",
        background:
          "radial-gradient(120% 90% at 50% 45%, transparent 42%, var(--lp-vignette) 100%)",
      }}
    />
  );
}

/* ── Light ───────────────────────────────────────────────────────── */

/**
 * The key light. One warm source, always off-centre, never a symmetric halo.
 * `travel` slides it across its section as you scroll, so the room appears to
 * turn past a fixed lamp rather than carrying its own glow around with it.
 */
export function KeyLight({
  x = "72%",
  y = "38%",
  size = 90,
  intensity = 0.16,
  travel = 6,
}: {
  x?: string;
  y?: string;
  size?: number;
  intensity?: number;
  travel?: number;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const progress = usePassage(ref);
  const reduce = useReducedMotion();
  const shift = useTransform(progress, [0, 1], [travel, -travel]);

  return (
    <div ref={ref} aria-hidden style={{ position: "absolute", inset: 0, pointerEvents: "none", overflow: "hidden" }}>
      <motion.div
        style={{
          position: "absolute",
          inset: "-20%",
          y: reduce ? 0 : shift,
          background: `radial-gradient(${size}% ${size * 0.8}% at ${x} ${y}, rgba(200,164,100,${intensity}) 0%, rgba(200,164,100,${intensity * 0.35}) 28%, transparent 62%)`,
        }}
      />
    </div>
  );
}

/* ── Photography ─────────────────────────────────────────────────── */

/**
 * A photograph, graded and moving. The image is over-scaled inside its frame so
 * the drift never exposes an edge, and it carries the same grade as every other
 * still on the page: the source material was shot under wildly different light,
 * and one pass over all of it is what makes the reel look like one film.
 */
export function Plate({
  src,
  alt,
  depth = 0.35,
  focus = "center",
  grade = GRADE,
  scrim,
  overscan = 1.18,
  style,
  className,
  children,
}: {
  src: string;
  alt: string;
  depth?: number;
  focus?: string;
  grade?: string;
  /** A gradient painted over the image so type stays readable on it. */
  scrim?: string;
  overscan?: number;
  style?: CSSProperties;
  className?: string;
  children?: ReactNode;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const progress = usePassage(ref);
  const reduce = useReducedMotion();
  const drift = depth * 100;
  const y = useTransform(progress, [0, 1], [-drift, drift]);

  return (
    <div
      ref={ref}
      className={className}
      style={{ position: "relative", overflow: "hidden", backgroundColor: c.plate, ...style }}
    >
      <motion.div
        style={{
          position: "absolute",
          top: `${(1 - overscan) * 50}%`,
          left: 0,
          width: "100%",
          height: `${overscan * 100}%`,
          y: reduce ? 0 : y,
          willChange: "transform",
        }}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={src}
          alt={alt}
          style={{
            width: "100%",
            height: "100%",
            objectFit: "cover",
            objectPosition: focus,
            filter: grade,
          }}
        />
      </motion.div>

      {/* Warm the shadows, the way a colourist would, so steel and skin sit in
          the same room as the gold. */}
      <div
        aria-hidden
        style={{
          position: "absolute",
          inset: 0,
          background: "var(--lp-photo-warm)",
          mixBlendMode: "multiply",
        }}
      />
      {scrim && <div aria-hidden style={{ position: "absolute", inset: 0, background: scrim }} />}

      {children}
    </div>
  );
}

/* ── Type as an entrance ─────────────────────────────────────────── */

/**
 * Lines rising out of a mask. Used exactly twice on the page: the hero, which is
 * the film starting, and the closing invitation. Everywhere else, type arrives
 * because you scrolled it into frame.
 */
export function LineReveal({
  lines,
  delay = 0,
  stagger = 0.09,
  style,
  inView = false,
}: {
  lines: string[];
  delay?: number;
  stagger?: number;
  style?: CSSProperties;
  /** Wait until the block is on screen instead of firing on load. */
  inView?: boolean;
}) {
  const ref = useRef<HTMLSpanElement>(null);
  /* One observer on the block rather than `whileInView` per line: the per-line
     form left the closing headline masked when the section was entered by a
     jump rather than a scroll, and an unrevealed headline is a blank page. */
  const onScreen = useInView(ref, { once: true, margin: "-12%" });
  const reduce = useReducedMotion();
  const play = inView ? onScreen : true;

  const from = reduce ? { y: "0%", opacity: 0 } : { y: "112%", opacity: 1 };
  const to = { y: "0%", opacity: 1 };

  return (
    <span ref={ref} style={{ display: "block", ...style }}>
      {lines.map((line, i) => (
        <span key={line} style={{ display: "block", overflow: "hidden", paddingBottom: "0.06em" }}>
          <motion.span
            style={{ display: "block", willChange: "transform" }}
            initial={from}
            animate={play ? to : from}
            transition={{ delay: delay + i * stagger, duration: 1.05, ease: [0.16, 1, 0.3, 1] }}
          >
            {line}
          </motion.span>
        </span>
      ))}
    </span>
  );
}

/* ── Section frame ───────────────────────────────────────────────── */

/**
 * A cut in the reel. Sections are not boxes with borders: they are separated by
 * a hairline of light that fades out at both ends, the way a shaft of light
 * falls off rather than stopping.
 */
export function LightSeam({ width = "62%" }: { width?: string }) {
  return (
    <div
      aria-hidden
      style={{
        height: 1,
        width,
        background: `linear-gradient(90deg, ${c.hairlineWarm}, ${c.hairline} 40%, transparent)`,
      }}
    />
  );
}

/** Shared so a caller can drive its own scroll-linked value off a section. */
export function useSectionProgress(): [React.RefObject<HTMLDivElement | null>, MotionValue<number>] {
  const ref = useRef<HTMLDivElement>(null);
  return [ref, usePassage(ref)];
}
