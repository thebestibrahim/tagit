import { createServiceClient } from "@/lib/supabase/server";
import Link from "next/link";
import type { CompanyStatus, Industry } from "@/types/database";
import { Building2, ChevronRight } from "lucide-react";
import { Suspense } from "react";
import SearchInput from "@/components/ui/SearchInput";
import Pagination from "@/components/ui/Pagination";
import LocalTime from "@/components/ui/LocalTime";
import { sanitizeSearch } from "@/lib/utils";

const PER_PAGE = 25;

type Company = {
  id: string;
  name: string;
  email: string;
  industry: Industry;
  status: CompanyStatus;
  created_at: string;
};

const STATUS_STYLES: Record<CompanyStatus, { bg: string; color: string; label: string }> = {
  pending:   { bg: "var(--color-soft-gold)",  color: "var(--color-deep-gold)", label: "Pending" },
  approved:  { bg: "#ECFDF5",                 color: "#065F46",                label: "Approved" },
  rejected:  { bg: "#FEF2F2",                 color: "#991B1B",                label: "Rejected" },
  suspended: { bg: "#F3F4F6",                 color: "#374151",                label: "Suspended" },
};

const INDUSTRY_LABELS: Record<Industry, string> = {
  fashion:      "Fashion",
  arts:         "Arts",
  collectibles: "Collectibles",
  restaurants:  "Restaurants",
  hotels:       "Hotels",
};

export default async function AdminCompaniesPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string; q?: string; page?: string }>;
}) {
  const { status: filterStatus, q: rawQ, page: pageParam } = await searchParams;
  const q = sanitizeSearch(rawQ ?? "");
  const supabase = createServiceClient();

  let query = supabase
    .from("companies")
    .select("id, name, email, industry, status, created_at")
    .order("created_at", { ascending: false });

  if (q) query = query.or(`name.ilike.%${q}%,email.ilike.%${q}%`);

  const { data } = await query;
  const companies = (data ?? []) as Company[];

  const counts = {
    all: companies.length,
    pending:  companies.filter((c) => c.status === "pending").length,
    approved: companies.filter((c) => c.status === "approved").length,
    rejected: companies.filter((c) => c.status === "rejected").length,
  };

  const filtered = filterStatus && filterStatus !== "all"
    ? companies.filter((c) => c.status === filterStatus)
    : companies;

  const tabs = [
    { key: "all",      label: `All (${counts.all})` },
    { key: "pending",  label: `Pending (${counts.pending})` },
    { key: "approved", label: `Approved (${counts.approved})` },
    { key: "rejected", label: `Rejected (${counts.rejected})` },
  ];

  const activeTab = filterStatus ?? "all";

  const page = Math.max(1, parseInt(pageParam ?? "1", 10));
  const totalPages = Math.ceil(filtered.length / PER_PAGE);
  const pageRows = filtered.slice((page - 1) * PER_PAGE, (page - 1) * PER_PAGE + PER_PAGE);
  const pageHref = (p: number) => {
    const sp = new URLSearchParams();
    if (activeTab !== "all") sp.set("status", activeTab);
    if (q) sp.set("q", q);
    if (p > 1) sp.set("page", String(p));
    const qs = sp.toString();
    return qs ? `/admin/companies?${qs}` : "/admin/companies";
  };

  return (
    <div className="p-8 max-w-5xl mx-auto">
      <div className="mb-8">
        <h1 className="text-h2 font-semibold" style={{ color: "var(--color-charcoal)" }}>
          Companies
        </h1>
        <p className="mt-1" style={{ color: "var(--color-slate)", fontSize: "var(--text-body-sm)" }}>
          Manage brand partner applications and accounts
        </p>
      </div>

      {/* Search + filter */}
      <div className="flex flex-wrap items-center gap-3 mb-6">
        <Suspense>
          <SearchInput placeholder="Search by name or email…" />
        </Suspense>
        <div
          className="flex gap-1 p-1 rounded-lg"
          style={{ backgroundColor: "var(--color-cream)" }}
        >
        {tabs.map((tab) => (
          <Link
            key={tab.key}
            href={`/admin/companies?status=${tab.key}`}
            className="px-4 py-1.5 rounded-md text-body-sm font-medium transition-colors"
            style={{
              backgroundColor: activeTab === tab.key ? "var(--color-pearl)" : "transparent",
              color: activeTab === tab.key ? "var(--color-charcoal)" : "var(--color-slate)",
              fontSize: "var(--text-body-sm)",
              boxShadow: activeTab === tab.key ? "var(--shadow-sm)" : "none",
              textDecoration: "none",
            }}
          >
            {tab.label}
          </Link>
        ))}
        </div>
      </div>

      {/* Table */}
      <div
        className="rounded-xl overflow-hidden"
        style={{ border: "1px solid var(--color-cream)", boxShadow: "var(--shadow-sm)" }}
      >
        {filtered.length === 0 ? (
          <div className="py-16 text-center" style={{ color: "var(--color-mist)" }}>
            <Building2 size={32} className="mx-auto mb-3 opacity-30" />
            <p style={{ fontSize: "var(--text-body-sm)" }}>No companies found</p>
          </div>
        ) : (
          <div className="overflow-x-auto"><table className="w-full">
            <thead>
              <tr style={{ backgroundColor: "var(--color-smoke)", borderBottom: "1px solid var(--color-cream)" }}>
                {["Company", "Industry", "Status", "Applied", ""].map((h) => (
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
              {pageRows.map((company, i) => {
                const s = STATUS_STYLES[company.status];
                return (
                  <tr
                    key={company.id}
                    style={{
                      backgroundColor: "var(--color-pearl)",
                      borderBottom: i < pageRows.length - 1 ? "1px solid var(--color-cream)" : "none",
                    }}
                  >
                    <td className="px-5 py-4">
                      <p className="font-medium" style={{ color: "var(--color-charcoal)", fontSize: "var(--text-body-sm)" }}>
                        {company.name}
                      </p>
                      <p style={{ color: "var(--color-mist)", fontSize: "var(--text-caption)" }}>
                        {company.email}
                      </p>
                    </td>
                    <td className="px-5 py-4">
                      <span style={{ color: "var(--color-graphite)", fontSize: "var(--text-body-sm)" }}>
                        {INDUSTRY_LABELS[company.industry]}
                      </span>
                    </td>
                    <td className="px-5 py-4">
                      <span
                        className="px-2.5 py-1 rounded-full text-micro font-medium"
                        style={{ backgroundColor: s.bg, color: s.color }}
                      >
                        {s.label}
                      </span>
                    </td>
                    <td className="px-5 py-4">
                      <span style={{ color: "var(--color-slate)", fontSize: "var(--text-body-sm)" }}>
                        {<LocalTime iso={company.created_at} pattern="MMM d, yyyy" />}
                      </span>
                    </td>
                    <td className="px-5 py-4 text-right">
                      <Link
                        href={`/admin/companies/${company.id}`}
                        className="inline-flex items-center gap-1"
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
        <Pagination page={page} totalPages={totalPages} makeHref={pageHref} totalLabel={`${filtered.length} total`} />
      </div>
    </div>
  );
}
