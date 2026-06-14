import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { getUser } from "@/lib/auth";
import { redirect } from "next/navigation";
import { formatCurrency } from "@/lib/billing/pricing";
import Link from "next/link";
import { Plus, Package } from "lucide-react";
import { Suspense } from "react";
import SearchInput from "@/components/ui/SearchInput";
import ClickableRow from "./ClickableRow";
import ProductRowActions from "./ProductRowActions";
import BrandPageSection from "./BrandPageSection";
import LocalTime from "@/components/ui/LocalTime";

const STATUS_FILTERS = ["all", "live", "owned", "transferred", "flagged"];

type Product = {
  id: string;
  name: string;
  retail_price: number | null;
  currency: string;
  created_at: string;
  tags: { short_id: string; status: string; token: string }[];
};

const PER_PAGE = 15;

export default async function ProductsPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; status?: string; page?: string }>;
}) {
  const supabase = await createClient();
  const user = await getUser();
  if (!user) redirect("/auth/login");

  const params = await searchParams;
  const q = params.q?.trim() ?? "";
  const statusFilter = STATUS_FILTERS.includes(params.status ?? "") ? params.status : "all";
  const page = Math.max(1, parseInt(params.page ?? "1", 10));
  const from = (page - 1) * PER_PAGE;
  const to = from + PER_PAGE - 1;

  let query = supabase
    .from("products")
    .select("id, name, retail_price, currency, created_at, tags(short_id, status, token)", { count: "exact" })
    .eq("company_id", user.id)
    .order("created_at", { ascending: false })
    .range(from, to);

  if (q) query = query.ilike("name", `%${q}%`);

  const { data, count } = await query;
  const products = (data ?? []) as Product[];
  const totalPages = Math.ceil((count ?? 0) / PER_PAGE);

  // Public brand-page settings (server-side, scoped to this brand).
  const { data: pageSettings } = await createAdminClient()
    .from("companies")
    .select("slug, page_bio, page_enabled")
    .eq("id", user.id)
    .single();

  // A product can be linked to several tags (each with its own link); match the
  // status filter if ANY of its tags is in that status.
  const filtered = statusFilter && statusFilter !== "all"
    ? products.filter((p) => p.tags.some((t) => t.status === statusFilter))
    : products;

  function buildHref(overrides: Record<string, string | undefined>) {
    const p = new URLSearchParams();
    const merged = { q: q || undefined, status: statusFilter !== "all" ? statusFilter : undefined, page: page > 1 ? String(page) : undefined, ...overrides };
    Object.entries(merged).forEach(([k, v]) => { if (v) p.set(k, v); });
    const s = p.toString();
    return `/dashboard/products${s ? `?${s}` : ""}`;
  }

  const tagStatusColor = (status: string) => {
    if (status === "owned" || status === "transferred") return { bg: "#ECFDF5", color: "#065F46" };
    if (status === "live") return { bg: "var(--color-soft-gold)", color: "var(--color-deep-gold)" };
    if (status === "flagged") return { bg: "var(--color-alert-tint)", color: "var(--color-alert)" };
    return { bg: "var(--color-linen)", color: "var(--color-slate)" };
  };

  return (
    <div className="p-8 max-w-5xl mx-auto">
      <div className="flex items-start justify-between mb-8">
        <div>
          <h1 className="text-h2 font-semibold" style={{ color: "var(--color-charcoal)" }}>Products</h1>
          <p className="mt-1" style={{ color: "var(--color-slate)", fontSize: "var(--text-body-sm)" }}>
            {count ?? 0} registered product{(count ?? 0) !== 1 ? "s" : ""}
          </p>
        </div>
        <Link
          href="/dashboard/products/new"
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg font-medium"
          style={{ backgroundColor: "var(--color-onyx)", color: "var(--color-pearl)", textDecoration: "none", fontSize: "var(--text-body-sm)" }}
        >
          <Plus size={14} />
          Register product
        </Link>
      </div>

      <BrandPageSection
        initialSlug={pageSettings?.slug ?? null}
        initialBio={pageSettings?.page_bio ?? null}
        initialEnabled={pageSettings?.page_enabled ?? false}
      />

      {/* Search + filter bar */}
      <div className="flex flex-wrap items-center gap-3 mb-5">
        <Suspense>
          <SearchInput placeholder="Search products…" />
        </Suspense>
        <div className="flex gap-1 p-1 rounded-lg" style={{ backgroundColor: "var(--color-linen)" }}>
          {STATUS_FILTERS.map((s) => (
            <Link
              key={s}
              href={buildHref({ status: s === "all" ? undefined : s, page: undefined })}
              className="px-3 py-1.5 rounded-md text-caption font-medium capitalize transition-colors"
              style={{
                backgroundColor: statusFilter === s ? "var(--color-pearl)" : "transparent",
                color: statusFilter === s ? "var(--color-charcoal)" : "var(--color-slate)",
                boxShadow: statusFilter === s ? "var(--shadow-sm)" : "none",
                textDecoration: "none",
                whiteSpace: "nowrap",
              }}
            >
              {s.replace(/_/g, " ")}
            </Link>
          ))}
        </div>
      </div>

      <div className="rounded-xl overflow-hidden" style={{ border: "1px solid var(--color-cream)", boxShadow: "var(--shadow-sm)" }}>
        {filtered.length === 0 ? (
          <div className="py-16 text-center" style={{ color: "var(--color-mist)" }}>
            <Package size={32} className="mx-auto mb-3 opacity-30" />
            <p style={{ fontSize: "var(--text-body-sm)" }}>
              {q ? `No products matching "${q}"` : "No products found"}
            </p>
            {!q && (
              <Link href="/dashboard/products/new" className="mt-3 inline-block" style={{ color: "var(--color-graphite)", fontSize: "var(--text-body-sm)", textDecoration: "underline" }}>
                Register your first product →
              </Link>
            )}
          </div>
        ) : (
          <>
            <div className="overflow-x-auto"><table className="w-full">
              <thead>
                <tr style={{ backgroundColor: "var(--color-smoke)", borderBottom: "1px solid var(--color-cream)" }}>
                  {["Product", "Tag ID", "Tag status", "Price", "Registered", ""].map((h) => (
                    <th key={h} className="text-left px-5 py-3 text-micro font-medium uppercase tracking-wider" style={{ color: "var(--color-slate)" }}>
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.map((product, i) => {
                  const badge = tagStatusColor(product.tags[0]?.status ?? "");
                  const scanUrl = product.tags[0]?.token
                    ? `${process.env.NEXT_PUBLIC_APP_URL ?? ""}/v/${product.tags[0].token}`
                    : null;

                  return (
                    <ClickableRow
                      key={product.id}
                      href={`/dashboard/products/${product.id}`}
                      borderBottom={i < filtered.length - 1 ? "1px solid var(--color-cream)" : "none"}
                    >
                      <td className="px-5 py-4">
                        <Link
                          href={`/dashboard/products/${product.id}`}
                          className="font-medium hover:underline"
                          style={{ color: "var(--color-charcoal)", fontSize: "var(--text-body-sm)", textDecoration: "none", display: "block" }}
                        >
                          {product.name}
                        </Link>
                      </td>
                      <td className="px-5 py-4">
                        <span style={{ fontFamily: "var(--font-jetbrains-mono)", fontSize: "var(--text-body-sm)", color: "var(--color-graphite)", letterSpacing: "0.05em" }}>
                          {product.tags[0]?.short_id ?? "—"}
                          {product.tags.length > 1 && (
                            <span style={{ color: "var(--color-mist)", letterSpacing: 0 }}> +{product.tags.length - 1} more</span>
                          )}
                        </span>
                      </td>
                      <td className="px-5 py-4">
                        <span
                          className="px-2 py-0.5 rounded-full text-micro font-medium capitalize"
                          style={{ backgroundColor: badge.bg, color: badge.color }}
                        >
                          {product.tags[0]?.status?.replace(/_/g, " ") ?? "—"}
                        </span>
                      </td>
                      <td className="px-5 py-4">
                        <span style={{ color: "var(--color-graphite)", fontSize: "var(--text-body-sm)" }}>
                          {product.retail_price != null
                            ? formatCurrency(product.retail_price, product.currency)
                            : "—"}
                        </span>
                      </td>
                      <td className="px-5 py-4">
                        <span style={{ color: "var(--color-slate)", fontSize: "var(--text-body-sm)" }}>
                          {<LocalTime iso={product.created_at} pattern="MMM d, yyyy" />}
                        </span>
                      </td>
                      <td className="px-5 py-4">
                        <div className="flex items-center justify-end">
                          <ProductRowActions productId={product.id} scanUrl={scanUrl} />
                        </div>
                      </td>
                    </ClickableRow>
                  );
                })}
              </tbody>
            </table></div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex items-center justify-between px-5 py-3" style={{ borderTop: "1px solid var(--color-cream)", backgroundColor: "var(--color-smoke)" }}>
                <p style={{ fontSize: "var(--text-caption)", color: "var(--color-slate)" }}>
                  Page {page} of {totalPages} · {count} total
                </p>
                <div className="flex gap-2">
                  {page > 1 && (
                    <Link href={buildHref({ page: String(page - 1) })} className="px-3 py-1.5 rounded-lg text-caption font-medium" style={{ backgroundColor: "var(--color-linen)", color: "var(--color-graphite)", textDecoration: "none" }}>
                      Previous
                    </Link>
                  )}
                  {page < totalPages && (
                    <Link href={buildHref({ page: String(page + 1) })} className="px-3 py-1.5 rounded-lg text-caption font-medium" style={{ backgroundColor: "var(--color-linen)", color: "var(--color-graphite)", textDecoration: "none" }}>
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
