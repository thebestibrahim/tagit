import Link from "next/link";
import { Wordmark } from "@/components/ui/Wordmark";
import { c, type } from "./styles";

const COLS = [
  {
    label: "Platform",
    links: [
      { label: "How it works", href: "#how-it-works" },
      { label: "Industries", href: "#industries" },
      { label: "Pricing", href: "#pricing" },
    ],
  },
  {
    label: "Company",
    links: [
      { label: "Contact us", href: "mailto:business@tagitlux.com" },
      { label: "Privacy policy", href: "/privacy" },
      { label: "Terms of service", href: "/terms" },
    ],
  },
  {
    label: "For brands",
    links: [
      { label: "Sign in", href: "/auth/login" },
      { label: "Apply for access", href: "/auth/register" },
    ],
  },
];

export default function LandingFooter() {
  return (
    <footer style={{ borderTop: `1px solid ${c.line}`, backgroundColor: c.paper }}>
      <div style={{ maxWidth: 1120, margin: "0 auto", padding: "64px 32px 32px" }}>
        <div className="footer-grid" style={{ display: "grid", gridTemplateColumns: "2fr 1fr 1fr 1fr", gap: 48, marginBottom: 48 }}>
          <div className="footer-brand">
            <div style={{ display: "flex", alignItems: "center", marginBottom: 16 }}>
              <Wordmark height={24} withIcon />
            </div>
            <p style={{ ...type.small, color: c.body, maxWidth: 260, marginBottom: 16 }}>
              Every luxury piece deserves a permanent record. Tagit gives your work a life
              beyond the point of sale.
            </p>
            <a
              href="mailto:business@tagitlux.com"
              style={{ fontSize: 15, color: c.goldText, textDecoration: "none", fontWeight: 500 }}
            >
              business@tagitlux.com
            </a>
          </div>

          {COLS.map((col) => (
            <div key={col.label}>
              <h3 style={{ fontSize: 15, fontWeight: 600, color: c.inkSoft, margin: "0 0 16px", letterSpacing: "-0.008em" }}>
                {col.label}
              </h3>
              <ul style={{ listStyle: "none", padding: 0, margin: 0, display: "flex", flexDirection: "column", gap: 11 }}>
                {col.links.map((link) => (
                  <li key={link.label}>
                    <Link href={link.href} style={{ fontSize: 15, color: c.body, textDecoration: "none" }}>
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div style={{ paddingTop: 24, borderTop: `1px solid ${c.line}` }}>
          <p style={{ margin: 0, fontSize: 14, color: c.quiet }}>
            © {new Date().getFullYear()} Tagit. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
}
