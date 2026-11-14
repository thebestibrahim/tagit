export const dynamic = "force-dynamic";

import { ScanReveal } from "@/components/consumer/scan-reveal";
import { createAdminClient } from "@/lib/supabase/admin";
import { createHmac, timingSafeEqual } from "crypto";
import { notFound } from "next/navigation";
import { headers } from "next/headers";
import { Clock } from "lucide-react";
import ClaimForm from "./ClaimForm";
import ActionShell from "./ActionShell";
import VoiceWidget from "./VoiceWidget";
import LocalTime from "@/components/ui/LocalTime";
import { getFlagsForConsumerPage } from "@/lib/feature-flags/server";
import { releaseExpiredClaims } from "@/lib/claims";
import { getSiblingTagIds } from "@/lib/tags";
import { resolveScanTheme, resolveBaseFont } from "@/lib/brand-page";
import {
  scanStyles as s,
  themeVars,
  VerificationHero,
  OwnershipRecord as RecordList,
  ScanFooter,
} from "@/components/consumer/scan-chrome";
import PieceSection from "@/components/consumer/PieceSection";

const admin = createAdminClient();

function validateHmac(token: string, signature: string) {
  try {
    const expected = createHmac("sha256", process.env.TAGIT_HMAC_SECRET!)
      .update(token)
      .digest("hex");
    return timingSafeEqual(Buffer.from(expected, "hex"), Buffer.from(signature, "hex"));
  } catch {
    return false;
  }
}

async function logScan(tagId: string, result: string, headerStore: Awaited<ReturnType<typeof headers>>) {
  const ip = headerStore.get("x-forwarded-for") ?? headerStore.get("x-real-ip") ?? null;
  const userAgent = headerStore.get("user-agent") ?? null;

  // Country/region/city are provided by Vercel's edge network (derived from the
  // request IP) — country/region level only, no GPS, no third-party GeoIP. The
  // 2-letter country code is mapped to a full name at display time. Absent in
  // local dev, so geo_location is null there.
  const country = headerStore.get("x-vercel-ip-country");
  const region = headerStore.get("x-vercel-ip-country-region");
  const city = headerStore.get("x-vercel-ip-city");
  const geo =
    country || region || city
      ? {
          country: country ?? null,
          region: region ?? null,
          city: city ? decodeURIComponent(city) : null,
        }
      : null;

  await admin.from("scan_logs").insert({
    tag_id: tagId,
    ip_address: ip,
    user_agent: userAgent,
    scan_result: result,
    geo_location: geo,
  }).then(() => {});
}

type OwnershipRecord = {
  id: string;
  owner_name: string;
  owner_email: string;
  acquisition_type: string;
  acquired_at: string;
  sale_price: number | null;
  currency: string;
  is_current: boolean;
};

type Product = {
  id: string;
  name: string;
  industry_fields: Record<string, string>;
  retail_price: number | null;
  currency: string;
  photos: string[];
};

