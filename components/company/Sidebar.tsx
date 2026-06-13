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
  ChevronRight,
  ChevronDown,
  Layers,
  Award,
  KeyRound,
  CreditCard,
  Lock,
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { useFlags } from "@/lib/feature-flags/client";
import type { FlagKey } from "@/lib/feature-flags/types";
import { toast } from "sonner";

// Nav items whose page is gated by a feature flag. When the flag is off the
// item still shows (and stays clickable — the page renders its own feature
// wall), but a lock icon signals it's not on the brand's plan.
const FLAG_FOR_HREF: Record<string, FlagKey> = {
  "/dashboard/certificates": "certificate_generation",
  "/dashboard/customization": "brand_customisation",
  "/dashboard/ai-persona": "ai_persona",
  "/dashboard/analytics": "analytics_overview",
};

const topNav = [
  { label: "Overview", href: "/dashboard",          icon: LayoutDashboard },
  { label: "Products", href: "/dashboard/products",  icon: Package },
];

const idKeysNav = {
  label: "ID Keys",
  icon: KeyRound,
  basePath: "/dashboard/id-keys",
  items: [
    { label: "Batches", href: "/dashboard/id-keys/batches", icon: Layers },
    { label: "Tags",    href: "/dashboard/id-keys/tags",    icon: Tag },
    { label: "Cards",   href: "/dashboard/id-keys/cards",   icon: CreditCard },
  ],
};

const bottomNav = [
  { label: "Ownership",     href: "/dashboard/ownership",     icon: Users },
  { label: "Certificates",  href: "/dashboard/certificates",  icon: Award },
  { label: "Customization", href: "/dashboard/customization", icon: Paintbrush },
  { label: "AI Persona",    href: "/dashboard/ai-persona",    icon: Bot },
  { label: "Analytics",     href: "/dashboard/analytics",     icon: BarChart2 },
  { label: "Billing",       href: "/dashboard/features",      icon: CreditCard },
  { label: "Settings",      href: "/dashboard/settings",      icon: Settings },
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

  function NavLink({ label, href, icon: Icon }: { label: string; href: string; icon: React.FC<{ size: number; strokeWidth?: number; style?: React.CSSProperties }> }) {
    const active = href === "/dashboard" ? pathname === "/dashboard" : pathname.startsWith(href);
    const flagKey = FLAG_FOR_HREF[href];
    const locked = flagKey ? !flags[flagKey] : false;
    const alert = navAlert[href];
    return (
      <Link href={href} className={`nav-item nav-item-dark ${active ? "active" : ""}`}>
        <Icon size={16} strokeWidth={1.5} style={{ color: active ? "#B8945D" : "#52525B" }} />
        <span className="flex-1">{label}</span>
        {alert && <AlertDot />}
        {locked ? (
          <Lock size={12} style={{ color: "#52525B", opacity: 0.7 }} />
        ) : active ? (
          <ChevronRight size={12} style={{ color: "#52525B" }} />
        ) : null}
      </Link>
    );
  }

  return (
    <aside
      className="flex flex-col h-full w-60 shrink-0"
      style={{ backgroundColor: "#1C1A14", borderRight: "1px solid #2E2A1E" }}
    >
      {/* Brand header */}
      <div
        className="flex items-center gap-3 px-5 h-[72px] shrink-0"
        style={{ borderBottom: "1px solid #2E2A1E", backgroundColor: "#171510" }}
      >
        {logoUrl ? (
          <Image
            src={logoUrl}
            alt={companyName}
            width={32}
            height={32}
            className="w-8 h-8 rounded object-contain"
            style={{ border: "1px solid #27272A" }}
          />
        ) : (
          <div
            className="w-8 h-8 rounded flex items-center justify-center text-xs font-semibold shrink-0"
            style={{
              background: "linear-gradient(135deg, #2A2A2D, #1C1C1F)",
              color: "#B8945D",
              border: "1px solid #27272A",
            }}
          >
            {companyName[0]?.toUpperCase()}
          </div>
        )}
        <div className="min-w-0">
          <p className="text-body-sm font-semibold truncate" style={{ color: "#E4E4E7" }}>
            {companyName}
          </p>
          <p className="text-micro" style={{ color: "#52525B" }}>
            Brand partner
          </p>
        </div>
      </div>

      {/* Tagit wordmark */}
      <div className="px-5 py-3 flex items-center" style={{ borderBottom: "1px solid #251F15" }}>
        <Wordmark tone="gold" height={20} />
      </div>

      {/* Nav */}
      <nav className="flex-1 overflow-y-auto p-3 space-y-0.5">
        {topNav.map((item) => (
          <NavLink key={item.href} {...item} />
        ))}

        {/* ID Keys dropdown */}
        <button
          type="button"
          onClick={() => setIdKeysOpen((o) => !o)}
          className={`nav-item nav-item-dark w-full text-left ${idKeysActive ? "active" : ""}`}
          aria-expanded={idKeysOpen}
        >
          <idKeysNav.icon size={16} strokeWidth={1.5} style={{ color: idKeysActive ? "#B8945D" : "#52525B" }} />
          <span className="flex-1">{idKeysNav.label}</span>
          {idKeysLocked && <Lock size={12} style={{ color: "#52525B", opacity: 0.7 }} />}
          {idKeysOpen ? (
            <ChevronDown size={12} style={{ color: "#52525B" }} />
          ) : (
            <ChevronRight size={12} style={{ color: "#52525B" }} />
          )}
        </button>
        {idKeysOpen && (
          <div className="space-y-0.5 pl-3" style={{ borderLeft: "1px solid #2E2A1E", marginLeft: 14 }}>
            {idKeysNav.items.map(({ label, href, icon: Icon }) => {
              const active = pathname.startsWith(href);
              return (
                <Link key={href} href={href} className={`nav-item nav-item-dark ${active ? "active" : ""}`}>
                  <Icon size={14} strokeWidth={1.5} style={{ color: active ? "#B8945D" : "#52525B" }} />
                  <span className="flex-1">{label}</span>
                </Link>
              );
            })}
          </div>
        )}

        {bottomNav.map((item) => (
          <NavLink key={item.href} {...item} />
        ))}
      </nav>

      {/* Footer */}
      <div className="p-3 shrink-0 space-y-2" style={{ borderTop: "1px solid #2E2A1E" }}>
        {billing && <PlanChip billing={billing} />}
        <button
          onClick={handleSignOut}
          className="nav-item nav-item-dark w-full text-left"
          style={{ color: "#6B2D2D" }}
        >
          <LogOut size={16} strokeWidth={1.5} style={{ color: "#6B2D2D" }} />
          <span style={{ color: "#B85C5C" }}>Sign out</span>
        </button>
      </div>
    </aside>
  );
}

