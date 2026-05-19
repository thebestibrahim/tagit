"use client";

import { useState } from "react";

type Day = { label: string; count: number };

export default function ScanChart({ days, max }: { days: Day[]; max: number }) {
  const [hovered, setHovered] = useState<number | null>(null);

  return (
    <div style={{ display: "flex", alignItems: "flex-end", gap: "6px", height: "120px" }}>
      {days.map((day, i) => (
        <div
          key={day.label}
          onMouseEnter={() => setHovered(i)}
          onMouseLeave={() => setHovered(null)}
          style={{
            flex: 1,
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: "4px",
            height: "100%",
            cursor: day.count > 0 ? "default" : "default",
          }}
        >
          <div style={{ flex: 1, width: "100%", display: "flex", alignItems: "flex-end" }}>
            <div
              style={{
                position: "relative",
                width: "100%",
                height: `${Math.max((day.count / max) * 100, day.count > 0 ? 8 : 2)}%`,
                backgroundColor:
                  hovered === i && day.count > 0
                    ? "var(--color-deep-gold)"
                    : day.count > 0
                    ? "var(--color-gold)"
                    : "var(--color-linen)",
                borderRadius: "3px 3px 0 0",
                transition: "background-color 0.15s ease",
                minHeight: "2px",
              }}
            >
              {hovered === i && day.count > 0 && (
                <div
                  style={{
                    position: "absolute",
                    bottom: "calc(100% + 5px)",
                    left: "50%",
                    transform: "translateX(-50%)",
                    backgroundColor: "var(--color-charcoal)",
                    color: "#fff",
                    fontSize: "11px",
                    fontWeight: 600,
                    padding: "3px 7px",
                    borderRadius: "5px",
                    whiteSpace: "nowrap",
                    pointerEvents: "none",
                    zIndex: 20,
                    letterSpacing: "-0.01em",
                  }}
                >
                  {day.label} · {day.count.toLocaleString()}
                </div>
              )}
            </div>
          </div>
          <span
            style={{
              fontSize: "9px",
              color: hovered === i && day.count > 0 ? "var(--color-slate)" : "var(--color-mist)",
              whiteSpace: "nowrap",
              transition: "color 0.15s ease",
            }}
          >
            {day.label.split(" ")[1]}
          </span>
        </div>
      ))}
    </div>
  );
}
