"use client";

import Link from "next/link";
import { Lock } from "lucide-react";
import type { LucideIcon } from "lucide-react";

/**
 * The pieces both sidebars (brand and admin) are built from, so the two
 * cannot drift apart again.
 *
 * Where you are is marked by a thin gold rule and brighter text, not a
 * chevron. A lock means the feature is not on the plan; an amber dot means
 * something there needs attention. Those are the only marks a row carries.
 */

export const SIDEBAR_BG = "var(--app-sidebar)";
export const SIDEBAR_EDGE = "rgba(240, 237, 230, 0.08)";
const ICON = "#7d776b";
const ICON_ACTIVE = "#c8a464";

export function SidebarFrame({ children }: { children: React.ReactNode }) {
  return (
    <aside className="flex flex-col h-full w-60 shrink-0" style={{ backgroundColor: SIDEBAR_BG, borderRight: `1px solid ${SIDEBAR_EDGE}` }}>
      {children}
    </aside>
  );
}

export function NavGroup({ label, children }: { label?: string; children: React.ReactNode }) {
  return (
    <div className="space-y-0.5">
      {label && (
        <p className="px-3 pt-5 pb-1.5 text-caption" style={{ color: "#7d776b" }}>
          {label}
        </p>
      )}
      {children}
    </div>
  );
}

export function NavItem({
  label,
  href,
  icon: Icon,
  active,
  locked,
  alert,
  size = 16,
}: {
  label: string;
  href: string;
  icon: LucideIcon;
  active: boolean;
  locked?: boolean;
  alert?: boolean;
  size?: number;
}) {
  return (
    <Link href={href} className={`nav-item nav-item-dark ${active ? "active" : ""}`} aria-current={active ? "page" : undefined}>
      <Icon size={size} strokeWidth={1.5} style={{ color: active ? ICON_ACTIVE : ICON }} aria-hidden />
      <span className="flex-1">{label}</span>
      {alert && <AlertDot />}
      {locked && <Lock size={12} style={{ color: ICON }} aria-label="Not on your plan" />}
    </Link>
  );
}

/** Something under this item needs attention. */
export function AlertDot() {
  return <span className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: "#e0a83a" }} aria-label="Needs attention" />;
}

export function SignOutButton({ onClick, icon: Icon }: { onClick: () => void; icon: LucideIcon }) {
  return (
    <button type="button" onClick={onClick} className="nav-item nav-item-dark w-full text-left">
      <Icon size={16} strokeWidth={1.5} style={{ color: ICON }} aria-hidden />
      <span>Sign out</span>
    </button>
  );
}

export const navIcon = { idle: ICON, active: ICON_ACTIVE };
