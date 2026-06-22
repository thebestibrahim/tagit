import { createServiceClient } from "@/lib/supabase/server";
import { getUser } from "@/lib/auth";
import { redirect, notFound } from "next/navigation";
import Link from "next/link";
import { ChevronLeft, ArrowRight } from "lucide-react";
import type { Invoice, InvoiceLineItem } from "@/types/database";
import { formatNaira } from "@/lib/billing/pricing";
import { invoiceNumber } from "@/lib/billing/invoices";
import { PrintReceiptButton } from "./PrintReceiptButton";

function fmtDate(d: string | null | undefined): string {
  if (!d) return "—";
  return new Date(d).toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" });
}

const STATUS: Record<Invoice["status"], { label: string; bg: string; color: string }> = {
  draft: { label: "Draft", bg: "var(--color-cream)", color: "var(--color-mist)" },
  sent: { label: "Unpaid", bg: "var(--color-soft-gold)", color: "var(--color-deep-gold)" },
  paid: { label: "● Paid", bg: "#DCFCE7", color: "#166534" },
  overdue: { label: "Overdue", bg: "#FEF2F2", color: "#991B1B" },
  cancelled: { label: "Cancelled", bg: "var(--color-cream)", color: "var(--color-mist)" },
};

export default async function InvoiceDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const user = await getUser();
  if (!user) redirect("/auth/login");

  const supabase = createServiceClient();
  const [{ data: invData }, { data: company }, { data: itemData }] = await Promise.all([
    supabase.from("invoices").select("*").eq("id", id).maybeSingle(),
    supabase.from("companies").select("name").eq("id", user.id).single(),
    supabase.from("invoice_line_items").select("*").eq("invoice_id", id).order("sort_order", { ascending: true }),
  ]);

  const invoice = invData as Invoice | null;
  // A brand may only view its own invoices.
  if (!invoice || invoice.company_id !== user.id) notFound();

  const items = (itemData ?? []) as InvoiceLineItem[];
  const positiveItems = items.filter((i) => i.total >= 0);
  const s = STATUS[invoice.status];
  const unpaid = invoice.status === "sent" || invoice.status === "overdue";

  return (
    <div className="p-8 max-w-2xl mx-auto">
      <Link href="/dashboard/features" className="inline-flex items-center gap-1.5 mb-8 print:hidden" style={{ color: "var(--color-slate)", fontSize: "var(--text-body-sm)", textDecoration: "none" }}>
        <ChevronLeft size={16} /> Back to billing
      </Link>

      <div className="rounded-2xl p-8" style={{ backgroundColor: "var(--color-pearl)", border: "1px solid var(--color-cream)" }}>
        <div className="flex items-start justify-between mb-8">
          <div>
            <p className="text-micro font-semibold uppercase tracking-widest" style={{ color: "var(--color-gold)" }}>Invoice</p>
            <h1 className="font-display mt-1" style={{ fontSize: "26px", color: "var(--color-charcoal)" }}>{invoiceNumber(invoice)}</h1>
          </div>
          <span className="text-micro font-semibold px-3 py-1.5 rounded-full" style={{ backgroundColor: s.bg, color: s.color }}>{s.label}</span>
        </div>

        <dl className="grid grid-cols-2 gap-y-3 gap-x-6 mb-8">
          <Row label="To" value={company?.name ?? "—"} />
          <Row label="Type" value={invoice.type === "batch" ? "Chip order" : "Subscription"} />
          {invoice.period_start && <Row label="Period" value={`${fmtDate(invoice.period_start)} — ${fmtDate(invoice.period_end)}`} />}
          <Row label="Issued" value={fmtDate(invoice.created_at)} />
          <Row label="Due" value={fmtDate(invoice.due_date)} />
          {invoice.paid_at && <Row label="Paid" value={fmtDate(invoice.paid_at)} />}
        </dl>

        <div style={{ borderTop: "1px solid var(--color-cream)" }}>
          {positiveItems.map((item) => (
            <div key={item.id} className="flex items-center justify-between py-3" style={{ borderBottom: "1px solid var(--color-cream)" }}>
              <span style={{ color: "var(--color-charcoal)", fontSize: "var(--text-body-sm)" }}>{item.description}</span>
              <span className="tabular-nums" style={{ color: "var(--color-charcoal)", fontSize: "var(--text-body-sm)" }}>{formatNaira(item.total)}</span>
            </div>
          ))}

          {invoice.discount_amount > 0 && (
            <div className="flex items-center justify-between py-3" style={{ borderBottom: "1px solid var(--color-cream)" }}>
              <span style={{ color: "var(--color-gold)", fontSize: "var(--text-body-sm)" }}>
                Discount{invoice.discount_percentage ? ` (${invoice.discount_percentage}% off)` : ""}
              </span>
              <span className="tabular-nums" style={{ color: "var(--color-gold)", fontSize: "var(--text-body-sm)" }}>−{formatNaira(invoice.discount_amount)}</span>
            </div>
          )}

          <div className="flex items-center justify-between pt-4">
            <span className="text-micro font-semibold uppercase tracking-widest" style={{ color: "var(--color-charcoal)" }}>Total</span>
            <span className="font-display tabular-nums" style={{ fontSize: "24px", color: "var(--color-charcoal)" }}>{formatNaira(invoice.amount)}</span>
          </div>
        </div>

        {unpaid && invoice.amount > 0 && (
          // Route through the self-healing pay endpoint so the button works even
          // if the Paystack link wasn't minted at invoice creation time.
          <a href={`/api/billing/pay/${invoice.id}`} className="mt-8 w-full inline-flex items-center justify-center gap-2 px-5 py-3 rounded-xl font-semibold" style={{ backgroundColor: "var(--color-charcoal)", color: "var(--color-pearl)", fontSize: "var(--text-body-sm)" }}>
            Pay {formatNaira(invoice.amount)} now <ArrowRight size={15} />
          </a>
        )}
        {invoice.status === "paid" && (
          <div className="mt-8">
            <div className="flex flex-col items-center gap-2 py-6 rounded-xl" style={{ backgroundColor: "#DCFCE7", border: "1px solid #BBF7D0" }}>
              <span className="text-micro font-bold uppercase tracking-[0.2em] px-4 py-1.5 rounded-full" style={{ backgroundColor: "#166534", color: "#fff" }}>
                ● Paid
              </span>
              {invoice.paid_at && (
                <p className="text-body-sm font-medium" style={{ color: "#166534" }}>Paid on {fmtDate(invoice.paid_at)}</p>
              )}
              {invoice.paystack_reference && (
                <p className="text-caption" style={{ color: "#15803D", fontFamily: "var(--font-jetbrains-mono)" }}>
                  Ref: {invoice.paystack_reference}
                </p>
              )}
            </div>
            <PrintReceiptButton />
          </div>
        )}
      </div>
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-caption" style={{ color: "var(--color-mist)" }}>{label}</dt>
      <dd className="mt-0.5 font-medium" style={{ color: "var(--color-charcoal)", fontSize: "var(--text-body-sm)" }}>{value}</dd>
    </div>
  );
}
