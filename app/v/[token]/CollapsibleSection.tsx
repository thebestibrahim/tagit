"use client";
import { useState } from "react";
import { ChevronDown } from "lucide-react";

export default function CollapsibleSection({
  title,
  badge,
  children,
  defaultOpen = false,
}: {
  title: string;
  badge?: string;
  children: React.ReactNode;
  defaultOpen?: boolean;
}) {
  const [open, setOpen] = useState(defaultOpen);

  return (
    <div style={{ borderTop: "1px solid #F0EDE8" }}>
      <button
        onClick={() => setOpen((v) => !v)}
        style={{
          width: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "15px 24px",
          background: "none",
          border: "none",
          cursor: "pointer",
          textAlign: "left",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <span
            style={{
              fontFamily: "'JetBrains Mono', monospace",
              fontSize: 10,
              fontWeight: 600,
              color: "#4A4A4F",
              letterSpacing: "0.12em",
              textTransform: "uppercase",
            }}
          >
            {title}
          </span>
          {badge && (
            <span
              style={{
                fontFamily: "'JetBrains Mono', monospace",
                fontSize: 9,
                padding: "2px 7px",
                backgroundColor: "#F5F2EC",
                borderRadius: 99,
                color: "#9E9EA3",
                letterSpacing: "0.04em",
              }}
            >
              {badge}
            </span>
          )}
        </div>
        <ChevronDown
          size={14}
          color="#9E9EA3"
          style={{
            transform: open ? "rotate(180deg)" : "rotate(0deg)",
            transition: "transform 0.25s ease",
            flexShrink: 0,
          }}
        />
      </button>
      {open && <div>{children}</div>}
    </div>
  );
}
