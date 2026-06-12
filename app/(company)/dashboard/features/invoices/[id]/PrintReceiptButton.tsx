"use client";

import { Printer } from "lucide-react";

// Prints the invoice page as a receipt. The dashboard chrome is hidden in print
// via the print:hidden utilities on the nav/back-link.
export function PrintReceiptButton() {
  return (
    <button
      type="button"
      onClick={() => window.print()}
      className="mt-4 w-full inline-flex items-center justify-center gap-2 px-5 py-3 rounded-xl font-semibold print:hidden"
      style={{ backgroundColor: "var(--color-charcoal)", color: "var(--color-pearl)", fontSize: "var(--text-body-sm)" }}
    >
      <Printer size={15} /> Download receipt
    </button>
  );
}
