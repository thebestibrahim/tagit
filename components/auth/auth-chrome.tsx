"use client";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { motion } from "motion/react";
import { Wordmark } from "@/components/ui/Wordmark";
import { c, EASE } from "@/components/landing/styles";

/**
 * Shared shell for the four /auth forms (register, login, forgot-password,
 * reset-password). They were four copies of the same dark-left / light-right
 * skeleton with the copy swapped in — this is that skeleton, once.
 */

export const authInputBase: React.CSSProperties = {
  width: "100%",
  border: `1px solid ${c.line}`,
  borderRadius: 8,
  padding: "13px 15px",
  fontSize: 15,
  color: c.ink,
  backgroundColor: "#fff",
  outline: "none",
  fontFamily: "inherit",
  letterSpacing: "-0.005em",
  transition: "border-color 0.2s, box-shadow 0.2s",
};

export function authFocusInput(e: React.FocusEvent<HTMLInputElement>) {
  e.currentTarget.style.borderColor = c.gold;
  e.currentTarget.style.boxShadow = "0 0 0 3px rgba(184,148,93,0.14)";
}
export function authBlurInput(e: React.FocusEvent<HTMLInputElement>) {
  e.currentTarget.style.borderColor = c.line;
  e.currentTarget.style.boxShadow = "none";
}

/** The field label above every input on these forms. */
export function FieldLabel({ htmlFor, children }: { htmlFor: string; children: React.ReactNode }) {
  return (
    <label htmlFor={htmlFor} style={{ display: "block", fontSize: 14, fontWeight: 550, color: c.inkSoft, marginBottom: 8, letterSpacing: "-0.005em" }}>
      {children}
    </label>
  );
}

export function AuthSubmitButton({
  loading,
  disabled,
  children,
}: {
  loading: boolean;
  disabled?: boolean;
  children: React.ReactNode;
}) {
  const isDisabled = loading || disabled;
  return (
    <button
      type="submit"
      disabled={isDisabled}
      style={{
        width: "100%",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        gap: 8,
        padding: "14px 24px",
        backgroundColor: isDisabled ? "#2A2A2B" : c.ink,
        color: c.paper,
        border: "none",
        borderRadius: 8,
        fontSize: 15,
        fontWeight: 550,
        letterSpacing: "-0.008em",
        cursor: isDisabled ? "not-allowed" : "pointer",
        transition: "background-color 0.2s",
        fontFamily: "inherit",
        opacity: disabled && !loading ? 0.5 : 1,
      }}
    >
      {children}
    </button>
  );
}

/** The dark editorial panel on the left. Hidden below 1024px, replaced by a plain logo lockup. */
export function AuthLeftPanel({
  eyebrow,
  heading,
  body,
  features,
  note,
}: {
  eyebrow: string;
  heading: React.ReactNode;
  body?: string;
  features?: string[];
  note?: string;
}) {
  return (
    <div
      className="hidden lg:flex auth-left"
      style={{
        width: "42%",
        backgroundColor: c.night,
        padding: "48px 56px",
        display: "flex",
        flexDirection: "column",
        justifyContent: "space-between",
        position: "relative",
        overflowY: "auto",
        overflowX: "hidden",
        flexShrink: 0,
      }}
    >
      <div
        style={{
          position: "absolute",
          top: 0,
          left: "50%",
          transform: "translateX(-50%)",
          width: 520,
          height: 380,
          background: "radial-gradient(ellipse at 50% 0%, rgba(184,148,93,0.13) 0%, transparent 70%)",
          pointerEvents: "none",
        }}
      />

      <div style={{ display: "flex", alignItems: "center", position: "relative" }}>
        <Wordmark height={30} withIcon />
      </div>

      <div style={{ position: "relative" }}>
        <p style={{ fontSize: 15, fontWeight: 600, color: c.champagne, marginBottom: 18, letterSpacing: "-0.005em" }}>
          {eyebrow}
        </p>
        <h2
          style={{
            fontFamily: "var(--font-display)",
            fontSize: "clamp(28px, 2.8vw, 40px)",
            fontWeight: 400,
            color: c.onDark,
            letterSpacing: "-0.028em",
            lineHeight: 1.18,
            margin: "0 0 24px",
          }}
        >
          {heading}
        </h2>
        {body && (
          <p style={{ fontSize: 16, color: c.onDarkBody, lineHeight: 1.65, margin: features ? "0 0 32px" : 0, letterSpacing: "-0.005em", maxWidth: 340 }}>
            {body}
          </p>
        )}

        {features && (
          <div style={{ display: "flex", flexDirection: "column", gap: 13 }}>
            {features.map((item) => (
              <div key={item} style={{ display: "flex", alignItems: "center", gap: 11 }}>
                <span style={{ width: 5, height: 5, borderRadius: "50%", backgroundColor: c.gold, opacity: 0.85, flexShrink: 0 }} />
                <span style={{ fontSize: 15, color: c.onDarkBody, letterSpacing: "-0.005em" }}>{item}</span>
              </div>
            ))}
          </div>
        )}

        {note && (
          <div style={{ marginTop: 32, paddingTop: 18, borderTop: "1px solid rgba(212,182,138,0.14)" }}>
            <p style={{ margin: 0, fontSize: 14, color: c.onDarkQuiet, letterSpacing: "-0.003em" }}>{note}</p>
          </div>
        )}
      </div>

      <p style={{ fontSize: 13, color: "#54504A", letterSpacing: "-0.003em", position: "relative" }}>
        © {new Date().getFullYear()} Tagit — identity infrastructure for luxury
      </p>
    </div>
  );
}

