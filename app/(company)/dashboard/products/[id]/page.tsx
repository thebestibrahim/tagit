import { createClient } from "@/lib/supabase/server";
import { getUser } from "@/lib/auth";
import { redirect, notFound } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { format } from "date-fns";
import { ChevronLeft, Pencil, Copy, Tag, User, ArrowRightLeft, Award, Package, CheckCircle2 } from "lucide-react";
import type { CompanyStatus } from "@/types/database";
import { statusBadge } from "@/lib/tag-status";
import { INDUSTRY_FIELDS, groupFields } from "@/lib/industry-fields";
import CopyLinkButton from "@/components/ui/CopyLinkButton";
import ReplaceChipButton from "./ReplaceChipButton";

// ── Types ────────────────────────────────────────────────────────────────────

type OwnershipRecord = {
  id: string;
  owner_name: string;
  owner_email: string;
  acquisition_type: string;
  acquired_at: string;
  sale_price: number | null;
  currency: string;
  is_current: boolean;
  ended_at: string | null;
};

type OwnershipClaim = {
  id: string;
  claimant_name: string;
  claimant_email: string;
  status: string;
  created_at: string;
  expires_at: string;
  reviewed_at: string | null;
  rejection_reason: string | null;
};

type TransferRequest = {
  id: string;
  to_name: string;
  to_email: string;
  sale_price: number | null;
  currency: string;
  status: string;
  created_at: string;
  expires_at: string;
  completed_at: string | null;
};

type Certificate = {
  id: string;
  cert_number: string;
  cert_type: string;
  issued_to_name: string;
  issued_at: string;
};

// ── Helpers ──────────────────────────────────────────────────────────────────

function fmt(date: string) {
  return format(new Date(date), "MMM d, yyyy 'at' h:mm a");
}

function fmtDate(date: string) {
  return format(new Date(date), "MMM d, yyyy");
}

function claimStatusBadge(status: string) {
  const map: Record<string, { bg: string; color: string }> = {
    pending:  { bg: "var(--color-soft-gold)",    color: "var(--color-deep-gold)" },
    approved: { bg: "#ECFDF5",                   color: "#065F46" },
    rejected: { bg: "var(--color-alert-tint)",   color: "var(--color-alert)" },
    expired:  { bg: "var(--color-linen)",        color: "var(--color-slate)" },
  };
  return map[status] ?? { bg: "var(--color-linen)", color: "var(--color-slate)" };
}

function transferStatusBadge(status: string) {
  const map: Record<string, { bg: string; color: string }> = {
    otp_pending:         { bg: "var(--color-soft-gold)", color: "var(--color-deep-gold)" },
    otp_verified:        { bg: "#EFF6FF",                color: "#1D4ED8" },
    awaiting_acceptance: { bg: "#F3F4F6",                color: "#374151" },
    completed:           { bg: "#ECFDF5",                color: "#065F46" },
    expired:             { bg: "var(--color-linen)",     color: "var(--color-slate)" },
    cancelled:           { bg: "var(--color-alert-tint)",color: "var(--color-alert)" },
  };
  return map[status] ?? { bg: "var(--color-linen)", color: "var(--color-slate)" };
}

// ── Page ─────────────────────────────────────────────────────────────────────

