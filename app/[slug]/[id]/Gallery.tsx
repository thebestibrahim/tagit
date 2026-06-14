"use client";

import { useState } from "react";
import Image from "next/image";
import { FONT_MONO, type BrandPalette } from "@/lib/brand-page";

// Product image gallery: one large main image with a thumbnail strip beneath.
// Tapping a thumbnail swaps the main image. Degrades to a single image when the
// product has only one photo, and to a placeholder when it has none.
export default function Gallery({
  photos,
  name,
  palette,
}: {
  photos: string[];
  name: string;
  palette: BrandPalette;
}) {
  const [active, setActive] = useState(0);

  if (photos.length === 0) {
    return (
      <div style={{ width: "100%", aspectRatio: "4 / 5", display: "flex", alignItems: "center", justifyContent: "center", backgroundColor: palette.divider }}>
        <span style={{ fontFamily: FONT_MONO, fontSize: 10, letterSpacing: "0.14em", color: palette.textSecondary, textTransform: "uppercase" }}>
          No image
        </span>
      </div>
    );
  }

  const current = photos[Math.min(active, photos.length - 1)];

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
      <div style={{ position: "relative", width: "100%", aspectRatio: "4 / 5", overflow: "hidden", backgroundColor: palette.divider }}>
        <Image
          src={current}
          alt={name}
          fill
          priority
          sizes="(max-width: 860px) 100vw, 55vw"
          style={{ objectFit: "cover" }}
        />
      </div>

      {photos.length > 1 && (
        <div
          style={{
            display: "grid",
            gridTemplateColumns: `repeat(${Math.min(photos.length, 5)}, 1fr)`,
            gap: 12,
          }}
        >
          {photos.slice(0, 5).map((url, i) => {
            const selected = i === active;
            return (
              <button
                key={url}
                type="button"
                onClick={() => setActive(i)}
                aria-label={`View image ${i + 1} of ${photos.length}`}
                aria-current={selected}
                style={{
                  position: "relative",
                  width: "100%",
                  aspectRatio: "1 / 1",
                  overflow: "hidden",
                  border: "none",
                  padding: 0,
                  cursor: "pointer",
                  backgroundColor: palette.divider,
                  outline: selected ? `2px solid ${palette.accent}` : "none",
                  outlineOffset: 2,
                  opacity: selected ? 1 : 0.6,
                  transition: "opacity 200ms ease",
                }}
              >
                <Image
                  src={url}
                  alt={`${name} — view ${i + 1}`}
                  fill
                  sizes="120px"
                  style={{ objectFit: "cover" }}
                />
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
