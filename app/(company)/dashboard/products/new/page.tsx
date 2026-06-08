import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import Link from "next/link";
import { ChevronLeft } from "lucide-react";
import ProductForm, { type ProductDefaults } from "./ProductForm";
import type { CompanyStatus } from "@/types/database";

export default async function NewProductPage({
  searchParams,
}: {
  searchParams: Promise<{ from?: string }>;
}) {
  const { from } = await searchParams;
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/auth/login");

  const { data: companyData } = await supabase
    .from("companies")
    .select("id, industry, status")
    .eq("id", user.id)
    .single();

  const company = companyData as { id: string; industry: string; status: CompanyStatus } | null;
  if (!company || company.status !== "approved") redirect("/auth/unauthorized");

  // Duplicate flow: pre-fill the form with a source product's details (never its
  // chips — those stay with the original and must be picked fresh).
  let defaults: ProductDefaults | undefined;
  if (from) {
    const { data: src } = await supabase
      .from("products")
      .select("name, retail_price, currency, industry_fields, photos")
      .eq("id", from)
      .eq("company_id", user.id)
      .single();
    if (src) {
      const s = src as {
        name: string;
        retail_price: number | null;
        currency: string | null;
        industry_fields: Record<string, string> | null;
        photos: string[] | null;
      };
      defaults = {
        name: s.name,
        price: s.retail_price != null ? String(s.retail_price) : "",
        currency: s.currency ?? "NGN",
        fields: s.industry_fields ?? {},
        photos: s.photos ?? [],
      };
    }
  }
  const duplicating = !!defaults;

  // Only show tags/cards that belong to this company and are not yet linked to a
  // product — i.e. still `created` (not shipped) or `shipped` (no product yet).
  const { data: tagData } = await supabase
    .from("tags")
    .select("id, short_id, token, medium")
    .eq("company_id", user.id)
    .in("status", ["created", "shipped"])
    .order("created_at", { ascending: false });

  const all = (tagData ?? []) as { id: string; short_id: string; token: string; medium: string }[];
  const tags = all.filter((t) => t.medium !== "card");
  const cards = all.filter((t) => t.medium === "card");

  return (
    <div className="p-8 max-w-3xl mx-auto">
      <Link
        href="/dashboard/products"
        className="inline-flex items-center gap-1.5 mb-8"
        style={{ color: "var(--color-slate)", fontSize: "var(--text-body-sm)", textDecoration: "none" }}
      >
        <ChevronLeft size={14} />
        All products
      </Link>

      <div className="mb-8">
        <h1 className="text-h2 font-semibold" style={{ color: "var(--color-charcoal)" }}>
          {duplicating ? "Duplicate product" : "Register product"}
        </h1>
        <p className="mt-1" style={{ color: "var(--color-slate)", fontSize: "var(--text-body-sm)" }}>
          {duplicating
            ? "Details have been copied over. Select fresh tags or cards, adjust anything you need, then save."
            : "Link a tag or card to a product and fill in its authenticity details."}
        </p>
      </div>

      <ProductForm tags={tags} cards={cards} industry={company.industry} companyId={company.id} defaults={defaults} />
    </div>
  );
}