/** Right-hand column: back link, mobile logo, and the form content itself. */
export function AuthRightPanel({
  backHref,
  backLabel,
  wide,
  children,
}: {
  backHref: string;
  backLabel: string;
  wide?: boolean;
  children: React.ReactNode;
}) {
  return (
    <div
      style={{
        flex: 1,
        display: "flex",
        flexDirection: "column",
        justifyContent: "center",
        padding: "48px clamp(24px, 6vw, 96px)",
        overflowY: "auto",
      }}
    >
      <div style={{ marginBottom: 44 }}>
        <Link href={backHref} style={{ display: "inline-flex", alignItems: "center", gap: 7, fontSize: 15, color: c.body, textDecoration: "none", letterSpacing: "-0.005em" }}>
          <ArrowLeft size={14} />
          {backLabel}
        </Link>
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.7, ease: EASE }}
        style={{ maxWidth: wide ? 460 : 400, width: "100%" }}
      >
        <div style={{ display: "flex", alignItems: "center", marginBottom: 32 }} className="lg:hidden">
          <Wordmark height={26} withIcon />
        </div>

        {children}
      </motion.div>
    </div>
  );
}

export function AuthEyebrow({ children, tone = "gold" }: { children: React.ReactNode; tone?: "gold" | "alert" }) {
  return (
    <p style={{ fontSize: 14, fontWeight: 600, color: tone === "alert" ? "#B85C5C" : c.goldText, marginBottom: 10, letterSpacing: "-0.003em" }}>
      {children}
    </p>
  );
}

export function AuthHeading({ children, tight }: { children: React.ReactNode; tight?: boolean }) {
  return (
    <h1
      style={{
        fontFamily: "var(--font-display)",
        fontSize: "clamp(28px, 3vw, 38px)",
        fontWeight: 400,
        color: c.ink,
        letterSpacing: "-0.028em",
        lineHeight: 1.1,
        margin: tight ? "0 0 8px" : "0 0 32px",
      }}
    >
      {children}
    </h1>
  );
}

// Fixed to the viewport rather than min-height: each panel scrolls internally
// (AuthLeftPanel, AuthRightPanel) when its own content runs long, instead of
// growing the whole row and dragging the other panel out of its centered position.
export const authOuter: React.CSSProperties = { height: "100vh", display: "flex", backgroundColor: c.paper };

export const authResponsiveCss = `
  @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
  @media (max-width: 1023px) { .hidden.lg\\:flex { display: none !important; } }
  .lg\\:hidden { display: none; }
  @media (max-width: 1023px) { .lg\\:hidden { display: flex !important; } }
`;
