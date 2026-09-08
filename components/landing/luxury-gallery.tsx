"use client";
import { motion } from "motion/react";
import { useState } from "react";
import { c, type, rise } from "./styles";

const ITEMS = [
  { label: "Timepieces", sub: "Swiss and independent horology", src: "/img/watch.jpg" },
  { label: "Leather goods", sub: "Bags, wallets and small goods", src: "/img/bag.jpg" },
  { label: "Jewellery", sub: "Fine and haute joaillerie", src: "/img/jewellery.jpg" },
  { label: "Ready to wear", sub: "Couture and limited editions", src: "/img/fashion-gallery.jpg" },
];

function GalleryImage({ src, alt }: { src: string; alt: string }) {
  const [failed, setFailed] = useState(false);

  if (failed) {
    return <div style={{ position: "absolute", inset: 0, background: "linear-gradient(145deg, #1A1510 0%, #2E2416 50%, #1A1510 100%)" }} />;
  }

  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={src}
      alt={alt}
      onError={() => setFailed(true)}
      style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover", objectPosition: "center" }}
    />
  );
}

function Tile({ item, large = false, wide = false, delay = 0 }: { item: (typeof ITEMS)[number]; large?: boolean; wide?: boolean; delay?: number }) {
  return (
    <motion.div
      {...rise(delay)}
      style={{
        gridRow: large ? "1 / 3" : undefined,
        gridColumn: wide ? "2 / 4" : undefined,
        position: "relative",
        borderRadius: 16,
        overflow: "hidden",
        backgroundColor: "#1A1510",
      }}
    >
      <GalleryImage src={item.src} alt={item.label} />
      <div style={{ position: "absolute", inset: 0, background: "linear-gradient(to top, rgba(8,8,6,0.88) 0%, rgba(8,8,6,0.12) 48%, transparent 100%)" }} />
      <div style={{ position: "absolute", bottom: large ? 28 : 22, left: large ? 28 : 22, right: 22 }}>
        <p
          style={{
            margin: "0 0 5px",
            fontFamily: "var(--font-display)",
            fontSize: large ? 28 : 21,
            color: c.onDark,
            letterSpacing: "-0.02em",
            lineHeight: 1.15,
          }}
        >
          {item.label}
        </p>
        <p style={{ ...type.small, color: c.onDarkQuiet }}>{item.sub}</p>
      </div>
    </motion.div>
  );
}

export default function LuxuryGallery() {
  return (
    <section className="gallery-section" style={{ backgroundColor: "#080806", padding: "120px 32px", position: "relative" }}>
      <div style={{ maxWidth: 1160, margin: "0 auto", position: "relative" }}>
        <div className="gallery-header" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 48, marginBottom: 56, alignItems: "end" }}>
          <motion.h2 {...rise()} style={{ ...type.h2, color: c.onDark }}>
            The things people never throw away.
          </motion.h2>

          <motion.p {...rise(0.1)} style={{ ...type.lead, color: c.onDarkBody }}>
            A watch, a bag, a ring. The pieces your customers keep for thirty years
            deserve a record that lasts at least as long.
          </motion.p>
        </div>

        <div
          className="gallery-grid"
          style={{ display: "grid", gridTemplateColumns: "1.5fr 1fr 1fr", gridTemplateRows: "310px 310px", gap: 8 }}
        >
          <Tile item={ITEMS[0]} large />
          {ITEMS.slice(1).map((item, i) => (
            <Tile key={item.label} item={item} wide={i === 2} delay={0.08 + i * 0.07} />
          ))}
        </div>
      </div>
    </section>
  );
}
