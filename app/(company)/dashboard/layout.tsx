import { createClient } from "@/lib/supabase/server";
import { getUser } from "@/lib/auth";
import { redirect } from "next/navigation";
import { CompanySidebar } from "@/components/company/Sidebar";
import type { CompanyStatus } from "@/types/database";

export default async function CompanyLayout({ children }: { children: React.ReactNode }) {
  const user = await getUser();
  if (!user) redirect("/auth/login");

  const supabase = await createClient();

  const { data: company } = await supabase
    .from("companies")
    .select("name, logo_url, status")
    .eq("id", user.id)
    .single() as { data: { name: string; logo_url: string | null; status: CompanyStatus } | null };

  if (!company || company.status !== "approved") {
    redirect("/auth/unauthorized");
  }

  return (
    <div className="flex h-screen overflow-hidden" style={{ backgroundColor: "#1C1A14" }}>
      <CompanySidebar companyName={company.name} logoUrl={company.logo_url} />
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden rounded-tl-xl rounded-bl-xl" style={{ backgroundColor: "var(--color-smoke)" }}>
        <main className="flex-1 overflow-y-auto bg-dot-grid">
          {children}
        </main>
      </div>
    </div>
  );
}
