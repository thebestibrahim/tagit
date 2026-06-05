import type { TagStatus } from "@/types/database";

/**
 * Single source of truth for how a tag/card status is rendered across every
 * dashboard surface (brand tables, admin tables, product detail, batch detail,
 * analytics). Colours follow the PRD vocabulary: created=slate, shipped=amber,
 * live=blue, owned=green, transferred=purple, flagged/suspended=red.
 */
export const STATUS_BADGE: Record<TagStatus, { label: string; bg: string; color: string }> = {
  created:     { label: "Created",     bg: "var(--color-cream)", color: "var(--color-slate)" },
  shipped:     { label: "Shipped",     bg: "#FEF3E2",            color: "#B45309" },
  live:        { label: "Live",        bg: "#EFF6FF",            color: "#1D4ED8" },
  owned:       { label: "Owned",       bg: "#ECFDF5",            color: "#065F46" },
  transferred: { label: "Transferred", bg: "#F5F3FF",            color: "#6D28D9" },
  flagged:     { label: "Flagged",     bg: "#FEF2F2",            color: "#991B1B" },
  suspended:   { label: "Suspended",   bg: "#FEF2F2",            color: "#991B1B" },
};

export function statusBadge(status: string): { label: string; bg: string; color: string } {
  return STATUS_BADGE[status as TagStatus] ?? STATUS_BADGE.created;
}

/** Filter chips for the tags/cards tables — "all" plus the customer-facing states. */
export const STATUS_FILTERS: ("all" | TagStatus)[] = [
  "all", "created", "shipped", "live", "owned", "transferred",
];
