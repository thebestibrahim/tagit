"use client";

const ITEMS = [
  "Verified Authentic",
  "Permanent Provenance",
  "Confirmed Ownership",
  "Made to Last",
  "Impossible to Fake",
  "EU Compliant",
  "Ownership History",
  "Brand Voice",
  "Protected Resale",
  "Global Coverage",
];

const SEP = " · ";
const text = ITEMS.join(SEP) + SEP;

export default function Marquee() {
  return (
    <div
      style={{
        borderTop: "1px solid #E8E2D5",
        borderBottom: "1px solid #E8E2D5",
        backgroundColor: "#F5F2EC",
        padding: "13px 0",
        overflow: "hidden",
        userSelect: "none",
      }}
    >
      <div
        style={{
          display: "flex",
          width: "max-content",
          animation: "marqueeScroll 55s linear infinite",
        }}
      >
        {/* Two copies for seamless loop */}
        {[0, 1].map((copy) => (
          <span
            key={copy}
            style={{
              fontFamily: "var(--font-mono)",
              fontSize: 9,
              letterSpacing: "0.12em",
              color: "#9E9EA3",
              textTransform: "uppercase",
              whiteSpace: "nowrap",
              paddingRight: 0,
            }}
          >
            {text}
          </span>
        ))}
      </div>

      <style>{`
        @keyframes marqueeScroll {
          0%   { transform: translateX(0); }
          100% { transform: translateX(-50%); }
        }
        @media (prefers-reduced-motion: reduce) {
          [style*="marqueeScroll"] { animation: none; }
        }
      `}</style>
    </div>
  );
}
