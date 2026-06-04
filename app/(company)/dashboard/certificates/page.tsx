import { createClient } from "@/lib/supabase/server";
import { getUser } from "@/lib/auth";
import { redirect } from "next/navigation";
import { createClient as createAdminClient } from "@supabase/supabase-js";
import Link from "next/link";
import { format } from "date-fns";
import { Award, CheckCircle, AlertTriangle, Clock, ExternalLink, ArrowRight } from "lucide-react";
import { getCurrentBrandFlags } from "@/lib/feature-flags/server";
import FeatureWall from "@/components/company/FeatureWall";

const admin = createAdminClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { autoRefreshToken: false, persistSession: false } }
);

type Cert = {
  id: string;
  cert_number: string;
  cert_type: "ownership" | "transfer" | "provenance";
  issued_to_name: string;
  issued_to_email: string;
  issued_at: string;
  tag_id: string;
  ownership_record_id: string | null;
};

type OwnerRecord = { id: string; is_current: boolean };

export default async function CertificatesPage() {
  const supabase = await createClient();
  const user = await getUser();
  if (!user) redirect("/auth/login");

  const flags = await getCurrentBrandFlags();
  if (!flags.certificate_generation) {
    return (
      <FeatureWall
        name="Certificate of Authenticity"
        description="Issue verified certificates for every ownership confirmation."
      />
    );
  }

  // Get all company tag IDs
  const { data: tagData } = await supabase
    .from("tags")
    .select("id")
    .eq("company_id", user.id);

  const tagIds = (tagData ?? []).map((t: { id: string }) => t.id);

  if (tagIds.length === 0) {
    return <EmptyState />;
  }

  // Fetch all certs for company tags
  const { data: certsData } = await admin
    .from("certificates")
    .select("id, cert_number, cert_type, issued_to_name, issued_to_email, issued_at, tag_id, ownership_record_id")
    .in("tag_id", tagIds)
    .order("issued_at", { ascending: false });

  const certs = (certsData ?? []) as Cert[];

  // Fetch product names by joining tags → products (via tags.product_id FK added in migration)
  const certTagIds = [...new Set(certs.map((c) => c.tag_id))];
  const { data: tagProductData } = certTagIds.length
    ? await admin.from("tags").select("id, products(name)").in("id", certTagIds)
    : { data: [] };

  const productMap = Object.fromEntries(
    (tagProductData ?? []).map((t) => {
      // Supabase types a to-one parent embed as an array (FK isOneToOne: false),
      // but PostgREST returns a single object at runtime — handle both shapes.
      const product = t.products as { name: string } | { name: string }[] | null;
      const name = Array.isArray(product) ? (product[0]?.name ?? "—") : (product?.name ?? "—");
      return [t.id, name];
    })
  );

  // Fetch ownership record statuses
  const ownerRecordIds = certs
    .map((c) => c.ownership_record_id)
    .filter(Boolean) as string[];

  const { data: ownerData } = ownerRecordIds.length
    ? await admin
        .from("ownership_records")
        .select("id, is_current")
        .in("id", ownerRecordIds)
    : { data: [] };

  const ownerMap = Object.fromEntries(
    (ownerData ?? []).map((r: OwnerRecord) => [r.id, r.is_current])
  );

  // Compute status for each cert
  const certRows = certs.map((cert) => {
    const isProvenance = cert.cert_type === "provenance";
    const isCurrent = cert.ownership_record_id ? ownerMap[cert.ownership_record_id] : false;
    const isTransferred = isProvenance || isCurrent === false;
    return { cert, isProvenance, isTransferred, productName: productMap[cert.tag_id] ?? "—" };
  });

  const total = certRows.length;
  const active = certRows.filter((r) => !r.isTransferred).length;
  const transferred = certRows.filter((r) => r.isTransferred && !r.isProvenance).length;
  const provenance = certRows.filter((r) => r.isProvenance).length;

  return (
    <div className="p-8 max-w-5xl mx-auto">
      <div className="page-header mb-8">
        <p className="text-micro font-semibold uppercase tracking-widest mb-2" style={{ color: "var(--color-gold)" }}>
          Ownership Ledger
        </p>
        <h1 className="font-display" style={{ fontSize: "32px", color: "var(--color-charcoal)", lineHeight: 1.15, letterSpacing: "-0.02em" }}>
          Certificates
        </h1>
        <p className="mt-1" style={{ color: "var(--color-slate)", fontSize: "var(--text-body-sm)" }}>
          Every certificate ever issued for your items — live status, always current.
        </p>
      </div>

      {/* Summary stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {[
          { label: "Total issued", value: total, color: "var(--color-charcoal)" },
          { label: "Active", value: active, color: "#15803D" },
          { label: "Transferred", value: transferred, color: "#DC2626" },
          { label: "Provenance", value: provenance, color: "#D97706" },
        ].map(({ label, value, color }) => (
          <div key={label} className="card-raised p-5">
            <p style={{ fontSize: "30px", fontWeight: 700, color, letterSpacing: "-0.03em", lineHeight: 1, marginBottom: 4 }}>
              {value}
            </p>
            <p style={{ fontSize: "var(--text-caption)", color: "var(--color-slate)" }}>{label}</p>
          </div>
        ))}
      </div>

      {/* Certificate list */}
      {certRows.length === 0 ? (
        <EmptyState />
      ) : (
        <div className="space-y-2">
          {certRows.map(({ cert, isProvenance, isTransferred, productName }) => (
            <Link
              key={cert.id}
              href={`/certificate/${cert.id}`}
              target="_blank"
              className="card-raised flex items-center gap-4 p-4 transition-all duration-200 group"
              style={{ textDecoration: "none" }}
            >
              {/* Status icon */}
              <div
                className="w-9 h-9 rounded-lg flex items-center justify-center shrink-0"
                style={{
                  backgroundColor: isProvenance
                    ? "rgba(253,230,138,0.2)"
                    : isTransferred
                    ? "rgba(254,202,202,0.2)"
                    : "rgba(187,247,208,0.2)",
                }}
              >
                {isProvenance
                  ? <Clock size={15} color="#D97706" />
                  : isTransferred
                  ? <AlertTriangle size={15} color="#DC2626" />
                  : <CheckCircle size={15} color="#15803D" />}
              </div>

              {/* Main info */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-0.5">
                  <p className="font-medium" style={{ fontSize: "var(--text-body-sm)", color: "var(--color-charcoal)" }}>
                    {cert.issued_to_name}
                  </p>
                  <span
                    style={{
                      fontSize: 10,
                      fontWeight: 600,
                      letterSpacing: "0.04em",
                      color: isProvenance ? "#92400E" : isTransferred ? "#991B1B" : "#15803D",
                      backgroundColor: isProvenance ? "#FEF3C7" : isTransferred ? "#FEE2E2" : "#DCFCE7",
                      padding: "1px 6px",
                      borderRadius: 4,
                    }}
                  >
                    {isProvenance ? "PROVENANCE" : isTransferred ? "TRANSFERRED" : "ACTIVE"}
                  </span>
                </div>
                <p style={{ fontSize: "var(--text-caption)", color: "var(--color-slate)" }}>
                  {productName} · {cert.cert_type === "ownership" ? "Origin" : cert.cert_type === "transfer" ? "Transfer" : "Provenance"} cert
                </p>
              </div>

              {/* Cert number + date */}
              <div className="text-right shrink-0 hidden sm:block">
                <p style={{ fontSize: 11, fontFamily: "monospace", color: "var(--color-graphite)", marginBottom: 2 }}>
                  {cert.cert_number}
                </p>
                <p style={{ fontSize: "var(--text-caption)", color: "var(--color-mist)" }}>
                  {format(new Date(cert.issued_at), "dd MMM yyyy")}
                </p>
              </div>

              <ExternalLink
                size={14}
                className="shrink-0 transition-opacity duration-150 opacity-0 group-hover:opacity-100"
                style={{ color: "var(--color-mist)" }}
              />
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}

function EmptyState() {
  return (
    <div className="p-8 max-w-5xl mx-auto">
      <div className="page-header mb-8">
        <p className="text-micro font-semibold uppercase tracking-widest mb-2" style={{ color: "var(--color-gold)" }}>
          Ownership Ledger
        </p>
        <h1 className="font-display" style={{ fontSize: "32px", color: "var(--color-charcoal)", lineHeight: 1.15, letterSpacing: "-0.02em" }}>
          Certificates
        </h1>
      </div>
      <div className="card-raised p-10 text-center">
        <Award size={32} style={{ color: "var(--color-mist)", margin: "0 auto 16px" }} />
        <p className="font-medium mb-2" style={{ color: "var(--color-charcoal)" }}>No certificates yet</p>
        <p style={{ fontSize: "var(--text-body-sm)", color: "var(--color-slate)", marginBottom: 20 }}>
          Certificates are issued automatically when you approve ownership claims or when transfers complete.
        </p>
        <Link
          href="/dashboard/ownership"
          className="inline-flex items-center gap-2 px-4 py-2 rounded-lg font-medium"
          style={{ backgroundColor: "var(--color-onyx)", color: "var(--color-pearl)", fontSize: "var(--text-body-sm)", textDecoration: "none" }}
        >
          Review ownership claims
          <ArrowRight size={13} />
        </Link>
      </div>
    </div>
  );
}
