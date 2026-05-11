import { createClient } from "@/lib/supabase/server";
import { getUser } from "@/lib/auth";
import { redirect } from "next/navigation";
import Link from "next/link";
import { format } from "date-fns";
import { Tag } from "lucide-react";
import { Suspense } from "react";
import SearchInput from "@/components/ui/SearchInput";
import type { CompanyStatus } from "@/types/database";

const STATUS_FILTERS = ["all", "created", "embedded", "owned", "unowned", "flagged"];

const BADGE: Record<string, { bg: string; color: string }> = {
  created:          { bg: "var(--color-linen)",         color: "var(--color-slate)" },
  written:          { bg: "var(--color-linen)",         color: "var(--color-slate)" },
  shipped:          { bg: "var(--color-soft-gold)",    color: "var(--color-deep-gold)" },
  embedded:         { bg: "var(--color-soft-gold)",    color: "var(--color-deep-gold)" },
  activated:        { bg: "var(--color-soft-gold)",    color: "var(--color-deep-gold)" },
  unowned:          { bg: "var(--color-linen)",         color: "var(--color-graphite)" },
  claim_pending:    { bg: "var(--color-soft-gold)",    color: "var(--color-warning)" },
  owned:            { bg: "var(--color-verified-tint)", color: "var(--color-verified)" },
  transfer_pending: { bg: "var(--color-soft-gold)",    color: "var(--color-warning)" },
  flagged:          { bg: "var(--color-alert-tint)",   color: "var(--color-alert)" },
  suspended:        { bg: "var(--color-alert-tint)",   color: "var(--color-alert)" },
};

