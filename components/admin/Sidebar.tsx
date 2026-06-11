"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  LayoutDashboard,
  Building2,
  Tag,
  Package,
  ScanLine,
  Settings,
  LogOut,
  ChevronRight,
  ToggleLeft,
  Inbox,
  Users,
  CreditCard,
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { toast } from "sonner";

const navItems = [
  { label: "Overview",      href: "/admin",                  icon: LayoutDashboard },
  { label: "Companies",     href: "/admin/companies",        icon: Building2 },
  { label: "Inquiries",     href: "/admin/inquiries",        icon: Inbox },
  { label: "Tags",          href: "/admin/tags",             icon: Tag },
  { label: "Batches",       href: "/admin/batches",          icon: Package },
  { label: "Billing",       href: "/admin/billing",          icon: CreditCard },
  { label: "Ownership",     href: "/admin/ownership",        icon: Users },
  { label: "Scan Logs",     href: "/admin/scans",            icon: ScanLine },
  { label: "Feature Flags", href: "/admin/feature-flags",   icon: ToggleLeft },
  { label: "Settings",      href: "/admin/settings",         icon: Settings },
];

export function AdminSidebar() {
  const pathname = usePathname();
  const router = useRouter();

  async function handleSignOut() {
    const supabase = createClient();
    await supabase.auth.signOut();
    toast.success("Signed out");
    router.push("/control/signin");
  }

  return (
    <aside
      className="flex flex-col h-full w-60 shrink-0"
      style={{
        backgroundColor: "#1C1A14",
        borderRight: "1px solid #2E2A1E",
      }}
    >
      {/* Brand mark */}
      <div
        className="flex items-center gap-3 px-5 h-[72px] shrink-0"
        style={{ borderBottom: "1px solid #2E2A1E", backgroundColor: "#171510" }}
      >
        <span
          className="font-display text-2xl"
          style={{ color: "#D4B68A", letterSpacing: "-0.02em" }}
        >
          Tagit
        </span>
        <span
          className="text-micro font-semibold uppercase tracking-widest px-2 py-0.5 rounded"
          style={{
            backgroundColor: "#1C1A14",
            color: "#B8945D",
            border: "1px solid #2E2A1E",
          }}
        >
          Admin
        </span>
      </div>

      {/* Nav */}
      <nav className="flex-1 overflow-y-auto p-3 space-y-0.5 pt-4">
        {navItems.map(({ label, href, icon: Icon }) => {
          const active =
            href === "/admin" ? pathname === "/admin" : pathname.startsWith(href);
          return (
            <Link
              key={href}
              href={href}
              className={`nav-item nav-item-dark ${active ? "active" : ""}`}
            >
              <Icon
                size={16}
                strokeWidth={1.5}
                style={{ color: active ? "#B8945D" : "#52525B" }}
              />
              <span className="flex-1">{label}</span>
              {active && (
                <ChevronRight size={12} style={{ color: "#52525B" }} />
              )}
            </Link>
          );
        })}
      </nav>

      {/* Footer */}
      <div className="p-3 shrink-0" style={{ borderTop: "1px solid #2E2A1E" }}>
        <button
          onClick={handleSignOut}
          className="nav-item nav-item-dark w-full text-left"
        >
          <LogOut size={16} strokeWidth={1.5} style={{ color: "#6B2D2D" }} />
          <span style={{ color: "#B85C5C" }}>Sign out</span>
        </button>
      </div>
    </aside>
  );
}
