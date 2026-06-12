import Link from "next/link";

export const metadata = { title: "Privacy Policy — Tagit" };

export default function PrivacyPage() {
  return (
    <div style={{ backgroundColor: "#FAFAF8", minHeight: "100vh" }}>
      {/* Nav bar */}
      <div style={{ borderBottom: "1px solid #E8E2D5", backgroundColor: "#FAFAF8" }}>
        <div style={{ maxWidth: 1120, margin: "0 auto", padding: "0 32px", height: 64, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <Link href="/" style={{ textDecoration: "none", display: "flex", alignItems: "center", gap: 4 }}>
            <span style={{ width: 5, height: 5, borderRadius: "50%", backgroundColor: "#B8945D", display: "inline-block" }} />
            <span style={{ fontFamily: "var(--font-display)", fontSize: 18, fontStyle: "italic", color: "#0A0A0B", letterSpacing: "-0.02em" }}>Tagit</span>
          </Link>
          <Link href="/" style={{ fontSize: 13, color: "#6E6E73", textDecoration: "none" }}>← Back to home</Link>
        </div>
      </div>

      {/* Content */}
      <div style={{ maxWidth: 720, margin: "0 auto", padding: "72px 32px 120px" }}>
        <p style={{ fontFamily: "var(--font-mono)", fontSize: 10, color: "#B8945D", letterSpacing: "0.12em", textTransform: "uppercase", margin: "0 0 16px" }}>
          Legal
        </p>
        <h1 style={{ fontFamily: "var(--font-display)", fontSize: "clamp(32px, 4vw, 52px)", fontWeight: 400, color: "#0A0A0B", letterSpacing: "-0.03em", lineHeight: 1.1, margin: "0 0 12px" }}>
          Privacy Policy
        </h1>
        <p style={{ fontSize: 14, color: "#9E9EA3", margin: "0 0 48px", fontFamily: "var(--font-mono)", letterSpacing: "0.04em" }}>
          Last updated: June 2026
        </p>

        <div style={{ display: "flex", flexDirection: "column", gap: 40 }}>
          {[
            {
              title: "Who we are",
              body: "Tagit is a luxury goods identity platform that helps brands give their products a permanent, verifiable digital identity. We are operated by Tagit Technologies Ltd. You can reach us at business@tagitlux.com.",
            },
            {
              title: "What we collect",
              body: "We collect information you provide directly — such as your name, email address, and company details when you register as a brand partner or request a demo. We also collect information about how you interact with our platform, including scan events and product views, which are associated with items you own rather than with individual users where possible.",
            },
            {
              title: "How we use your information",
              body: "We use your information to operate and improve the Tagit platform, to communicate with you about your account, and to send you updates relevant to your brand partnership. We do not sell your personal information to third parties.",
            },
            {
              title: "Data sharing",
              body: "We share information with our technology partners (including Supabase for database hosting) only as necessary to operate the service. All partners are bound by data processing agreements that protect your information.",
            },
            {
              title: "Ownership records",
              body: "Ownership transfer records are permanent and cannot be deleted — this is by design, as the immutability of the record is core to the product's value. Before initiating a transfer or claim, please review the information carefully.",
            },
            {
              title: "Your rights",
              body: "Depending on your location, you may have rights to access, correct, or delete your personal data. To exercise these rights, contact us at business@tagitlux.com. We will respond within 30 days.",
            },
            {
              title: "Location data",
              body: "When a consumer scans a Tagit-enabled item, Tagit collects the approximate geographic location of that scan based on the IP address of the device used. This location data is collected at country and region level only. Tagit does not collect precise GPS coordinates or device location.\n\nLocation data collected includes the country and approximate region from which a scan, ownership claim, or ownership transfer was initiated. This data is used to provide brand partners with analytics showing where their items are being used and where ownership is changing hands.\n\nBrand partners receive aggregate and anonymised location analytics through their Tagit dashboard. Individual consumer location data is never shared with brand partners in an identifiable form.\n\nLocation data is retained for the lifetime of the product record to which it belongs. Consumers may request deletion of their location data by contacting info@tagitlux.com.",
            },
            {
              title: "Data we collect on scans",
              body: "Each time a Tagit-enabled item is scanned, Tagit automatically records the date and time of the scan, the approximate geographic location based on IP address, the device type, and the item scanned. This data is used to detect fraudulent scanning activity and to provide analytics to brand partners.",
            },
            {
              title: "Your rights under GDPR and the NDPA",
              body: "If you are located in the European Union or United Kingdom you have rights under the General Data Protection Regulation including the right to access your personal data, the right to request correction or deletion, and the right to object to processing. To exercise these rights contact info@tagitlux.com.\n\nIf you are located in Nigeria your data rights are governed by the Nigeria Data Protection Act 2023. Tagit processes personal data in compliance with the NDPA. To exercise your rights contact info@tagitlux.com.",
            },
            {
              title: "Cookies",
              body: "We use cookies and similar technologies to keep you signed in and to understand how the platform is used. You can manage cookie preferences through your browser settings.",
            },
            {
              title: "Changes to this policy",
              body: "We may update this policy from time to time. Material changes will be communicated to registered users by email. Continued use of the platform after changes take effect constitutes acceptance of the updated policy.",
            },
            {
              title: "Contact",
              body: "For any privacy-related questions, contact us at business@tagitlux.com.",
            },
          ].map((section) => (
            <div key={section.title}>
              <h2 style={{ fontFamily: "var(--font-display)", fontSize: 20, fontWeight: 400, fontStyle: "italic", color: "#1F1F22", letterSpacing: "-0.015em", margin: "0 0 12px" }}>
                {section.title}
              </h2>
              {section.body.split("\n\n").map((para, i) => (
                <p key={i} style={{ fontSize: 14, color: "#6E6E73", lineHeight: 1.75, margin: i === 0 ? 0 : "12px 0 0", letterSpacing: "-0.003em" }}>
                  {para}
                </p>
              ))}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
