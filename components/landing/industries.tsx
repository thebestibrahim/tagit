"use client";
import { motion, useReducedMotion, useTransform } from "motion/react";
import { Plate, useSectionProgress } from "./interactive/cinema";
import { c, type, rise } from "./styles";

const TIMELINE = [
  { year: "2026", label: "Pilot begins with textiles and fashion" },
  { year: "2028", label: "Extended to electronics and batteries" },
  { year: "2030", label: "Full mandate across applicable categories" },
];

const LIVE = [
  { name: "Fashion", desc: "Luxury garments, accessories and leather goods" },
  { name: "Arts", desc: "Original works, limited editions and sculpture" },
  { name: "Collectibles", desc: "Watches, sneakers, memorabilia and jewellery" },
];

/**
 * Two beats in one section: the deadline, then the ground already covered.
 *
 * The timeline's line is drawn by the scroll itself, so the years arrive as you
 * reach them. The categories sit on a single wide plate rather than a row of
 * tiles, because the strip above already carried the photography and a second
 * grid of stills would just repeat it.
 */
export default function Industries() {
  const [ref, progress] = useSectionProgress();
  const reduce = useReducedMotion();
  const draw = useTransform(progress, [0.06, 0.42], [0, 1]);

  return (
    <section
      id="industries"
      ref={ref}
      className="lp-section-padding"
      style={{ padding: "132px 0 136px", background: `linear-gradient(180deg, ${c.abyss} 0%, ${c.plate} 16%, ${c.plate} 84%, ${c.abyss} 100%)`, position: "relative", overflow: "hidden" }}
    >
      <div className="lp-inner" style={{ position: "relative", maxWidth: 1280, margin: "0 auto", padding: "0 56px" }}>
        <motion.div {...rise()} style={{ maxWidth: 820, marginBottom: 72 }}>
          <h2 style={{ ...type.h2, color: c.bone, marginBottom: 26, maxWidth: "17ch" }}>
            The rules are about to change. This is built for what comes after.
          </h2>
          <p style={{ ...type.lead, color: c.patina, maxWidth: "50ch" }}>
            Between 2026 and 2030 the European Union will require every luxury product
            sold in its market to carry a verifiable digital identity.{" "}
            <span style={{ color: c.bone }}>
              Brands without that infrastructure lose access to the largest luxury market
              in the world.
            </span>
          </p>
        </motion.div>

        {/* The deadline, drawn by the scroll. */}
        <div style={{ position: "relative", marginBottom: 128 }}>
          <div aria-hidden style={{ height: 1, backgroundColor: "rgba(243,240,233,0.07)", marginBottom: 0 }}>
            <motion.div
              style={{
                height: 1,
                originX: 0,
                scaleX: reduce ? 1 : draw,
                background: `linear-gradient(90deg, ${c.key}, ${c.ember})`,
              }}
            />
          </div>

          <div className="timeline-grid" style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 40 }}>
            {TIMELINE.map((item, i) => (
              <motion.div key={item.year} {...rise(0.08 + i * 0.09)} style={{ paddingTop: 26 }}>
                <div
                  aria-hidden
                  style={{ width: 7, height: 7, borderRadius: "50%", backgroundColor: c.key, marginTop: -29, marginBottom: 22 }}
                />
                <p
                  style={{
                    fontFamily: "var(--font-display)",
                    fontSize: "clamp(38px, 4vw, 56px)",
                    color: c.bone,
                    letterSpacing: "-0.038em",
                    margin: "0 0 10px",
                    lineHeight: 1,
                  }}
                >
                  {item.year}
                </p>
                <p style={{ ...type.small, color: c.patina, maxWidth: "26ch" }}>{item.label}</p>
              </motion.div>
            ))}
          </div>
        </div>

        {/* Where it runs today. */}
        <Plate
          src="/img/art.jpg"
          alt="A still life in oil, the kind of work that now travels with a verifiable identity"
          focus="46% 42%"
          depth={0.22}
          overscan={1.3}
          className="industries-plate"
          style={{ height: "clamp(420px, 46vw, 560px)", borderRadius: 4 }}
          scrim="linear-gradient(to top, rgba(8,8,10,0.95) 0%, rgba(8,8,10,0.55) 38%, rgba(8,8,10,0.12) 72%)"
        >
          <div
            className="industries-overlay"
            style={{ position: "absolute", inset: 0, zIndex: 2, display: "flex", flexDirection: "column", justifyContent: "flex-end", padding: "44px 44px 40px" }}
          >
            <h3 style={{ ...type.h3, color: c.bone, marginBottom: 28 }}>Where Tagit runs today.</h3>

            <div className="industries-list" style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 32 }}>
              {LIVE.map((ind) => (
                <div key={ind.name}>
                  <div aria-hidden style={{ height: 1, width: 32, backgroundColor: c.key, marginBottom: 14, opacity: 0.8 }} />
                  <p
                    style={{
                      fontFamily: "var(--font-display)",
                      fontSize: "clamp(21px, 1.9vw, 27px)",
                      color: c.bone,
                      margin: "0 0 6px",
                      letterSpacing: "-0.024em",
                      lineHeight: 1.1,
                    }}
                  >
                    {ind.name}
                  </p>
                  <p style={{ ...type.small, color: c.patina, maxWidth: "28ch" }}>{ind.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </Plate>

        <motion.p {...rise(0.15)} style={{ ...type.small, color: c.patina, margin: "26px 0 0" }}>
          Restaurants and hotels are next as the network grows.
        </motion.p>
      </div>
    </section>
  );
}
