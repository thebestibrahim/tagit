import { Document, Page, Text, View, renderToBuffer } from "@react-pdf/renderer";
import { formatNaira } from "@/lib/billing/pricing";

// Branded invoice PDF, attached to every invoice email. Kept deliberately
// simple: wordmark, parties, line items, totals, status.

export interface InvoicePdfData {
  invoiceNumber: string;
  companyName: string;
  type: "subscription" | "batch";
  periodStart?: string | null;
  periodEnd?: string | null;
  issuedAt: string;
  dueDate: string;
  paid: boolean;
  lineItems: { description: string; total: number }[];
  subtotal: number;
  discountAmount: number;
  discountPercentage: number | null;
  amount: number;
}

const INK = "#0A0A0B";
const GOLD = "#B8945D";
const BODY = "#55555B";
const MUTE = "#9E9EA3";
const LINE = "#E8E2D5";

function fmtDate(d: string | null | undefined): string {
  if (!d) return "—";
  return new Date(d).toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" });
}

function InvoiceDocument({ data }: { data: InvoicePdfData }) {
  const positive = data.lineItems.filter((i) => i.total >= 0);
  return (
    <Document title={`Tagit Invoice ${data.invoiceNumber}`}>
      <Page size="A4" style={{ padding: 48, fontFamily: "Helvetica", fontSize: 10, color: BODY }}>
        {/* Header */}
        <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 36 }}>
          <View>
            <Text style={{ fontFamily: "Times-Italic", fontSize: 22, color: INK }}>Tagit</Text>
            <Text style={{ fontSize: 7, letterSpacing: 1.5, color: MUTE, marginTop: 4, textTransform: "uppercase" }}>
              Identity Infrastructure for Physical Luxury
            </Text>
          </View>
          <View style={{ alignItems: "flex-end" }}>
            <Text style={{ fontSize: 8, letterSpacing: 1.5, color: GOLD, textTransform: "uppercase" }}>Invoice</Text>
            <Text style={{ fontSize: 13, color: INK, marginTop: 4 }}>{data.invoiceNumber}</Text>
            <Text style={{ fontSize: 9, color: data.paid ? "#166534" : MUTE, marginTop: 6, textTransform: "uppercase", letterSpacing: 1 }}>
              {data.paid ? "Paid" : "Unpaid"}
            </Text>
          </View>
        </View>

        {/* Meta */}
        <View style={{ flexDirection: "row", justifyContent: "space-between", marginBottom: 28 }}>
          <View>
            <Text style={{ fontSize: 7, color: MUTE, textTransform: "uppercase", letterSpacing: 1 }}>Billed to</Text>
            <Text style={{ fontSize: 12, color: INK, marginTop: 3 }}>{data.companyName}</Text>
          </View>
          <View style={{ alignItems: "flex-end" }}>
            <Text style={{ fontSize: 9, color: BODY }}>Issued {fmtDate(data.issuedAt)}</Text>
            <Text style={{ fontSize: 9, color: BODY, marginTop: 2 }}>Due {fmtDate(data.dueDate)}</Text>
            {data.type === "subscription" && data.periodStart && (
              <Text style={{ fontSize: 9, color: BODY, marginTop: 2 }}>
                Period {fmtDate(data.periodStart)} – {fmtDate(data.periodEnd)}
              </Text>
            )}
          </View>
        </View>

        {/* Line items */}
        <View style={{ borderTopWidth: 1, borderTopColor: INK, paddingTop: 8 }}>
          <View style={{ flexDirection: "row", justifyContent: "space-between", paddingBottom: 6 }}>
            <Text style={{ fontSize: 7, color: MUTE, textTransform: "uppercase", letterSpacing: 1 }}>Description</Text>
            <Text style={{ fontSize: 7, color: MUTE, textTransform: "uppercase", letterSpacing: 1 }}>Amount</Text>
          </View>
          {positive.map((item, idx) => (
            <View key={idx} style={{ flexDirection: "row", justifyContent: "space-between", paddingVertical: 7, borderTopWidth: 1, borderTopColor: LINE }}>
              <Text style={{ fontSize: 10, color: INK }}>{item.description}</Text>
              <Text style={{ fontSize: 10, color: INK }}>{formatNaira(item.total)}</Text>
            </View>
          ))}
          {data.discountAmount > 0 && (
            <View style={{ flexDirection: "row", justifyContent: "space-between", paddingVertical: 7, borderTopWidth: 1, borderTopColor: LINE }}>
              <Text style={{ fontSize: 10, color: GOLD }}>
                Discount{data.discountPercentage ? ` (${data.discountPercentage}% off)` : ""}
              </Text>
              <Text style={{ fontSize: 10, color: GOLD }}>-{formatNaira(data.discountAmount)}</Text>
            </View>
          )}
          <View style={{ flexDirection: "row", justifyContent: "space-between", paddingTop: 12, marginTop: 4, borderTopWidth: 2, borderTopColor: INK }}>
            <Text style={{ fontSize: 9, color: INK, textTransform: "uppercase", letterSpacing: 1 }}>Total</Text>
            <Text style={{ fontSize: 15, color: INK }}>{formatNaira(data.amount)}</Text>
          </View>
        </View>

        {/* Footer */}
        <View style={{ position: "absolute", bottom: 48, left: 48, right: 48, borderTopWidth: 1, borderTopColor: LINE, paddingTop: 12 }}>
          <Text style={{ fontSize: 8, color: MUTE }}>
            {data.paid ? "Payment received. Thank you." : "Please pay by the due date using the secure link in your invoice email."}
          </Text>
          <Text style={{ fontSize: 8, color: MUTE, marginTop: 3 }}>Tagit · info@tagitlux.com</Text>
        </View>
      </Page>
    </Document>
  );
}

export async function generateInvoicePdf(data: InvoicePdfData): Promise<Buffer> {
  return renderToBuffer(<InvoiceDocument data={data} />);
}
