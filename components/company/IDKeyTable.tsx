import Link from "next/link";
import { Tag, CreditCard } from "lucide-react";
import { statusBadge } from "@/lib/tag-status";
import type { TagMedium } from "@/types/database";
import LocalTime from "@/components/ui/LocalTime";

export type IDKeyRow = {
  id: string;
  short_id: string;
  token: string;
  status: string;
  created_at: string;
  products: { name: string } | null;
};

/**
 * Shared table for the brand-facing Tags and Cards pages. Identical layout and
 * columns for both media; the only difference is the empty-state copy/icon, so
 * neither page duplicates row markup.
 */
export default function IDKeyTable({ rows, medium }: { rows: IDKeyRow[]; medium: TagMedium }) {
  const noun = medium === "card" ? "cards" : "tags";
  const singular = medium === "card" ? "card" : "tag";
  const Icon = medium === "card" ? CreditCard : Tag;

  if (rows.length === 0) {
    return (
      <div className="py-16 text-center" style={{ color: "var(--color-mist)" }}>
        <Icon size={32} className="mx-auto mb-3 opacity-30" />
        <p style={{ fontSize: "var(--text-body-sm)" }}>No {noun} found</p>
      </div>
    );
  }

  return (
    <table className="w-full">
      <thead>
        <tr style={{ backgroundColor: "var(--color-smoke)", borderBottom: "1px solid var(--color-cream)" }}>
          {["Short ID", "Product", "Status", "Created", "Scan"].map((h) => (
            <th key={h} className="text-left px-5 py-3 text-micro font-medium uppercase tracking-wider" style={{ color: "var(--color-slate)" }}>
              {h}
            </th>
          ))}
        </tr>
      </thead>
      <tbody>
        {rows.map((row, i) => {
          const badge = statusBadge(row.status);
          return (
            <tr
              key={row.id}
              style={{
                backgroundColor: "var(--color-pearl)",
                borderBottom: i < rows.length - 1 ? "1px solid var(--color-cream)" : "none",
              }}
            >
              <td className="px-5 py-4">
                <span style={{ fontFamily: "var(--font-jetbrains-mono)", fontSize: "var(--text-body-sm)", color: "var(--color-charcoal)", letterSpacing: "0.05em" }}>
                  {row.short_id}
                </span>
              </td>
              <td className="px-5 py-4">
                {row.products?.name ? (
                  <span style={{ fontSize: "var(--text-body-sm)", color: "var(--color-graphite)" }}>
                    {row.products.name}
                  </span>
                ) : (
                  <span style={{ fontSize: "var(--text-body-sm)", color: "var(--color-mist)" }}>
                    Unassigned
                  </span>
                )}
              </td>
              <td className="px-5 py-4">
                <span className="px-2 py-0.5 rounded-full text-micro font-medium" style={{ backgroundColor: badge.bg, color: badge.color }}>
                  {badge.label}
                </span>
              </td>
              <td className="px-5 py-4">
                <span style={{ color: "var(--color-slate)", fontSize: "var(--text-body-sm)" }}>
                  {<LocalTime iso={row.created_at} pattern="MMM d, yyyy" />}
                </span>
              </td>
              <td className="px-5 py-4">
                <Link
                  href={`/v/${row.token}`}
                  target="_blank"
                  style={{ color: "var(--color-graphite)", fontSize: "var(--text-body-sm)", textDecoration: "underline" }}
                  title={`Preview ${singular} scan page`}
                >
                  Preview
                </Link>
              </td>
            </tr>
          );
        })}
      </tbody>
    </table>
  );
}
