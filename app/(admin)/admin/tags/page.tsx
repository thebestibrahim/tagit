import { createClient } from "@/lib/supabase/server";
import { format } from "date-fns";
import { Tag } from "lucide-react";
import type { TagStatus } from "@/types/database";

type TagRow = {
  id: string;
  token: string;
  short_id: string;
  industry: string;
  status: TagStatus;
  created_at: string;
  companies: { name: string } | null;
};

const STATUS_STYLES: Record<TagStatus, { bg: string; color: string }> = {
  created:          { bg: "var(--color-cream)",     color: "var(--color-slate)" },
  written:          { bg: "#EFF6FF",                color: "#1D4ED8" },
  shipped:          { bg: "#F5F3FF",                color: "#5B21B6" },
  embedded:         { bg: "#FFF7ED",                color: "#9A3412" },
  activated:        { bg: "var(--color-soft-gold)", color: "var(--color-deep-gold)" },
  unowned:          { bg: "var(--color-soft-gold)", color: "var(--color-deep-gold)" },
  claim_pending:    { bg: "#FEF3C7",                color: "#92400E" },
  owned:            { bg: "#ECFDF5",                color: "#065F46" },
  transfer_pending: { bg: "#EFF6FF",                color: "#1D4ED8" },
  flagged:          { bg: "#FEF2F2",                color: "#991B1B" },
  suspended:        { bg: "#F3F4F6",                color: "#374151" },
};

export default async function AdminTagsPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string; page?: string }>;
}) {
  const { status: filterStatus, page: pageParam } = await searchParams;
  const page = Math.max(1, parseInt(pageParam ?? "1", 10));
  const pageSize = 50;
  const offset = (page - 1) * pageSize;

  const supabase = await createClient();

  let query = supabase
    .from("tags")
    .select("id, token, short_id, industry, status, created_at, companies(name)", { count: "exact" })
    .order("created_at", { ascending: false })
    .range(offset, offset + pageSize - 1);

  if (filterStatus && filterStatus !== "all") {
    query = query.eq("status", filterStatus);
  }

  const { data, count } = await query;
  const tags = (data ?? []) as TagRow[];
  const total = count ?? 0;
  const totalPages = Math.ceil(total / pageSize);

  const STATUS_GROUPS = [
    { key: "all",      label: "All" },
    { key: "created",  label: "Created" },
    { key: "owned",    label: "Owned" },
    { key: "unowned",  label: "Unowned" },
    { key: "flagged",  label: "Flagged" },
  ];

  const activeStatus = filterStatus ?? "all";

  return (
    <div className="p-8 max-w-6xl mx-auto">
      <div className="mb-8">
        <h1 className="text-h2 font-semibold" style={{ color: "var(--color-charcoal)" }}>
          Tags
        </h1>
        <p className="mt-1" style={{ color: "var(--color-slate)", fontSize: "var(--text-body-sm)" }}>
          {total.toLocaleString()} total tags across all companies
        </p>
      </div>

      {/* Filter tabs */}
      <div
        className="flex gap-1 mb-6 p-1 rounded-lg w-fit"
        style={{ backgroundColor: "var(--color-cream)" }}
      >
        {STATUS_GROUPS.map((tab) => (
          <a
            key={tab.key}
            href={`/admin/tags?status=${tab.key}`}
            className="px-4 py-1.5 rounded-md text-body-sm font-medium transition-colors"
            style={{
              backgroundColor: activeStatus === tab.key ? "var(--color-pearl)" : "transparent",
              color: activeStatus === tab.key ? "var(--color-charcoal)" : "var(--color-slate)",
              fontSize: "var(--text-body-sm)",
              boxShadow: activeStatus === tab.key ? "var(--shadow-sm)" : "none",
              textDecoration: "none",
            }}
          >
            {tab.label}
          </a>
        ))}
      </div>

      <div
        className="rounded-xl overflow-hidden"
        style={{ border: "1px solid var(--color-cream)", boxShadow: "var(--shadow-sm)" }}
      >
        {tags.length === 0 ? (
          <div className="py-16 text-center" style={{ color: "var(--color-mist)" }}>
            <Tag size={32} className="mx-auto mb-3 opacity-30" />
            <p style={{ fontSize: "var(--text-body-sm)" }}>No tags found</p>
          </div>
        ) : (
          <table className="w-full">
            <thead>
              <tr style={{ backgroundColor: "var(--color-smoke)", borderBottom: "1px solid var(--color-cream)" }}>
                {["Short ID", "Company", "Industry", "Status", "Created"].map((h) => (
                  <th
                    key={h}
                    className="text-left px-5 py-3 text-micro font-medium uppercase tracking-wider"
                    style={{ color: "var(--color-slate)" }}
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {tags.map((tag, i) => {
                const s = STATUS_STYLES[tag.status] ?? STATUS_STYLES.created;
                return (
                  <tr
                    key={tag.id}
                    style={{
                      backgroundColor: "var(--color-pearl)",
                      borderBottom: i < tags.length - 1 ? "1px solid var(--color-cream)" : "none",
                    }}
                  >
                    <td className="px-5 py-3">
                      <span
                        style={{
                          fontFamily: "var(--font-jetbrains-mono)",
                          fontSize: "var(--text-body-sm)",
                          color: "var(--color-charcoal)",
                          letterSpacing: "0.05em",
                        }}
                      >
                        {tag.short_id}
                      </span>
                    </td>
                    <td className="px-5 py-3">
                      <span style={{ color: "var(--color-graphite)", fontSize: "var(--text-body-sm)" }}>
                        {tag.companies?.name ?? "—"}
                      </span>
                    </td>
                    <td className="px-5 py-3">
                      <span style={{ color: "var(--color-graphite)", fontSize: "var(--text-body-sm)", textTransform: "capitalize" }}>
                        {tag.industry}
                      </span>
                    </td>
                    <td className="px-5 py-3">
                      <span
                        className="px-2 py-0.5 rounded-full text-micro font-medium capitalize"
                        style={{ backgroundColor: s.bg, color: s.color }}
                      >
                        {tag.status.replace("_", " ")}
                      </span>
                    </td>
                    <td className="px-5 py-3">
                      <span style={{ color: "var(--color-slate)", fontSize: "var(--text-body-sm)" }}>
                        {format(new Date(tag.created_at), "MMM d, yyyy")}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex justify-between items-center mt-4">
          <span style={{ color: "var(--color-slate)", fontSize: "var(--text-body-sm)" }}>
            Page {page} of {totalPages} ({total.toLocaleString()} tags)
          </span>
          <div className="flex gap-2">
            {page > 1 && (
              <a
                href={`/admin/tags?status=${activeStatus}&page=${page - 1}`}
                className="px-3 py-1.5 rounded-md text-body-sm"
                style={{ border: "1px solid var(--color-stone)", color: "var(--color-graphite)", textDecoration: "none", fontSize: "var(--text-body-sm)" }}
              >
                Previous
              </a>
            )}
            {page < totalPages && (
              <a
                href={`/admin/tags?status=${activeStatus}&page=${page + 1}`}
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
