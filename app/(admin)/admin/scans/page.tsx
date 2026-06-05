export const dynamic = "force-dynamic";

import { createClient, createServiceClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { format } from "date-fns";
import { ScanLine, Globe } from "lucide-react";
import { Suspense } from "react";
import SearchInput from "@/components/ui/SearchInput";

type ScanLog = {
  id: string;
  created_at: string;
  scan_result: string;
  ip_address: string | null;
  user_agent: string | null;
  tags: { short_id: string; company_id: string } | null;
};

const PER_PAGE = 25;

const RESULT_BADGE: Record<string, { bg: string; color: string }> = {
  valid:        { bg: "var(--color-verified-tint)", color: "var(--color-verified)" },
  invalid_hmac: { bg: "var(--color-alert-tint)",   color: "var(--color-alert)" },
};

export default async function AdminScansPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; page?: string; result?: string }>;
}) {
  // Auth check must use the cookie-based client — the service-role client has no
  // user session, so getUser() there is always null and would bounce every admin
  // out to /control/signin. Data queries below still use the service client to
  // bypass RLS.
  const authClient = await createClient();
  const { data: { user } } = await authClient.auth.getUser();
  if (!user || user.app_metadata?.role !== "tagit_admin") redirect("/control/signin");

  const supabase = createServiceClient();

  const params = await searchParams;
  const q = params.q?.trim() ?? "";
  const resultFilter = params.result ?? "all";
  const page = Math.max(1, parseInt(params.page ?? "1", 10));
  const from = (page - 1) * PER_PAGE;
  const to = from + PER_PAGE - 1;

  let query = supabase
    .from("scan_logs")
    .select("id, created_at, scan_result, ip_address, user_agent, tags(short_id, company_id)", { count: "exact" })
    .order("created_at", { ascending: false })
    .range(from, to);

  if (resultFilter !== "all") query = query.eq("scan_result", resultFilter);

  const { data, count } = await query;
  const logs = (data ?? []) as ScanLog[];
  const totalPages = Math.ceil((count ?? 0) / PER_PAGE);

  // Fetch company names for company_ids appearing in this page
  const companyIds = [...new Set(logs.map((l) => l.tags?.company_id).filter(Boolean))] as string[];
  const { data: companiesData } = companyIds.length
    ? await supabase.from("companies").select("id, name").in("id", companyIds)
    : { data: [] };

  const companyNames = Object.fromEntries(
    ((companiesData ?? []) as { id: string; name: string }[]).map((c) => [c.id, c.name])
  );

  // Filter by search term client-side on short_id or company name (small page set)
  const filtered = q
    ? logs.filter((l) => {
        const shortId = l.tags?.short_id?.toLowerCase() ?? "";
        const company = companyNames[l.tags?.company_id ?? ""]?.toLowerCase() ?? "";
        const qLow = q.toLowerCase();
        return shortId.includes(qLow) || company.includes(qLow);
      })
    : logs;

  const RESULT_FILTERS = ["all", "valid", "invalid_hmac"];

  return (
    <div className="p-8 max-w-6xl mx-auto">
      <div className="mb-8">
        <h1 className="text-h2 font-semibold" style={{ color: "var(--color-charcoal)" }}>
          Scan Logs
        </h1>
        <p className="mt-1" style={{ color: "var(--color-slate)", fontSize: "var(--text-body-sm)" }}>
          {(count ?? 0).toLocaleString()} total scans recorded
        </p>
      </div>

      {/* Search + filter */}
      <div className="flex flex-wrap items-center gap-3 mb-6">
        <Suspense>
          <SearchInput placeholder="Search tag ID or company…" />
        </Suspense>
        <div className="flex gap-1 p-1 rounded-lg" style={{ backgroundColor: "var(--color-cream)" }}>
          {RESULT_FILTERS.map((r) => (
            <a
              key={r}
              href={`/admin/scans?${new URLSearchParams({ ...(r !== "all" ? { result: r } : {}), ...(q ? { q } : {}) })}`}
              className="px-3 py-1.5 rounded-md text-caption font-medium capitalize transition-colors"
              style={{
                backgroundColor: resultFilter === r ? "var(--color-pearl)" : "transparent",
                color: resultFilter === r ? "var(--color-charcoal)" : "var(--color-slate)",
                boxShadow: resultFilter === r ? "var(--shadow-sm)" : "none",
                textDecoration: "none",
                whiteSpace: "nowrap",
              }}
            >
              {r.replace("_", " ")}
            </a>
          ))}
        </div>
      </div>

      <div
        className="rounded-xl overflow-hidden"
        style={{ border: "1px solid var(--color-cream)", boxShadow: "var(--shadow-sm)" }}
      >
        {filtered.length === 0 ? (
          <div className="py-16 text-center" style={{ color: "var(--color-mist)" }}>
            <ScanLine size={32} className="mx-auto mb-3 opacity-30" />
            <p style={{ fontSize: "var(--text-body-sm)" }}>
              {q ? `No scans matching "${q}"` : "No scans recorded yet"}
            </p>
          </div>
        ) : (
          <>
            <table className="w-full">
              <thead>
                <tr style={{ backgroundColor: "var(--color-smoke)", borderBottom: "1px solid var(--color-cream)" }}>
                  {["Time", "Tag", "Company", "Result", "IP Address", "Client"].map((h) => (
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
                {filtered.map((log, i) => {
                  const badge = RESULT_BADGE[log.scan_result] ?? { bg: "var(--color-linen)", color: "var(--color-slate)" };
                  const companyName = companyNames[log.tags?.company_id ?? ""] ?? "—";
                  const ua = log.user_agent ?? "";
                  const isMobile = /mobile|android|iphone/i.test(ua);
                  const browser = ua.includes("Chrome") ? "Chrome" : ua.includes("Safari") ? "Safari" : ua.includes("Firefox") ? "Firefox" : "Other";

                  return (
                    <tr
                      key={log.id}
                      style={{
                        backgroundColor: "var(--color-pearl)",
                        borderBottom: i < filtered.length - 1 ? "1px solid var(--color-cream)" : "none",
                      }}
                    >
                      <td className="px-5 py-3">
                        <span style={{ fontSize: "var(--text-body-sm)", color: "var(--color-slate)" }}>
                          {format(new Date(log.created_at), "MMM d, HH:mm")}
                        </span>
                      </td>
                      <td className="px-5 py-3">
                        <span style={{ fontFamily: "var(--font-jetbrains-mono)", fontSize: "var(--text-body-sm)", color: "var(--color-charcoal)", letterSpacing: "0.05em" }}>
                          {log.tags?.short_id ?? "—"}
                        </span>
                      </td>
                      <td className="px-5 py-3">
                        <span style={{ fontSize: "var(--text-body-sm)", color: "var(--color-graphite)" }}>
                          {companyName}
                        </span>
                      </td>
                      <td className="px-5 py-3">
                        <span
                          className="px-2 py-0.5 rounded-full text-micro font-medium capitalize"
                          style={{ backgroundColor: badge.bg, color: badge.color }}
                        >
                          {log.scan_result.replace(/_/g, " ")}
                        </span>
                      </td>
                      <td className="px-5 py-3">
                        <div className="flex items-center gap-1.5">
                          <Globe size={12} style={{ color: "var(--color-mist)", flexShrink: 0 }} />
                          <span style={{ fontSize: "var(--text-caption)", color: "var(--color-slate)", fontFamily: "var(--font-jetbrains-mono)" }}>
                            {log.ip_address ?? "—"}
                          </span>
                        </div>
                      </td>
                      <td className="px-5 py-3">
                        <span style={{ fontSize: "var(--text-caption)", color: "var(--color-slate)" }}>
                          {browser}{isMobile ? " · Mobile" : " · Desktop"}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>

            {totalPages > 1 && (
              <div
                className="flex items-center justify-between px-5 py-3"
                style={{ borderTop: "1px solid var(--color-cream)", backgroundColor: "var(--color-smoke)" }}
              >
                <p style={{ fontSize: "var(--text-caption)", color: "var(--color-slate)" }}>
                  Page {page} of {totalPages} · {(count ?? 0).toLocaleString()} total scans
                </p>
                <div className="flex gap-2">
                  {page > 1 && (
                    <a
                      href={`/admin/scans?${new URLSearchParams({ ...(resultFilter !== "all" ? { result: resultFilter } : {}), ...(q ? { q } : {}), page: String(page - 1) })}`}
                      className="px-3 py-1.5 rounded-lg text-caption font-medium"
                      style={{ backgroundColor: "var(--color-linen)", color: "var(--color-graphite)", textDecoration: "none" }}
                    >
                      Previous
                    </a>
                  )}
                  {page < totalPages && (
                    <a
                      href={`/admin/scans?${new URLSearchParams({ ...(resultFilter !== "all" ? { result: resultFilter } : {}), ...(q ? { q } : {}), page: String(page + 1) })}`}
                      className="px-3 py-1.5 rounded-lg text-caption font-medium"
                      style={{ backgroundColor: "var(--color-linen)", color: "var(--color-graphite)", textDecoration: "none" }}
                    >
                      Next
                    </a>
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
