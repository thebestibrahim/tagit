import { createClient } from "@/lib/supabase/server";
import { getUser } from "@/lib/auth";
import { redirect } from "next/navigation";
import type { CompanyStatus } from "@/types/database";
import SettingsForm from "./SettingsForm";

export default async function SettingsPage() {
  const supabase = await createClient();
  const user = await getUser();
  if (!user) redirect("/auth/login");

  const { data } = await supabase
    .from("companies")
    .select("name, email, logo_url, status")
    .eq("id", user.id)
    .single();

  const company = data as { name: string; email: string; logo_url: string | null; status: CompanyStatus } | null;
  if (!company || company.status !== "approved") redirect("/auth/unauthorized");

  return (
    <div className="p-8 max-w-2xl mx-auto">
      <div className="page-header mb-8">
        <p className="text-micro font-semibold uppercase tracking-widest mb-2" style={{ color: "var(--color-gold)" }}>
          Account
        </p>
        <h1 className="font-display" style={{ fontSize: "32px", color: "var(--color-charcoal)", lineHeight: 1.15, letterSpacing: "-0.02em" }}>
          Settings
        </h1>
        <p className="mt-1" style={{ color: "var(--color-slate)", fontSize: "var(--text-body-sm)" }}>
          Manage your account credentials and company profile
        </p>
      </div>

      <SettingsForm
        initialName={company.name}
        email={user.email ?? company.email}
        logoUrl={company.logo_url}
      />
    </div>
  );
}
