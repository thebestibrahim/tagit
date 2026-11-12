"use client";

import Link from "next/link";
import { Wordmark } from "@/components/ui/Wordmark";
import { usePathname, useRouter } from "next/navigation";
import {
  LayoutDashboard,
  Building2,
  Tag,
  Package,
  ScanLine,
  Settings,
  LogOut,
  ToggleLeft,
  Inbox,
  Users,
  CreditCard,
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { toast } from "sonner";
import { NavGroup, NavItem, SidebarFrame, SignOutButton, SIDEBAR_EDGE } from "@/components/layout/sidebar-parts";

// Grouped by what staff are doing: dealing with brands, running the physical
// supply of tags, or watching the platform.
const navGroups = [
  {
    label: undefined,
    items: [{ label: "Overview", href: "/admin", icon: LayoutDashboard }],
  },
  {
    label: "Brands",
    items: [
      { label: "Companies", href: "/admin/companies", icon: Building2 },
      { label: "Inquiries", href: "/admin/inquiries", icon: Inbox },
      { label: "Billing",   href: "/admin/billing",   icon: CreditCard },
    ],
  },
  {
    label: "Supply",
    items: [
      { label: "Batches", href: "/admin/batches", icon: Package },
      { label: "Tags",    href: "/admin/tags",    icon: Tag },
    ],
  },
  {
    label: "Platform",
    items: [
      { label: "Ownership",     href: "/admin/ownership",     icon: Users },
      { label: "Scan logs",     href: "/admin/scans",         icon: ScanLine },
      { label: "Feature flags", href: "/admin/feature-flags", icon: ToggleLeft },
      { label: "Settings",      href: "/admin/settings",      icon: Settings },
    ],
  },
];

export function AdminSidebar({ alerts }: { alerts?: { companies?: boolean; billing?: boolean; batches?: boolean } | null }) {
  const pathname = usePathname();
  const router = useRouter();

  // Nav items that should show an amber action-needed dot.
  const navAlert: Record<string, boolean> = {
    "/admin/companies": !!alerts?.companies,
    "/admin/billing": !!alerts?.billing,
    "/admin/batches": !!alerts?.batches,
  };

  async function handleSignOut() {
    const supabase = createClient();
    await supabase.auth.signOut();
    toast.success("Signed out");
    router.push("/control/signin");
  }

  return (
    <SidebarFrame>
      <Link
        href="/admin"
        className="flex items-center gap-3 px-5 h-[72px] shrink-0"
        style={{ borderBottom: `1px solid ${SIDEBAR_EDGE}`, textDecoration: "none" }}
      >
        <Wordmark height={20} />
        <span className="text-body-sm" style={{ color: "#9a9486" }}>
          Staff
        </span>
      </Link>

      <nav className="flex-1 overflow-y-auto px-3 pt-3 pb-4" aria-label="Admin">
        {navGroups.map((group) => (
          <NavGroup key={group.label ?? "top"} label={group.label}>
            {group.items.map((item) => (
              <NavItem
                key={item.href}
                {...item}
                active={item.href === "/admin" ? pathname === "/admin" : pathname.startsWith(item.href)}
                alert={navAlert[item.href]}
              />
            ))}
          </NavGroup>
        ))}
      </nav>

      <div className="px-3 pt-3 pb-4 shrink-0" style={{ borderTop: `1px solid ${SIDEBAR_EDGE}` }}>
        <SignOutButton onClick={handleSignOut} icon={LogOut} />
      </div>
    </SidebarFrame>
  );
}
