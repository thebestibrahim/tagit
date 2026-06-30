import Link from "next/link";
import { ChevronLeft } from "lucide-react";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Connecting your domain on GoDaddy — Tagit",
};

export default function GoDaddyHelpPage() {
  return (
    <main style={{ maxWidth: 640, margin: "0 auto", padding: "48px 24px 80px", fontFamily: "system-ui, sans-serif" }}>
      <Link
        href="/dashboard/settings"
        style={{ display: "inline-flex", alignItems: "center", gap: 6, color: "#8B7355", fontSize: 14, textDecoration: "none", marginBottom: 32 }}
      >
        <ChevronLeft size={14} />
        Back to settings
      </Link>

      <p style={{ fontSize: 11, fontWeight: 600, letterSpacing: "0.16em", textTransform: "uppercase", color: "#B49A6B", marginBottom: 8 }}>
        DNS setup
      </p>
      <h1 style={{ fontSize: 28, fontWeight: 300, color: "#1C1C1C", letterSpacing: "-0.01em", lineHeight: 1.2, margin: "0 0 8px" }}>
        Connecting your domain on GoDaddy
      </h1>
      <p style={{ fontSize: 14, color: "#6B6B6B", lineHeight: 1.7, margin: "0 0 40px" }}>
        These steps add the DNS record that lets Tagit serve your brand page on your own domain. The change usually takes 5-30 minutes to take effect, though it can take up to 48 hours.
      </p>

      <ol style={{ paddingLeft: 0, listStyle: "none", margin: 0 }}>
        <Step n={1} title="Sign in to GoDaddy">
          Go to <strong>godaddy.com</strong> and sign in to your account.
        </Step>

        <Step n={2} title="Open your domain settings">
          Click your name in the top right, then <strong>My Products</strong>. Find your domain and click <strong>DNS</strong> next to it.
        </Step>

        <Step n={3} title="Add a CNAME record">
          <p style={{ margin: "0 0 12px" }}>
            Scroll to the <strong>CNAME</strong> section and click <strong>Add</strong>. Fill in the fields:
          </p>
          <RecordTable rows={[
            ["Type", "CNAME"],
            ["Name", "@"],
            ["Value", "cname.vercel-dns.com"],
            ["TTL", "1 Hour (or default)"],
          ]} />
          <p style={{ margin: "12px 0 0", fontSize: 13, color: "#8B8B8B" }}>
            GoDaddy may show <strong>@</strong> as your actual domain name (e.g. bushuaart.com) in the Name field. Enter <strong>@</strong> and it will save correctly. If there is already a CNAME for <strong>@</strong>, edit it rather than adding a new one.
          </p>
        </Step>

        <Step n={4} title="Save your changes">
          Click <strong>Save</strong>. GoDaddy will apply the change. DNS propagation typically takes a few minutes to a few hours.
        </Step>

        <Step n={5} title="Check connection in Tagit">
          Return to your Tagit settings and click <strong>Check Connection</strong>. It will confirm once the record has been detected.
        </Step>
      </ol>

      <div style={{ marginTop: 40, padding: "16px 20px", backgroundColor: "#F9F6F0", border: "1px solid #E8E0D0", borderRadius: 12 }}>
        <p style={{ fontSize: 14, color: "#6B6B6B", margin: 0, lineHeight: 1.7 }}>
          Need help? Email us at <a href="mailto:business@tagitlux.com" style={{ color: "#B49A6B" }}>business@tagitlux.com</a> and we will walk you through it.
        </p>
      </div>
    </main>
  );
}

function Step({ n, title, children }: { n: number; title: string; children: React.ReactNode }) {
  return (
    <li style={{ display: "flex", gap: 20, marginBottom: 36 }}>
      <span style={{ display: "flex", alignItems: "center", justifyContent: "center", width: 32, height: 32, borderRadius: "50%", backgroundColor: "#1C1C1C", color: "#FAFAF8", fontSize: 13, fontWeight: 600, flexShrink: 0, marginTop: 2 }}>
        {n}
      </span>
      <div>
        <p style={{ fontSize: 15, fontWeight: 600, color: "#1C1C1C", margin: "4px 0 8px" }}>{title}</p>
        <div style={{ fontSize: 14, color: "#4A4A4A", lineHeight: 1.7 }}>{children}</div>
      </div>
    </li>
  );
}

function RecordTable({ rows }: { rows: [string, string][] }) {
  return (
    <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
      <tbody>
        {rows.map(([label, value]) => (
          <tr key={label} style={{ borderBottom: "1px solid #E8E0D0" }}>
            <td style={{ padding: "8px 12px 8px 0", color: "#8B8B8B", fontWeight: 500, width: 80, verticalAlign: "top" }}>{label}</td>
            <td style={{ padding: "8px 0", color: "#1C1C1C", fontFamily: "monospace", fontWeight: value === "cname.vercel-dns.com" || value === "@" ? 600 : 400 }}>{value}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}