export default async function ScanPage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;
  const headerStore = await headers();

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: tagData } = await (admin as any)
    .from("tags")
    .select("id, token, short_id, status, company_id, industry, hmac_signature, product_id")
    .eq("token", token)
    .single();

  if (!tagData) notFound();

  const tag = tagData as {
    id: string;
    token: string;
    short_id: string;
    status: string;
    company_id: string;
    industry: string;
    hmac_signature: string;
    product_id: string | null;
  };

  // HMAC is used for the "Verified Authentic" badge only — it is NOT a page gate.
  // nanoid(21) tokens have 126 bits of entropy, making them impossible to guess.
  // Blocking the page on HMAC failure silently breaks tags whenever the secret
  // rotates or a deployment race occurs, which is far worse than showing the page.
  const hmacValid = process.env.TAGIT_HMAC_SECRET
    ? validateHmac(tag.token, tag.hmac_signature)
    : false;

  // Fire scan log without blocking page render
  logScan(tag.id, hmacValid ? "valid" : "unverified", headerStore);

  // Ownership is unified across the product's tag group (multiple tags on one
  // item). Resolve the sibling tags, then expire any lapsed pending claims so a
  // scan re-offers the claim form instead of showing a stale "pending" banner.
  const siblingIds = await getSiblingTagIds(admin, tag);
  await releaseExpiredClaims(admin, siblingIds);

  // Split company into two queries — stable columns first, then migration-dependent columns.
  // This way a missing DB column (migration not yet run) never breaks the scan page.
  const [
    { data: productData },
    { data: companyBase },
    { data: companyExt },
    { data: ownershipData },
    { data: activeTransferData },
    { data: pendingClaimData },
    scanPageFlags,
  ] = await Promise.all([
    tag.product_id
      ? admin
          .from("products")
          .select("id, name, industry_fields, retail_price, currency, photos")
          .eq("id", tag.product_id)
          .single()
      : Promise.resolve({ data: null }),
    admin
      .from("companies")
      .select("id, name, logo_url, brand_primary_color, brand_secondary_color, brand_accent_color, brand_font, brand_story, custom_header_text, social_links, ai_enabled, ai_persona_name")
      .eq("id", tag.company_id)
      .single(),
    admin
      .from("companies")
      .select("brand_text_color, brand_template")
      .eq("id", tag.company_id)
      .single()
      .then((r) => ({ data: r.error ? null : r.data })),
    // Ownership chain resolves across the whole product group, not one tag.
    admin
      .from("ownership_records")
      .select("id, owner_name, owner_email, acquisition_type, acquired_at, sale_price, currency, is_current")
      .in("tag_id", siblingIds)
      .order("acquired_at", { ascending: true }),
    // Pending transfer is derived from an awaiting_acceptance row on any sibling
    // tag — not from a tag state.
    admin
      .from("transfer_requests")
      .select("id, to_name, to_email")
      .in("tag_id", siblingIds)
      .eq("status", "awaiting_acceptance")
      .limit(1),
    // A pending first-ownership claim (any sibling tag) — the tag stays `live`
    // during the 24h manual-review window; expired ones were just released.
    admin
      .from("ownership_claims")
      .select("id")
      .in("tag_id", siblingIds)
      .eq("status", "pending")
      .limit(1),
    // brandId comes from tag.company_id — consumer is not authenticated
    getFlagsForConsumerPage(tag.company_id),
  ]);

  const product = productData as Product | null;

  const company = companyBase
    ? ({
        ...companyBase,
        brand_text_color: (companyExt as { brand_text_color?: string } | null)?.brand_text_color ?? "#FAFAF8",
        brand_template: (companyExt as { brand_template?: string } | null)?.brand_template ?? "classic",
      } as {
        id: string;
        name: string;
        logo_url: string | null;
        brand_primary_color: string;
        brand_secondary_color: string;
        brand_accent_color: string;
        brand_text_color: string;
        brand_font: string;
        brand_template: string;
        brand_story: string | null;
        custom_header_text: string | null;
        social_links: Record<string, string>;
        ai_enabled: boolean;
        ai_persona_name: string | null;
      })
    : null;

  const ownershipRecords = (ownershipData ?? []) as OwnershipRecord[];
  const currentOwner = ownershipRecords.find((r) => r.is_current) ?? null;
  const activeTransfer = ((activeTransferData ?? []) as { id: string; to_name: string; to_email: string }[])[0] ?? null;
  const hasPendingClaim = ((pendingClaimData ?? []) as { id: string }[]).length > 0;

  const theme = resolveScanTheme({
    brand_primary_color: company?.brand_primary_color,
    brand_accent_color: company?.brand_accent_color,
    brand_text_color: company?.brand_text_color,
  });
  // The voice widget still takes the raw brand colours.
  const primary = company?.brand_primary_color || "#0A0A0B";
  const accent = company?.brand_accent_color || "#B8945D";
  const house = company?.custom_header_text || company?.name || "Tagit";
  const maker = company?.name || "the brand";

  // The verdict: the one thing the buyer came to learn, said first.
  const unregistered = ["created", "shipped"].includes(tag.status) || !product;
  const verdict =
    tag.status === "suspended"
      ? { title: "Suspended", note: `${maker} has suspended this piece. Contact them before you buy or sell it.`, seal: false }
      : tag.status === "flagged"
        ? { title: "Under review", note: `${maker} has flagged this piece and is looking into it. Hold off on buying or selling it until they're done.`, seal: false }
        : unregistered
          ? { title: "Not registered yet", note: "This tag hasn't been attached to a piece yet. Check back once the brand has registered it.", seal: false }
          : hmacValid
            ? { title: "Authentic", note: `Made by ${maker}. Its tag's signature checks out with Tagit.`, seal: true }
            : { title: "Registered", note: `On the Tagit register as a piece by ${maker}.`, seal: true };

  const socials = company?.social_links ?? {};

  return (
    <div className={s.page} style={themeVars(theme, resolveBaseFont(company?.brand_font))}>
      {verdict.seal && <ScanReveal verdict={verdict.title} house={house} />}
      <VerificationHero
        house={house}
        logoUrl={company?.logo_url}
        verdict={verdict.title}
        note={verdict.note}
        seal={verdict.seal}
        meta={[
          <>Tag <span>{tag.short_id}</span></>,
          "Checked just now",
        ]}
      />

      <main className={s.column} style={{ paddingBottom: 24 }}>
        {product && (
          <>
            <PieceSection
              product={product}
              industry={tag.industry}
              accent={theme.accentInk}
              template={company?.brand_template || "classic"}
            />

            <RecordList
              entries={ownershipRecords.map((r) => ({
                id: r.id,
                name: r.owner_name,
                current: r.is_current,
                meta: (
                  <>
                    {r.acquisition_type === "origin" ? "First owner" : "Transferred"} on{" "}
                    <LocalTime iso={r.acquired_at} pattern="d MMM yyyy" />
                    {r.sale_price ? `. ${r.currency} ${r.sale_price.toLocaleString()}` : ""}
                  </>
                ),
              }))}
            />

            <ActionSection
              tag={tag}
              product={product}
              maker={maker}
              currentOwner={currentOwner}
              activeTransfer={activeTransfer}
              hasPendingClaim={hasPendingClaim}
              accent={accent}
              primary={primary}
            />
          </>
        )}

        {Object.values(socials).some(Boolean) && (
          <nav className={s.links} aria-label={`${maker} elsewhere`}>
            {socials.website && (
              <a className={s.buttonQuiet} href={socials.website} target="_blank" rel="noopener noreferrer">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden><circle cx="12" cy="12" r="10"/><path d="M2 12h20M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/></svg>
                Website
              </a>
            )}
            {socials.instagram && (
              <a className={s.buttonQuiet} href={socials.instagram} target="_blank" rel="noopener noreferrer">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden><rect x="2" y="2" width="20" height="20" rx="5"/><path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"/><line x1="17.5" y1="6.5" x2="17.51" y2="6.5"/></svg>
                Instagram
              </a>
            )}
            {socials.twitter && (
              <a className={s.buttonQuiet} href={socials.twitter} target="_blank" rel="noopener noreferrer">
                <svg width="13" height="13" viewBox="0 0 24 24" fill="currentColor" aria-hidden><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-4.714-6.231-5.401 6.231H2.748l7.73-8.835L1.254 2.25H8.08l4.256 5.622L18.244 2.25zm-1.161 17.52h1.833L7.084 4.126H5.117L17.083 19.77z"/></svg>
                X
              </a>
            )}
          </nav>
        )}

        <ScanFooter />
      </main>

      {company?.ai_enabled && scanPageFlags.ai_persona && (
        <VoiceWidget
          tagId={tag.id}
          personaName={company.ai_persona_name || "Assistant"}
          accentColor={accent}
          primaryColor={primary}
        />
      )}
    </div>
  );
}

