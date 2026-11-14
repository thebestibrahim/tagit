import { createClient } from "@/lib/supabase/server";
import { getUser } from "@/lib/auth";
import { redirect } from "next/navigation";
import { createClient as createAdminClient } from "@supabase/supabase-js";
import Link from "next/link";
import { ExternalLink } from "lucide-react";
import { getCurrentBrandFlags } from "@/lib/feature-flags/server";
import FeatureWall from "@/components/company/FeatureWall";
import Pagination from "@/components/ui/Pagination";
import LocalTime from "@/components/ui/LocalTime";
import { EmptyState as Empty } from "@/components/ui/empty-state";

const PER_PAGE = 20;

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

export default async function CertificatesPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string }>;
}) {
  const supabase = await createClient();
  const user = await getUser();
  if (!user) redirect("/auth/login");

  const flags = await getCurrentBrandFlags();
  if (!flags.certificate_generation) {
    return (
      <FeatureWall
        name="Certificates of authenticity"
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
      const name = Array.isArray(product) ? (product[0]?.name ?? null) : (product?.name ?? null);
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
    return { cert, isProvenance, isTransferred, productName: productMap[cert.tag_id] ?? null };
  });

  const total = certRows.length;
  const active = certRows.filter((r) => !r.isTransferred).length;
  const transferred = certRows.filter((r) => r.isTransferred && !r.isProvenance).length;
  const provenance = certRows.filter((r) => r.isProvenance).length;

  // Stats above cover all certs; the list below is paginated.
  const params = await searchParams;
  const page = Math.max(1, parseInt(params.page ?? "1", 10));
  const totalPages = Math.ceil(certRows.length / PER_PAGE);
  const pageRows = certRows.slice((page - 1) * PER_PAGE, (page - 1) * PER_PAGE + PER_PAGE);
  const pageHref = (p: number) => (p > 1 ? `/dashboard/certificates?page=${p}` : "/dashboard/certificates");

  // What each certificate's state means to the brand. A transfer is a normal
  // event in a piece's life, not an error, so nothing here is red.
  const STATE = {
    current:    { label: "Current",      color: "#1f5a40", bg: "#e3f0e8" },
    passedOn:   { label: "Passed on",    color: "#5e5c57", bg: "#eeebe4" },
    provenance: { label: "Provenance",   color: "#6e5527", bg: "#f3ecdd" },
  } as const;
  const TYPE_LABEL: Record<string, string> = { ownership: "Origin certificate", transfer: "Transfer certificate", provenance: "Provenance record" };

  return (
    <div className="p-5 sm:p-8 max-w-5xl mx-auto">
      <div className="page-header">
        <h1 className="page-title">Certificates</h1>
        <p className="page-desc">
          Every certificate issued for your pieces. Each one shows whether its holder still owns the piece.
        </p>
      </div>

      <section aria-label="Certificate totals" className="card-raised ov-figures mb-8">
        {[
          { label: "Issued", value: total, note: "Since you joined" },
          { label: "Current", value: active, note: "Held by the owner today" },
          { label: "Passed on", value: transferred, note: "The piece changed hands" },
          { label: "Provenance", value: provenance, note: "Records of earlier owners" },
        ].map(({ label, value, note }) => (
          <div key={label} className="ov-figure" style={{ cursor: "default" }}>
            <span className="ov-figure-value">{value.toLocaleString()}</span>
            <span className="block text-body-sm font-medium" style={{ color: "var(--color-onyx)" }}>{label}</span>
            <span className="block text-caption" style={{ color: "var(--app-body)" }}>{note}</span>
          </div>
        ))}
      </section>

      {certRows.length === 0 ? (
        <EmptyState />
      ) : (
        <>
          <div className="card-raised">
            <ul>
              {pageRows.map(({ cert, isProvenance, isTransferred, productName }) => {
                const state = isProvenance ? STATE.provenance : isTransferred ? STATE.passedOn : STATE.current;
                return (
                  <li key={cert.id}>
                    <Link href={`/certificate/${cert.id}`} target="_blank" className="ov-row group">
                      <span className="flex-1 min-w-0">
                        <span className="block text-body-sm font-medium truncate" style={{ color: "var(--color-onyx)" }}>
                          {cert.issued_to_name}
                        </span>
                        <span className="block text-caption truncate" style={{ color: "var(--app-body)" }}>
                          {productName ?? "Product not linked"}, {TYPE_LABEL[cert.cert_type]?.toLowerCase() ?? "certificate"}
                        </span>
                      </span>
                      <span className="shrink-0 rounded-full px-2.5 py-0.5 text-caption font-medium" style={{ color: state.color, backgroundColor: state.bg }}>
                        {state.label}
                      </span>
                      <span className="hidden md:block w-40 text-right shrink-0">
                        <span className="block text-caption" style={{ fontFamily: "var(--font-mono)", color: "var(--color-onyx)" }}>{cert.cert_number}</span>
                        <span className="block text-caption" style={{ color: "var(--app-body)" }}>
                          <LocalTime iso={cert.issued_at} pattern="d MMM yyyy" />
                        </span>
                      </span>
                      <ExternalLink size={14} aria-label="Opens in a new tab" className="shrink-0 opacity-40 group-hover:opacity-100 transition-opacity" style={{ color: "var(--app-body)" }} />
                    </Link>
                  </li>
                );
              })}
            </ul>
          </div>
          <div className="mt-4">
            <Pagination page={page} totalPages={totalPages} makeHref={pageHref} totalLabel={`${total} total`} />
          </div>
        </>
      )}
    </div>
  );
}

function EmptyState() {
  return (
    <div className="p-8 max-w-5xl mx-auto">
      <div className="page-header mb-8">
        <h1 className="page-title">
          Certificates
        </h1>
      </div>
      <div className="card-raised">
        <Empty title="No certificates issued yet" action={{ label: "Review ownership claims", href: "/dashboard/ownership" }}>
          A certificate is issued the moment you approve an ownership claim or a transfer completes. Each one stays current as the piece changes hands.
        </Empty>
      </div>
    </div>
  );
}
