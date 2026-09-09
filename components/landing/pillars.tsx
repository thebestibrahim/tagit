"use client";
import { motion, useInView } from "motion/react";
import { useRef, type ReactNode } from "react";
import OwnershipLedger from "./interactive/ownership-ledger";
import { KeyLight, Parallax } from "./interactive/cinema";
import { EASE, c, type, rise } from "./styles";

const PILLARS = [
  {
    name: "Identity",
    description:
      "A chip embedded in the piece, or a signed card that travels with it. Either way, it cannot be copied and it outlasts the sale.",
    points: [
      "Every piece carries a mark only you can create",
      "Fakes are caught the moment they are scanned",
      "Chip or card, chosen per piece, per customer",
      "Built to last the lifetime of the piece",
    ],
  },
  {
    name: "Ownership",
    description:
      "A living record of every owner and every transfer. Both sides confirm the handover, so both sides are protected.",
    points: [
      "Brand and buyer both confirm first ownership",
      "Secure, confirmed transfers between owners",
      "A history that cannot be altered or deleted",
      "Permanent proof of origin at resale",
    ],
  },
  {
    name: "Intelligence",
    description:
      "For the first time, you can see where your work travels, who holds it, and what it is worth in the world.",
    points: [
      "See where your pieces travel globally",
      "Track what your work is worth over time",
      "Know when someone tries to fake your pieces",
      "Your own market data, finally yours",
    ],
  },
];

/**
 * Three columns divided by light rather than by rules: each seam is bright where
 * the lamp hits it and falls away down the column. The ledger sits beside the
 * heading as the one piece of evidence in the section, since ownership is the
 * claim a visitor is least likely to take on trust.
 */

/**
 * One drawn mark per pillar. Each is the mechanism it sits above rather than a
 * decorative glyph: the inlay in its housing, a chain of custody, a piece
 * moving across a horizon. Stroked on as the column comes into frame.
 */
function Mark({ children }: { children: ReactNode }) {
  const ref = useRef<SVGSVGElement>(null);
  /* Driven off one observer rather than `whileInView`, which fired for two of
     the three columns and left the first mark permanently undrawn. */
  const onScreen = useInView(ref, { once: true, margin: "-10%" });

  return (
    <motion.svg
      ref={ref}
      width="60"
      height="60"
      viewBox="0 0 64 64"
      fill="none"
      aria-hidden
      initial="rest"
      animate={onScreen ? "drawn" : "rest"}
      /* The marks inherit their gold from `color` so the shapes can use
         currentColor: a CSS variable in a presentation attribute does not
         resolve in every browser. */
      style={{ display: "block", marginBottom: 26, overflow: "visible", color: c.key }}
    >
      {children}
    </motion.svg>
  );
}

const stroke = {
  stroke: "currentColor",
  strokeWidth: 1.5,
  strokeLinecap: "round" as const,
  strokeLinejoin: "round" as const,
  fill: "none",
};

const draw = (delay: number) => ({
  variants: { rest: { pathLength: 0, opacity: 0 }, drawn: { pathLength: 1, opacity: 1 } },
  transition: { duration: 0.8, ease: EASE, delay },
});

const MARKS = [
  /* Identity: the inlay, closed inside its housing. */
  <>
    <motion.circle cx="32" cy="32" r="25" {...stroke} {...draw(0)} />
    <motion.circle cx="32" cy="32" r="16" {...stroke} strokeOpacity={0.5} {...draw(0.14)} />
    <motion.rect x="26" y="26" width="12" height="12" rx="2.5" {...stroke} {...draw(0.28)} />
    <motion.path d="M32 7 v6" {...stroke} {...draw(0.4)} />
  </>,
  /* Ownership: a chain of custody, the hand it is in now filled. */
  <>
    <motion.path d="M11 32 h42" {...stroke} strokeOpacity={0.45} {...draw(0)} />
    <motion.circle cx="11" cy="32" r="5.5" {...stroke} {...draw(0.14)} />
    <motion.circle cx="32" cy="32" r="5.5" {...stroke} {...draw(0.26)} />
    <motion.circle cx="53" cy="32" r="5.5" {...stroke} fill="currentColor" {...draw(0.38)} />
  </>,
  /* Intelligence: where the work is in the world. */
  <>
    <motion.circle cx="32" cy="32" r="24" {...stroke} {...draw(0)} />
    <motion.ellipse cx="32" cy="32" rx="10" ry="24" {...stroke} strokeOpacity={0.5} {...draw(0.16)} />
    <motion.path d="M9.5 24 h45 M9.5 40 h45" {...stroke} strokeOpacity={0.5} {...draw(0.28)} />
    <motion.circle cx="42" cy="21" r="3.4" {...stroke} fill="currentColor" {...draw(0.42)} />
  </>,
];

