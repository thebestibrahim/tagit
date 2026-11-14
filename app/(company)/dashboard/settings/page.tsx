import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { getUser } from "@/lib/auth";
import { redirect } from "next/navigation";
import type { CompanyStatus, CustomDomain } from "@/types/database";
import { getCurrentBrandFlags } from "@/lib/feature-flags/server";
import SettingsForm, { SettingsSection } from "./SettingsForm";
import { CustomDomainSection } from "./CustomDomainSection";

export default async function SettingsPage() {
  const supabase = await createClient();
  const user = await getUser();
  if (!user) redirect("/auth/login");

  const { data } = await supabase
    .from("companies")
    .select("name, email, logo_url, status, industry, created_at")
    .eq("id", user.id)
    .single();

  const company = data as {
    name: string;
    email: string;
    logo_url: string | null;
    status: CompanyStatus;
    industry: string | null;
    created_at: string | null;
  } | null;
  if (!company || company.status !== "approved") redirect("/auth/unauthorized");

  const admin = createAdminClient();
  // The slug is read server-side with the service client, the same way the
  // Products page reads brand-page settings.
  const [flags, { data: domainRow }, { data: pageRow }] = await Promise.all([
    getCurrentBrandFlags(),
    admin.from("custom_domains").select("*").eq("company_id", user.id).maybeSingle(),
    admin.from("companies").select("slug").eq("id", user.id).maybeSingle(),
  ]);

  const currentDomain = (domainRow as CustomDomain | null) ?? null;

  return (
    <div className="p-5 sm:p-8 max-w-4xl mx-auto">
      <div className="page-header">
        <h1 className="page-title">Settings</h1>
        <p className="page-desc">Your house&apos;s details, how you sign in, and the address of your brand page.</p>
      </div>

      <SettingsForm
        initialName={company.name}
        email={user.email ?? company.email}
        logoUrl={company.logo_url}
        industry={company.industry}
        memberSince={company.created_at}
      />

      <SettingsSection
        title="Your domain"
        description={
          flags.custom_domain
            ? "Serve your brand page from your own web address, like verify.yourbrand.com."
            : "Serve your brand page from your own web address. Available on the Atelier plan and above."
        }
      >
        <CustomDomainSection enabled={flags.custom_domain} initialDomain={currentDomain} slug={(pageRow as { slug: string | null } | null)?.slug ?? null} />
      </SettingsSection>
    </div>
  );
}
