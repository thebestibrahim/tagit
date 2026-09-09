"use client";
import { motion } from "motion/react";
import ScanSequence from "./interactive/scan-sequence";
import TagArtifact from "./interactive/tag-artifact";
import { KeyLight, LightSeam } from "./interactive/cinema";
import { c, type, rise } from "./styles";

/**
 * Placed second, directly under the title card, because everything after it
 * argues about why this matters and none of that lands until you know what the
 * thing actually is. The sequence answers "what happens", the artifact below it
 * answers "what is physically in my product".
 */
export default function HowItWorks() {
  return (
    <section
      id="how-it-works"
      className="lp-section-padding"
      style={{ padding: "132px 0 136px", backgroundColor: c.abyss, position: "relative", overflow: "hidden" }}
    >
      <KeyLight x="70%" y="55%" size={72} intensity={0.11} travel={50} />

      <div className="lp-inner" style={{ position: "relative", maxWidth: 1280, margin: "0 auto", padding: "0 56px" }}>
        <motion.div {...rise()} style={{ marginBottom: 64, maxWidth: 700 }}>
          <h2 style={{ ...type.h2, color: c.bone, marginBottom: 20, maxWidth: "14ch" }}>
            How a piece gets its identity.
          </h2>
          <p style={{ ...type.lead, color: c.patina, maxWidth: "50ch" }}>
            Four steps, and then it runs on its own for the life of the object. Click
            through them.
          </p>
        </motion.div>

        <ScanSequence />

        <motion.div {...rise(0.1)} style={{ marginTop: 104 }}>
          <LightSeam width="100%" />
          <h3 style={{ ...type.h3, color: c.bone, margin: "36px 0 48px", maxWidth: "22ch" }}>
            What actually goes into the piece.
          </h3>
          <TagArtifact />
        </motion.div>
      </div>
    </section>
  );
}
