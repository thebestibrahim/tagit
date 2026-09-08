"use client";
import { useState } from "react";
import { motion } from "motion/react";
import { c, type, rise } from "./styles";

const TIMELINE = [
  { year: "2026", label: "Pilot begins with textiles and fashion" },
  { year: "2028", label: "Extended to electronics and batteries" },
  { year: "2030", label: "Full mandate across applicable categories" },
];

const INDUSTRIES = [
  { name: "Fashion", desc: "Luxury garments, accessories and leather goods", src: "/img/fashion-industry.jpg", live: true },
  { name: "Arts", desc: "Original works, limited editions and sculpture", src: "/img/art.jpg", live: true },
  { name: "Collectibles", desc: "Watches, sneakers, memorabilia and jewellery", src: "/img/collectibles.jpg", live: true },
  { name: "Restaurants", desc: "Tasting menus and signature dishes", src: null, live: false },
  { name: "Hotels", desc: "Suites, curated stays and bespoke experiences", src: null, live: false },
];

function IndustryPhoto({ src, alt }: { src: string; alt: string }) {
  const [failed, setFailed] = useState(false);
  if (failed) return null;
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={src}
      alt={alt}
      onError={() => setFailed(true)}
      style={{ width: "100%", height: "100%", objectFit: "cover", objectPosition: "center" }}
    />
  );
}

export default function Industries() {
  return (
    <section
      id="industries"
      className="lp-section-padding"
      style={{ padding: "120px 32px", backgroundColor: c.ivory, borderTop: `1px solid ${c.line}` }}
    >
      <div style={{ maxWidth: 1120, margin: "0 auto" }}>
        {/* ── Why now ── */}
        <motion.div {...rise()} style={{ maxWidth: 720, marginBottom: 56 }}>
          <h2 style={{ ...type.h2, color: c.ink, marginBottom: 22 }}>
            The rules are about to change. This is built for what comes after.
          </h2>
          <p style={{ ...type.lead, color: c.body }}>
            Between 2026 and 2030 the European Union will require every luxury product
            sold in its market to carry a verifiable digital identity.{" "}
            <strong style={{ color: c.inkSoft, fontWeight: 550 }}>
              Brands without that infrastructure lose access to the largest luxury market
              in the world.
            </strong>
          </p>
        </motion.div>

        {/* Timeline strip */}
        <div
          className="timeline-grid"
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(3, 1fr)",
            gap: 1,
            marginBottom: 96,
            borderTop: `1px solid ${c.line}`,
          }}
        >
          {TIMELINE.map((item, i) => (
            <motion.div
              key={item.year}
              {...rise(0.1 + i * 0.08)}
              style={{
                padding: "24px 32px 24px 0",
                paddingLeft: i > 0 ? 32 : 0,
                borderLeft: i > 0 ? `1px solid ${c.line}` : "none",
              }}
            >
              <p
                style={{
                  fontFamily: "var(--font-display)",
                  fontSize: 34,
                  color: c.goldText,
                  letterSpacing: "-0.03em",
                  margin: "0 0 8px",
                  lineHeight: 1,
                }}
              >
                {item.year}
              </p>
              <p style={{ ...type.small, color: c.body }}>{item.label}</p>
            </motion.div>
          ))}
        </div>

        {/* ── Where it runs today ── */}
        <motion.div {...rise()} style={{ marginBottom: 40, maxWidth: 620 }}>
          <h3 style={{ ...type.h3, color: c.ink, marginBottom: 14 }}>
            Where Tagit runs today.
          </h3>
          <p style={{ ...type.body, color: c.body }}>
            Three categories are live now. Two more open as the network grows.
          </p>
        </motion.div>

        <div className="industries-grid" style={{ display: "grid", gridTemplateColumns: "repeat(5, 1fr)", gap: 12 }}>
          {INDUSTRIES.map((ind, i) => (
            <motion.div
              key={ind.name}
              {...rise(i * 0.06)}
              style={{
                backgroundColor: ind.live ? "#fff" : "transparent",
                border: `1px solid ${c.line}`,
                borderRadius: 14,
                overflow: "hidden",
                display: "flex",
                flexDirection: "column",
              }}
            >
              <div style={{ height: 148, position: "relative", backgroundColor: "#EFEBE2", overflow: "hidden" }}>
                {ind.live && ind.src && <IndustryPhoto src={ind.src} alt={ind.name} />}
              </div>

              <div style={{ padding: "18px 18px 22px" }}>
                <h4
                  style={{
                    fontFamily: "var(--font-display)",
                    fontSize: 21,
                    fontWeight: 400,
                    color: ind.live ? c.inkSoft : c.quiet,
                    letterSpacing: "-0.02em",
                    margin: "0 0 6px",
                    lineHeight: 1.2,
                  }}
                >
                  {ind.name}
                </h4>
                <p style={{ ...type.small, color: c.quiet, marginBottom: ind.live ? 0 : 10 }}>{ind.desc}</p>
                {!ind.live && (
                  <span style={{ fontSize: 14, color: c.quiet, fontWeight: 500 }}>Coming soon</span>
                )}
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
