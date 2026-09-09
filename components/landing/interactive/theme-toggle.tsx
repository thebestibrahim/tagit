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
        width="17"
        height="17"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
        aria-hidden
      >
        {/* One shape doing both jobs: the disc stays, the rays and the bite
            trade places, so the switch reads as the light changing rather than
            as two different icons swapping. */}
        <motion.circle
          cx="12"
          cy="12"
          r="5"
          animate={{ r: dark ? 8.4 : 5 }}
          transition={{ duration: 0.45, ease: EASE }}
        />
        <motion.g
          animate={{ opacity: dark ? 0 : 1, rotate: dark ? -35 : 0, scale: dark ? 0.6 : 1 }}
          transition={{ duration: 0.45, ease: EASE }}
          style={{ originX: "12px", originY: "12px" }}
        >
          {[0, 45, 90, 135, 180, 225, 270, 315].map((deg) => (
            <line
              key={deg}
              x1="12"
              y1="1.6"
              x2="12"
              y2="3.9"
              transform={`rotate(${deg} 12 12)`}
            />
          ))}
        </motion.g>
        {/* The bite that turns the disc into a crescent. */}
        <motion.circle
          cx="17.5"
          cy="7.5"
          r="7.5"
          fill="var(--lp-abyss)"
          stroke="none"
          animate={{ opacity: dark ? 1 : 0 }}
          transition={{ duration: 0.4, ease: EASE }}
        />
      </motion.svg>
    </button>
  );
}
