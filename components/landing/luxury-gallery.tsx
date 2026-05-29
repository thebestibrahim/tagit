"use client";
import { motion } from "motion/react";
import { useState } from "react";

const EASE = [0.16, 1, 0.3, 1] as const;

const ITEMS = [
  {
    label: "Timepieces",
    sub: "Swiss & independent horology",
    src: "/img/watch.jpg",
    fallback: "linear-gradient(145deg, #1A1510 0%, #2E2416 50%, #1A1510 100%)",
    tall: true,
  },
  {
    label: "Leather Goods",
    sub: "Bags, wallets & small goods",
    src: "/img/bag.jpg",
    fallback: "linear-gradient(145deg, #12100E 0%, #261E14 50%, #12100E 100%)",
    tall: false,
  },
  {
    label: "Jewellery",
    sub: "Fine & haute joaillerie",
    src: "/img/jewellery.jpg",
    fallback: "linear-gradient(145deg, #0E0E14 0%, #1C1828 50%, #0E0E14 100%)",
    tall: false,
  },
  {
    label: "Ready-to-wear",
    sub: "Couture & limited editions",
    src: "/img/fashion-gallery.jpg",
    fallback: "linear-gradient(145deg, #100E0A 0%, #221C10 50%, #100E0A 100%)",
    tall: false,
  },
];

function GalleryImage({ src, alt, fallback, tall }: { src: string; alt: string; fallback: string; tall: boolean }) {
  const [failed, setFailed] = useState(false);

  if (failed) {
    return (
      <div style={{
        position: "absolute", inset: 0,
        background: fallback,
      }}>
        {/* Subtle grain texture */}
        <div style={{
          position: "absolute", inset: 0,
          backgroundImage: "url(\"data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='0.04'/%3E%3C/svg%3E\")",
          opacity: 0.4,
        }} />
        {/* Centered minimal mark */}
        <div style={{
          position: "absolute", inset: 0,
          display: "flex", alignItems: "center", justifyContent: "center",
        }}>
          <div style={{
            width: tall ? 48 : 36,
            height: tall ? 48 : 36,
            borderRadius: "50%",
            border: "1px solid rgba(184,148,93,0.2)",
            display: "flex", alignItems: "center", justifyContent: "center",
          }}>
            <div style={{ width: 6, height: 6, borderRadius: "50%", backgroundColor: "rgba(184,148,93,0.3)" }} />
          </div>
        </div>
      </div>
    );
  }

  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={src}
      alt={alt}
      onError={() => setFailed(true)}
      style={{
        position: "absolute", inset: 0,
        width: "100%", height: "100%",
        objectFit: "cover", objectPosition: "center",
      }}
    />
  );
}

