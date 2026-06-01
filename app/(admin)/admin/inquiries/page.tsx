import { createServiceClient } from "@/lib/supabase/server";
import { format } from "date-fns";
import { Inbox } from "lucide-react";
import InquiryActions from "./InquiryActions";

type InquiryStatus = 'new' | 'contacted' | 'converted' | 'declined';

const STATUS_STYLES: Record<InquiryStatus, { bg: string; color: string; label: string }> = {
  new:       { bg: "#EFF6FF", color: "#1D4ED8", label: "New" },
  contacted: { bg: "var(--color-soft-gold)", color: "var(--color-deep-gold)", label: "Contacted" },
  converted: { bg: "#ECFDF5", color: "#065F46", label: "Converted" },
  declined:  { bg: "#F3F4F6", color: "#374151", label: "Declined" },
};

export default async function InquiriesPage() {
  const supabase = createServiceClient();

  const { data } = await supabase
    .from("brand_inquiries")
    .select("*")
    .order("created_at", { ascending: false });

  const inquiries = data ?? [];

  const counts = {
    all: inquiries.length,
    new: inquiries.filter((i) => i.status === "new").length,
  };

  return (
    <div className="p-8 max-w-5xl mx-auto">
      <div className="mb-8">
        <h1 className="text-h2 font-semibold" style={{ color: "var(--color-charcoal)" }}>
          Brand Inquiries
        </h1>
        <p className="mt-1" style={{ color: "var(--color-slate)", fontSize: "var(--text-body-sm)" }}>
          Access requests from prospective brand partners
          {counts.new > 0 && (
            <span
              className="ml-2 px-2 py-0.5 rounded-full text-micro font-semibold"
              style={{ backgroundColor: "#EFF6FF", color: "#1D4ED8" }}
            >
              {counts.new} new
            </span>
          )}
        </p>
      </div>

      <div
        className="rounded-xl overflow-hidden"
        style={{ border: "1px solid var(--color-cream)", boxShadow: "var(--shadow-sm)" }}
      >
        {inquiries.length === 0 ? (
          <div className="py-16 text-center" style={{ color: "var(--color-mist)" }}>
            <Inbox size={32} className="mx-auto mb-3 opacity-30" />
            <p style={{ fontSize: "var(--text-body-sm)" }}>No inquiries yet</p>
          </div>
        ) : (
          <table className="w-full">
            <thead>
              <tr style={{ backgroundColor: "var(--color-smoke)", borderBottom: "1px solid var(--color-cream)" }}>
                {["Name", "Company", "Contact", "Status", "Submitted", ""].map((h) => (
                  <th
                    key={h}
                    className="text-left px-5 py-3 text-micro font-medium uppercase tracking-wider"
                    style={{ color: "var(--color-slate)" }}
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {inquiries.map((inquiry, i) => {
                const s = STATUS_STYLES[inquiry.status as InquiryStatus] ?? STATUS_STYLES.new;
                return (
                  <tr
                    key={inquiry.id}
                    style={{
                      backgroundColor: "var(--color-pearl)",
                      borderBottom: i < inquiries.length - 1 ? "1px solid var(--color-cream)" : "none",
                    }}
                  >
                    <td className="px-5 py-4">
                      <p className="font-medium" style={{ color: "var(--color-charcoal)", fontSize: "var(--text-body-sm)" }}>
                        {inquiry.name}
                      </p>
                    </td>
                    <td className="px-5 py-4">
                      <span style={{ color: "var(--color-graphite)", fontSize: "var(--text-body-sm)" }}>
                        {inquiry.company}
                      </span>
                    </td>
                    <td className="px-5 py-4">
                      <p style={{ color: "var(--color-graphite)", fontSize: "var(--text-body-sm)" }}>
                        {inquiry.email}
                      </p>
                      {inquiry.phone && (
                        <p style={{ color: "var(--color-mist)", fontSize: "var(--text-caption)" }}>
                          {inquiry.phone}
                        </p>
                      )}
                    </td>
                    <td className="px-5 py-4">
                      <span
                        className="px-2.5 py-1 rounded-full text-micro font-medium"
                        style={{ backgroundColor: s.bg, color: s.color }}
                      >
                        {s.label}
                      </span>
                    </td>
                    <td className="px-5 py-4">
                      <span style={{ color: "var(--color-slate)", fontSize: "var(--text-body-sm)" }}>
                        {format(new Date(inquiry.created_at), "MMM d, yyyy")}
                      </span>
                    </td>
                    <td className="px-5 py-4">
                      <InquiryActions
                        inquiryId={inquiry.id}
                        status={inquiry.status as "new" | "contacted" | "converted" | "declined"}
                      />
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
