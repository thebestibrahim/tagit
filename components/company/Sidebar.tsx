"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { Wordmark } from "@/components/ui/Wordmark";
import { usePathname, useRouter } from "next/navigation";
import {
  LayoutDashboard,
  Tag,
  Package,
  Users,
  Paintbrush,
  BarChart2,
  Bot,
  Settings,
  LogOut,
  ChevronDown,
  type LucideIcon,
  Layers,
  Award,
  KeyRound,
  CreditCard,
  Lock,
  Landmark,
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { useFlags } from "@/lib/feature-flags/client";
import type { FlagKey } from "@/lib/feature-flags/types";
import { toast } from "sonner";
import { NavGroup, NavItem, SidebarFrame, SignOutButton, SIDEBAR_EDGE, navIcon } from "@/components/layout/sidebar-parts";

// Nav items whose page is gated by a feature flag. When the flag is off the
// item still shows (and stays clickable — the page renders its own feature
// wall), but a lock icon signals it's not on the brand's plan.
const FLAG_FOR_HREF: Record<string, FlagKey> = {
  "/dashboard/certificates": "certificate_generation",
  "/dashboard/customization": "brand_customisation",
  "/dashboard/ai-persona": "ai_persona",
  "/dashboard/analytics": "analytics_overview",
  "/dashboard/exhibitions": "exhibitions",
};

// Grouped by the job each page does, so the list reads as four short lists
// instead of thirteen equal rows.
const catalogueNav = [
  { label: "Overview", href: "/dashboard",          icon: LayoutDashboard },
  { label: "Products", href: "/dashboard/products",  icon: Package },
];

const idKeysNav = {
  label: "ID keys",
  icon: KeyRound,
  basePath: "/dashboard/id-keys",
  items: [
    { label: "Batches", href: "/dashboard/id-keys/batches", icon: Layers },
    { label: "Tags",    href: "/dashboard/id-keys/tags",    icon: Tag },
    { label: "Cards",   href: "/dashboard/id-keys/cards",   icon: CreditCard },
  ],
};

const navGroups = [
  {
    label: "Provenance",
    items: [
      { label: "Ownership",    href: "/dashboard/ownership",    icon: Users },
      { label: "Certificates", href: "/dashboard/certificates", icon: Award },
      { label: "Exhibitions",  href: "/dashboard/exhibitions",  icon: Landmark },
    ],
  },
  {
    label: "Brand",
    items: [
      { label: "Customization", href: "/dashboard/customization", icon: Paintbrush },
      { label: "AI persona",    href: "/dashboard/ai-persona",    icon: Bot },
      { label: "Analytics",     href: "/dashboard/analytics",     icon: BarChart2 },
    ],
  },
  {
    label: "Account",
    items: [
      { label: "Billing",  href: "/dashboard/features", icon: CreditCard },
      { label: "Settings", href: "/dashboard/settings", icon: Settings },
    ],
  },
];

interface BillingSummary {
  status: string;
  planName: string;
  trialEndsAt: string | null;
}

interface CompanySidebarProps {
  companyName: string;
  logoUrl?: string | null;
  billing?: BillingSummary | null;
  alerts?: { billing?: boolean; ownership?: boolean } | null;
}

export function CompanySidebar({ companyName, logoUrl, billing, alerts }: CompanySidebarProps) {
  const pathname = usePathname();
  const router = useRouter();
  const flags = useFlags();

  // Nav items that should show an amber action-needed dot.
  const navAlert: Record<string, boolean> = {
    "/dashboard/features": !!alerts?.billing,
    "/dashboard/ownership": !!alerts?.ownership,
  };

  const idKeysActive = pathname.startsWith(idKeysNav.basePath);
  const idKeysLocked = !flags.bulk_tag_creation;
  const [idKeysOpen, setIdKeysOpen] = useState(idKeysActive);

  async function handleSignOut() {
    const supabase = createClient();
    await supabase.auth.signOut();
    toast.success("Signed out");
    router.push("/auth/login");
  }

  function Item({ label, href, icon }: { label: string; href: string; icon: LucideIcon }) {
    const active = href === "/dashboard" ? pathname === "/dashboard" : pathname.startsWith(href);
    const flagKey = FLAG_FOR_HREF[href];
    return (
      <NavItem
        label={label}
        href={href}
        icon={icon}
        active={active}
        locked={flagKey ? !flags[flagKey] : false}
        alert={navAlert[href]}
      />
    );
  }

  return (
    <SidebarFrame>
      {/* Whose workspace this is */}
      <Link
        href="/dashboard"
        className="flex items-center gap-3 px-5 h-[72px] shrink-0"
        style={{ borderBottom: `1px solid ${SIDEBAR_EDGE}`, textDecoration: "none" }}
      >
        {logoUrl ? (
          <Image
            src={logoUrl}
            alt=""
            width={36}
            height={36}
            className="w-9 h-9 rounded-md object-contain shrink-0"
            style={{ backgroundColor: "#f7f5f0" }}
          />
        ) : (
          <span
            className="w-9 h-9 rounded-md flex items-center justify-center shrink-0 font-display"
            style={{ backgroundColor: "#24211b", color: "#c8a464", fontSize: 20, fontStyle: "italic" }}
            aria-hidden
          >
            {companyName[0]?.toUpperCase()}
          </span>
        )}
        <span className="min-w-0 text-body-sm font-semibold truncate" style={{ color: "#f0ede6" }}>
          {companyName}
        </span>
      </Link>

      <nav className="flex-1 overflow-y-auto px-3 pt-3 pb-4" aria-label="Dashboard">
        <NavGroup>
          {catalogueNav.map((item) => (
            <Item key={item.href} {...item} />
          ))}

          <button
            type="button"
            onClick={() => setIdKeysOpen((o) => !o)}
            className={`nav-item nav-item-dark w-full text-left ${idKeysActive && !idKeysOpen ? "active" : ""}`}
            aria-expanded={idKeysOpen}
          >
            <idKeysNav.icon size={16} strokeWidth={1.5} style={{ color: idKeysActive ? navIcon.active : navIcon.idle }} aria-hidden />
            <span className="flex-1">{idKeysNav.label}</span>
            {idKeysLocked && <Lock size={12} style={{ color: navIcon.idle }} aria-label="Not on your plan" />}
            <ChevronDown
              size={14}
              style={{ color: navIcon.idle, transform: idKeysOpen ? "none" : "rotate(-90deg)", transition: "transform 0.15s" }}
              aria-hidden
            />
          </button>
          {idKeysOpen && (
            <div className="space-y-0.5 pl-6">
              {idKeysNav.items.map((item) => (
                <NavItem key={item.href} {...item} size={14} active={pathname.startsWith(item.href)} />
              ))}
            </div>
          )}
        </NavGroup>

        {navGroups.map((group) => (
          <NavGroup key={group.label} label={group.label}>
            {group.items.map((item) => (
              <Item key={item.href} {...item} />
            ))}
          </NavGroup>
        ))}
      </nav>

      <div className="px-3 pt-3 pb-4 shrink-0 space-y-1" style={{ borderTop: `1px solid ${SIDEBAR_EDGE}` }}>
        {billing && <PlanChip billing={billing} />}
        <SignOutButton onClick={handleSignOut} icon={LogOut} />
        <div className="px-3 pt-3">
          <Wordmark height={13} />
        </div>
      </div>
    </SidebarFrame>
  );
}

// Compact plan/billing chip in the sidebar footer — links to the Billing page.
function PlanChip({ billing }: { billing: BillingSummary }) {
  const { status, planName, trialEndsAt } = billing;

  let dot = "#16A34A";
  let line = "Active";
  let lineColor = "#9a9486";
  if (status === "trialing") {
    dot = "#B8945D";
    // A trial countdown is intentionally relative to the current time.
    // eslint-disable-next-line react-hooks/purity
    const days = trialEndsAt ? Math.max(0, Math.ceil((new Date(trialEndsAt).getTime() - Date.now()) / 86400000)) : 0;
    line = `Trial, ${days} day${days === 1 ? "" : "s"} left`;
    lineColor = "#c8a464";
  } else if (status === "past_due") {
    dot = "#DC2626";
    line = "Payment due";
    lineColor = "#e08a8a";
  } else if (status === "suspended") {
    dot = "#DC2626";
    line = "Suspended. Pay to restore";
    lineColor = "#e08a8a";
  } else if (status === "cancelled") {
    dot = "#6B7280";
    line = "Cancelled";
  }

  return (
    <Link
      href="/dashboard/features"
      className="nav-item nav-item-dark"
      style={{ textDecoration: "none", alignItems: "flex-start" }}
    >
      <span className="inline-block w-2 h-2 rounded-full shrink-0 mt-[7px] ml-1 mr-1" style={{ backgroundColor: dot }} aria-hidden />
      <span className="min-w-0 flex-1">
        <span className="block truncate text-body-sm font-medium" style={{ color: "#f0ede6" }}>{planName}</span>
        <span className="block truncate text-caption" style={{ color: lineColor }}>{line}</span>
      </span>
    </Link>
  );
}
