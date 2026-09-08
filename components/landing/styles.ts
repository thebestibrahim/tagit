/**
 * Shared visual language for the landing page.
 *
 * Two rules this file exists to enforce:
 *  1. Page copy bottoms out at 14px. Decorative micro-type is not a style. The only
 *     exception is the secondary line inside the two simulated product cards (13px),
 *     where it reads as real product UI rather than decoration.
 *  2. Every text colour here clears WCAG AA against the surface it is named for.
 */

export const EASE = [0.16, 1, 0.3, 1] as const;

export const c = {
  /* Surfaces */
  paper: "#FAFAF8",
  ivory: "#F5F2EC",
  night: "#0A0A0B",

  /* Ink on light surfaces */
  ink: "#0A0A0B",
  inkSoft: "#1F1F22",
  body: "#55555B", // 6.8:1 on paper
  quiet: "#6C6C73", // 4.7:1 on paper

  /* Ink on dark surfaces */
  onDark: "#FAFAF8",
  onDarkBody: "#C2C2C8", // 11:1 on night
  onDarkQuiet: "#9B9BA2", // 7:1 on night

  /* Rules */
  line: "#E8E2D5",
  lineDark: "rgba(212,182,138,0.13)",

  /* Gold. goldText is the only gold safe for text on light. */
  gold: "#B8945D",
  goldText: "#8B6F3F",
  champagne: "#C9A66B",

  verified: "#2D6A4F",
} as const;

const serif = { fontFamily: "var(--font-display)", fontWeight: 400 } as const;

export const type = {
  /** Hero only. */
  display: { ...serif, fontSize: "clamp(44px, 5.4vw, 78px)", letterSpacing: "-0.038em", lineHeight: 0.98 },
  /** Section headings. */
  h2: { ...serif, fontSize: "clamp(33px, 3.7vw, 52px)", letterSpacing: "-0.032em", lineHeight: 1.06, margin: 0 },
  h3: { ...serif, fontSize: "clamp(22px, 2.1vw, 28px)", letterSpacing: "-0.022em", lineHeight: 1.18, margin: 0 },
  /** The sentence directly under a heading. */
  lead: { fontSize: "clamp(17px, 1.35vw, 19px)", lineHeight: 1.58, letterSpacing: "-0.011em", margin: 0 },
  body: { fontSize: 16, lineHeight: 1.65, letterSpacing: "-0.006em", margin: 0 },
  small: { fontSize: 14.5, lineHeight: 1.55, letterSpacing: "-0.003em", margin: 0 },
} as const;

/** Standard reveal. Sections stagger their children rather than each element choosing its own timing. */
export const reveal = {
  initial: { opacity: 0, y: 20 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true, margin: "-70px" },
} as const;

export const rise = (delay = 0) => ({
  ...reveal,
  transition: { duration: 0.75, ease: EASE, delay },
});
