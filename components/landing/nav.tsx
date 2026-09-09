"use client";
import Link from "next/link";
import { motion, useScroll, useTransform } from "motion/react";
import { Wordmark } from "@/components/ui/Wordmark";
import ThemeToggle from "./interactive/theme-toggle";
import { c, ground } from "./styles";

const LINKS = [
  { label: "How it works", href: "#how-it-works" },
  { label: "Industries", href: "#industries" },
  { label: "Pricing", href: "#pricing" },
];

/**
 * The nav sits inside the opening frame rather than on top of it: nothing but
 * the mark and three words while the hero is on screen, then it settles onto a
 * pane of dark glass once you are inside the page.
 */
export default function LandingNav() {
  const { scrollY } = useScroll();
  const bgOpacity = useTransform(scrollY, [0, 140], [0, 0.88]);
  const seamOpacity = useTransform(scrollY, [40, 160], [0, 1]);
  const height = useTransform(scrollY, [0, 160], [86, 64]);

  return (
    <motion.nav style={{ position: "fixed", top: 0, left: 0, right: 0, zIndex: 80 }}>
      <motion.div
        style={{
          position: "absolute",
          inset: 0,
          backgroundColor: ground(0.92),
          backdropFilter: "blur(16px)",
          WebkitBackdropFilter: "blur(16px)",
          opacity: bgOpacity,
        }}
      />
      <motion.div
        style={{
          position: "absolute",
          bottom: 0,
          left: 0,
          right: 0,
          height: 1,
          opacity: seamOpacity,
          background: `linear-gradient(90deg, transparent, ${c.hairlineWarm} 22%, ${c.hairline} 60%, transparent)`,
        }}
      />

      <motion.div
        className="nav-bar"
        style={{
          position: "relative",
          maxWidth: 1280,
          margin: "0 auto",
          padding: "0 56px",
          height,
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
        }}
      >
        <Link href="/" style={{ textDecoration: "none", display: "flex", alignItems: "center" }}>
          <Wordmark height={26} withIcon />
        </Link>

        <div className="nav-links" style={{ display: "flex", alignItems: "center", gap: 34 }}>
          {LINKS.map(({ label, href }) => (
            <a key={label} href={href} className="cine-navlink">
              {label}
            </a>
          ))}
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: 18 }}>
          <ThemeToggle />
          <Link href="/auth/login" className="cine-navlink nav-signin">
            Sign in
          </Link>
          <Link href="/auth/register" className="cine-cta-ghost cine-cta-sm">
            Apply for access
          </Link>
        </div>
      </motion.div>
    </motion.nav>
  );
}
