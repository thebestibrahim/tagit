import Link from "next/link";
import { AlertCircle } from "lucide-react";

// Shown across the dashboard when a brand is `past_due` — their trial has ended
// and the first invoice is unpaid. They keep read access but cannot place new
// chip orders until they pay. This is the softer step before full suspension.
export function PastDueBanner({ amountLabel }: { amountLabel?: string | null }) {
  return (
    <div
      className="flex items-center justify-between gap-4 px-5 py-3 print:hidden"
      style={{ backgroundColor: "#FEF3C7", borderBottom: "1px solid #FDE68A" }}
    >
      <div className="flex items-center gap-2.5 min-w-0">
        <AlertCircle size={18} style={{ color: "#92400E", flexShrink: 0 }} />
        <p className="text-body-sm min-w-0" style={{ color: "#92400E" }}>
          <strong style={{ fontWeight: 600 }}>Your trial has ended.</strong>{" "}
          Settle your first invoice{amountLabel ? ` (${amountLabel})` : ""} to restore full access. New chip orders are paused until payment.
        </p>
      </div>
      <Link
        href="/dashboard/features"
        className="shrink-0 text-micro font-semibold px-3.5 py-1.5 rounded-full whitespace-nowrap"
        style={{ backgroundColor: "#92400E", color: "#FFFBEB" }}
      >
        Pay invoice
      </Link>
    </div>
  );
}