export default async function CompanyTagsPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string; page?: string; q?: string }>;
}) {
  const supabase = await createClient();
  const user = await getUser();
  if (!user) redirect("/auth/login");

  const { data: companyData } = await supabase
    .from("companies")
    .select("status")
    .eq("id", user.id)
    .single();

  const company = companyData as { status: CompanyStatus } | null;
  if (!company || company.status !== "approved") redirect("/auth/unauthorized");

  const params = await searchParams;
  const statusFilter = STATUS_FILTERS.includes(params.status ?? "") ? params.status : "all";
  const q = params.q?.trim() ?? "";
  const page = Math.max(1, parseInt(params.page ?? "1", 10));
  const perPage = 25;
  const from = (page - 1) * perPage;
  const to = from + perPage - 1;

  let query = supabase
    .from("tags")
    .select("id, short_id, token, status, industry, created_at, activated_at", { count: "exact" })
    .eq("company_id", user.id)
    .order("created_at", { ascending: false })
    .range(from, to);

  if (statusFilter && statusFilter !== "all") {
    query = query.eq("status", statusFilter);
  }
  if (q) {
    query = query.ilike("short_id", `%${q}%`);
  }

  const { data, count } = await query;
  const tags = (data ?? []) as {
    id: string;
    short_id: string;
    token: string;
    status: string;
    industry: string;
    created_at: string;
    activated_at: string | null;
  }[];

  const totalPages = Math.ceil((count ?? 0) / perPage);

  return (
    <div className="p-8 max-w-5xl mx-auto">
      <div className="page-header mb-8">
        <p className="text-micro font-semibold uppercase tracking-widest mb-2" style={{ color: "var(--color-gold)" }}>
          Inventory
        </p>
        <h1 className="font-display" style={{ fontSize: "32px", color: "var(--color-charcoal)", lineHeight: 1.15, letterSpacing: "-0.02em" }}>
          Tags
        </h1>
        <p className="mt-1" style={{ color: "var(--color-slate)", fontSize: "var(--text-body-sm)" }}>
          {count ?? 0} tags in your account
        </p>
      </div>

      {/* Search + filter */}
      <div className="flex flex-wrap items-center gap-3 mb-6">
        <Suspense>
          <SearchInput placeholder="Search by tag ID…" />
        </Suspense>
        <div className="flex flex-wrap gap-1 p-1 rounded-lg" style={{ backgroundColor: "var(--color-linen)" }}>
        {STATUS_FILTERS.map((s) => (
          <Link
            key={s}
            href={`/dashboard/tags${s === "all" ? "" : `?status=${s}`}`}
            className="px-3 py-1.5 rounded-md text-caption font-medium capitalize transition-colors"
            style={{
              backgroundColor: statusFilter === s ? "var(--color-pearl)" : "transparent",
              color: statusFilter === s ? "var(--color-charcoal)" : "var(--color-slate)",
              boxShadow: statusFilter === s ? "var(--shadow-sm)" : "none",
            }}
          >
            {s.replace("_", " ")}
          </Link>
        ))}
        </div>
      </div>

      <div className="rounded-xl overflow-hidden card-raised" style={{ padding: 0 }}>
        {tags.length === 0 ? (
          <div className="py-16 text-center" style={{ color: "var(--color-mist)" }}>
            <Tag size={32} className="mx-auto mb-3 opacity-30" />
            <p style={{ fontSize: "var(--text-body-sm)" }}>
              {q ? `No tags matching "${q}"` : "No tags found"}
            </p>
          </div>
        ) : (
          <>
            <table className="w-full">
              <thead>
                <tr style={{ backgroundColor: "var(--color-smoke)", borderBottom: "1px solid var(--color-cream)" }}>
                  {["Short ID", "Industry", "Status", "Created", "Scan"].map((h) => (
                    <th key={h} className="text-left px-5 py-3 text-micro font-medium uppercase tracking-wider" style={{ color: "var(--color-slate)" }}>
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {tags.map((tag, i) => {
                  const badge = BADGE[tag.status] ?? BADGE.created;
                  return (
                    <tr
                      key={tag.id}
                      style={{
                        backgroundColor: "var(--color-pearl)",
                        borderBottom: i < tags.length - 1 ? "1px solid var(--color-cream)" : "none",
                      }}
                    >
                      <td className="px-5 py-4">
                        <span style={{ fontFamily: "var(--font-jetbrains-mono)", fontSize: "var(--text-body-sm)", color: "var(--color-charcoal)", letterSpacing: "0.05em" }}>
                          {tag.short_id}
                        </span>
                      </td>
                      <td className="px-5 py-4">
                        <span className="capitalize" style={{ fontSize: "var(--text-body-sm)", color: "var(--color-graphite)" }}>
                          {tag.industry}
                        </span>
                      </td>
                      <td className="px-5 py-4">
                        <span className="px-2 py-0.5 rounded-full text-micro font-medium capitalize" style={{ backgroundColor: badge.bg, color: badge.color }}>
                          {tag.status.replace(/_/g, " ")}
                        </span>
                      </td>
                      <td className="px-5 py-4">
                        <span style={{ color: "var(--color-slate)", fontSize: "var(--text-body-sm)" }}>
                          {format(new Date(tag.created_at), "MMM d, yyyy")}
                        </span>
                      </td>
                      <td className="px-5 py-4">
                        <Link
                          href={`/v/${tag.token}`}
                          target="_blank"
                          style={{ color: "var(--color-graphite)", fontSize: "var(--text-body-sm)", textDecoration: "underline" }}
                        >
                          Preview
                        </Link>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>

            {/* Pagination */}
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
                    <Link
                      href={`/dashboard/tags?${statusFilter !== "all" ? `status=${statusFilter}&` : ""}page=${page - 1}`}
                      className="px-3 py-1.5 rounded-lg text-caption font-medium"
                      style={{ backgroundColor: "var(--color-linen)", color: "var(--color-graphite)" }}
                    >
                      Previous
                    </Link>
                  )}
                  {page < totalPages && (
                    <Link
                      href={`/dashboard/tags?${statusFilter !== "all" ? `status=${statusFilter}&` : ""}page=${page + 1}`}
                      className="px-3 py-1.5 rounded-lg text-caption font-medium"
                      style={{ backgroundColor: "var(--color-linen)", color: "var(--color-graphite)" }}
                    >
                      Next
                    </Link>
                  )}
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
