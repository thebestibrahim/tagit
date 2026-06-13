import { createClient } from "@/lib/supabase/server";
import type { ClaimStatus } from "@/types/database";
import { getUser } from "@/lib/auth";
import { redirect } from "next/navigation";
import Link from "next/link";
import { Users, ChevronRight } from "lucide-react";
import { Suspense } from "react";
import SearchInput from "@/components/ui/SearchInput";
import OwnerLedgerTable, { type OwnerRow } from "@/components/OwnerLedgerTable";
import LocalTime from "@/components/ui/LocalTime";
import { sanitizeSearch } from "@/lib/utils";

type Claim = {
  id: string;
  tag_id: string;
  claimant_name: string;
  claimant_email: string;
  status: string;
  created_at: string;
  expires_at: string;
  tags: { short_id: string; products: { name: string }[] | null } | null;
};

type OwnerRecord = {
  id: string;
  owner_name: string;
  owner_email: string;
  acquisition_type: string;
  is_current: boolean | null;
  acquired_at: string | null;
  tags: { short_id: string; products: { name: string }[] | null } | null;
};

const STATUS_FILTER = ["all", "pending", "approved", "rejected"];
const OWNER_FILTER = ["all", "current", "previous"];

const BADGE: Record<string, { bg: string; color: string }> = {
  pending:  { bg: "var(--color-soft-gold)",    color: "var(--color-deep-gold)" },
  approved: { bg: "var(--color-verified-tint)", color: "var(--color-verified)" },
  rejected: { bg: "var(--color-alert-tint)",   color: "var(--color-alert)" },
  expired:  { bg: "var(--color-linen)",         color: "var(--color-slate)" },
};

const PER_PAGE = 15;