function ActionSection({
  tag,
  product,
  maker,
  currentOwner,
  activeTransfer,
  hasPendingClaim,
  accent,
  primary,
}: {
  tag: { id: string; status: string; short_id: string };
  product: { name: string };
  maker: string;
  currentOwner: OwnershipRecord | null;
  activeTransfer: { id: string; to_name: string; to_email: string } | null;
  hasPendingClaim: boolean;
  accent: string;
  primary: string;
}) {
  // A `live` tag is claimable, unless a first-ownership claim is already
  // pending its 24h auto-confirm, in which case we say so.
  if (tag.status === "live" && !hasPendingClaim) {
    return (
      <section className={s.section} aria-labelledby="claim-heading">
        <div className={`${s.panel} ${s.panelPad}`}>
          <h2 id="claim-heading" className={s.formTitle}>Is this yours?</h2>
          <p className={s.formLead}>
            If you bought this piece, add yourself to its record as the owner. We&apos;ll email you a code to confirm it&apos;s you.
          </p>
          <ClaimForm tagId={tag.id} productName={product.name} accent={accent} primary={primary} />
        </div>
      </section>
    );
  }

  if (tag.status === "live" && hasPendingClaim) {
    return (
      <section className={s.section}>
        <div className={`${s.notice} ${s.noticeWait}`} role="status">
          <Clock size={17} aria-hidden />
          <p>
            <strong>A claim on this piece is waiting.</strong> It confirms automatically within 24 hours unless {maker} flags it.
          </p>
        </div>
      </section>
    );
  }

  // Owner actions for an item that has an owner (claimed → `owned`, or acquired
  // via a prior transfer → `transferred`). A pending onward transfer is derived
  // from activeTransfer, not from a tag state.
  if (["owned", "transferred"].includes(tag.status) && currentOwner) {
    return (
      <ActionShell
        tagId={tag.id}
        hasPendingTransfer={!!activeTransfer}
        currentOwner={{
          owner_name: currentOwner.owner_name,
          owner_email: currentOwner.owner_email,
          currency: currentOwner.currency,
        }}
        activeTransfer={activeTransfer}
        accent={accent}
        primary={primary}
      />
    );
  }

  return null;
}