export default function Pillars() {
  return (
    <section className="lp-section-padding" style={{ background: `linear-gradient(180deg, ${c.abyss} 0%, ${c.plate} 16%, ${c.plate} 84%, ${c.abyss} 100%)`, padding: "132px 0 136px", position: "relative", overflow: "hidden" }}>
      <KeyLight x="50%" y="0%" size={95} intensity={0.13} travel={30} />

      <div className="lp-inner" style={{ position: "relative", maxWidth: 1280, margin: "0 auto", padding: "0 56px" }}>
        <div className="pillars-head" style={{ display: "grid", gridTemplateColumns: "1.25fr 0.75fr", gap: 64, alignItems: "center", marginBottom: 96 }}>
          <motion.div {...rise()}>
            <h2 style={{ ...type.h2, color: c.bone, marginBottom: 22, maxWidth: "13ch" }}>
              Three things every piece carries.
            </h2>
            <p style={{ ...type.lead, color: c.patina, maxWidth: "42ch" }}>
              One chip or card, doing three jobs at once, for as long as the object exists.
            </p>
          </motion.div>

          <Parallax depth={0.34} className="pillars-evidence" style={{ justifySelf: "end" }}>
            <OwnershipLedger />
          </Parallax>
        </div>

        <div className="pillars-grid" style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 0 }}>
          {PILLARS.map((pillar, i) => (
            <motion.div
              key={pillar.name}
              className="pillars-item"
              {...rise(i * 0.1)}
              style={{
                position: "relative",
                padding: i === 0 ? "0 44px 0 0" : "0 44px",
                paddingRight: i === PILLARS.length - 1 ? 0 : 44,
              }}
            >
              {i > 0 && (
                <div
                  aria-hidden
                  className="pillars-seam"
                  style={{
                    position: "absolute",
                    left: 0,
                    top: 0,
                    bottom: 0,
                    width: 1,
                    background: `linear-gradient(180deg, ${c.hairlineWarm}, ${c.hairline} 30%, transparent 92%)`,
                  }}
                />
              )}

              <Mark>{MARKS[i]}</Mark>

              <h3
                style={{
                  fontFamily: "var(--font-display)",
                  fontSize: "clamp(30px, 2.8vw, 40px)",
                  fontWeight: 400,
                  color: c.bone,
                  letterSpacing: "-0.03em",
                  lineHeight: 1.05,
                  margin: "0 0 18px",
                }}
              >
                {pillar.name}
              </h3>

              <p style={{ ...type.body, color: c.patina, margin: "0 0 30px", maxWidth: "34ch" }}>
                {pillar.description}
              </p>

              <ul style={{ listStyle: "none", padding: 0, margin: 0, display: "flex", flexDirection: "column", gap: 13 }}>
                {pillar.points.map((point) => (
                  <li key={point} style={{ display: "flex", gap: 13 }}>
                    <span
                      aria-hidden
                      style={{ width: 14, height: 1, backgroundColor: c.key, flexShrink: 0, marginTop: 11, opacity: 0.75 }}
                    />
                    <span style={{ ...type.small, color: c.patina }}>{point}</span>
                  </li>
                ))}
              </ul>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
