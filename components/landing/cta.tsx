"use client";
import { motion } from "motion/react";
import Link from "next/link";
import { c, type, rise } from "./styles";

export default function CtaSection() {
  return (
    <section style={{ padding: "96px 32px", backgroundColor: c.ivory, borderTop: `1px solid ${c.line}` }}>
      <div style={{ maxWidth: 1120, margin: "0 auto" }}>
        <motion.div
          {...rise()}
          className="cta-inner"
          style={{
            backgroundColor: c.night,
            borderRadius: 20,
            padding: "80px 80px",
            position: "relative",
            overflow: "hidden",
          }}
        >
          {/* Warm light from the top-left corner rather than a centred halo */}
          <div
            style={{
              position: "absolute",
              top: "-40%",
              left: "-10%",
              width: "70%",
              height: "180%",
              background: "radial-gradient(ellipse at 40% 50%, rgba(184,148,93,0.18) 0%, transparent 62%)",
              pointerEvents: "none",
            }}
          />

          <div className="cta-content" style={{ position: "relative", display: "grid", gridTemplateColumns: "1.1fr 1fr", gap: 56, alignItems: "center" }}>
            <div>
              <h2 style={{ ...type.h2, color: c.onDark, marginBottom: 20 }}>
                Be one of the first brands on the network.
              </h2>
              <p style={{ ...type.lead, color: c.onDarkBody, maxWidth: 460 }}>
                We are working with a small group of founding brands right now. Apply for
                access, or book a walkthrough and we will reply within two working days.
              </p>
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: 12, maxWidth: 264, width: "100%" }}>
              <Link
                href="/auth/register"
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  justifyContent: "center",
                  padding: "16px 28px",
                  backgroundColor: c.gold,
                  color: "#fff",
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
                  justifyContent: "center",
                  padding: "16px 24px",
                  color: c.onDarkBody,
                  border: "1px solid rgba(212,182,138,0.24)",
                  borderRadius: 8,
                  textDecoration: "none",
                  fontWeight: 450,
                  fontSize: 15,
                  letterSpacing: "-0.005em",
                }}
              >
                Book a walkthrough
              </a>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
