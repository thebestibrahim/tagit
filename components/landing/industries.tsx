"use client";
import { motion } from "motion/react";

const INDUSTRIES = [
  { name: "Fashion", desc: "Luxury garments, accessories, leather goods", active: true },
  { name: "Arts", desc: "Original works, limited editions, sculpture", active: true },
  { name: "Collectibles", desc: "Watches, sneakers, memorabilia, jewellery", active: true },
  { name: "Restaurants", desc: "Tasting menus, signature dishes, experiences", active: false },
  { name: "Hotels", desc: "Suites, curated stays, bespoke experiences", active: false },
];

export default function Industries() {
  return (
    <section
      id="industries"
      className="lp-section-padding"
      style={{ padding: "112px 32px", backgroundColor: "#F5F2EC", borderTop: "1px solid #E8E2D5" }}
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
          <h2
            style={{
              fontFamily: "var(--font-display)",
              fontSize: "clamp(32px, 3.8vw, 52px)",
              fontWeight: 400,
              color: "#0A0A0B",
              letterSpacing: "-0.03em",
              lineHeight: 1.08,
              margin: "0 0 12px",
            }}
          >
            Industries where{" "}
            <em style={{ fontStyle: "italic", color: "#8B6F3F" }}>provenance</em> is everything.
          </h2>
          <p style={{ margin: 0, fontSize: 15, color: "#6E6E73", letterSpacing: "-0.005em" }}>
            Three industries live today. Two more arriving as the network grows.
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
                border: `1px solid ${ind.active ? "#E8E2D5" : "#E8E2D5"}`,
                borderRadius: 12,
                padding: "24px 20px",
                position: "relative",
                opacity: ind.active ? 1 : 0.55,
              }}
            >
              {/* Active dot */}
              {ind.active && (
                <div
                  style={{
                    width: 6,
                    height: 6,
                    borderRadius: "50%",
                    backgroundColor: "#B8945D",
                    marginBottom: 16,
                  }}
                />
              )}

              {!ind.active && (
                <div style={{ marginBottom: 16 }}>
                  <span
                    style={{
                      fontFamily: "var(--font-mono)",
                      fontSize: 8,
                      color: "#9E9EA3",
                      letterSpacing: "0.1em",
                      border: "1px solid #E8E2D5",
                      padding: "2px 6px",
                      borderRadius: 3,
                    }}
                  >
                    COMING SOON
                  </span>
                </div>
              )}

              <h3
                style={{
                  fontFamily: "var(--font-display)",
                  fontSize: 20,
                  fontWeight: 400,
                  fontStyle: "italic",
                  color: ind.active ? "#1F1F22" : "#9E9EA3",
                  letterSpacing: "-0.015em",
                  margin: "0 0 8px",
                  lineHeight: 1.2,
                }}
              >
                {ind.name}
              </h3>
              <p
                style={{
                  fontSize: 12,
                  color: ind.active ? "#6E6E73" : "#9E9EA3",
                  lineHeight: 1.55,
                  margin: 0,
                  letterSpacing: "-0.003em",
                }}
              >
                {ind.desc}
              </p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
