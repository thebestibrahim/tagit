"use client";
import Link from "next/link";
import { motion, useScroll, useTransform } from "motion/react";
import MagneticButton from "./interactive/magnetic-button";
import { RequestAccessButton } from "./request-access-modal";

export default function LandingNav() {
  const { scrollY } = useScroll();
  const borderOpacity = useTransform(scrollY, [0, 80], [0, 1]);
  const bgOpacity = useTransform(scrollY, [0, 80], [0.5, 0.92]);

  return (
    <motion.nav style={{ position: "fixed", top: 0, left: 0, right: 0, zIndex: 100, borderBottom: "1px solid rgba(232,226,213,0)" }}>
      {/* Glass backdrop */}
      <motion.div style={{
        position: "absolute", inset: 0,
        backgroundColor: "#FAFAF8", backdropFilter: "blur(12px)", WebkitBackdropFilter: "blur(12px)",
        opacity: bgOpacity,
      }} />
      <motion.div style={{
        position: "absolute", bottom: 0, left: 0, right: 0,
        height: 1, backgroundColor: "#E8E2D5", opacity: borderOpacity,
      }} />

      <div style={{
        position: "relative", maxWidth: 1120, margin: "0 auto",
        padding: "0 32px", height: 64,
        display: "flex", alignItems: "center", justifyContent: "space-between",
      }}>
        {/* Logo */}
        <Link href="/" style={{ textDecoration: "none", display: "flex", alignItems: "center", gap: 4 }}>
          <span style={{ width: 6, height: 6, borderRadius: "50%", backgroundColor: "#B8945D", display: "inline-block", flexShrink: 0 }} />
          <span style={{ fontFamily: "var(--font-display)", fontSize: 20, fontStyle: "italic", color: "#0A0A0B", letterSpacing: "-0.02em" }}>
            Tagit
          </span>
        </Link>

        {/* Links */}
        <div className="nav-links" style={{ display: "flex", alignItems: "center", gap: 32 }}>
          {[
            { label: "How it works", href: "#how-it-works" },
            { label: "Industries", href: "#industries" },
            { label: "Pricing", href: "#pricing" },
          ].map(({ label, href }) => (
            <a
              key={label}
              href={href}
              style={{ fontSize: 14, color: "#6E6E73", textDecoration: "none", fontWeight: 450, letterSpacing: "-0.005em", transition: "color 0.2s ease" }}
              onMouseEnter={(e) => (e.currentTarget.style.color = "#0A0A0B")}
              onMouseLeave={(e) => (e.currentTarget.style.color = "#6E6E73")}
            >
              {label}
            </a>
          ))}
        </div>

        {/* CTAs */}
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <Link
            href="/auth/login"
            className="nav-signin"
            style={{ fontSize: 13, color: "#6E6E73", textDecoration: "none", fontWeight: 450 }}
          >
            Sign in
          </Link>
          <MagneticButton>
            <RequestAccessButton
              style={{
                fontSize: 13, fontWeight: 550,
                color: "#FAFAF8", backgroundColor: "#0A0A0B",
                padding: "9px 18px", borderRadius: 7,
                letterSpacing: "-0.005em",
              }}
            >
              Request Access
            </RequestAccessButton>
          </MagneticButton>
        </div>
      </div>
    </motion.nav>
  );
}
