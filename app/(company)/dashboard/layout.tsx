import { createClient } from "@/lib/supabase/server";
import { getUser } from "@/lib/auth";
import { redirect } from "next/navigation";
import { CompanySidebar } from "@/components/company/Sidebar";
import { SuspensionGuard } from "@/components/company/SuspensionGuard";
import { createAdminClient } from "@/lib/supabase/admin";
import type { CompanyStatus } from "@/types/database";
import { getFlagsForBrand } from "@/lib/feature-flags/server";
import { FlagProvider } from "@/lib/feature-flags/client";
import type { FlagMap } from "@/lib/feature-flags/types";

export default async function CompanyLayout({ children }: { children: React.ReactNode }) {
  const user = await getUser();
  if (!user) redirect("/auth/login");

  // Admins have no company row — send them to their own area instead of
  // failing the company access gate below and landing on "Access denied".
  if (user.app_metadata?.role === "tagit_admin") redirect("/admin");

  const supabase = await createClient();

  const { data: company } = await supabase
    .from("companies")
    .select("name, logo_url, status")
    .eq("id", user.id)
    .single() as { data: { name: string; logo_url: string | null; status: CompanyStatus } | null };

  if (!company || company.status !== "approved") {
    redirect("/auth/unauthorized");
  }

  const flags: FlagMap = await getFlagsForBrand(user.id);

  // Subscription drives the sidebar plan chip + the suspension redirect.
  // Suspended for non-payment? Every dashboard page bounces to billing. Chip
  // scanning (/v/[token]) is a separate route group and is never affected.
  const { data: sub } = await createAdminClient()
    .from("subscriptions")
    .select("status, trial_ends_at, plans(name)")
    .eq("company_id", user.id)
    .maybeSingle();
  const suspended = sub?.status === "suspended";
  const subRow = sub as { status: string; trial_ends_at: string | null; plans: { name: string } | null } | null;
  const billing = subRow
    ? { status: subRow.status, planName: subRow.plans?.name ?? "Plan", trialEndsAt: subRow.trial_ends_at }
    : null;

  return (
    <FlagProvider flags={flags}>
      <SuspensionGuard suspended={suspended} />
      <div className="flex h-screen overflow-hidden" style={{ backgroundColor: "#1C1A14" }}>
        <CompanySidebar companyName={company.name} logoUrl={company.logo_url} billing={billing} />
        <div className="flex-1 flex flex-col min-w-0 overflow-hidden rounded-tl-xl rounded-bl-xl" style={{ backgroundColor: "var(--color-smoke)" }}>
          <main className="flex-1 overflow-y-auto bg-dot-grid">
            {children}
          </main>
        </div>
      </div>
    </FlagProvider>
  );
}
