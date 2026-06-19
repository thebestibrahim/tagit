"use client";

import { useState } from "react";
import Image from "next/image";

// Museum-matted, fully palette-driven hero gallery for the info page. Unlike the
// scan-page gallery (which is fixed to a cream mat), every surface here is
// derived from the brand's palette so the page reads correctly in any shade,
// light or dark. One photo → a single framed plate; several → the plate plus a
// quiet thumbnail strip.

export default function InfoGallery({
  photos,
  alt,
  surface,
  hairline,
  accent,
  muted,
}: {
  photos: string[];
  alt: string;
  surface: string;
  hairline: string;
  accent: string;
  muted: string;
}) {
  const [active, setActive] = useState(0);
  if (!photos || photos.length === 0) return null;
  const index = Math.min(active, photos.length - 1);
  const multiple = photos.length > 1;

  return (
    <div>
      {/* The mat: generous padding + a hairline inner keyline, gallery-style. */}
      <div
        style={{
          position: "relative",
          width: "100%",
          aspectRatio: "1 / 1",
          backgroundColor: surface,
          border: `1px solid ${hairline}`,
          padding: 22,
          boxSizing: "border-box",
        }}
      >
        <div style={{ position: "relative", width: "100%", height: "100%", border: `1px solid ${hairline}` }}>
          <Image
            key={index}
            src={photos[index]}
            alt={alt}
            fill
            sizes="(max-width: 520px) 100vw, 480px"
            priority
            style={{ objectFit: "contain", padding: 14, animation: "info-fade 420ms ease" }}
          />
        </div>
        {multiple && (
          <span
            style={{
              position: "absolute",
              top: 16,
              right: 16,
              fontFamily: "'JetBrains Mono',monospace",
              fontSize: 9,
              letterSpacing: "0.12em",
              color: muted,
            }}
          >
            {String(index + 1).padStart(2, "0")} / {String(photos.length).padStart(2, "0")}
          </span>
        )}
      </div>

      {multiple && (
        <div style={{ display: "flex", gap: 10, marginTop: 12, overflowX: "auto", scrollbarWidth: "none", paddingBottom: 2 }}>
          {photos.map((p, i) => {
            const on = i === index;
            return (
              <button
                key={p + i}
                type="button"
                onClick={() => setActive(i)}
                aria-label={`View image ${i + 1}`}
                aria-current={on}
                className="info-thumb"
                style={{
                  position: "relative",
                  flexShrink: 0,
                  width: 56,
                  height: 56,
                  overflow: "hidden",
                  cursor: "pointer",
                  padding: 6,
                  backgroundColor: surface,
                  border: on ? `1px solid ${accent}` : `1px solid ${hairline}`,
                  opacity: on ? 1 : 0.55,
                  transition: "opacity 200ms ease, border-color 200ms ease",
                }}
              >
                <Image src={p} alt="" fill sizes="56px" style={{ objectFit: "contain", padding: 6 }} />
              </button>
            );
          })}
        </div>
      )}

      <style>{`
        @keyframes info-fade { from { opacity: 0.5 } to { opacity: 1 } }
        .info-thumb:hover { opacity: 1 !important; }
        @media (prefers-reduced-motion: reduce) {
          [style*="info-fade"] { animation: none !important; }
        }
      `}</style>
    </div>
  );
}
