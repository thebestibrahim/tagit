"use client";
import { motion } from "motion/react";
import { c, type, rise } from "./styles";

const INCLUDED = [
  "Physical tags, programmed and ready to embed",
  "Every piece registered with its full story",
  "Authenticity confirmed on every scan, anywhere",
  "Complete ownership history for each piece",
  "Your own branded experience when customers scan",
  "Your brand's voice, heard on every scan",
  "Insight into where your work travels",
  "EU compliance built in from day one",
];

export default function Pricing() {
  return (
    <section
      id="pricing"
      className="lp-section-padding"
      style={{ padding: "120px 32px", backgroundColor: c.paper, borderTop: `1px solid ${c.line}` }}
    >
      <div style={{ maxWidth: 940, margin: "0 auto" }}>
        <motion.div {...rise()} style={{ marginBottom: 48, maxWidth: 560 }}>
          <h2 style={{ ...type.h2, color: c.ink, marginBottom: 18 }}>
            Pricing that follows your catalogue.
          </h2>
          <p style={{ ...type.lead, color: c.body }}>
            There are no fixed tiers and no per-seat fees. You pay for the tags you
            activate, so the cost tracks the size of your catalogue and nothing else.
          </p>
        </motion.div>

        <motion.div
          {...rise(0.08)}
          className="pricing-card"
          style={{
            display: "grid",
            gridTemplateColumns: "1fr 1fr",
            backgroundColor: "#fff",
            border: `1px solid ${c.line}`,
            borderRadius: 20,
            overflow: "hidden",
            boxShadow: "0 4px 24px rgba(10,10,11,0.06)",
          }}
        >
          <div className="pricing-left" style={{ padding: "44px 40px", borderRight: `1px solid ${c.line}` }}>
            <h3 style={{ fontSize: 17, fontWeight: 600, color: c.inkSoft, margin: "0 0 24px", letterSpacing: "-0.01em" }}>
              Everything is included
            </h3>
            <ul style={{ listStyle: "none", padding: 0, margin: 0, display: "flex", flexDirection: "column", gap: 14 }}>
              {INCLUDED.map((item) => (
                <li key={item} style={{ display: "flex", alignItems: "flex-start", gap: 12 }}>
                  <svg width="16" height="16" viewBox="0 0 14 14" fill="none" style={{ flexShrink: 0, marginTop: 3 }} aria-hidden="true">
                    <circle cx="7" cy="7" r="6" stroke={c.verified} strokeWidth="1.2" />
                    <path d="M 4 7 L 6.2 9.2 L 10 5" stroke={c.verified} strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                  <span style={{ ...type.small, color: c.body }}>{item}</span>
                </li>
              ))}
            </ul>
          </div>

          <div
            style={{
              padding: "44px 40px",
              backgroundColor: c.night,
              display: "flex",
              flexDirection: "column",
              justifyContent: "center",
            }}
          >
            <h3
              style={{
                fontFamily: "var(--font-display)",
                fontSize: 36,
                fontWeight: 400,
                color: c.onDark,
                letterSpacing: "-0.028em",
                lineHeight: 1.15,
                margin: "0 0 16px",
              }}
            >
              Built around
              <br />
              your brand.
            </h3>
            <p style={{ ...type.body, color: c.onDarkBody, margin: "0 0 32px" }}>
              Tell us your catalogue size and how many pieces you make in a year, and we
              will put a structure together with you.
            </p>

            <a
              href="mailto:business@tagitlux.com?subject=Tagit pricing"
              style={{
                display: "block",
                textAlign: "center",
                padding: "14px 20px",
                borderRadius: 8,
                fontWeight: 550,
                fontSize: 15,
                textDecoration: "none",
                letterSpacing: "-0.005em",
                backgroundColor: c.gold,
                color: "#fff",
                marginBottom: 16,
              }}
            >
              Talk to us about pricing
            </a>
            <p style={{ ...type.small, color: c.onDarkQuiet, textAlign: "center" }}>
              Or email{" "}
              <a href="mailto:business@tagitlux.com" style={{ color: c.champagne, textDecoration: "none" }}>
                business@tagitlux.com
              </a>
            </p>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
