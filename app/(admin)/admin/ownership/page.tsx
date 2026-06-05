import { createServiceClient } from "@/lib/supabase/server";
import OwnerLedgerTable, { type OwnerRow } from "@/components/OwnerLedgerTable";

const OWNER_FILTER = ["all", "current", "previous"];
const PAGE_SIZE = 50;

// PostgREST embeds a to-one relation as an object, but supabase typegen
// sometimes widens it to an array — normalise either shape to a single row.
function one<T>(v: T | T[] | null | undefined): T | null {
  if (Array.isArray(v)) return v[0] ?? null;
  return v ?? null;
}

type Rec = {
  id: string;
  owner_name: string;
  owner_email: string;
  acquisition_type: string;
  is_current: boolean | null;
  acquired_at: string | null;
  tags:
    | {
        short_id: string;
        products: { name: string } | { name: string }[] | null;
        companies: { name: string } | { name: string }[] | null;
      }
    | { short_id: string; products: unknown; companies: unknown }[]
    | null;
};

export default async function AdminOwnershipPage({
  searchParams,
}: {
  searchParams: Promise<{ owner?: string; page?: string }>;
}) {
  const { owner, page: pageParam } = await searchParams;
  const ownerFilter = OWNER_FILTER.includes(owner ?? "") ? owner! : "all";
  const page = Math.max(1, parseInt(pageParam ?? "1", 10));
  const offset = (page - 1) * PAGE_SIZE;

  const supabase = createServiceClient();

  let query = supabase
    .from("ownership_records")
    .select(
      "id, owner_name, owner_email, acquisition_type, is_current, acquired_at, tags!inner(short_id, products(name), companies(name))",
      { count: "exact" }
    )
    .order("acquired_at", { ascending: false })
    .range(offset, offset + PAGE_SIZE - 1);

  if (ownerFilter === "current") query = query.eq("is_current", true);
  if (ownerFilter === "previous") query = query.eq("is_current", false);

  const { data, count } = await query;
  const total = count ?? 0;
  const totalPages = Math.ceil(total / PAGE_SIZE);

  const rows: OwnerRow[] = ((data ?? []) as Rec[]).map((r) => {
    const tag = one(r.tags) as { short_id: string; products: unknown; companies: unknown } | null;
    const product = one(tag?.products as { name: string } | { name: string }[] | null);
    const company = one(tag?.companies as { name: string } | { name: string }[] | null);
    return {
      id: r.id,
      ownerName: r.owner_name,
      ownerEmail: r.owner_email,
      productName: product?.name ?? null,
      tagShortId: tag?.short_id ?? null,
      acquisitionType: r.acquisition_type,
      isCurrent: !!r.is_current,
      acquiredAt: r.acquired_at,
      companyName: company?.name ?? null,
    };
  });

  return (
    <div className="p-8 max-w-6xl mx-auto">
      <div className="mb-8">
        <h1 className="text-h2 font-semibold" style={{ color: "var(--color-charcoal)" }}>
          Ownership
        </h1>
        <p className="mt-1" style={{ color: "var(--color-slate)", fontSize: "var(--text-body-sm)" }}>
          {total.toLocaleString()} ownership records across all companies
        </p>
      </div>

      {/* Filter tabs */}
      <div className="flex gap-1 mb-6 p-1 rounded-lg w-fit" style={{ backgroundColor: "var(--color-cream)" }}>
        {OWNER_FILTER.map((key) => (
          <a
            key={key}
            href={key === "all" ? "/admin/ownership" : `/admin/ownership?owner=${key}`}
            className="px-4 py-1.5 rounded-md text-body-sm font-medium capitalize transition-colors"
            style={{
              backgroundColor: ownerFilter === key ? "var(--color-pearl)" : "transparent",
              color: ownerFilter === key ? "var(--color-charcoal)" : "var(--color-slate)",
              fontSize: "var(--text-body-sm)",
              boxShadow: ownerFilter === key ? "var(--shadow-sm)" : "none",
              textDecoration: "none",
            }}
          >
            {key}
          </a>
        ))}
      </div>

      <div className="rounded-xl overflow-hidden" style={{ border: "1px solid var(--color-cream)", boxShadow: "var(--shadow-sm)" }}>
        <OwnerLedgerTable rows={rows} showCompany />
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex justify-between items-center mt-4">
          <span style={{ color: "var(--color-slate)", fontSize: "var(--text-body-sm)" }}>
            Page {page} of {totalPages} ({total.toLocaleString()} records)
          </span>
          <div className="flex gap-2">
            {page > 1 && (
              <a
                href={`/admin/ownership?owner=${ownerFilter}&page=${page - 1}`}
                className="px-3 py-1.5 rounded-md text-body-sm"
                style={{ border: "1px solid var(--color-stone)", color: "var(--color-graphite)", textDecoration: "none", fontSize: "var(--text-body-sm)" }}
              >
                Previous
              </a>
            )}
            {page < totalPages && (
              <a
                href={`/admin/ownership?owner=${ownerFilter}&page=${page + 1}`}
                className="px-3 py-1.5 rounded-md text-body-sm"
                style={{ border: "1px solid var(--color-stone)", color: "var(--color-graphite)", textDecoration: "none", fontSize: "var(--text-body-sm)" }}
              >
                Next
              </a>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
