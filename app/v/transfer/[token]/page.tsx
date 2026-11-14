export const dynamic = "force-dynamic";

import { createClient } from "@supabase/supabase-js";
import { notFound } from "next/navigation";
import { ArrowRight } from "lucide-react";
import AcceptTransferButton from "./AcceptTransferButton";
import { formatCurrency } from "@/lib/billing/pricing";
import { resolveScanTheme } from "@/lib/brand-page";
import { scanStyles as s, themeVars, VerificationHero, ScanFooter } from "@/components/consumer/scan-chrome";

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
    .select("id, tag_id, from_owner_id, to_name, to_email, sale_price, currency, status, expires_at")
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
    currency: string;
    status: string;
    expires_at: string;
  };

  // Null expires_at means "no expiry" — never treat it as expired (otherwise
  // new Date(null) coerces to 1970 and the link always shows as expired).
  const expired = transfer.expires_at != null && new Date(transfer.expires_at) < new Date();

  // Fetch product (via tags.product_id FK) and current owner
  const [{ data: tagProductData }, { data: ownerData }] = await Promise.all([
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (admin as any).from("tags").select("token, products(name, companies(name, brand_primary_color, brand_accent_color, logo_url))").eq("id", transfer.tag_id).single(),
    admin.from("ownership_records").select("owner_name").eq("id", transfer.from_owner_id).single(),
  ]);

  const tagToken = (tagProductData as { token?: string } | null)?.token ?? null;
  const rawProd = (tagProductData as { products: unknown } | null)?.products;
  const product = (Array.isArray(rawProd) ? rawProd[0] : rawProd) as {
    name: string;
    companies: { name: string; brand_primary_color: string; brand_accent_color: string; logo_url: string | null };
  } | null;

  const owner = ownerData as { owner_name: string } | null;
  const brand = product?.companies ?? null;
  const theme = resolveScanTheme({
    brand_primary_color: brand?.brand_primary_color,
    brand_accent_color: brand?.brand_accent_color,
  });
  const house = brand?.name || "Tagit";
  const pieceName = product?.name || "this piece";
  const from = owner?.owner_name || "The owner";

  const state =
    transfer.status === "completed" ? "done" :
    expired || transfer.status !== "awaiting_acceptance" ? "closed" :
    "open";

  const verdict =
    state === "done"
      ? { title: "Transfer complete", note: `${pieceName} has already passed to ${transfer.to_name}. Nothing more to do here.`, seal: true }
      : state === "closed"
        ? { title: "Link expired", note: "This transfer was cancelled or its link ran out. Ask the owner to send you a new one.", seal: false }
        : { title: "A piece for you", note: `${from} is passing ${pieceName} on to you. Accept it to become its owner on the record.`, seal: true };

  return (
    <div className={s.page} style={themeVars(theme)}>
      <VerificationHero house={house} logoUrl={brand?.logo_url} verdict={verdict.title} note={verdict.note} seal={verdict.seal} />

      <main className={s.column}>
        {state === "open" && (
          <section className={s.section} aria-label="The transfer">
            <div className={`${s.panel} ${s.panelPad}`}>
              <p className={s.kicker}>Ownership transfer</p>
              <h2 className={s.pieceName}>{pieceName}</h2>
              <dl className={s.facts}>
                <div className={s.fact}><dt>From</dt><dd>{from}</dd></div>
                <div className={s.fact}><dt>To</dt><dd>{transfer.to_name}</dd></div>
                {transfer.sale_price ? (
                  <div className={s.fact}><dt>Sale price</dt><dd>{formatCurrency(transfer.sale_price, transfer.currency)}</dd></div>
                ) : null}
                <div className={s.fact} style={{ borderBottom: "none" }}><dt>Made by</dt><dd>{house}</dd></div>
              </dl>
              <p className={s.formLead} style={{ marginTop: 18 }}>
                Accept only once you have the piece. Your name is added to its permanent record, and we email you a certificate.
              </p>
              <div style={{ marginTop: 18 }}>
                <AcceptTransferButton acceptanceToken={token} />
              </div>
            </div>
          </section>
        )}

        {state === "done" && tagToken && (
          <div className={s.section}>
            <a href={`/v/${tagToken}`} className={s.button} style={{ textDecoration: "none" }}>
              See the piece and its record
              <ArrowRight size={16} aria-hidden />
            </a>
          </div>
        )}

        <ScanFooter />
      </main>
    </div>
  );
}
