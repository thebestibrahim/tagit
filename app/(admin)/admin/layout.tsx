import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { AdminSidebar } from "@/components/admin/Sidebar";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user || user.app_metadata?.role !== "tagit_admin") {
    redirect("/control/signin");
  }

  return (
    <div className="flex h-screen overflow-hidden" style={{ backgroundColor: "#1C1A14" }}>
      <AdminSidebar />
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden rounded-tl-xl rounded-bl-xl" style={{ backgroundColor: "var(--color-smoke)" }}>
        <main className="flex-1 overflow-y-auto bg-dot-grid">
          {children}
        </main>
      </div>
    </div>
  );
}
