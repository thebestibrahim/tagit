"use client";
import { useTheme } from "next-themes";
import { motion } from "motion/react";
import { EASE } from "../styles";

/**
 * Turns the lights on and off.
 *
 * The page ships dark because that is the brand, and this is the way out of it
 * rather than a system-preference guess.
 *
 * `resolvedTheme` is undefined until next-themes has read the stored choice, and
 * falling back to dark there is what keeps hydration honest: the server renders
 * dark (the default), so the first client render matches exactly. The page's own
 * colours are already correct by then, set before paint by next-themes' inline
 * script, so at worst this icon settles a frame late.
 */
export default function ThemeToggle() {
  const { resolvedTheme, setTheme } = useTheme();
  const dark = resolvedTheme !== "light";

  return (
    <button
      type="button"
      className="theme-toggle"
      onClick={() => setTheme(dark ? "light" : "dark")}
      aria-label={dark ? "Switch to the light theme" : "Switch to the dark theme"}
      title={dark ? "Lights on" : "Lights off"}
    >
      <motion.svg
        width="19"
        height="19"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden
      >
        {/* A stroked disc with an opaque bite reads as a thin broken ring at
            19px. Two proper icons crossing over is legible at a glance, which
            is the whole job of this control. */}
        <motion.g
          animate={{ opacity: dark ? 1 : 0, rotate: dark ? 0 : -70, scale: dark ? 1 : 0.6 }}
          transition={{ duration: 0.4, ease: EASE }}
          style={{ originX: "12px", originY: "12px" }}
        >
          <path
            d="M20.8 13.1A8.6 8.6 0 1 1 10.9 3.2 6.7 6.7 0 0 0 20.8 13.1z"
            fill="currentColor"
            fillOpacity="0.22"
          />
        </motion.g>

        <motion.g
          animate={{ opacity: dark ? 0 : 1, rotate: dark ? 70 : 0, scale: dark ? 0.6 : 1 }}
          transition={{ duration: 0.4, ease: EASE }}
          style={{ originX: "12px", originY: "12px" }}
        >
          <circle cx="12" cy="12" r="4.1" fill="currentColor" fillOpacity="0.22" />
          {[0, 45, 90, 135, 180, 225, 270, 315].map((deg) => (
            <line key={deg} x1="12" y1="2.4" x2="12" y2="4.6" transform={`rotate(${deg} 12 12)`} />
          ))}
        </motion.g>
      </motion.svg>
    </button>
  );
}
