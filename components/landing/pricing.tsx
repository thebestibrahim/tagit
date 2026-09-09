"use client";
import { motion } from "motion/react";
import { KeyLight } from "./interactive/cinema";
import { c, type, rise } from "./styles";

const INCLUDED = [
  "Tags and cards, programmed and ready to use",
  "Every piece registered with its full story",
  "Authenticity confirmed on every scan, anywhere",
  "Complete ownership history for each piece",
  "Your own branded experience when customers scan",
  "Your brand's voice, heard on every scan",
  "Insight into where your work travels",
  "EU compliance built in from day one",
];

/**
 * The lit panel.
 *
 * The page stays in one room from the first frame to the last, so the moment
 * where a visitor is asked to decide is marked by light rather than by a change
 * of ground: this is the warmest, brightest surface on the page, and the only
 * one lit from inside.
 */
export default function Pricing() {
  return (
    <section
      id="pricing"
      className="lp-section-padding"
      style={{ padding: "132px 0 128px", backgroundColor: c.abyss, position: "relative", overflow: "hidden" }}
    >
      <KeyLight x="80%" y="46%" size={64} intensity={0.1} travel={40} />

      <div className="lp-inner" style={{ position: "relative", maxWidth: 1180, margin: "0 auto", padding: "0 56px" }}>
        <motion.div {...rise()} style={{ marginBottom: 56, maxWidth: 780 }}>
          <h2 style={{ ...type.h2, color: c.bone, marginBottom: 20, maxWidth: "15ch" }}>
            Pricing that follows your catalogue.
          </h2>
          <p style={{ ...type.lead, color: c.patina, maxWidth: "52ch" }}>
            There are no fixed tiers and no per-seat fees. You pay for the tags you
            activate, so the cost tracks the size of your catalogue and nothing else.
          </p>
        </motion.div>

        <motion.div
          {...rise(0.08)}
          className="pricing-card"
          style={{
            display: "grid",
            gridTemplateColumns: "1.2fr 0.8fr",
            backgroundColor: c.plate,
            border: `1px solid ${c.hairline}`,
            borderRadius: 4,
            overflow: "hidden",
          }}
        >
          <div className="pricing-left" style={{ padding: "48px 48px 44px", borderRight: `1px solid ${c.hairline}` }}>
            <h3 style={{ fontSize: 16.5, fontWeight: 600, color: c.bone, margin: "0 0 30px", letterSpacing: "-0.01em" }}>
              Everything is included
            </h3>
            <ul className="pricing-list" style={{ listStyle: "none", padding: 0, margin: 0, display: "grid", gridTemplateColumns: "1fr 1fr", gap: "17px 30px" }}>
              {INCLUDED.map((item) => (
                <li key={item} style={{ display: "flex", alignItems: "flex-start", gap: 12 }}>
                  <svg width="15" height="15" viewBox="0 0 14 14" fill="none" style={{ flexShrink: 0, marginTop: 4, color: c.seal }} aria-hidden="true">
                    <path d="M 2.5 7.4 L 5.4 10.2 L 11.5 3.6" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                  <span style={{ ...type.small, color: c.patina }}>{item}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* Lit from inside. The one warm surface on the page. */}
          <div
            className="pricing-right"
            style={{
              position: "relative",
              padding: "48px 44px",
              backgroundColor: "#171208",
              backgroundImage:
                "radial-gradient(120% 90% at 18% 10%, rgba(235,211,160,0.26) 0%, rgba(200,164,100,0.10) 38%, transparent 74%)",
              display: "flex",
              flexDirection: "column",
              justifyContent: "center",
            }}
          >
            <h3
              style={{
                fontFamily: "var(--font-display)",
                fontSize: "clamp(30px, 2.8vw, 40px)",
                fontWeight: 400,
                color: c.bone,
                letterSpacing: "-0.032em",
                lineHeight: 1.08,
                margin: "0 0 18px",
              }}
            >
              Built around
              <br />
              your brand.
            </h3>
            <p style={{ ...type.body, color: "#CFC6B4", margin: "0 0 32px" }}>
              Tell us your catalogue size and how many pieces you make in a year, and we
              will put a structure together with you.
            </p>

            <a href="mailto:business@tagitlux.com?subject=Tagit pricing" className="cine-cta-key" style={{ justifyContent: "center" }}>
              Talk to us about pricing
            </a>
            <p style={{ ...type.small, color: "#B6AC9A", textAlign: "center", marginTop: 16 }}>
              Or email{" "}
              <a href="mailto:business@tagitlux.com" style={{ color: c.ember, textDecoration: "none" }}>
                business@tagitlux.com
              </a>
            </p>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
