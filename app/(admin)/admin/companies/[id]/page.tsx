import { createClient } from "@/lib/supabase/server";
import { notFound } from "next/navigation";
import Link from "next/link";
import { format } from "date-fns";
import { ChevronLeft, Package } from "lucide-react";
import Image from "next/image";
import type { CompanyStatus, Industry } from "@/types/database";
import ReviewActions from "./ReviewActions";

type Company = {
  id: string;
  name: string;
  email: string;
  industry: Industry;
  status: CompanyStatus;
  brand_story: string | null;
  logo_url: string | null;
  created_at: string;
  approved_at: string | null;
};

const STATUS_STYLES: Record<CompanyStatus, { bg: string; color: string; label: string }> = {
  pending:   { bg: "var(--color-soft-gold)",  color: "var(--color-deep-gold)", label: "Pending review" },
  approved:  { bg: "#ECFDF5",                 color: "#065F46",                label: "Approved" },
  rejected:  { bg: "#FEF2F2",                 color: "#991B1B",                label: "Rejected" },
  suspended: { bg: "#F3F4F6",                 color: "#374151",                label: "Suspended" },
};

const INDUSTRY_LABELS: Record<Industry, string> = {
  fashion:      "Fashion & Apparel",
  arts:         "Art & Photography",
  collectibles: "Collectibles & Memorabilia",
  restaurants:  "Restaurants & Hospitality",
  hotels:       "Hotels & Luxury Stays",
};

