"use client";
import { motion } from "motion/react";
import { useState } from "react";
import Link from "next/link";
import VerifiedCard from "./interactive/verified-card";
import OwnershipLedger from "./interactive/ownership-ledger";
import { EASE, c, type } from "./styles";

const WATCH_IMG = "/img/watch.jpg";

function HeroPanel() {
  const [imgFailed, setImgFailed] = useState(false);

  return (
    <motion.div
      className="hero-visual"
      initial={{ opacity: 0, scale: 0.98 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ delay: 0.5, duration: 0.9, ease: EASE }}
      style={{
        position: "relative",
        height: 640,
        borderRadius: 24,
        overflow: "hidden",
        boxShadow: "0 48px 96px rgba(10,10,11,0.18), 0 16px 40px rgba(10,10,11,0.1)",
      }}
    >
      <div style={{ position: "absolute", inset: 0, backgroundColor: "#1A1510" }}>
        {!imgFailed && (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={WATCH_IMG}
            alt="A luxury timepiece carrying a Tagit chip"
            onError={() => setImgFailed(true)}
            style={{ width: "100%", height: "100%", objectFit: "cover", objectPosition: "center 30%" }}
          />
        )}
      </div>

      {/* Darkening pass so the two cards stay readable over the photograph */}
      <div style={{ position: "absolute", inset: 0, background: "linear-gradient(160deg, rgba(10,10,11,0.5) 0%, rgba(10,10,11,0.18) 40%, rgba(10,10,11,0.62) 100%)" }} />

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.95, duration: 0.85, ease: EASE }}
        style={{ position: "absolute", top: 26, left: 26, zIndex: 3 }}
      >
        <VerifiedCard />
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 1.15, duration: 0.85, ease: EASE }}
        className="hero-ledger"
        style={{ position: "absolute", bottom: 26, right: 22, zIndex: 4 }}
      >
        <OwnershipLedger />
      </motion.div>
    </motion.div>
  );
}

export default function Hero() {
  return (
    <section
      style={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        position: "relative",
        overflow: "hidden",
        backgroundColor: c.paper,
      }}
    >
      {/* One soft, off-centre warm wash. Not a symmetric glow. */}
      <div
        style={{
          position: "absolute",
          top: "-30%",
          right: "-15%",
          width: "70%",
          height: "150%",
          background: "radial-gradient(ellipse at 65% 45%, rgba(212,182,138,0.16) 0%, transparent 62%)",
          pointerEvents: "none",
        }}
      />

      <div
        className="hero-layout"
        style={{
          maxWidth: 1200,
          margin: "0 auto",
          padding: "120px 48px 80px",
          width: "100%",
          display: "grid",
          gridTemplateColumns: "1fr 1fr",
          gap: 64,
          alignItems: "center",
        }}
      >
        <div>
          <h1 style={{ ...type.display, color: c.ink, margin: "0 0 32px" }}>
            {[
              { text: "Proof that ", accent: "stays", delay: 0.1 },
              { text: "with the piece.", accent: null, delay: 0.2 },
            ].map((line, i) => (
              <span key={i} style={{ display: "block", overflow: "hidden" }}>
                <motion.span
                  initial={{ y: "108%" }}
                  animate={{ y: 0 }}
                  transition={{ delay: line.delay, duration: 0.95, ease: EASE }}
                  style={{ display: "block" }}
                >
                  {line.text}
                  {line.accent && (
                    <em style={{ fontStyle: "italic", color: c.goldText }}>{line.accent}</em>
                  )}
                </motion.span>
              </span>
            ))}
          </h1>

          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5, duration: 0.8, ease: EASE }}
          >
            <p style={{ ...type.lead, color: c.body, margin: "0 0 36px", maxWidth: 460 }}>
              Tagit puts a secure chip inside everything you make. One tap proves the piece
              is genuine, shows every owner it has had, and keeps your brand present long
              after the sale.
            </p>

            <div style={{ display: "flex", gap: 12, flexWrap: "wrap", alignItems: "center" }}>
              <Link
                href="/auth/register"
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  padding: "14px 26px",
                  backgroundColor: c.ink,
                  color: c.paper,
                  borderRadius: 8,
                  fontWeight: 550,
                  fontSize: 15,
                  letterSpacing: "-0.01em",
                  textDecoration: "none",
                }}
              >
                Apply for access
              </Link>

              <a
                href="mailto:business@tagitlux.com?subject=Tagit walkthrough"
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  padding: "14px 24px",
                  color: c.inkSoft,
                  border: `1px solid ${c.line}`,
                  borderRadius: 8,
                  textDecoration: "none",
                  fontWeight: 450,
                  fontSize: 15,
                  letterSpacing: "-0.005em",
                  transition: "border-color 0.2s ease, background-color 0.2s ease",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.borderColor = "#CFC7B4";
                  e.currentTarget.style.backgroundColor = "rgba(255,255,255,0.6)";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.borderColor = c.line;
                  e.currentTarget.style.backgroundColor = "transparent";
                }}
              >
                Book a walkthrough
              </a>
            </div>
          </motion.div>
        </div>

        <HeroPanel />
      </div>
    </section>
  );
}
