import { createClient } from "@supabase/supabase-js";
import { notFound } from "next/navigation";
import { ArrowRight } from "lucide-react";
import LocalTime from "@/components/ui/LocalTime";
import { resolveField } from "@/lib/industry-fields";
import { resolveScanTheme } from "@/lib/brand-page";
import { ScanReveal } from "@/components/consumer/scan-reveal";
import { scanStyles as s, themeVars, VerificationHero, Facts, ScanFooter } from "@/components/consumer/scan-chrome";

const admin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { autoRefreshToken: false, persistSession: false } }
);

type Cert = {
  id: string;
  cert_number: string;
  cert_type: "ownership" | "transfer" | "provenance";
  template: string;
  issued_to_name: string;
  issued_to_email: string;
  issued_at: string;
  tag_id: string;
  ownership_record_id: string | null;
};

type OwnerRecord = { is_current: boolean; ended_at: string | null };
type Product = { name: string; industry_fields: Record<string, string> };
type Tag = { short_id: string; company_id: string; token: string };
type Company = {
  name: string;
  logo_url: string | null;
  brand_primary_color: string;
  brand_accent_color: string;
  brand_text_color?: string | null;
};

export default async function CertificatePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const { data: certData } = await admin
    .from("certificates")
    .select("id, cert_number, cert_type, template, issued_to_name, issued_to_email, issued_at, tag_id, ownership_record_id")
    .eq("id", id)
    .single();

  if (!certData) notFound();
  const cert = certData as Cert;

  const [{ data: tagData }, { data: ownerRecordData }] = await Promise.all([
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (admin as any).from("tags").select("short_id, company_id, token, products(name, industry_fields)").eq("id", cert.tag_id).single(),
    cert.ownership_record_id
      ? admin.from("ownership_records").select("is_current, ended_at").eq("id", cert.ownership_record_id).single()
      : Promise.resolve({ data: null }),
  ]);

  const tagRow = tagData as (Tag & { products: Product | null }) | null;
  if (!tagRow) notFound();

  const product = tagRow.products;
  if (!product) notFound();

  const tag: Tag = { short_id: tagRow.short_id, company_id: tagRow.company_id, token: tagRow.token };
  const ownerRecord = ownerRecordData as OwnerRecord | null;

  const [{ data: companyData }, { data: companyExt }] = await Promise.all([
    admin.from("companies").select("name, logo_url, brand_primary_color, brand_accent_color").eq("id", tag.company_id).single(),
    // Selected apart so a database without the column still renders the page.
    admin
      .from("companies")
      .select("brand_text_color")
      .eq("id", tag.company_id)
      .single()
      .then((r) => ({ data: r.error ? null : (r.data as { brand_text_color: string | null }) })),
  ]);

  const company = (companyData ?? {
    name: "Unknown Brand",
    logo_url: null,
    brand_primary_color: "#0A0A0B",
    brand_accent_color: "#B8945D",
  }) as Company;

  // Live status, checked against the record on every load.
  const isProvenance = cert.cert_type === "provenance";
  const isSuperseded = !isProvenance && ownerRecord?.is_current === false;

  const theme = resolveScanTheme({
    brand_primary_color: company.brand_primary_color,
    brand_accent_color: company.brand_accent_color,
    brand_text_color: companyExt?.brand_text_color ?? null,
  });

  const verdict = isProvenance
    ? { title: "Provenance", note: `A permanent record that ${cert.issued_to_name} once owned this piece. It can't be changed or removed.`, seal: true }
    : isSuperseded
      ? { title: "Superseded", note: "The piece has changed hands since this certificate was issued. It stays as history, and can't be used to claim the piece.", seal: false }
      : { title: "Valid", note: `This certificate is on the Tagit record, and ${cert.issued_to_name} still owns the piece.`, seal: true };

  const kind =
    cert.cert_type === "transfer" ? "Certificate of transfer" :
    isProvenance ? "Provenance record" :
    "Certificate of authenticity";

  const holderLabel =
    isProvenance ? "Previously owned by" :
    cert.cert_type === "transfer" ? "Transferred to" :
    "Issued to";

  const details = Object.entries(product.industry_fields ?? {})
    // Short facts only; stories and notes belong on the scan page.
    .filter(([k, v]) => {
      const text = String(v ?? "").trim();
      return text !== "" && text.length <= 80 && resolveField(k).type !== "textarea";
    })
    .slice(0, 6)
    .map(([key, value]) => ({ key, label: resolveField(key).label, value: String(value) }));

  return (
    <div className={s.page} style={themeVars(theme)}>
      {verdict.title === "Valid" && <ScanReveal verdict="Valid" house={company.name} />}
      <VerificationHero
        house={company.name}
        logoUrl={company.logo_url}
        verdict={verdict.title}
        note={verdict.note}
        seal={verdict.seal}
        compact={verdict.title === "Valid"}
        meta={[<span key="n">{cert.cert_number}</span>, "Checked just now"]}
      />

      <main className={s.column}>
        <section className={s.section} aria-label="The certificate">
          <div className={`${s.panel} ${s.panelPad}`}>
            <p className={s.kicker}>{kind}</p>
            <h2 className={s.pieceName}>{product.name}</h2>
            <dl className={s.facts}>
              <div className={s.fact}>
                <dt>{holderLabel}</dt>
                <dd>{cert.issued_to_name}</dd>
              </div>
              <div className={s.fact}>
                <dt>Issued</dt>
                <dd><LocalTime iso={cert.issued_at} pattern="d MMMM yyyy" /></dd>
              </div>
              <div className={s.fact}>
                <dt>Made by</dt>
                <dd>{company.name}</dd>
              </div>
              <div className={s.fact} style={{ borderBottom: "none" }}>
                <dt>Tag</dt>
                <dd style={{ fontFamily: "var(--mono)", fontWeight: 400 }}>{tag.short_id}</dd>
              </div>
            </dl>
          </div>
        </section>

        {details.length > 0 && (
          <section className={s.section} aria-labelledby="details-heading">
            <h2 id="details-heading" className={s.h2}>The piece</h2>
            <Facts items={details} />
          </section>
        )}

        {!isProvenance && (
          <div className={s.section}>
            <a href={`/v/${tag.token}`} className={s.button} style={{ textDecoration: "none" }}>
              See the piece and its full record
              <ArrowRight size={16} aria-hidden />
            </a>
          </div>
        )}

        <ScanFooter note="Every Tagit certificate is checked against the live record when it's opened, so what you see here is current." />
      </main>
    </div>
  );
}

export const dynamic = "force-dynamic";
