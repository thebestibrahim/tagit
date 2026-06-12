import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { AdminSidebar } from "@/components/admin/Sidebar";
import { MobileNav } from "@/components/layout/MobileNav";
import { getAdminNavAlerts } from "@/lib/nav-alerts";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  // No session at all -> staff login. A logged-in non-admin (a brand) ->
  // their own dashboard, not the staff login page (which would look broken
  // to someone who is already signed in).
  if (!user) {
    redirect("/control/signin");
  }
  if (user.app_metadata?.role !== "tagit_admin") {
    redirect("/dashboard");
  }

  const alerts = await getAdminNavAlerts();

  return (
    <div className="flex h-screen overflow-hidden" style={{ backgroundColor: "#1C1A14" }}>
      <div className="hidden lg:flex shrink-0">
        <AdminSidebar alerts={alerts} />
      </div>
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden lg:rounded-tl-xl lg:rounded-bl-xl" style={{ backgroundColor: "var(--color-smoke)" }}>
        <MobileNav label="Tagit · Admin">
          <AdminSidebar alerts={alerts} />
        </MobileNav>
        <main className="flex-1 overflow-y-auto bg-dot-grid">
          {children}
        </main>
      </div>
    </div>
  );
}