// Amber dot signalling a nav item needs the brand's attention.
function AlertDot() {
  return <span className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: "#FBBF24" }} />;
}

// Compact plan/billing chip in the sidebar footer — links to the Billing page.
function PlanChip({ billing }: { billing: BillingSummary }) {
  const { status, planName, trialEndsAt } = billing;

  let dot = "#16A34A";
  let line = "Active";
  let lineColor = "#8A8478";
  if (status === "trialing") {
    dot = "#B8945D";
    // A trial countdown is intentionally relative to the current time.
    // eslint-disable-next-line react-hooks/purity
    const days = trialEndsAt ? Math.max(0, Math.ceil((new Date(trialEndsAt).getTime() - Date.now()) / 86400000)) : 0;
    line = `Trial · ${days} day${days === 1 ? "" : "s"} left`;
    lineColor = "#B8945D";
  } else if (status === "past_due") {
    dot = "#DC2626";
    line = "Payment due";
    lineColor = "#B85C5C";
  } else if (status === "suspended") {
    dot = "#DC2626";
    line = "Suspended — pay to restore";
    lineColor = "#B85C5C";
  } else if (status === "cancelled") {
    dot = "#6B7280";
    line = "Cancelled";
  }

  return (
    <Link
      href="/dashboard/features"
      className="flex items-center gap-2.5 px-3 py-2.5 rounded-lg transition-colors"
      style={{ backgroundColor: "#171510", border: "1px solid #2E2A1E", textDecoration: "none" }}
    >
      <span className="inline-block w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: dot }} />
      <span className="min-w-0 flex-1">
        <span className="block truncate text-body-sm font-medium" style={{ color: "#E4E4E7" }}>{planName}</span>
        <span className="block truncate text-micro" style={{ color: lineColor }}>{line}</span>
      </span>
      <ChevronRight size={12} style={{ color: "#52525B" }} className="shrink-0" />
    </Link>
  );
}
