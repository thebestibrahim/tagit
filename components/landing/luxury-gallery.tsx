"use client";
import { motion, useReducedMotion, useTransform } from "motion/react";
import { Plate, useSectionProgress } from "./interactive/cinema";
import { GRADE_DEEP, c, ground, type, rise } from "./styles";

type Item = { label: string; sub: string; src: string; focus: string; depth: number; grade?: string };

const ITEMS: Item[] = [
  { label: "Timepieces", sub: "Swiss and independent horology", src: "/img/watch.jpg", focus: "58% 62%", depth: 0.3 },
  { label: "Leather goods", sub: "Bags, wallets and small goods", src: "/img/bag.jpg", focus: "center", depth: 0.16 },
  { label: "Jewellery", sub: "Fine and haute joaillerie", src: "/img/jewellery.jpg", focus: "52% 38%", depth: 0.34,
    /* Shot high-key against white, so it needs a deeper grade than the rest to
       sit in the same room. */
    grade: GRADE_DEEP },
  { label: "Ready to wear", sub: "Couture and limited editions", src: "/img/fashion-gallery.jpg", focus: "center", depth: 0.2 },
];

/**
 * A tracking shot past a vitrine.
 *
 * The strip is wider than the viewport on purpose and slides laterally against
 * the scroll, so the pieces pass the camera rather than sitting in a grid. Each
 * plate also drifts vertically at its own rate, which is what stops four
 * photographs shot in four different studios from reading as four stickers.
 */
export default function LuxuryGallery() {
  const [ref, progress] = useSectionProgress();
  const reduce = useReducedMotion();
  const x = useTransform(progress, [0, 1], ["0%", "-7%"]);

  return (
    <section ref={ref} className="gallery-section" style={{ backgroundColor: c.abyss, padding: "56px 0 128px", position: "relative", overflow: "hidden" }}>
      <div className="lp-inner" style={{ maxWidth: 1280, margin: "0 auto", padding: "0 56px 64px" }}>
        <div className="gallery-header" style={{ display: "grid", gridTemplateColumns: "1.05fr 0.95fr", gap: 56, alignItems: "end" }}>
          <motion.h2 {...rise()} style={{ ...type.h2, color: c.bone, maxWidth: "14ch" }}>
            The things people never throw away.
          </motion.h2>

          <motion.p {...rise(0.1)} style={{ ...type.lead, color: c.patina, maxWidth: "44ch" }}>
            A watch, a bag, a ring. The pieces your customers keep for thirty years
            deserve a record that lasts at least as long.
          </motion.p>
        </div>
      </div>

      <motion.div
        className="gallery-strip"
        style={{
          display: "flex",
          gap: 10,
          paddingLeft: 56,
          x: reduce ? 0 : x,
          willChange: "transform",
        }}
      >
        {ITEMS.map((item) => (
          <Plate
            key={item.label}
            src={item.src}
            alt={item.label}
            focus={item.focus}
            depth={item.depth}
            grade={item.grade}
            className="gallery-plate"
            style={{ flex: "0 0 clamp(230px, 25vw, 380px)", height: "clamp(320px, 40vw, 540px)", borderRadius: 4 }}
            scrim={`linear-gradient(to top, ${ground(0.92)} 0%, ${ground(0.15)} 44%, transparent 72%)`}
          >
            <div style={{ position: "absolute", bottom: 24, left: 24, right: 20, zIndex: 2 }}>
              <p
                style={{
                  margin: "0 0 5px",
                  fontFamily: "var(--font-display)",
                  fontSize: "clamp(20px, 1.8vw, 26px)",
                  color: c.bone,
                  letterSpacing: "-0.024em",
                  lineHeight: 1.12,
                }}
              >
                {item.label}
              </p>
              <p style={{ ...type.small, color: c.patina }}>{item.sub}</p>
            </div>
          </Plate>
        ))}
      </motion.div>
    </section>
  );
}