export default async function ProductDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const user = await getUser();
  if (!user) redirect("/auth/login");

  const supabase = await createClient();

  // Company check
  const { data: companyData } = await supabase
    .from("companies")
    .select("id, industry, status, name")
    .eq("id", user.id)
    .single();

  const company = companyData as { id: string; industry: string; status: CompanyStatus; name: string } | null;
  if (!company || company.status !== "approved") redirect("/auth/unauthorized");

  // Product + linked tags + unassigned inventory (for the Replace picker) in parallel
  const [{ data: productData }, { data: linkedTagsData }, { data: availableData }] = await Promise.all([
    supabase
      .from("products")
      .select("id, name, retail_price, currency, industry_fields, photos, created_at")
      .eq("id", id)
      .eq("company_id", user.id)
      .single(),
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (supabase as any)
      .from("tags")
      .select("id, short_id, token, status, medium, created_at, activated_at")
      .eq("product_id", id),
    // Chips this brand owns that aren't linked to any product yet — the pool a
    // broken chip can be replaced from (mirrors the new-product picker).
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (supabase as any)
      .from("tags")
      .select("short_id, medium")
      .eq("company_id", user.id)
      .is("product_id", null)
      .in("status", ["created", "shipped"])
      .order("created_at", { ascending: false }),
  ]);

  const availableChips = (availableData ?? []) as { short_id: string; medium: string }[];

  if (!productData) notFound();

  const product = productData as {
    id: string;
    name: string;
    retail_price: number | null;
    currency: string;
    industry_fields: Record<string, string>;
    photos: string[];
    created_at: string;
  };

  type TagRecord = { id: string; short_id: string; token: string; status: string; medium: string; created_at: string; activated_at: string | null };
  // Tags first, then cards — stable, readable order in the ID list.
  const productTags = ((linkedTagsData ?? []) as TagRecord[]).sort(
    (a, b) => (a.medium === "card" ? 1 : 0) - (b.medium === "card" ? 1 : 0)
  );
  const cardCount = productTags.filter((t) => t.medium === "card").length;
  const tagCount = productTags.length - cardCount;
  // "2 tags + 1 card", "3 tags", or "1 card" — the human label for this set.
  const keysLabel = [
    tagCount > 0 ? `${tagCount} tag${tagCount !== 1 ? "s" : ""}` : "",
    cardCount > 0 ? `${cardCount} card${cardCount !== 1 ? "s" : ""}` : "",
  ].filter(Boolean).join(" + ");
  const productTagIds = productTags.map((t) => t.id);
  const primaryTag = productTags[0] ?? null;

  // All history data fetched in parallel — scoped to all tags on this product
  const [ownershipRes, claimsRes, transfersRes, certsRes] = await Promise.all([
    productTagIds.length
      ? supabase
          .from("ownership_records")
          .select("id, owner_name, owner_email, acquisition_type, acquired_at, sale_price, currency, is_current, ended_at")
          .in("tag_id", productTagIds)
          .order("acquired_at", { ascending: true })
      : Promise.resolve({ data: [] }),
    productTagIds.length
      ? supabase
          .from("ownership_claims")
          .select("id, claimant_name, claimant_email, status, created_at, expires_at, reviewed_at, rejection_reason")
          .in("tag_id", productTagIds)
          .order("created_at", { ascending: true })
      : Promise.resolve({ data: [] }),
    productTagIds.length
      ? supabase
          .from("transfer_requests")
          .select("id, to_name, to_email, sale_price, currency, status, created_at, expires_at, completed_at")
          .in("tag_id", productTagIds)
          .order("created_at", { ascending: true })
      : Promise.resolve({ data: [] }),
    productTagIds.length
      ? Promise.resolve(
          supabase
            .from("certificates")
            .select("id, cert_number, cert_type, issued_to_name, issued_at")
            .in("tag_id", productTagIds)
            .order("issued_at", { ascending: true })
        ).catch(() => ({ data: [] as Certificate[] }))
      : Promise.resolve({ data: [] as Certificate[] }),
  ]);

  const ownershipRecords = (ownershipRes.data ?? []) as OwnershipRecord[];
  const claims = (claimsRes.data ?? []) as OwnershipClaim[];
  const transfers = (transfersRes.data ?? []) as TransferRequest[];
  const certificates = ((certsRes as { data: Certificate[] | null }).data ?? []) as Certificate[];

  const currentOwner = ownershipRecords.find((r) => r.is_current) ?? null;

  const industryFields = INDUSTRY_FIELDS[company.industry] ?? [];
  const grouped = groupFields(industryFields);
  const iFields = product.industry_fields ?? {};

  // Build unified chronological timeline
  type TimelineItem = {
    date: string;
    kind: "registered" | "activated" | "claim" | "ownership" | "transfer" | "certificate";
    icon: React.ReactNode;
    iconBg: string;
    title: string;
    meta: string[];
    badge?: { label: string; bg: string; color: string };
    link?: string;
  };

  const timeline: TimelineItem[] = [];

  // Product registered
  timeline.push({
    date: product.created_at,
    kind: "registered",
    icon: <Package size={14} />,
    iconBg: "var(--color-onyx)",
    title: "Product registered",
    meta: [
      productTags.length > 0
        ? `${keysLabel} linked: ${productTags.map((t) => `${t.short_id} (${t.medium === "card" ? "card" : "tag"})`).join(", ")}`
        : "No tags or cards linked",
    ],
  });

  // Activations (one entry per tag/card that has been scanned)
  for (const t of productTags) {
    if (t.activated_at) {
      const noun = t.medium === "card" ? "Card" : "Tag";
      timeline.push({
        date: t.activated_at,
        kind: "activated",
        icon: <Tag size={14} />,
        iconBg: "#1D4ED8",
        title: productTags.length > 1 ? `${noun} ${t.short_id} first scanned` : `${noun} first scanned`,
        meta: ["Activated by consumer scan"],
      });
    }
  }

  // Ownership claims
  for (const claim of claims) {
    const badge = claimStatusBadge(claim.status);
    timeline.push({
      date: claim.created_at,
      kind: "claim",
      icon: <User size={14} />,
      iconBg: "var(--color-deep-gold)",
      title: "Ownership claim submitted",
      meta: [
        `${claim.claimant_name} · ${claim.claimant_email}`,
        claim.reviewed_at ? `Reviewed ${fmtDate(claim.reviewed_at)}` : `Expires ${fmtDate(claim.expires_at)}`,
        ...(claim.rejection_reason ? [`Reason: ${claim.rejection_reason}`] : []),
      ],
      badge: { label: claim.status, bg: badge.bg, color: badge.color },
      link: `/dashboard/ownership/${claim.id}`,
    });
  }

  // Ownership records
  for (const rec of ownershipRecords) {
    timeline.push({
      date: rec.acquired_at,
      kind: "ownership",
      icon: rec.acquisition_type === "origin" ? <CheckCircle2 size={14} /> : <ArrowRightLeft size={14} />,
      iconBg: "#065F46",
      title: rec.acquisition_type === "origin" ? "Ownership established" : "Ownership transferred",
      meta: [
        `${rec.owner_name} · ${rec.owner_email}`,
        ...(rec.sale_price ? [`${rec.currency} ${rec.sale_price.toLocaleString()}`] : []),
        ...(rec.ended_at ? [`Ownership ended ${fmtDate(rec.ended_at)}`] : rec.is_current ? ["Current owner"] : []),
      ],
      badge: rec.is_current
        ? { label: "Current", bg: "#ECFDF5", color: "#065F46" }
        : { label: "Past", bg: "var(--color-linen)", color: "var(--color-slate)" },
    });
  }

  // Transfer requests
  for (const tr of transfers) {
    const badge = transferStatusBadge(tr.status);
    timeline.push({
      date: tr.created_at,
      kind: "transfer",
      icon: <ArrowRightLeft size={14} />,
      iconBg: "#1D4ED8",
      title: "Transfer of ownership initiated",
      meta: [
        `To: ${tr.to_name} · ${tr.to_email}`,
        ...(tr.sale_price ? [`${tr.currency} ${tr.sale_price.toLocaleString()}`] : []),
        ...(tr.completed_at ? [`Completed ${fmtDate(tr.completed_at)}`] : tr.status !== "completed" && tr.status !== "cancelled" ? [`Expires ${fmtDate(tr.expires_at)}`] : []),
      ],
      badge: { label: tr.status.replace(/_/g, " "), bg: badge.bg, color: badge.color },
    });
  }

  // Certificates
  for (const cert of certificates) {
    timeline.push({
      date: cert.issued_at,
      kind: "certificate",
      icon: <Award size={14} />,
      iconBg: "var(--color-gold)",
      title: `Certificate issued — ${cert.cert_type === "ownership" ? "Ownership" : "Transfer"}`,
      meta: [`${cert.cert_number} · ${cert.issued_to_name}`],
      link: `/certificate/${cert.id}`,
    });
  }

  // Sort oldest → newest
  timeline.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

  const tagBadge = statusBadge(primaryTag?.status ?? "created");

  return (
    <div className="p-8 max-w-4xl mx-auto">
      {/* ── Header ── */}
      <div className="flex items-center justify-between mb-8">
        <Link
          href="/dashboard/products"
          className="inline-flex items-center gap-1.5"
          style={{ color: "var(--color-slate)", fontSize: "var(--text-body-sm)", textDecoration: "none" }}
        >
          <ChevronLeft size={14} />
          All products
        </Link>
        <div className="flex items-center gap-2">
          <Link
            href={`/dashboard/products/new?from=${id}`}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg font-medium"
            style={{ backgroundColor: "var(--color-pearl)", color: "var(--color-graphite)", border: "1px solid var(--color-stone)", textDecoration: "none", fontSize: "var(--text-body-sm)" }}
          >
            <Copy size={13} />
            Duplicate
          </Link>
          <Link
            href={`/dashboard/products/${id}/edit`}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg font-medium"
            style={{ backgroundColor: "var(--color-onyx)", color: "var(--color-pearl)", textDecoration: "none", fontSize: "var(--text-body-sm)" }}
          >
            <Pencil size={13} />
            Edit product
          </Link>
        </div>
      </div>

      {/* ── Product overview card ── */}
      <div className="card-raised rounded-xl p-6 mb-6">
        <div className="flex items-start justify-between gap-4 mb-5">
          <div>
            <p className="text-micro font-semibold uppercase tracking-widest mb-1" style={{ color: "var(--color-gold)" }}>
              {company.industry}
            </p>
            <h1 className="font-display" style={{ fontSize: "28px", color: "var(--color-charcoal)", lineHeight: 1.15, letterSpacing: "-0.02em" }}>
              {product.name}
            </h1>
          </div>
          {primaryTag && (
            <span
              className="px-2.5 py-1 rounded-full text-micro font-medium shrink-0"
              style={{ backgroundColor: tagBadge.bg, color: tagBadge.color }}
            >
              {tagBadge.label}
            </span>
          )}
        </div>

        <div className="grid grid-cols-2 gap-x-8 gap-y-3 mb-5 sm:grid-cols-3">
          <div>
            <p className="text-micro font-medium uppercase tracking-wider mb-0.5" style={{ color: "var(--color-mist)" }}>
              {cardCount > 0 && tagCount > 0
                ? "Tags & Cards"
                : cardCount > 0
                  ? (cardCount === 1 ? "Card ID" : "Cards")
                  : (tagCount === 1 ? "Tag ID" : "Tags")}
            </p>
            {productTags.length === 0 ? (
              <p style={{ fontSize: "var(--text-body-sm)", color: "var(--color-graphite)" }}>—</p>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                {productTags.map((t) => {
                  const isCard = t.medium === "card";
                  return (
                  <div key={t.id} style={{ display: "flex", alignItems: "center", gap: "8px", flexWrap: "wrap" }}>
                    <span
                      className="px-1.5 py-0.5 rounded text-micro font-medium"
                      style={
                        isCard
                          ? { backgroundColor: "#EFF6FF", color: "#1D4ED8" }
                          : { backgroundColor: "var(--color-linen)", color: "var(--color-graphite)" }
                      }
                    >
                      {isCard ? "Card" : "Tag"}
                    </span>
                    <span
                      style={{ fontFamily: "var(--font-jetbrains-mono)", fontSize: "var(--text-body-sm)", color: "var(--color-graphite)", letterSpacing: "0.05em" }}
                    >
                      {t.short_id}
                    </span>
                    {/* Each tag/card carries its own unique consumer link. */}
                    <CopyLinkButton url={`${process.env.NEXT_PUBLIC_APP_URL ?? ""}/v/${t.token}`} label="Copy link" />
                    {/* Swap a broken/missing chip for a fresh one from inventory. */}
                    <ReplaceChipButton
                      productId={product.id}
                      chip={{ short_id: t.short_id, medium: t.medium }}
                      available={availableChips.filter((c) => c.medium === t.medium).map((c) => c.short_id)}
                    />
                  </div>
                  );
                })}
              </div>
            )}
          </div>
          <div>
            <p className="text-micro font-medium uppercase tracking-wider mb-0.5" style={{ color: "var(--color-mist)" }}>Retail price</p>
            <p style={{ fontSize: "var(--text-body-sm)", color: "var(--color-graphite)" }}>
              {product.retail_price ? `${product.currency} ${product.retail_price.toLocaleString()}` : "—"}
            </p>
          </div>
          <div>
            <p className="text-micro font-medium uppercase tracking-wider mb-0.5" style={{ color: "var(--color-mist)" }}>Registered</p>
            <p style={{ fontSize: "var(--text-body-sm)", color: "var(--color-graphite)" }}>
              {fmtDate(product.created_at)}
            </p>
          </div>
          {currentOwner && (
            <div>
              <p className="text-micro font-medium uppercase tracking-wider mb-0.5" style={{ color: "var(--color-mist)" }}>Current owner</p>
              <p style={{ fontSize: "var(--text-body-sm)", color: "var(--color-graphite)" }}>{currentOwner.owner_name}</p>
              <p style={{ fontSize: "var(--text-caption)", color: "var(--color-slate)" }}>{currentOwner.owner_email}</p>
            </div>
          )}
          {primaryTag?.activated_at && (
            <div>
              <p className="text-micro font-medium uppercase tracking-wider mb-0.5" style={{ color: "var(--color-mist)" }}>First scanned</p>
              <p style={{ fontSize: "var(--text-body-sm)", color: "var(--color-graphite)" }}>{fmtDate(primaryTag.activated_at)}</p>
            </div>
          )}
        </div>

        {/* Photos */}
        {product.photos && product.photos.length > 0 && (
          <div className="flex gap-3 flex-wrap pt-4" style={{ borderTop: "1px solid var(--color-cream)" }}>
            {product.photos.map((url, i) => (
              <div
                key={i}
                style={{
                  width: "72px",
                  height: "72px",
                  borderRadius: "var(--radius-md)",
                  overflow: "hidden",
                  border: "1px solid var(--color-cream)",
                  position: "relative",
                  flexShrink: 0,
                }}
              >
                <Image src={url} alt={`${product.name} photo ${i + 1}`} fill style={{ objectFit: "cover" }} />
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ── Industry fields ── */}
      {Object.keys(iFields).length > 0 && (
        <div className="card-raised rounded-xl p-6 mb-6">
          <h2 className="text-body font-semibold mb-4" style={{ color: "var(--color-charcoal)" }}>Product details</h2>
          {Object.entries(grouped).map(([groupName, fields]) => {
            const hasValues = fields.some((f) => iFields[f.key]);
            if (!hasValues) return null;
            return (
              <div key={groupName} className="mb-5 last:mb-0">
                <p className="text-micro font-semibold uppercase tracking-wider mb-3" style={{ color: "var(--color-mist)" }}>
                  {groupName}
                </p>
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                  {fields.filter((f) => iFields[f.key]).map((field) => (
                    <div key={field.key} style={{ gridColumn: field.type === "textarea" ? "1 / -1" : undefined }}>
                      <p className="text-micro font-medium mb-0.5" style={{ color: "var(--color-slate)" }}>
                        {field.label}
                      </p>
                      <p style={{ fontSize: "var(--text-body-sm)", color: "var(--color-charcoal)", whiteSpace: "pre-wrap" }}>
                        {iFields[field.key]}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ── Certificates ── */}
      {certificates.length > 0 && (
        <div className="card-raised rounded-xl p-6 mb-6">
          <h2 className="text-body font-semibold mb-4" style={{ color: "var(--color-charcoal)" }}>
            Certificates
          </h2>
          <div className="space-y-3">
            {certificates.map((cert) => (
              <div
                key={cert.id}
                className="flex items-center justify-between p-3 rounded-lg"
                style={{ backgroundColor: "var(--color-smoke)", border: "1px solid var(--color-cream)" }}
              >
                <div className="flex items-center gap-3">
                  <div
                    className="flex items-center justify-center rounded-lg"
                    style={{ width: "32px", height: "32px", backgroundColor: "var(--color-soft-gold)" }}
                  >
                    <Award size={14} style={{ color: "var(--color-deep-gold)" }} />
                  </div>
                  <div>
                    <p className="font-medium" style={{ fontSize: "var(--text-body-sm)", color: "var(--color-charcoal)" }}>
                      {cert.cert_number}
                    </p>
                    <p style={{ fontSize: "var(--text-caption)", color: "var(--color-slate)" }}>
                      {cert.cert_type === "ownership" ? "Ownership" : "Transfer"} · Issued to {cert.issued_to_name} · {fmtDate(cert.issued_at)}
                    </p>
                  </div>
                </div>
                <Link
                  href={`/certificate/${cert.id}`}
                  target="_blank"
                  style={{ fontSize: "var(--text-caption)", color: "var(--color-graphite)", textDecoration: "underline" }}
                >
                  View →
                </Link>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── Provenance timeline ── */}
      <div className="card-raised rounded-xl p-6">
        <h2 className="text-body font-semibold mb-6" style={{ color: "var(--color-charcoal)" }}>
          Provenance history
        </h2>

        {timeline.length === 0 ? (
          <p style={{ fontSize: "var(--text-body-sm)", color: "var(--color-mist)" }}>
            No history recorded yet.
          </p>
        ) : (
          <div className="relative">
            {/* Vertical line */}
            <div
              style={{
                position: "absolute",
                left: "15px",
                top: "4px",
                bottom: "4px",
                width: "1px",
                backgroundColor: "var(--color-cream)",
              }}
            />

            <div className="space-y-6">
              {timeline.map((item, i) => (
                <div key={i} className="flex gap-4 relative">
                  {/* Icon bubble */}
                  <div
                    className="flex items-center justify-center rounded-full shrink-0 z-10"
                    style={{
                      width: "30px",
                      height: "30px",
                      backgroundColor: item.iconBg,
                      color: "#fff",
                    }}
                  >
                    {item.icon}
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0 pt-1">
                    <div className="flex items-start justify-between gap-2 flex-wrap">
                      <div>
                        <p className="font-medium" style={{ fontSize: "var(--text-body-sm)", color: "var(--color-charcoal)" }}>
                          {item.link ? (
                            <Link href={item.link} style={{ color: "inherit", textDecoration: "underline" }}>
                              {item.title}
                            </Link>
                          ) : (
                            item.title
                          )}
                        </p>
                        {item.meta.map((m, mi) => (
                          <p key={mi} style={{ fontSize: "var(--text-caption)", color: "var(--color-slate)", marginTop: "1px" }}>
                            {m}
                          </p>
                        ))}
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        {item.badge && (
                          <span
                            className="px-2 py-0.5 rounded-full text-micro font-medium capitalize"
                            style={{ backgroundColor: item.badge.bg, color: item.badge.color }}
                          >
                            {item.badge.label}
                          </span>
                        )}
                        <span style={{ fontSize: "var(--text-caption)", color: "var(--color-mist)", whiteSpace: "nowrap" }}>
                          {fmt(item.date)}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
