import Link from "next/link";

export const metadata = { title: "Terms of Service — Tagit" };

export default function TermsPage() {
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
          Terms of Service
        </h1>
        <p style={{ fontSize: 14, color: "#9E9EA3", margin: "0 0 48px", fontFamily: "var(--font-mono)", letterSpacing: "0.04em" }}>
          Last updated: June 2026
        </p>

        <div style={{ display: "flex", flexDirection: "column", gap: 40 }}>
          {[
            {
              title: "Acceptance of terms",
              body: "By accessing or using the Tagit platform, you agree to be bound by these Terms of Service. If you do not agree to these terms, please do not use the platform. These terms apply to all users, including brand partners and end consumers.",
            },
            {
              title: "The platform",
              body: "Tagit provides a digital identity service for physical luxury goods. Brand partners can register products, manage ownership records, and give their customers a way to verify authenticity and track ownership history. Consumers can view product information, claim ownership, and transfer items to new owners.",
            },
            {
              title: "Brand partner obligations",
              body: "Brand partners agree to provide accurate product information and to use Tagit only for legitimate luxury goods that they own the rights to. Misuse of the platform — including registering counterfeit items or falsifying product details — will result in immediate termination of access.",
            },
            {
              title: "Ownership records",
              body: "Ownership records created on the Tagit platform are permanent and cannot be altered or deleted. This permanence is a core feature of the service. You are responsible for ensuring that any ownership claim or transfer you initiate is accurate and authorised.",
            },
            {
              title: "Analytics and location data",
              body: "By scanning a Tagit-enabled item or claiming ownership of an item through the Tagit platform, you consent to Tagit collecting approximate location data based on your IP address for the purposes described in our Privacy Policy. This data enables brand partners to understand where their items are being used and is an integral part of the Tagit authentication service.\n\nBrand partners who use the Tagit platform agree that location analytics provided to them represent aggregate data about scan and ownership activity and may not be used to identify, target, or contact individual consumers.",
            },
            {
              title: "Data retention",
              body: "Tagit retains scan and location data for the lifetime of the product record to which it belongs. Ownership records are retained permanently as part of an item's provenance history. Consumers may request deletion of personal data not forming part of a permanent provenance record by contacting info@tagitlux.com.",
            },
            {
              title: "European Union compliance",
              body: "Tagit operates in compliance with the EU Digital Product Passport framework and applicable data protection law. Brand partners selling into the European Union acknowledge that Tagit's authentication and ownership tracking services are designed to support compliance with EU Digital Product Passport requirements coming into effect between 2027 and 2029.",
            },
            {
              title: "Intellectual property",
              body: "All content on the Tagit platform, including the interface, design, and code, is owned by Tagit Technologies Ltd. Brand partners retain full ownership of their product imagery, descriptions, and brand identity content uploaded to the platform.",
            },
            {
              title: "Service availability",
              body: "We aim to keep the platform available at all times, but cannot guarantee uninterrupted service. We may perform maintenance or updates at any time. We are not liable for any loss resulting from temporary unavailability.",
            },
            {
              title: "Limitation of liability",
              body: "To the fullest extent permitted by law, Tagit is not liable for any indirect, incidental, or consequential damages arising from your use of the platform. Our total liability to you for any claim is limited to the amount you have paid us in the 12 months preceding the claim.",
            },
            {
              title: "Termination",
              body: "We reserve the right to suspend or terminate access to the platform at any time, with or without notice, for conduct that we believe violates these terms or is harmful to other users, us, or third parties.",
            },
            {
              title: "Governing law",
              body: "These terms are governed by and construed in accordance with applicable law. Any disputes will be resolved through binding arbitration or, where required by law, in the courts of the applicable jurisdiction.",
            },
            {
              title: "Contact",
              body: "For any questions about these terms, contact us at business@tagitlux.com.",
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
