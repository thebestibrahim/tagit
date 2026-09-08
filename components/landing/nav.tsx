"use client";
import Link from "next/link";
import { motion, useScroll, useTransform } from "motion/react";
import { Wordmark } from "@/components/ui/Wordmark";
import { c } from "./styles";

const LINKS = [
  { label: "How it works", href: "#how-it-works" },
  { label: "Industries", href: "#industries" },
  { label: "Pricing", href: "#pricing" },
];

export default function LandingNav() {
  const { scrollY } = useScroll();
  const borderOpacity = useTransform(scrollY, [0, 80], [0, 1]);
  const bgOpacity = useTransform(scrollY, [0, 80], [0.5, 0.92]);

  return (
    <motion.nav style={{ position: "fixed", top: 0, left: 0, right: 0, zIndex: 100 }}>
      <motion.div
        style={{
          position: "absolute",
          inset: 0,
          backgroundColor: c.paper,
          backdropFilter: "blur(12px)",
          WebkitBackdropFilter: "blur(12px)",
          opacity: bgOpacity,
        }}
      />
      <motion.div
        style={{ position: "absolute", bottom: 0, left: 0, right: 0, height: 1, backgroundColor: c.line, opacity: borderOpacity }}
      />

      <div
        style={{
          position: "relative",
          maxWidth: 1120,
          margin: "0 auto",
          padding: "0 32px",
          height: 68,
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
        }}
      >
        <Link href="/" style={{ textDecoration: "none", display: "flex", alignItems: "center" }}>
          <Wordmark height={26} withIcon />
        </Link>

        <div className="nav-links" style={{ display: "flex", alignItems: "center", gap: 32 }}>
          {LINKS.map(({ label, href }) => (
            <a
              key={label}
              href={href}
              style={{ fontSize: 15, color: c.body, textDecoration: "none", fontWeight: 450, letterSpacing: "-0.005em", transition: "color 0.2s ease" }}
              onMouseEnter={(e) => (e.currentTarget.style.color = c.ink)}
              onMouseLeave={(e) => (e.currentTarget.style.color = c.body)}
            >
              {label}
            </a>
          ))}
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
          <Link href="/auth/login" className="nav-signin" style={{ fontSize: 15, color: c.body, textDecoration: "none", fontWeight: 450 }}>
            Sign in
          </Link>
          <Link
            href="/auth/register"
            style={{
              fontSize: 14,
              fontWeight: 550,
              color: c.paper,
              backgroundColor: c.ink,
              padding: "10px 20px",
              borderRadius: 8,
              letterSpacing: "-0.005em",
              textDecoration: "none",
            }}
          >
            Apply for access
          </Link>
        </div>
      </div>
    </motion.nav>
  );
}
