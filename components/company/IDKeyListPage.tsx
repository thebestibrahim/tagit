import { createClient } from "@/lib/supabase/server";
import { getUser } from "@/lib/auth";
import { redirect } from "next/navigation";
import Link from "next/link";
import { Suspense } from "react";
import SearchInput from "@/components/ui/SearchInput";
import IDKeyTable, { type IDKeyRow } from "./IDKeyTable";
import { STATUS_FILTERS } from "@/lib/tag-status";
import type { TagMedium, TagStatus } from "@/types/database";

/**
 * The Tags and Cards pages are identical apart from the `medium` they scope to,
 * so all of the querying, filtering and pagination lives here. Each page is a
 * one-line wrapper that passes its medium.
 */
export default async function IDKeyListPage({
  medium,
  searchParams,
}: {
  medium: TagMedium;
  searchParams: Promise<{ status?: string; page?: string; q?: string }>;
}) {
  const supabase = await createClient();
  const user = await getUser();
  if (!user) redirect("/auth/login");

  const noun = medium === "card" ? "cards" : "tags";
  const heading = medium === "card" ? "Cards" : "Tags";
  const subtitle =
    medium === "card"
      ? "Authentication cards for items that cannot be embedded"
      : "Chips embedded in your items";
  const basePath = `/dashboard/id-keys/${noun}`;

  const params = await searchParams;
  const statusFilter = (STATUS_FILTERS as string[]).includes(params.status ?? "") ? params.status! : "all";
  const q = params.q?.trim() ?? "";
  const page = Math.max(1, parseInt(params.page ?? "1", 10));
  const perPage = 25;
  const from = (page - 1) * perPage;
  const to = from + perPage - 1;

  let query = supabase
    .from("tags")
    .select("id, short_id, token, status, created_at, products(name)", { count: "exact" })
    .eq("company_id", user.id)
    .eq("medium", medium)
    .order("created_at", { ascending: false })
    .range(from, to);

  if (statusFilter !== "all") query = query.eq("status", statusFilter as TagStatus);
  if (q) query = query.ilike("short_id", `%${q}%`);

  const { data, count } = await query;
  const rows = (data ?? []) as unknown as IDKeyRow[];
  const totalPages = Math.ceil((count ?? 0) / perPage);

  const buildHref = (next: { status?: string; page?: number }) => {
    const sp = new URLSearchParams();
    const status = next.status ?? statusFilter;
    if (status && status !== "all") sp.set("status", status);
    if (q) sp.set("q", q);
    if (next.page && next.page > 1) sp.set("page", String(next.page));
    const qs = sp.toString();
    return qs ? `${basePath}?${qs}` : basePath;
  };

  return (
    <div className="p-8 max-w-5xl mx-auto">
      <div className="page-header mb-8">
        <p className="text-micro font-semibold uppercase tracking-widest mb-2" style={{ color: "var(--color-gold)" }}>
          ID Keys
        </p>
        <h1 className="font-display" style={{ fontSize: "32px", color: "var(--color-charcoal)", lineHeight: 1.15, letterSpacing: "-0.02em" }}>
          {heading}
        </h1>
        <p className="mt-1" style={{ color: "var(--color-slate)", fontSize: "var(--text-body-sm)" }}>
          {count ?? 0} {noun} · {subtitle.toLowerCase()}
        </p>
      </div>

      {/* Search + status filter */}
      <div className="flex flex-wrap items-center gap-3 mb-6">
        <Suspense>
          <SearchInput placeholder={`Search by ${medium === "card" ? "card" : "tag"} ID…`} />
        </Suspense>
        <div className="flex flex-wrap gap-1 p-1 rounded-lg" style={{ backgroundColor: "var(--color-linen)" }}>
          {STATUS_FILTERS.map((s) => (
            <Link
              key={s}
              href={buildHref({ status: s, page: 1 })}
              className="px-3 py-1.5 rounded-md text-caption font-medium capitalize transition-colors"
              style={{
                backgroundColor: statusFilter === s ? "var(--color-pearl)" : "transparent",
                color: statusFilter === s ? "var(--color-charcoal)" : "var(--color-slate)",
                boxShadow: statusFilter === s ? "var(--shadow-sm)" : "none",
                textDecoration: "none",
              }}
            >
              {s}
            </Link>
          ))}
        </div>
      </div>

      <div className="rounded-xl overflow-hidden card-raised" style={{ padding: 0 }}>
        <IDKeyTable rows={rows} medium={medium} />

        {totalPages > 1 && (
          <div
            className="flex items-center justify-between px-5 py-3"
            style={{ borderTop: "1px solid var(--color-cream)", backgroundColor: "var(--color-smoke)" }}
          >
            <p style={{ fontSize: "var(--text-caption)", color: "var(--color-slate)" }}>
              Page {page} of {totalPages}
            </p>
            <div className="flex gap-2">
              {page > 1 && (
                <Link href={buildHref({ page: page - 1 })} className="px-3 py-1.5 rounded-lg text-caption font-medium" style={{ backgroundColor: "var(--color-linen)", color: "var(--color-graphite)", textDecoration: "none" }}>
                  Previous
                </Link>
              )}
              {page < totalPages && (
                <Link href={buildHref({ page: page + 1 })} className="px-3 py-1.5 rounded-lg text-caption font-medium" style={{ backgroundColor: "var(--color-linen)", color: "var(--color-graphite)", textDecoration: "none" }}>
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
