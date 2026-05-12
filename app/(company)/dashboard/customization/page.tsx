import { createClient } from "@/lib/supabase/server";
import { getUser } from "@/lib/auth";
import { redirect } from "next/navigation";
import CustomizationForm from "./CustomizationForm";

type Company = {
  name: string;
  brand_primary_color: string;
  brand_secondary_color: string;
  brand_accent_color: string;
  brand_font: string;
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
    .select("name, brand_primary_color, brand_secondary_color, brand_accent_color, brand_font, brand_story, custom_header_text, social_links")
    .eq("id", user.id)
    .single();

  const company = data as Company | null;
  if (!company) redirect("/auth/unauthorized");

  return (
    <div className="p-8 max-w-3xl mx-auto">
      <div className="mb-8">
        <h1 className="text-h2 font-semibold" style={{ color: "var(--color-charcoal)" }}>
          Brand customization
        </h1>
        <p className="mt-1" style={{ color: "var(--color-slate)", fontSize: "var(--text-body-sm)" }}>
          Customize how your brand appears on consumer scan pages.
        </p>
      </div>

      <CustomizationForm company={company} />
    </div>
  );
}
