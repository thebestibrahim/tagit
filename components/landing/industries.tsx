"use client";
import { useState } from "react";
import { motion } from "motion/react";

const INDUSTRIES = [
  {
    name: "Fashion",
    desc: "Luxury garments, accessories, leather goods",
    src: "/img/fashion-industry.jpg",
    fallback: "linear-gradient(160deg, #EDE8DF, #DDD4C4)",
    active: true,
  },
  {
    name: "Arts",
    desc: "Original works, limited editions, sculpture",
    src: "/img/art.jpg",
    fallback: "linear-gradient(160deg, #EDE8E0, #E0D8C8)",
    active: true,
  },
  {
    name: "Collectibles",
    desc: "Watches, sneakers, memorabilia, jewellery",
    src: "/img/collectibles.jpg",
    fallback: "linear-gradient(160deg, #EAE5DC, #DDD5C5)",
    active: true,
  },
  {
    name: "Restaurants",
    desc: "Tasting menus, signature dishes, experiences",
    src: null,
    fallback: "linear-gradient(160deg, #F0EDE8, #E8E0D0)",
    active: false,
  },
  {
    name: "Hotels",
    desc: "Suites, curated stays, bespoke experiences",
    src: null,
    fallback: "linear-gradient(160deg, #EDE8E0, #E0D8C8)",
    active: false,
  },
];

function IndustryPhoto({ src, alt, fallback }: { src: string; alt: string; fallback: string }) {
  const [failed, setFailed] = useState(false);

  return (
    <div style={{ position: "absolute", inset: 0, background: fallback }}>
      {!failed && src && (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={src}
          alt={alt}
          onError={() => setFailed(true)}
          style={{ width: "100%", height: "100%", objectFit: "cover", objectPosition: "center" }}
        />
      )}
      <div style={{ position: "absolute", inset: 0, background: "linear-gradient(to bottom, transparent 40%, rgba(255,255,255,0.5) 100%)" }} />
    </div>
  );
}

export default function Industries() {
  return (
    <section
      id="industries"
      className="lp-section-padding"
      style={{ padding: "120px 32px", backgroundColor: "#F5F2EC", borderTop: "1px solid #E8E2D5" }}
    >
      <div style={{ maxWidth: 1120, margin: "0 auto" }}>
        <motion.div
          initial={{ opacity: 0, y: 28 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-80px" }}
          transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
          style={{ marginBottom: 56 }}
        >
          <p style={{ margin: "0 0 12px", fontFamily: "var(--font-mono)", fontSize: 10, color: "#B8945D", letterSpacing: "0.12em", textTransform: "uppercase" }}>
            Built For
          </p>
          <h2 style={{
            fontFamily: "var(--font-display)",
            fontSize: "clamp(32px, 3.8vw, 52px)",
            fontWeight: 400, color: "#0A0A0B",
            letterSpacing: "-0.03em", lineHeight: 1.08, margin: "0 0 12px",
          }}>
            Industries where{" "}
            <em style={{ fontStyle: "italic", color: "#8B6F3F" }}>origin</em> is everything.
          </h2>
          <p style={{ margin: 0, fontSize: 15, color: "#6E6E73", letterSpacing: "-0.005em" }}>
            Three categories live today. Two more arriving as the network grows.
          </p>
        </motion.div>

        <div className="industries-grid" style={{ display: "grid", gridTemplateColumns: "repeat(5, 1fr)", gap: 12 }}>
          {INDUSTRIES.map((ind, i) => (
            <motion.div
              key={ind.name}
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-60px" }}
              transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1], delay: i * 0.07 }}
              style={{
                backgroundColor: ind.active ? "#fff" : "transparent",
                border: "1px solid #E8E2D5",
                borderRadius: 14,
                overflow: "hidden",
                position: "relative",
                opacity: ind.active ? 1 : 0.5,
                display: "flex",
                flexDirection: "column",
              }}
            >
              {/* Photo or placeholder */}
              <div style={{ height: 148, position: "relative", backgroundColor: "#F0EDE8", overflow: "hidden" }}>
                {ind.active && ind.src ? (
                  <IndustryPhoto src={ind.src} alt={ind.name} fallback={ind.fallback} />
                ) : (
                  <div style={{ position: "absolute", inset: 0, background: ind.fallback, display: "flex", alignItems: "center", justifyContent: "center" }}>
                    <span style={{ fontFamily: "var(--font-mono)", fontSize: 8, color: "#C7C7CC", letterSpacing: "0.1em" }}>COMING SOON</span>
                  </div>
                )}
              </div>

              <div style={{ padding: "16px 18px 20px" }}>
                {ind.active ? (
                  <div style={{ width: 5, height: 5, borderRadius: "50%", backgroundColor: "#B8945D", marginBottom: 10 }} />
                ) : (
                  <div style={{ marginBottom: 10 }}>
                    <span style={{
                      fontFamily: "var(--font-mono)", fontSize: 8, color: "#9E9EA3",
                      letterSpacing: "0.1em", border: "1px solid #E8E2D5", padding: "2px 6px", borderRadius: 3,
                    }}>
                      COMING SOON
                    </span>
                  </div>
                )}
                <h3 style={{
                  fontFamily: "var(--font-display)", fontSize: 18, fontWeight: 400,
                  fontStyle: "italic", color: ind.active ? "#1F1F22" : "#9E9EA3",
                  letterSpacing: "-0.015em", margin: "0 0 6px", lineHeight: 1.2,
                }}>
                  {ind.name}
                </h3>
                <p style={{ fontSize: 12, color: ind.active ? "#6E6E73" : "#9E9EA3", lineHeight: 1.55, margin: 0 }}>
                  {ind.desc}
                </p>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
