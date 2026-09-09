"use client";
import { useRef } from "react";
import Link from "next/link";
import {
  motion,
  useScroll,
  useTransform,
  useMotionValue,
  useSpring,
  useReducedMotion,
} from "motion/react";
import { LineReveal } from "./interactive/cinema";
import HeroCertificate from "./interactive/hero-certificate";
import { EASE, c, ground, type } from "./styles";

/**
 * The opening title card.
 *
 * Centred, and stripped to three things: the line, the sentence under it, and
 * the piece itself rising into the bottom of the frame. The proof panel that
 * used to float here now lives in the scan sequence directly below, where it
 * has something to prove; here it was just another rectangle competing with
 * the object.
 *
 * Depth comes from four layers moving at four rates. Scrolling does not slide
 * the hero away, it dollies past it and dissolves to black.
 */
export default function Hero() {
  const sectionRef = useRef<HTMLElement>(null);
  const reduce = useReducedMotion();

  const { scrollY } = useScroll();
  const plateY = useTransform(scrollY, [0, 900], [0, 130]);
  const plateScale = useTransform(scrollY, [0, 900], [1, 1.14]);
  const copyY = useTransform(scrollY, [0, 900], [0, -170]);
  const dissolve = useTransform(scrollY, [0, 620], [0, 0.94]);
  const cueFade = useTransform(scrollY, [0, 180], [1, 0]);
  const barHeight = useTransform(scrollY, [0, 700], [0, 56]);

  /* A hand on the camera. Nothing moves unless the visitor moves. */
  const px = useMotionValue(0);
  const sx = useSpring(px, { stiffness: 55, damping: 22, mass: 0.7 });
  const copyX = useTransform(sx, (v) => v * 8);

  function onMove(e: React.MouseEvent) {
    if (reduce) return;
    const r = sectionRef.current?.getBoundingClientRect();
    if (!r) return;
    px.set((e.clientX - (r.left + r.width / 2)) / (r.width / 2));
  }

  return (
    <section
      ref={sectionRef}
      onMouseMove={onMove}
      onMouseLeave={() => px.set(0)}
      className="hero"
      style={{
        position: "relative",
        minHeight: "100svh",
        display: "flex",
        alignItems: "flex-start",
        justifyContent: "center",
        overflow: "hidden",
        backgroundColor: c.abyss,
        isolation: "isolate",
      }}
    >
      {/* ── Layer 1: the proof ──
           The headline promises proof that stays with the piece, so the hero
           shows the proof itself: the certificate a buyer is holding seconds
           after they tap. An abstract mark asked people to decode it; this
           states the case. ── */}
      <motion.div
        className="hero-mark"
        style={{
          position: "absolute",
          bottom: "4%",
          left: "50%",
          width: "clamp(300px, min(52vw, 56vh), 690px)",
          marginLeft: "calc(clamp(300px, min(52vw, 56vh), 690px) / -2)",
          zIndex: 4,
          y: reduce ? 0 : plateY,
          scale: reduce ? 1 : plateScale,
          willChange: "transform",
        }}
      >
        <HeroCertificate />
      </motion.div>

      {/* ── Layer 2: the grade. The object keeps the light, the type keeps the dark. ── */}
      <div
        aria-hidden
        className="hero-scrim"
        style={{
          position: "absolute",
          inset: 0,
          background:
            `radial-gradient(70% 52% at 50% 98%, ${ground(0)} 0%, ${ground(0.28)} 36%, ${ground(0.82)} 64%, ${ground(0.96)} 100%)`,
        }}
      />
      <div
        aria-hidden
        style={{
          position: "absolute",
          inset: 0,
          background: `linear-gradient(180deg, ${ground(0.86)} 0%, ${ground(0.4)} 20%, transparent 42%, transparent 84%, ${ground(0.55)} 100%)`,
        }}
      />
      {/* The lamp, placed where the photograph's own light falls. */}
      <div
        aria-hidden
        style={{
          position: "absolute",
          inset: 0,
          background: `radial-gradient(42% 34% at 50% 80%, ${c.keyGlow} 0%, transparent 70%)`,
          mixBlendMode: "screen",
        }}
      />

      {/* Dissolve to black on the way out. */}
      <motion.div
        aria-hidden
        style={{ position: "absolute", inset: 0, backgroundColor: c.abyss, opacity: reduce ? 0 : dissolve, zIndex: 5 }}
      />

      {/* The anamorphic frame: opens once on load, closes as you leave. */}
      <motion.div
        aria-hidden
        initial={{ height: reduce ? 0 : "9vh" }}
        animate={{ height: 0 }}
        transition={{ duration: 1.5, ease: EASE, delay: 0.15 }}
        style={{ position: "absolute", top: 0, left: 0, right: 0, backgroundColor: c.abyss, zIndex: 6 }}
      />
      <motion.div
        aria-hidden
        initial={{ height: reduce ? 0 : "9vh" }}
        animate={{ height: 0 }}
        transition={{ duration: 1.5, ease: EASE, delay: 0.15 }}
        style={{ position: "absolute", bottom: 0, left: 0, right: 0, backgroundColor: c.abyss, zIndex: 6 }}
      />
      <motion.div
        aria-hidden
        style={{ position: "absolute", bottom: 0, left: 0, right: 0, height: reduce ? 0 : barHeight, backgroundColor: c.abyss, zIndex: 6 }}
      />

      {/* ── Layer 3: the title ── */}
      <motion.div
        className="hero-title"
        style={{
          position: "relative",
          zIndex: 7,
          width: "100%",
          maxWidth: 900,
          padding: "clamp(96px, 13vh, 156px) 32px 0",
          textAlign: "center",
          y: reduce ? 0 : copyY,
          x: reduce ? 0 : copyX,
        }}
      >
        <h1 style={{ ...type.display, color: c.bone, margin: "0 0 30px" }}>
          <LineReveal lines={["Proof that stays", "with the piece."]} delay={0.55} stagger={0.11} />
        </h1>

        <motion.div
          initial={{ opacity: 0, y: reduce ? 0 : 18 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1.15, duration: 0.9, ease: EASE }}
        >
          <p style={{ ...type.lead, color: c.patina, margin: "0 auto 38px", maxWidth: "46ch" }}>
            A tag set inside the piece, or a signed card that travels with it. One tap
            proves it is genuine and shows every owner it has had.
          </p>

          <div style={{ display: "flex", gap: 14, flexWrap: "wrap", justifyContent: "center" }}>
            <Link href="/auth/register" className="cine-cta-key">
              Apply for access
            </Link>
            <a href="mailto:business@tagitlux.com?subject=Tagit walkthrough" className="cine-cta-ghost">
              Book a walkthrough
            </a>
          </div>
        </motion.div>
      </motion.div>

      {/* Scroll cue: the only thing on this page that moves by itself. */}
      <motion.div
        className="hero-cue"
        aria-hidden
        style={{
          position: "absolute",
          bottom: 30,
          left: 56,
          zIndex: 7,
          opacity: reduce ? 0 : cueFade,
        }}
      >
        <div style={{ position: "relative", width: 1, height: 52, backgroundColor: c.hairline, overflow: "hidden" }}>
          <div className="cine-cue-spark" />
        </div>
      </motion.div>
    </section>
  );
}