export default async function CompanyDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();

  const [{ data }, { data: productsData }] = await Promise.all([
    supabase.from("companies")
      .select("id, name, email, industry, status, brand_story, logo_url, created_at, approved_at")
      .eq("id", id)
      .single(),
    supabase.from("products")
      .select("id, name, retail_price, currency, created_at, photos, tags(short_id, status)")
      .eq("company_id", id)
      .order("created_at", { ascending: false }),
  ]);

  const company = data as Company | null;
  if (!company) notFound();

  const products = (productsData ?? []) as {
    id: string;
    name: string;
    retail_price: number | null;
    currency: string;
    created_at: string;
    photos: string[];
    tags: { short_id: string; status: string } | null;
  }[];

  const s = STATUS_STYLES[company.status];

  return (
    <div className="p-8 max-w-3xl mx-auto">
      {/* Back */}
      <Link
        href="/admin/companies"
        className="inline-flex items-center gap-1.5 mb-8"
        style={{ color: "var(--color-slate)", fontSize: "var(--text-body-sm)", textDecoration: "none" }}
      >
        <ChevronLeft size={14} />
        All companies
      </Link>

      {/* Header */}
      <div className="flex items-start justify-between mb-8">
        <div>
          <h1 className="text-h2 font-semibold" style={{ color: "var(--color-charcoal)" }}>
            {company.name}
          </h1>
          <p className="mt-1" style={{ color: "var(--color-slate)", fontSize: "var(--text-body-sm)" }}>
            {company.email}
          </p>
        </div>
        <span
          className="px-3 py-1.5 rounded-full text-body-sm font-medium"
          style={{ backgroundColor: s.bg, color: s.color }}
        >
          {s.label}
        </span>
      </div>

      {/* Details card */}
      <div
        className="rounded-xl p-6 mb-6"
        style={{ backgroundColor: "var(--color-pearl)", border: "1px solid var(--color-cream)", boxShadow: "var(--shadow-sm)" }}
      >
        <h2 className="text-body font-semibold mb-4" style={{ color: "var(--color-charcoal)" }}>
          Application details
        </h2>
        <dl className="space-y-3">
          {[
            { label: "Industry",     value: INDUSTRY_LABELS[company.industry] },
            { label: "Applied",      value: format(new Date(company.created_at), "MMMM d, yyyy 'at' HH:mm") },
            { label: "Company ID",   value: company.id },
            ...(company.approved_at
              ? [{ label: "Approved", value: format(new Date(company.approved_at), "MMMM d, yyyy") }]
              : []),
          ].map(({ label, value }) => (
            <div key={label} className="flex gap-4">
              <dt
                className="w-28 shrink-0 text-body-sm font-medium"
                style={{ color: "var(--color-slate)" }}
              >
                {label}
              </dt>
              <dd
                className="text-body-sm font-mono"
                style={{ color: "var(--color-charcoal)", fontFamily: label === "Company ID" ? "var(--font-jetbrains-mono)" : "inherit" }}
              >
                {value}
              </dd>
            </div>
          ))}
        </dl>

        {company.brand_story && (
          <div className="mt-5 pt-5" style={{ borderTop: "1px solid var(--color-cream)" }}>
            <p className="text-body-sm font-medium mb-2" style={{ color: "var(--color-slate)" }}>
              Brand story
            </p>
            <p style={{ color: "var(--color-graphite)", fontSize: "var(--text-body-sm)", lineHeight: 1.6 }}>
              {company.brand_story}
            </p>
          </div>
        )}
      </div>

      {/* Products */}
      <div
        className="rounded-xl overflow-hidden mb-6"
        style={{ backgroundColor: "var(--color-pearl)", border: "1px solid var(--color-cream)", boxShadow: "var(--shadow-sm)" }}
      >
        <div className="flex items-center justify-between px-6 py-4" style={{ borderBottom: "1px solid var(--color-cream)" }}>
          <h2 className="text-body font-semibold" style={{ color: "var(--color-charcoal)" }}>
            Products
          </h2>
          <span className="text-caption" style={{ color: "var(--color-slate)" }}>
            {products.length} registered
          </span>
        </div>
        {products.length === 0 ? (
          <div className="py-10 text-center" style={{ color: "var(--color-mist)" }}>
            <Package size={24} className="mx-auto mb-2 opacity-30" />
            <p style={{ fontSize: "var(--text-body-sm)" }}>No products registered yet</p>
          </div>
        ) : (
          <table className="w-full">
            <thead>
              <tr style={{ backgroundColor: "var(--color-smoke)", borderBottom: "1px solid var(--color-cream)" }}>
                {["Product", "Tag ID", "Status", "Price", "Registered"].map((h) => (
                  <th key={h} className="text-left px-5 py-3 text-micro font-medium uppercase tracking-wider" style={{ color: "var(--color-slate)" }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {products.map((p, i) => (
                <tr key={p.id} style={{ borderBottom: i < products.length - 1 ? "1px solid var(--color-cream)" : "none" }}>
                  <td className="px-5 py-3">
                    <div className="flex items-center gap-3">
                      {p.photos?.[0] ? (
                        <Image src={p.photos[0]} alt="" width={36} height={36} style={{ borderRadius: "4px", objectFit: "cover", border: "1px solid var(--color-cream)", flexShrink: 0 }} />
                      ) : (
                        <div style={{ width: "36px", height: "36px", borderRadius: "4px", backgroundColor: "var(--color-linen)", flexShrink: 0 }} />
                      )}
                      <span className="font-medium" style={{ fontSize: "var(--text-body-sm)", color: "var(--color-charcoal)" }}>{p.name}</span>
                    </div>
                  </td>
                  <td className="px-5 py-3">
                    <span style={{ fontFamily: "var(--font-jetbrains-mono)", fontSize: "var(--text-body-sm)", color: "var(--color-graphite)", letterSpacing: "0.05em" }}>
                      {p.tags?.short_id ?? "—"}
                    </span>
                  </td>
                  <td className="px-5 py-3">
                    <span className="px-2 py-0.5 rounded-full text-micro font-medium capitalize" style={{ backgroundColor: p.tags?.status === "owned" ? "var(--color-verified-tint)" : "var(--color-soft-gold)", color: p.tags?.status === "owned" ? "var(--color-verified)" : "var(--color-deep-gold)" }}>
                      {p.tags?.status?.replace(/_/g, " ") ?? "—"}
                    </span>
                  </td>
                  <td className="px-5 py-3" style={{ fontSize: "var(--text-body-sm)", color: "var(--color-graphite)" }}>
                    {p.retail_price ? `${p.currency} ${p.retail_price.toLocaleString()}` : "—"}
                  </td>
                  <td className="px-5 py-3" style={{ fontSize: "var(--text-body-sm)", color: "var(--color-slate)" }}>
                    {format(new Date(p.created_at), "MMM d, yyyy")}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Actions */}
      {company.status === "pending" && (
        <div
          className="rounded-xl p-6"
          style={{ backgroundColor: "var(--color-pearl)", border: "1px solid var(--color-cream)", boxShadow: "var(--shadow-sm)" }}
        >
          <h2 className="text-body font-semibold mb-1" style={{ color: "var(--color-charcoal)" }}>
            Review application
          </h2>
          <p className="mb-5 text-body-sm" style={{ color: "var(--color-slate)" }}>
            Approving will create the company&apos;s dashboard access. Rejecting will notify them by email.
          </p>
          <ReviewActions companyId={company.id} />
        </div>
      )}
    </div>
  );
}
