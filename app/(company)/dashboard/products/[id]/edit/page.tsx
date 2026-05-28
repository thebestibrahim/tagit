import { createClient } from "@/lib/supabase/server";
import { getUser } from "@/lib/auth";
import { redirect, notFound } from "next/navigation";
import Link from "next/link";
import { ChevronLeft } from "lucide-react";
import EditProductForm from "./EditProductForm";
import type { CompanyStatus } from "@/types/database";

export default async function EditProductPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const user = await getUser();
  if (!user) redirect("/auth/login");

  const supabase = await createClient();

  const { data: companyData } = await supabase
    .from("companies")
    .select("id, industry, status")
    .eq("id", user.id)
    .single();

  const company = companyData as { id: string; industry: string; status: CompanyStatus } | null;
  if (!company || company.status !== "approved") redirect("/auth/unauthorized");

  const [{ data: productData }, { data: linkedTagsData }] = await Promise.all([
    supabase
      .from("products")
      .select("id, name, retail_price, currency, industry_fields, photos")
      .eq("id", id)
      .eq("company_id", user.id)
      .single(),
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (supabase as any)
      .from("tags")
      .select("id, short_id")
      .eq("product_id", id),
  ]);

  if (!productData) notFound();

  const product = productData as {
    id: string;
    name: string;
    retail_price: number | null;
    currency: string;
    industry_fields: Record<string, string>;
    photos: string[];
  };

  const linkedTags = (linkedTagsData ?? []) as { id: string; short_id: string }[];

  return (
    <div className="p-8 max-w-3xl mx-auto">
      <Link
        href={`/dashboard/products/${id}`}
        className="inline-flex items-center gap-1.5 mb-8"
        style={{ color: "var(--color-slate)", fontSize: "var(--text-body-sm)", textDecoration: "none" }}
      >
        <ChevronLeft size={14} />
        Back to product
      </Link>

      <div className="page-header mb-8">
        <p className="text-micro font-semibold uppercase tracking-widest mb-2" style={{ color: "var(--color-gold)" }}>
          Edit
        </p>
        <h1 className="font-display" style={{ fontSize: "32px", color: "var(--color-charcoal)", lineHeight: 1.15, letterSpacing: "-0.02em" }}>
          {product.name}
        </h1>
        {linkedTags.length > 0 && (
          <p className="mt-1" style={{ color: "var(--color-slate)", fontSize: "var(--text-body-sm)", fontFamily: "var(--font-mono)" }}>
            {linkedTags.length === 1 ? `Tag ${linkedTags[0].short_id}` : `Tags: ${linkedTags.map((t) => t.short_id).join(", ")}`}
          </p>
        )}
      </div>

      <EditProductForm
        product={product}
        industry={company.industry}
        companyId={company.id}
      />
    </div>
  );
}
