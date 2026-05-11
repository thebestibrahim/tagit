export const dynamic = "force-dynamic";

import { createClient } from "@supabase/supabase-js";
import { notFound } from "next/navigation";
import AcceptTransferButton from "./AcceptTransferButton";
import { ShieldX } from "lucide-react";

const admin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { autoRefreshToken: false, persistSession: false } }
);

export default async function TransferAcceptPage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;

  const { data: transferData } = await admin
    .from("transfer_requests")
    .select("id, tag_id, from_owner_id, to_name, to_email, sale_price, status, expires_at")
    .eq("acceptance_token", token)
    .single();

  if (!transferData) notFound();

  const transfer = transferData as {
    id: string;
    tag_id: string;
    from_owner_id: string;
    to_name: string;
    to_email: string;
    sale_price: number | null;
    status: string;
    expires_at: string;
  };

  const expired = new Date(transfer.expires_at) < new Date();

  // Fetch product and current owner
  const [{ data: productData }, { data: ownerData }] = await Promise.all([
    admin.from("products").select("name, companies(name, brand_primary_color, brand_accent_color, logo_url)").eq("tag_id", transfer.tag_id).single(),
    admin.from("ownership_records").select("owner_name").eq("id", transfer.from_owner_id).single(),
  ]);

  const product = productData as {
    name: string;
    companies: { name: string; brand_primary_color: string; brand_accent_color: string; logo_url: string | null };
  } | null;

  const owner = ownerData as { owner_name: string } | null;
  const primary = product?.companies?.brand_primary_color || "#0A0A0B";
  const accent = product?.companies?.brand_accent_color || "#B8945D";

  if (transfer.status === "completed") {
    return (
      <CenteredCard primary={primary}>
        <div style={{ textAlign: "center" }}>
          <div style={{ fontSize: "40px", marginBottom: "12px" }}>✓</div>
          <h1 style={{ margin: "0 0 8px", fontSize: "22px", fontWeight: "700", color: "#0A0A0B" }}>
            Transfer complete
          </h1>
          <p style={{ margin: 0, fontSize: "14px", color: "#6E6E73" }}>
            This ownership transfer has already been completed.
          </p>
        </div>
      </CenteredCard>
    );
  }

  if (expired || transfer.status !== "awaiting_acceptance") {
    return (
      <CenteredCard primary={primary}>
        <div style={{ textAlign: "center" }}>
          <ShieldX size={40} color="#B85C5C" style={{ margin: "0 auto 12px" }} />
          <h1 style={{ margin: "0 0 8px", fontSize: "22px", fontWeight: "700", color: "#0A0A0B" }}>
            Transfer expired
          </h1>
          <p style={{ margin: 0, fontSize: "14px", color: "#6E6E73" }}>
            This transfer link has expired or is no longer valid.
          </p>
        </div>
      </CenteredCard>
    );
  }

  return (
    <div style={{ minHeight: "100vh", backgroundColor: "#FAFAF8", fontFamily: "system-ui,-apple-system,sans-serif" }}>
      <header style={{ backgroundColor: primary, padding: "16px 20px", display: "flex", alignItems: "center", gap: "12px" }}>
        {product?.companies?.logo_url && (
          <img src={product.companies.logo_url} alt="" style={{ width: "28px", height: "28px", borderRadius: "4px", objectFit: "contain" }} />
        )}
        <span style={{ fontSize: "16px", fontWeight: "700", color: "#FAFAF8" }}>
          {product?.companies?.name || "Tagit"}
        </span>
      </header>

      <div style={{ maxWidth: "480px", margin: "0 auto", padding: "32px 20px" }}>
        <div
          style={{
            padding: "28px",
            backgroundColor: "#fff",
            borderRadius: "16px",
            border: "1px solid #E8E2D5",
          }}
        >
          <p style={{ margin: "0 0 4px", fontSize: "11px", fontWeight: "700", color: accent, textTransform: "uppercase", letterSpacing: "0.08em" }}>
            Ownership transfer
          </p>
          <h1 style={{ margin: "0 0 20px", fontSize: "24px", fontWeight: "700", color: "#0A0A0B", letterSpacing: "-0.02em", lineHeight: 1.2 }}>
            {product?.name || "Item"}
          </h1>

          <table style={{ width: "100%", borderCollapse: "collapse", marginBottom: "24px" }}>
            <tbody>
              {[
                ["From", owner?.owner_name || "—"],
                ["To", transfer.to_name],
                ...(transfer.sale_price ? [["Sale price", `NGN ${transfer.sale_price.toLocaleString()}`]] : []),
                ["Brand", product?.companies?.name || "—"],
              ].map(([label, value]) => (
                <tr key={label} style={{ borderBottom: "1px solid #F5F2EC" }}>
                  <td style={{ padding: "10px 0", fontSize: "13px", color: "#9E9EA3", width: "35%" }}>{label}</td>
                  <td style={{ padding: "10px 0", fontSize: "13px", color: "#1F1F22", fontWeight: "500" }}>{value}</td>
                </tr>
              ))}
            </tbody>
          </table>

          <p style={{ margin: "0 0 20px", fontSize: "13px", color: "#6E6E73", lineHeight: 1.5 }}>
            By accepting, you confirm receipt of this item and become the new verified owner on Tagit. This action is recorded permanently.
          </p>

          <AcceptTransferButton acceptanceToken={token} primary={primary} />
        </div>

        <p style={{ textAlign: "center", marginTop: "20px", fontSize: "11px", color: "#9E9EA3" }}>
          Powered by Tagit — Identity infrastructure for luxury
        </p>
      </div>
    </div>
  );
}

function CenteredCard({ children, primary }: { children: React.ReactNode; primary: string }) {
  return (
    <div style={{ minHeight: "100vh", backgroundColor: "#FAFAF8", fontFamily: "system-ui,-apple-system,sans-serif" }}>
      <header style={{ backgroundColor: primary, padding: "16px 20px" }}>
        <span style={{ fontSize: "16px", fontWeight: "700", color: "#FAFAF8" }}>Tagit</span>
      </header>
      <div style={{ maxWidth: "480px", margin: "48px auto", padding: "0 20px" }}>
        <div style={{ padding: "36px", backgroundColor: "#fff", borderRadius: "16px", border: "1px solid #E8E2D5" }}>
          {children}
        </div>
      </div>
    </div>
  );
}
