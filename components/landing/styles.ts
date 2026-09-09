/**
 * Shared visual language for the landing page.
 *
 * The landing page is staged as one continuous shot through a dark room: a
 * single warm key light rakes across objects, the whole reel carries one colour
 * grade, and depth comes from things moving at different rates as you scroll.
 * The auth pages still use the light half of this palette, so the light tokens
 * below stay exactly as they were.
 *
 * Two rules this file exists to enforce:
 *  1. Page copy bottoms out at 14px. Decorative micro-type is not a style.
 *  2. Every text colour here clears WCAG AA against the surface it is named for.
 */

export const EASE = [0.16, 1, 0.3, 1] as const;
/** For scroll-linked motion, where an ease-out curve reads as lag, not intent. */
export const EASE_LINEAR = [0.4, 0, 0.6, 1] as const;

export const c = {
  /* ── Light surfaces (auth pages, and the one lit act at the end) ── */
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

  /* ── The dark room ────────────────────────────────────────────────
     abyss is the ground. plate is a surface catching a little light.
     Never place one flat fill against another: light does the separating. */
  abyss: "#08080A",
  plate: "#101013",
  raised: "#17171B",

  /* Light falling on the dark room */
  bone: "#F3F0E9", // primary
  patina: "#A8A49C", // secondary, 8.2:1 on abyss
  ash: "#7C7972", // tertiary, 4.6:1 on abyss — labels only, never body copy

  /* The key light itself */
  key: "#C8A464",
  ember: "#EBD3A0",
  keyGlow: "rgba(200,164,100,0.16)",
  hairline: "rgba(243,240,233,0.10)",
  hairlineWarm: "rgba(200,164,100,0.22)",

  /* Confirmation, keyed for a dark ground */
  seal: "#5FBF8F",
} as const;

const serif = { fontFamily: "var(--font-display)", fontWeight: 400 } as const;

/** A perfect fourth off 16px, so the display sizes are related, not chosen. */
export const type = {
  /** Hero only. Set to fill its measure, not to sit inside one. */
  display: { ...serif, fontSize: "clamp(52px, 8.2vw, 132px)", letterSpacing: "-0.042em", lineHeight: 0.9 },
  /** Section headings. */
  h2: { ...serif, fontSize: "clamp(36px, 4.6vw, 68px)", letterSpacing: "-0.035em", lineHeight: 1.02, margin: 0 },
  h3: { ...serif, fontSize: "clamp(24px, 2.3vw, 34px)", letterSpacing: "-0.025em", lineHeight: 1.14, margin: 0 },
  /** The sentence directly under a heading. */
  lead: { fontSize: "clamp(17px, 1.35vw, 20px)", lineHeight: 1.58, letterSpacing: "-0.012em", margin: 0 },
  body: { fontSize: 16, lineHeight: 1.68, letterSpacing: "-0.006em", margin: 0 },
  small: { fontSize: 14.5, lineHeight: 1.6, letterSpacing: "-0.003em", margin: 0 },
} as const;

/** Standard reveal. Used sparingly now: the page moves because you scroll. */
export const reveal = {
  initial: { opacity: 0, y: 20 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true, margin: "-70px" },
} as const;

export const rise = (delay = 0) => ({
  ...reveal,
  transition: { duration: 0.75, ease: EASE, delay },
});

/** One colour grade across every photograph on the page, whatever it was shot on. */
export const GRADE = "saturate(0.72) contrast(1.06) brightness(0.78)";