export default function LuxuryGallery() {
  return (
    <section
      className="gallery-section"
      style={{
        backgroundColor: "#080806",
        padding: "120px 32px",
        position: "relative",
        overflow: "hidden",
      }}
    >
      {/* Subtle ambient top glow */}
      <div style={{
        position: "absolute", top: 0, left: "50%", transform: "translateX(-50%)",
        width: 900, height: 320,
        background: "radial-gradient(ellipse at 50% 0%, rgba(184,148,93,0.07) 0%, transparent 70%)",
        pointerEvents: "none",
      }} />

      <div style={{ maxWidth: 1160, margin: "0 auto", position: "relative" }}>

        {/* Header row */}
        <div className="gallery-header" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 48, marginBottom: 56, alignItems: "end" }}>
          <motion.div
            initial={{ opacity: 0, y: 28 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-80px" }}
            transition={{ duration: 0.8, ease: EASE }}
          >
            <p style={{ margin: "0 0 14px", fontFamily: "var(--font-mono)", fontSize: 10, color: "#D4B68A", letterSpacing: "0.14em", textTransform: "uppercase" }}>
              The Objects We Protect
            </p>
            <h2 style={{
              fontFamily: "var(--font-display)",
              fontSize: "clamp(34px, 4vw, 56px)",
              fontWeight: 400, color: "#FAFAF8",
              letterSpacing: "-0.03em", lineHeight: 1.06, margin: 0,
            }}>
              Crafted to last.{" "}
              <em style={{ fontStyle: "italic", color: "#C9A66B" }}>Remembered forever.</em>
            </h2>
          </motion.div>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-80px" }}
            transition={{ duration: 0.8, ease: EASE, delay: 0.1 }}
            style={{ fontSize: 15, color: "#4A4A4F", lineHeight: 1.75, margin: 0, letterSpacing: "-0.005em" }}
          >
            Every watch, every bag, every jewel — the pieces your customers carry for decades deserve a record that lasts just as long.
          </motion.p>
        </div>

        {/* Photo grid */}
        <div className="gallery-grid" style={{
          display: "grid",
          gridTemplateColumns: "1.5fr 1fr 1fr",
          gridTemplateRows: "310px 310px",
          gap: 8,
        }}>
          {/* Large tile — spans 2 rows */}
          <motion.div
            initial={{ opacity: 0, scale: 0.97 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true, margin: "-60px" }}
            transition={{ duration: 1, ease: EASE }}
            style={{
              gridRow: "1 / 3",
              position: "relative",
              borderRadius: 16,
              overflow: "hidden",
              backgroundColor: "#1A1510",
            }}
          >
            <GalleryImage src={ITEMS[0].src} alt={ITEMS[0].label} fallback={ITEMS[0].fallback} tall />
            <div style={{ position: "absolute", inset: 0, background: "linear-gradient(to top, rgba(8,8,6,0.85) 0%, rgba(8,8,6,0.1) 45%, transparent 100%)" }} />
            <div style={{ position: "absolute", bottom: 28, left: 28, right: 28 }}>
              <p style={{ margin: "0 0 5px", fontFamily: "var(--font-display)", fontSize: 24, fontStyle: "italic", color: "#FAFAF8", letterSpacing: "-0.015em" }}>
                {ITEMS[0].label}
              </p>
              <p style={{ margin: 0, fontFamily: "var(--font-mono)", fontSize: 9, color: "#B8945D", letterSpacing: "0.12em", textTransform: "uppercase" }}>
                {ITEMS[0].sub}
              </p>
            </div>
          </motion.div>

          {/* 3 smaller tiles */}
          {ITEMS.slice(1).map((item, i) => (
            <motion.div
              key={item.label}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-60px" }}
              transition={{ duration: 0.8, ease: EASE, delay: 0.08 + i * 0.07 }}
              style={{
                position: "relative",
                borderRadius: 16,
                overflow: "hidden",
                backgroundColor: "#1A1510",
              }}
            >
              <GalleryImage src={item.src} alt={item.label} fallback={item.fallback} tall={false} />
              <div style={{ position: "absolute", inset: 0, background: "linear-gradient(to top, rgba(8,8,6,0.82) 0%, rgba(8,8,6,0.08) 50%, transparent 100%)" }} />
              <div style={{ position: "absolute", bottom: 20, left: 20, right: 20 }}>
                <p style={{ margin: "0 0 4px", fontFamily: "var(--font-display)", fontSize: 18, fontStyle: "italic", color: "#FAFAF8", letterSpacing: "-0.015em" }}>
                  {item.label}
                </p>
                <p style={{ margin: 0, fontFamily: "var(--font-mono)", fontSize: 8, color: "#B8945D", letterSpacing: "0.12em", textTransform: "uppercase" }}>
                  {item.sub}
                </p>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Bottom rule */}
        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8, delay: 0.3 }}
          style={{ marginTop: 24, display: "flex", justifyContent: "space-between", alignItems: "center" }}
        >
          <div style={{ height: 1, flex: 1, background: "linear-gradient(to right, rgba(212,182,138,0.12), transparent)" }} />
          <p style={{ margin: "0 20px", fontFamily: "var(--font-mono)", fontSize: 9, color: "#2E2A20", letterSpacing: "0.1em", textTransform: "uppercase", whiteSpace: "nowrap" }}>
            Fashion · Arts · Collectibles · More Coming
          </p>
          <div style={{ height: 1, flex: 1, background: "linear-gradient(to left, rgba(212,182,138,0.12), transparent)" }} />
        </motion.div>
      </div>

    </section>
  );
}
