import { format } from "date-fns";
import { Users } from "lucide-react";

export type OwnerRow = {
  id: string;
  ownerName: string;
  ownerEmail: string;
  productName: string | null;
  tagShortId: string | null;
  acquisitionType: string;
  isCurrent: boolean;
  acquiredAt: string | null;
  companyName?: string | null;
};

function acquisitionLabel(type: string): string {
  if (type === "origin") return "Brand origin";
  if (type === "transfer") return "Transfer";
  return type.replace(/_/g, " ");
}

/**
 * Shared ledger of ownership_records — every owner a product has ever had, with
 * the current holder marked. Used by the brand Ownership page (its own products)
 * and the admin Ownership page (`showCompany` adds a Company column, all brands).
 */
export default function OwnerLedgerTable({
  rows,
  showCompany = false,
}: {
  rows: OwnerRow[];
  showCompany?: boolean;
}) {
  if (rows.length === 0) {
    return (
      <div className="py-16 text-center" style={{ color: "var(--color-mist)" }}>
        <Users size={32} className="mx-auto mb-3 opacity-30" />
        <p style={{ fontSize: "var(--text-body-sm)" }}>No ownership records</p>
      </div>
    );
  }

  const headers = [
    "Owner",
    ...(showCompany ? ["Company"] : []),
    "Product",
    "Tag",
    "Acquisition",
    "Status",
    "Date",
  ];

  return (
    <table className="w-full">
      <thead>
        <tr style={{ backgroundColor: "var(--color-smoke)", borderBottom: "1px solid var(--color-cream)" }}>
          {headers.map((h) => (
            <th key={h} className="text-left px-5 py-3 text-micro font-medium uppercase tracking-wider" style={{ color: "var(--color-slate)" }}>
              {h}
            </th>
          ))}
        </tr>
      </thead>
      <tbody>
        {rows.map((row, i) => (
          <tr
            key={row.id}
            style={{
              backgroundColor: "var(--color-pearl)",
              borderBottom: i < rows.length - 1 ? "1px solid var(--color-cream)" : "none",
            }}
          >
            <td className="px-5 py-4">
              <p className="font-medium" style={{ color: "var(--color-charcoal)", fontSize: "var(--text-body-sm)" }}>
                {row.ownerName}
              </p>
              <p style={{ color: "var(--color-slate)", fontSize: "var(--text-caption)" }}>
                {row.ownerEmail}
              </p>
            </td>
            {showCompany && (
              <td className="px-5 py-4">
                <span style={{ color: "var(--color-graphite)", fontSize: "var(--text-body-sm)" }}>
                  {row.companyName ?? "—"}
                </span>
              </td>
            )}
            <td className="px-5 py-4">
              <span style={{ color: "var(--color-graphite)", fontSize: "var(--text-body-sm)" }}>
                {row.productName ?? "—"}
              </span>
            </td>
            <td className="px-5 py-4">
              <span style={{ fontFamily: "var(--font-jetbrains-mono)", fontSize: "var(--text-body-sm)", color: "var(--color-graphite)", letterSpacing: "0.05em" }}>
                {row.tagShortId ?? "—"}
              </span>
            </td>
            <td className="px-5 py-4">
              <span style={{ color: "var(--color-slate)", fontSize: "var(--text-body-sm)" }}>
                {acquisitionLabel(row.acquisitionType)}
              </span>
            </td>
            <td className="px-5 py-4">
              <span
                className="px-2 py-0.5 rounded-full text-micro font-medium"
                style={
                  row.isCurrent
                    ? { backgroundColor: "var(--color-verified-tint)", color: "var(--color-verified)" }
                    : { backgroundColor: "var(--color-linen)", color: "var(--color-slate)" }
                }
              >
                {row.isCurrent ? "Current" : "Previous"}
              </span>
            </td>
            <td className="px-5 py-4">
              <span style={{ color: "var(--color-slate)", fontSize: "var(--text-body-sm)" }}>
                {row.acquiredAt ? format(new Date(row.acquiredAt), "MMM d, yyyy") : "—"}
              </span>
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}
