"use client";

import { useState } from "react";
import Image from "next/image";

type Frame = {
  height?: number;
  aspectRatio?: string;
  objectFit: "contain" | "cover";
  padding?: number | string;
};

/**
 * Scan-page product imagery. One photo → the framed hero exactly as before.
 * Multiple → the hero plus a quiet row of tappable thumbnails beneath; tapping
 * swaps the hero with a soft fade. Frame (height/aspect/fit/padding) is passed
 * per template so it matches minimal / editorial / classic layouts.
 */
export default function ProductGallery({
  photos,
  alt,
  frame,
  accent = "#0A0A0B",
}: {
  photos: string[];
  alt: string;
  frame: Frame;
  accent?: string;
}) {
  const [active, setActive] = useState(0);
  if (!photos || photos.length === 0) return null;

  const index = Math.min(active, photos.length - 1);
  const multiple = photos.length > 1;

  return (
    <div>
      <div
        style={{
          position: "relative",
          width: "100%",
          height: frame.height,
          aspectRatio: frame.aspectRatio,
          backgroundColor: "#F5F2EC",
          borderRadius: 16,
          overflow: "hidden",
          border: "1px solid #EDE8DF",
        }}
      >
        <Image
          key={index}
          src={photos[index]}
          alt={alt}
          fill
          sizes="(max-width: 480px) 100vw, 440px"
          priority
          style={{
            objectFit: frame.objectFit,
            padding: frame.padding,
            animation: "tg-fade 360ms ease",
          }}
        />
        {multiple && (
          <span
            style={{
              position: "absolute",
              top: 12,
              right: 12,
              padding: "3px 8px",
              borderRadius: 99,
              backgroundColor: "rgba(10,10,11,0.55)",
              backdropFilter: "blur(6px)",
              WebkitBackdropFilter: "blur(6px)",
              fontFamily: "'JetBrains Mono',monospace",
              fontSize: 9,
              letterSpacing: "0.08em",
              color: "rgba(255,255,255,0.92)",
            }}
          >
            {String(index + 1).padStart(2, "0")} / {String(photos.length).padStart(2, "0")}
          </span>
        )}
      </div>

      {multiple && (
        <div
          style={{
            display: "flex",
            gap: 8,
            marginTop: 10,
            overflowX: "auto",
            scrollbarWidth: "none",
            paddingBottom: 2,
          }}
        >
          {photos.map((p, i) => {
            const on = i === index;
            return (
              <button
                key={p + i}
                type="button"
                onClick={() => setActive(i)}
                aria-label={`View image ${i + 1}`}
                aria-current={on}
                style={{
                  position: "relative",
                  flexShrink: 0,
                  width: 58,
                  height: 58,
                  borderRadius: 12,
                  overflow: "hidden",
                  cursor: "pointer",
                  padding: 0,
                  backgroundColor: "#F5F2EC",
                  border: on ? `1.5px solid ${accent}` : "1px solid #EDE8DF",
                  opacity: on ? 1 : 0.6,
                  transition: "opacity 200ms ease, border-color 200ms ease",
                }}
              >
                <Image src={p} alt="" fill sizes="58px" style={{ objectFit: "cover" }} />
              </button>
            );
          })}
        </div>
      )}

      <style>{`@keyframes tg-fade { from { opacity: 0.55 } to { opacity: 1 } }`}</style>
    </div>
  );
}
