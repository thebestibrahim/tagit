"use client";
import Link from "next/link";
import { motion } from "motion/react";
import { KeyLight, LineReveal } from "./interactive/cinema";
import { c, type, rise } from "./styles";

/**
 * The end card. No panel and no box: the lamp, one statement at display size,
 * and the two things a visitor can do about it.
 */
export default function CtaSection() {
  return (
    <section style={{ padding: "36px 0 132px", backgroundColor: c.abyss, position: "relative", overflow: "hidden" }}>
      <KeyLight x="26%" y="60%" size={72} intensity={0.15} travel={30} />

      <div className="lp-inner" style={{ position: "relative", maxWidth: 1180, margin: "0 auto", padding: "0 56px" }}>
        <div
          aria-hidden
          style={{ height: 1, width: "100%", background: `linear-gradient(90deg, ${c.key}, ${c.hairline} 34%, transparent 82%)`, marginBottom: 80 }}
        />

        <div className="cta-content" style={{ display: "grid", gridTemplateColumns: "1.3fr 0.7fr", gap: 64, alignItems: "end" }}>
          <h2 style={{ ...type.h2, color: c.bone, margin: 0 }}>
            <LineReveal inView lines={["Be one of the first", "brands on the network."]} stagger={0.1} />
          </h2>

          <motion.div {...rise(0.25)} style={{ display: "flex", flexDirection: "column", gap: 14, maxWidth: 300 }}>
            <p style={{ ...type.small, color: c.patina, margin: "0 0 6px" }}>
              We are working with a small group of founding brands right now. Apply for
              access, or book a walkthrough and we will reply within two working days.
            </p>
            <Link href="/auth/register" className="cine-cta-key" style={{ justifyContent: "center" }}>
              Apply for access
            </Link>
            <a
              href="mailto:business@tagitlux.com?subject=Tagit walkthrough"
              className="cine-cta-ghost"
              style={{ justifyContent: "center" }}
            >
              Book a walkthrough
            </a>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