export default async function OwnershipPage({
  searchParams,
}: {
  searchParams: Promise<{ view?: string; status?: string; owner?: string; q?: string; page?: string }>;
}) {
  const supabase = await createClient();
  const user = await getUser();
  if (!user) redirect("/auth/login");

  const params = await searchParams;
  const view = params.view === "owners" ? "owners" : "claims";
  const q = sanitizeSearch(params.q ?? "");
  const page = Math.max(1, parseInt(params.page ?? "1", 10));
  const from = (page - 1) * PER_PAGE;
  const to = from + PER_PAGE - 1;

  const statusFilter = STATUS_FILTER.includes(params.status ?? "") ? params.status! : "pending";
  const ownerFilter = OWNER_FILTER.includes(params.owner ?? "") ? params.owner! : "all";

  // ── Claims branch (default) ──────────────────────────────────────────────
  let claims: Claim[] = [];
  let claimsCount = 0;
  // ── Owners ledger branch ─────────────────────────────────────────────────
  let ownerRows: OwnerRow[] = [];
  let ownersCount = 0;

  if (view === "claims") {
    let query = supabase
      .from("ownership_claims")
      .select("id, tag_id, claimant_name, claimant_email, status, created_at, expires_at, tags!inner(short_id, company_id, products(name))", { count: "exact" })
      .eq("tags.company_id", user.id)
      .order("created_at", { ascending: false })
      .range(from, to);

    if (statusFilter !== "all") query = query.eq("status", statusFilter as ClaimStatus);
    if (q) query = query.or(`claimant_name.ilike.%${q}%,claimant_email.ilike.%${q}%`);

    const { data, count } = await query;
    claims = (data ?? []) as Claim[];
    claimsCount = count ?? 0;
  } else {
    let query = supabase
      .from("ownership_records")
      .select("id, owner_name, owner_email, acquisition_type, is_current, acquired_at, tags!inner(short_id, company_id, products(name))", { count: "exact" })
      .eq("tags.company_id", user.id)
      .order("acquired_at", { ascending: false })
      .range(from, to);

    if (ownerFilter === "current") query = query.eq("is_current", true);
    if (ownerFilter === "previous") query = query.eq("is_current", false);
    if (q) query = query.or(`owner_name.ilike.%${q}%,owner_email.ilike.%${q}%`);

    const { data, count } = await query;
    ownersCount = count ?? 0;
    ownerRows = ((data ?? []) as OwnerRecord[]).map((r) => ({
      id: r.id,
      ownerName: r.owner_name,
      ownerEmail: r.owner_email,
      productName: r.tags?.products?.[0]?.name ?? null,
      tagShortId: r.tags?.short_id ?? null,
      acquisitionType: r.acquisition_type,
      isCurrent: !!r.is_current,
      acquiredAt: r.acquired_at,
    }));
  }

  const count = view === "claims" ? claimsCount : ownersCount;
  const totalPages = Math.ceil(count / PER_PAGE);
  const subFilters = view === "claims" ? STATUS_FILTER : OWNER_FILTER;
  const activeSub = view === "claims" ? statusFilter : ownerFilter;
  const defaultSub = view === "claims" ? "pending" : "all";

  const subHref = (s: string) => {
    const sp = new URLSearchParams();
    if (view === "owners") sp.set("view", "owners");
    if (s !== defaultSub) sp.set(view === "claims" ? "status" : "owner", s);
    if (q) sp.set("q", q);
    const qs = sp.toString();
    return qs ? `/dashboard/ownership?${qs}` : "/dashboard/ownership";
  };

  const pageHref = (p: number) => {
    const sp = new URLSearchParams();
    if (view === "owners") sp.set("view", "owners");
    if (activeSub !== defaultSub) sp.set(view === "claims" ? "status" : "owner", activeSub);
    if (q) sp.set("q", q);
    if (p > 1) sp.set("page", String(p));
    const qs = sp.toString();
    return qs ? `/dashboard/ownership?${qs}` : "/dashboard/ownership";
  };

  return (
    <div className="p-8 max-w-5xl mx-auto">
      <div className="page-header mb-8">
        <p className="text-micro font-semibold uppercase tracking-widest mb-2" style={{ color: "var(--color-gold)" }}>
          Provenance
        </p>
        <h1 className="font-display" style={{ fontSize: "32px", color: "var(--color-charcoal)", lineHeight: 1.15, letterSpacing: "-0.02em" }}>
          Ownership
        </h1>
        <p className="mt-1" style={{ color: "var(--color-slate)", fontSize: "var(--text-body-sm)" }}>
          {view === "claims"
            ? "Review and manage ownership claims for your products"
            : "Every owner your products have had, current and past"}
        </p>
      </div>

      {/* View toggle */}
      <div className="flex gap-1 p-1 rounded-lg mb-6 w-fit" style={{ backgroundColor: "var(--color-linen)" }}>
        {[
          { key: "claims", label: "Claims", href: "/dashboard/ownership" },
          { key: "owners", label: "Owners", href: "/dashboard/ownership?view=owners" },
        ].map((t) => (
          <Link
            key={t.key}
            href={t.href}
            className="px-4 py-1.5 rounded-md text-body-sm font-medium transition-colors"
            style={{
              backgroundColor: view === t.key ? "var(--color-pearl)" : "transparent",
              color: view === t.key ? "var(--color-charcoal)" : "var(--color-slate)",
              boxShadow: view === t.key ? "var(--shadow-sm)" : "none",
              textDecoration: "none",
            }}
          >
            {t.label}
          </Link>
        ))}
      </div>

      {/* Search + sub-filter bar */}
      <div className="flex flex-wrap items-center gap-3 mb-6">
        <Suspense>
          <SearchInput placeholder="Search by name or email…" />
        </Suspense>
        <div className="flex gap-1 p-1 rounded-lg" style={{ backgroundColor: "var(--color-linen)" }}>
          {subFilters.map((s) => (
            <Link
              key={s}
              href={subHref(s)}
              className="px-4 py-1.5 rounded-md text-body-sm font-medium capitalize transition-colors"
              style={{
                backgroundColor: activeSub === s ? "var(--color-pearl)" : "transparent",
                color: activeSub === s ? "var(--color-charcoal)" : "var(--color-slate)",
                boxShadow: activeSub === s ? "var(--shadow-sm)" : "none",
                textDecoration: "none",
              }}
            >
              {s}
            </Link>
          ))}
        </div>
      </div>

      <div className="rounded-xl overflow-hidden card-raised" style={{ padding: 0 }}>
        {view === "owners" ? (
          <OwnerLedgerTable rows={ownerRows} />
        ) : claims.length === 0 ? (
          <div className="py-16 text-center" style={{ color: "var(--color-mist)" }}>
            <Users size={32} className="mx-auto mb-3 opacity-30" />
            <p style={{ fontSize: "var(--text-body-sm)" }}>
              {q ? `No claims matching "${q}"` : `No ${statusFilter === "all" ? "" : statusFilter} claims`}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto"><table className="w-full">
            <thead>
              <tr style={{ backgroundColor: "var(--color-smoke)", borderBottom: "1px solid var(--color-cream)" }}>
                {["Claimant", "Product", "Tag", "Status", "Date", ""].map((h) => (
                  <th key={h} className="text-left px-5 py-3 text-micro font-medium uppercase tracking-wider" style={{ color: "var(--color-slate)" }}>
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {claims.map((claim, i) => {
                const badge = BADGE[claim.status] ?? BADGE.expired;
                return (
                  <tr
                    key={claim.id}
                    style={{
                      backgroundColor: "var(--color-pearl)",
                      borderBottom: i < claims.length - 1 ? "1px solid var(--color-cream)" : "none",
                    }}
                  >
                    <td className="px-5 py-4">
                      <p className="font-medium" style={{ color: "var(--color-charcoal)", fontSize: "var(--text-body-sm)" }}>
                        {claim.claimant_name}
                      </p>
                      <p style={{ color: "var(--color-slate)", fontSize: "var(--text-caption)" }}>
                        {claim.claimant_email}
                      </p>
                    </td>
                    <td className="px-5 py-4">
                      <span style={{ color: "var(--color-graphite)", fontSize: "var(--text-body-sm)" }}>
                        {claim.tags?.products?.[0]?.name ?? "—"}
                      </span>
                    </td>
                    <td className="px-5 py-4">
                      <span style={{ fontFamily: "var(--font-jetbrains-mono)", fontSize: "var(--text-body-sm)", color: "var(--color-graphite)", letterSpacing: "0.05em" }}>
                        {claim.tags?.short_id ?? "—"}
                      </span>
                    </td>
                    <td className="px-5 py-4">
                      <span className="px-2 py-0.5 rounded-full text-micro font-medium capitalize" style={{ backgroundColor: badge.bg, color: badge.color }}>
                        {claim.status}
                      </span>
                    </td>
                    <td className="px-5 py-4">
                      <span style={{ color: "var(--color-slate)", fontSize: "var(--text-body-sm)" }}>
                        {<LocalTime iso={claim.created_at} pattern="MMM d, yyyy" />}
                      </span>
                    </td>
                    <td className="px-5 py-4">
                      <Link
                        href={`/dashboard/ownership/${claim.id}`}
                        className="flex items-center gap-1"
                        style={{ color: "var(--color-graphite)", fontSize: "var(--text-body-sm)" }}
                      >
                        Review <ChevronRight size={14} />
                      </Link>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table></div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between px-5 py-3" style={{ borderTop: "1px solid var(--color-cream)", backgroundColor: "var(--color-smoke)" }}>
            <p style={{ fontSize: "var(--text-caption)", color: "var(--color-slate)" }}>
              Page {page} of {totalPages} · {count} total
            </p>
            <div className="flex gap-2">
              {page > 1 && (
                <Link href={pageHref(page - 1)} className="px-3 py-1.5 rounded-lg text-caption font-medium" style={{ backgroundColor: "var(--color-linen)", color: "var(--color-graphite)", textDecoration: "none" }}>
                  Previous
                </Link>
              )}
              {page < totalPages && (
                <Link href={pageHref(page + 1)} className="px-3 py-1.5 rounded-lg text-caption font-medium" style={{ backgroundColor: "var(--color-linen)", color: "var(--color-graphite)", textDecoration: "none" }}>
                  Next
                </Link>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
