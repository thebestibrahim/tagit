import { createClient } from "@/lib/supabase/server";
import { getUser } from "@/lib/auth";
import { redirect } from "next/navigation";
import CustomizationForm from "./CustomizationForm";

type Company = {
  name: string;
  logo_url: string | null;
  brand_primary_color: string;
  brand_secondary_color: string;
  brand_accent_color: string;
  brand_text_color: string;
  brand_font: string;
  brand_template: string;
  brand_story: string | null;
  custom_header_text: string | null;
  social_links: Record<string, string>;
};

export default async function CustomizationPage() {
  const supabase = await createClient();
  const user = await getUser();
  if (!user) redirect("/auth/login");

  const { data } = await supabase
    .from("companies")
    .select("name, logo_url, brand_primary_color, brand_secondary_color, brand_accent_color, brand_text_color, brand_font, brand_template, brand_story, custom_header_text, social_links")
    .eq("id", user.id)
    .single();

  const company = data as Company | null;
  if (!company) redirect("/auth/unauthorized");

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

      <CustomizationForm company={company} />
    </div>
  );
}
