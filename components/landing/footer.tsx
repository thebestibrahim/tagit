import Link from "next/link";

const COLS = [
  {
    label: "Platform",
    links: [
      { label: "How it works", href: "#how-it-works" },
      { label: "Industries", href: "#industries" },
      { label: "Pricing", href: "#pricing" },
      { label: "Request a Demo", href: "mailto:business@tagitlux.com" },
    ],
  },
  {
    label: "Company",
    links: [
      { label: "About", href: "#" },
      { label: "Contact", href: "mailto:business@tagitlux.com" },
      { label: "Privacy Policy", href: "/privacy" },
      { label: "Terms of Service", href: "/terms" },
    ],
  },
  {
    label: "Brand Login",
    links: [
      { label: "Brand dashboard", href: "/auth/login" },
      { label: "Sign in", href: "/auth/login" },
    ],
  },
];

export default function LandingFooter() {
  return (
    <footer style={{ borderTop: "1px solid #E8E2D5", backgroundColor: "#FAFAF8" }}>
      <div style={{ maxWidth: 1120, margin: "0 auto", padding: "56px 32px 32px" }}>
        {/* Top */}
        <div className="footer-grid" style={{ display: "grid", gridTemplateColumns: "2fr 1fr 1fr 1fr", gap: 48, marginBottom: 48 }}>
          {/* Brand */}
          <div className="footer-brand">
            <div style={{ display: "flex", alignItems: "center", gap: 4, marginBottom: 14 }}>
              <span style={{ width: 5, height: 5, borderRadius: "50%", backgroundColor: "#B8945D", display: "inline-block" }} />
              <span style={{ fontFamily: "var(--font-display)", fontSize: 18, fontStyle: "italic", color: "#0A0A0B", letterSpacing: "-0.02em" }}>Tagit</span>
            </div>
            <p style={{ fontSize: 13, color: "#6E6E73", lineHeight: 1.65, maxWidth: 240, margin: "0 0 16px" }}>
              Every luxury piece deserves a permanent record. Tagit gives your work a life beyond the point of sale.
            </p>
            <a
              href="mailto:business@tagitlux.com"
              style={{ fontSize: 13, color: "#B8945D", textDecoration: "none", fontWeight: 450 }}
            >
              business@tagitlux.com
            </a>
          </div>

          {/* Columns */}
          {COLS.map((col) => (
            <div key={col.label}>
              <p style={{ margin: "0 0 14px", fontFamily: "var(--font-mono)", fontSize: 10, color: "#9E9EA3", letterSpacing: "0.1em", textTransform: "uppercase" }}>
                {col.label}
              </p>
              <ul style={{ listStyle: "none", padding: 0, margin: 0, display: "flex", flexDirection: "column", gap: 9 }}>
                {col.links.map((link) => (
                  <li key={link.label}>
                    <Link
                      href={link.href}
                      style={{ fontSize: 13, color: "#6E6E73", textDecoration: "none", lineHeight: 1 }}
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* Bottom bar */}
        <div
          style={{
            paddingTop: 24,
            borderTop: "1px solid #E8E2D5",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            flexWrap: "wrap",
            gap: 12,
          }}
        >
          <p style={{ margin: 0, fontSize: 12, color: "#9E9EA3" }}>
            © {new Date().getFullYear()} Tagit. All rights reserved.
          </p>
          <p style={{ margin: 0, fontFamily: "var(--font-mono)", fontSize: 10, color: "#C7C7CC", letterSpacing: "0.06em" }}>
            BUILT FOR THOSE WHO BUILD TO LAST
          </p>
        </div>
      </div>
    </footer>
  );
}
