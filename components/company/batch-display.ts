import type { BatchType } from "@/types/database";

export type BatchRow = {
  id: string;
  industry: string;
  batch_size: number;
  cards_quantity: number;
  batch_type: BatchType;
  batch_name: string | null;
  status: string;
  notes: string | null;
  created_at: string;
  shipped_at: string | null;
};

/** "30 tags + 20 cards", "100 tags", or "50 cards" depending on the batch type. */
export function batchQuantityLabel(b: Pick<BatchRow, "batch_type" | "batch_size" | "cards_quantity">): string {
  const parts: string[] = [];
  if (b.batch_type !== "cards") parts.push(`${(b.batch_size ?? 0).toLocaleString()} tags`);
  if (b.batch_type !== "tags") parts.push(`${(b.cards_quantity ?? 0).toLocaleString()} cards`);
  return parts.join(" + ");
}

export const BATCH_TYPE_BADGE: Record<BatchType, { label: string; bg: string; color: string }> = {
  tags:  { label: "Tags",  bg: "var(--color-soft-gold)", color: "var(--color-deep-gold)" },
  cards: { label: "Cards", bg: "#EFF6FF",                color: "#1D4ED8" },
  mixed: { label: "Mixed", bg: "#F5F3FF",                color: "#6D28D9" },
};

export const BATCH_STATUS_STYLES: Record<string, { bg: string; color: string }> = {
  pending:          { bg: "var(--color-cream)",     color: "var(--color-slate)" },
  awaiting_payment: { bg: "var(--color-soft-gold)", color: "var(--color-deep-gold)" },
  processing:       { bg: "#EFF6FF",                color: "#1D4ED8" },
  generated:        { bg: "var(--color-soft-gold)", color: "var(--color-deep-gold)" },
  written:          { bg: "#EFF6FF",                color: "#1D4ED8" },
  shipped:          { bg: "#ECFDF5",                color: "#065F46" },
};

export const BATCH_STATUS_LABELS: Record<string, string> = {
  pending:          "Request received — awaiting Tagit",
  awaiting_payment: "Awaiting payment",
  processing:       "In production",
  generated:        "Generated",
  written:          "Programmed",
  shipped:          "Shipped",
};

// Short, presentable badge label. Falls back to a humanised version of any
// status not in the map (e.g. "awaiting_payment" → "Awaiting payment").
const BATCH_STATUS_BADGE: Record<string, string> = {
  pending:          "Pending",
  awaiting_payment: "Awaiting payment",
  processing:       "In production",
  generated:        "Generated",
  written:          "Programmed",
  shipped:          "Shipped",
  cancelled:        "Cancelled",
};

export function prettyBatchStatus(status: string): string {
  return (
    BATCH_STATUS_BADGE[status] ??
    status.replace(/_/g, " ").replace(/^\w/, (c) => c.toUpperCase())
  );
}
