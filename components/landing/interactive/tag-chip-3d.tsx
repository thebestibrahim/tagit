"use client";
import { useRef, useEffect } from "react";

export default function TagChip3D() {
  const containerRef = useRef<HTMLDivElement>(null);
  const chipRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const container = containerRef.current;
    const chip = chipRef.current;
    if (!container || !chip) return;

    let angle = 0;
    let tiltX = 0;
    let tiltY = 0;
    let targetTiltX = 0;
    let targetTiltY = 0;
    let isHovering = false;
    let lastTime = performance.now();
    let rafId: number;

    function tick(time: number) {
      if (!chip) return;
      const delta = Math.min((time - lastTime) / 1000, 0.05);
      lastTime = time;

      if (!isHovering) {
        angle += (360 / 15) * delta;
      }
      tiltX += (targetTiltX - tiltX) * 0.08;
      tiltY += (targetTiltY - tiltY) * 0.08;

      if (isHovering) {
        chip.style.transform = `perspective(900px) rotateX(${tiltY}deg) rotateY(${tiltX}deg)`;
      } else {
        chip.style.transform = `perspective(900px) rotateY(${angle % 360}deg) rotateX(${tiltY * 0.5}deg)`;
      }

      rafId = requestAnimationFrame(tick);
    }

    const el = container;

    function onMouseMove(e: MouseEvent) {
      const rect = el.getBoundingClientRect();
      targetTiltX = ((e.clientX - (rect.left + rect.width / 2)) / (rect.width / 2)) * 22;
      targetTiltY = -((e.clientY - (rect.top + rect.height / 2)) / (rect.height / 2)) * 14;
    }

    function onMouseEnter() { isHovering = true; }
    function onMouseLeave() {
      isHovering = false;
      targetTiltX = 0;
      targetTiltY = 0;
    }

    el.addEventListener("mousemove", onMouseMove);
    el.addEventListener("mouseenter", onMouseEnter);
    el.addEventListener("mouseleave", onMouseLeave);
    rafId = requestAnimationFrame(tick);

    return () => {
      cancelAnimationFrame(rafId);
      el.removeEventListener("mousemove", onMouseMove);
      el.removeEventListener("mouseenter", onMouseEnter);
      el.removeEventListener("mouseleave", onMouseLeave);
    };
  }, []);

  return (
    <div
      ref={containerRef}
      style={{
        position: "relative",
        width: 260,
        height: 260,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        cursor: "none",
      }}
    >
      {/* Pulsing scan rings */}
      {[0, 1, 2].map((i) => (
        <div
          key={i}
          style={{
            position: "absolute",
            width: 200,
            height: 200,
            borderRadius: "50%",
            border: "1px solid rgba(184,148,93,0.35)",
            top: "50%",
            left: "50%",
            transform: "translate(-50%,-50%)",
            animation: `tagRingPulse 3s ease-out ${i * 1}s infinite`,
            pointerEvents: "none",
          }}
        />
      ))}

      {/* Chip body */}
      <div
        ref={chipRef}
        style={{
          width: 168,
          height: 168,
          borderRadius: "50%",
          background:
            "conic-gradient(from 20deg at 50% 50%, #C9A66B 0deg, #E8CC99 55deg, #9A7340 110deg, #D4B68A 160deg, #8B6F3F 200deg, #C9A66B 255deg, #E8CC99 305deg, #C9A66B 360deg)",
          boxShadow:
            "0 24px 64px rgba(184,148,93,0.4), 0 8px 24px rgba(10,10,11,0.25), inset 0 1px 2px rgba(255,255,255,0.35)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          position: "relative",
          willChange: "transform",
        }}
      >
        {/* Antenna rings */}
        {[136, 114, 92].map((size) => (
          <div
            key={size}
            style={{
              position: "absolute",
              width: size,
              height: size,
              borderRadius: "50%",
              border: "1px solid rgba(139,111,63,0.35)",
              top: "50%",
              left: "50%",
              transform: "translate(-50%,-50%)",
              pointerEvents: "none",
            }}
          />
        ))}

        {/* Central contact pad */}
        <div
          style={{
            width: 72,
            height: 72,
            borderRadius: "50%",
            background: "radial-gradient(circle at 35% 35%, rgba(45,30,8,0.85), rgba(15,10,3,0.95))",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            boxShadow: "inset 0 2px 6px rgba(0,0,0,0.6), 0 1px 2px rgba(212,182,138,0.3)",
            position: "relative",
            zIndex: 1,
          }}
        >
          <span
            style={{
              fontFamily: "var(--font-display)",
              fontSize: 30,
              fontStyle: "italic",
              color: "#D4B68A",
              lineHeight: 1,
              userSelect: "none",
            }}
          >
            T
          </span>
        </div>
      </div>

      {/* Caption */}
      <p
        style={{
          fontFamily: "var(--font-mono)",
          fontSize: 10,
          color: "var(--color-champagne)",
          letterSpacing: "0.12em",
          textTransform: "uppercase",
          margin: "20px 0 0",
          opacity: 0.8,
        }}
      >
        TAG · X7F3C9
      </p>

      <style>{`
        @keyframes tagRingPulse {
          0%   { transform: translate(-50%,-50%) scale(1);   opacity: 0.5; }
          100% { transform: translate(-50%,-50%) scale(2.4); opacity: 0; }
        }
      `}</style>
    </div>
  );
}
