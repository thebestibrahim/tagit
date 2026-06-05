import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import Link from "next/link";
import { ChevronLeft } from "lucide-react";
import ProductForm from "./ProductForm";
import type { CompanyStatus } from "@/types/database";

export default async function NewProductPage() {
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
          Register product
        </h1>
        <p className="mt-1" style={{ color: "var(--color-slate)", fontSize: "var(--text-body-sm)" }}>
          Link a tag or card to a product and fill in its authenticity details.
        </p>
      </div>

      <ProductForm tags={tags} cards={cards} industry={company.industry} companyId={company.id} />
    </div>
  );
}
