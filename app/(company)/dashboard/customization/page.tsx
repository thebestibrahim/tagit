import { createClient } from "@/lib/supabase/server";
import { getUser } from "@/lib/auth";
import { redirect } from "next/navigation";
import { getCurrentBrandFlags } from "@/lib/feature-flags/server";
import FeatureWall from "@/components/company/FeatureWall";
import CustomizationForm from "./CustomizationForm";

type Company = {
  name: string;
  logo_url: string | null;
  signature_url: string | null;
  brand_primary_color: string;
  brand_secondary_color: string;
  brand_accent_color: string;
  brand_text_color: string;
  brand_font: string;
  brand_template: string;
  cert_template: string;
  brand_story: string | null;
  custom_header_text: string | null;
  social_links: Record<string, string>;
};

export default async function CustomizationPage() {
  const supabase = await createClient();
  const user = await getUser();
  if (!user) redirect("/auth/login");

  const flags = await getCurrentBrandFlags();
  if (!flags.brand_customisation) {
    return (
      <FeatureWall
        name="Brand Customisation"
        description="Personalise how your brand looks on every customer scan page."
      />
    );
  }

  // brand_text_color and brand_template require docs/add-brand-fields.sql migration.
  // Select them separately so a missing column doesn't break the whole page.
  const { data } = await supabase
    .from("companies")
    .select("name, logo_url, brand_primary_color, brand_secondary_color, brand_accent_color, brand_font, brand_story, custom_header_text, social_links")
    .eq("id", user.id)
    .single();

  const { data: extData } = await supabase
    .from("companies")
    .select("brand_text_color, brand_template, cert_template, signature_url")
    .eq("id", user.id)
    .single()
    .then((r) => ({ data: r.error ? null : r.data }));

  if (!data) redirect("/auth/unauthorized");

  const ext = extData as {
    brand_text_color?: string;
    brand_template?: string;
    cert_template?: string;
    signature_url?: string | null;
  } | null;

  const company: Company = {
    ...(data as Omit<Company, "brand_text_color" | "brand_template" | "cert_template" | "signature_url">),
    brand_text_color: ext?.brand_text_color ?? "#FAFAF8",
    brand_template:   ext?.brand_template   ?? "classic",
    cert_template:    ext?.cert_template    ?? "classic",
    signature_url:    ext?.signature_url    ?? null,
  };

  return (
    <div className="p-8 max-w-5xl mx-auto">
      <div className="page-header mb-8">
        <p className="text-micro font-semibold uppercase tracking-widest mb-2" style={{ color: "var(--color-gold)" }}>
          Branding
        </p>
        <h1 className="font-display" style={{ fontSize: "32px", color: "var(--color-charcoal)", lineHeight: 1.15, letterSpacing: "-0.02em" }}>
          Brand customization
        </h1>
        <p className="mt-1" style={{ color: "var(--color-slate)", fontSize: "var(--text-body-sm)" }}>
          Control how your brand looks on every customer scan page.
        </p>
      </div>

      <CustomizationForm company={company} showExhibitions={flags.exhibitions} />
    </div>
  );
}
