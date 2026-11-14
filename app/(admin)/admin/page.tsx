import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { createServiceClient } from "@/lib/supabase/server";
import LocalTime from "@/components/ui/LocalTime";
import { embeddedName } from "@/lib/utils";
import type { CompanyStatus, TagStatus } from "@/types/database";

type Named = { name: string } | { name: string }[] | null;

/**
 * The staff landing page. It leads with what is waiting on Tagit (brands to
 * review, batch requests to approve, overdue accounts, new inquiries), then
 * the platform's figures.
 */
export default async function AdminOverviewPage() {
  const supabase = createServiceClient();

  const [companiesResult, tagsResult, batchesResult, overdueResult, inquiriesResult] = await Promise.all([
    supabase.from("companies").select("id, name, status, created_at").order("created_at", { ascending: false }),
    supabase.from("tags").select("status"),
    supabase
      .from("tag_batches")
      .select("id, batch_name, batch_size, cards_quantity, batch_type, status, created_at, companies(name)")
      .in("status", ["pending", "awaiting_payment"])
      .order("created_at", { ascending: true }),
    supabase
      .from("subscriptions")
      .select("company_id, status, companies(name)")
      .in("status", ["past_due", "suspended"]),
    supabase.from("brand_inquiries").select("id", { count: "exact", head: true }).eq("status", "new"),
  ]);

  const companies = (companiesResult.data ?? []) as { id: string; name: string; status: CompanyStatus; created_at: string }[];
  const tags = (tagsResult.data ?? []) as { status: TagStatus }[];
  const batches = (batchesResult.data ?? []) as unknown as {
    id: string;
    batch_name: string | null;
    batch_size: number | null;
    cards_quantity: number | null;
    batch_type: string;
    status: string;
    created_at: string;
    companies: Named;
  }[];
  const overdue = (overdueResult.data ?? []) as unknown as { company_id: string; status: string; companies: Named }[];
  const newInquiries = inquiriesResult.count ?? 0;

  const pendingCompanies = companies.filter((c) => c.status === "pending");
  const batchRequests = batches.filter((b) => b.status === "pending");
  const awaitingPayment = batches.filter((b) => b.status === "awaiting_payment");

  type Task = { key: string; href: string; title: string; detail: string; when?: string; tone?: "alert" };
  const tasks: Task[] = [
    ...overdue.map((o) => ({
      key: `bill-${o.company_id}`,
      href: `/admin/companies/${o.company_id}`,
      title: `${embeddedName(o.companies) ?? "A brand"} is ${o.status === "suspended" ? "suspended" : "overdue"}`,
      detail: o.status === "suspended" ? "Suspended for non-payment. Their scans still work." : "Their invoice is unpaid.",
      tone: "alert" as const,
    })),
    ...pendingCompanies.map((c) => ({
      key: `co-${c.id}`,
      href: `/admin/companies/${c.id}`,
      title: `Review ${c.name}`,
      detail: "New brand application",
      when: c.created_at,
    })),
    ...batchRequests.map((b) => ({
      key: `batch-${b.id}`,
      href: `/admin/batches/${b.id}`,
      title: `Approve a batch for ${embeddedName(b.companies) ?? "a brand"}`,
      detail: describeBatch(b),
      when: b.created_at,
    })),
    ...awaitingPayment.map((b) => ({
      key: `pay-${b.id}`,
      href: `/admin/batches/${b.id}`,
      title: `${embeddedName(b.companies) ?? "A brand"} hasn't paid for a batch`,
      detail: describeBatch(b),
      when: b.created_at,
    })),
  ];

  const figures = [
    { label: "Brands", value: companies.filter((c) => c.status === "approved").length, note: `${pendingCompanies.length} waiting for review`, href: "/admin/companies" },
    { label: "Tags made", value: tags.length, note: "Across every batch", href: "/admin/tags" },
    { label: "In the world", value: tags.filter((t) => ["live", "owned", "transferred"].includes(t.status)).length, note: "Live on a piece", href: "/admin/tags" },
    { label: "Owned", value: tags.filter((t) => ["owned", "transferred"].includes(t.status)).length, note: "With a recorded owner", href: "/admin/ownership" },
  ];

  const waiting = tasks.length + (newInquiries > 0 ? 1 : 0);

  return (
    <div className="p-5 sm:p-8 max-w-5xl mx-auto">
      <div className="page-header">
        <h1 className="page-title">Overview</h1>
        <p className="page-desc">
          {waiting === 0 ? "Nothing is waiting on Tagit right now." : `${waiting} thing${waiting === 1 ? " is" : "s are"} waiting on Tagit.`}
        </p>
      </div>

      <section aria-labelledby="tasks-heading" className="mb-10">
        <h2 id="tasks-heading" className="ov-h2 mb-3">Needs you</h2>
        <div className="card-raised">
          {waiting === 0 ? (
            <p className="px-6 py-7 text-body-sm" style={{ color: "var(--app-body)", maxWidth: "60ch" }}>
              New brand applications, batch requests, unpaid accounts and inquiries from the website will appear here as they arrive.
            </p>
          ) : (
            <ul>
              {tasks.map((t) => (
                <li key={t.key}>
                  <Link href={t.href} className="ov-row">
                    <span
                      aria-hidden
                      className="w-2 h-2 rounded-full shrink-0"
                      style={{ backgroundColor: t.tone === "alert" ? "#b84a4a" : "var(--color-gold)" }}
                    />
                    <span className="flex-1 min-w-0">
                      <span className="block text-body-sm font-medium truncate" style={{ color: "var(--color-onyx)" }}>{t.title}</span>
                      <span className="block text-caption truncate" style={{ color: "var(--app-body)" }}>{t.detail}</span>
                    </span>
                    {t.when && (
                      <span className="hidden sm:block text-caption shrink-0" style={{ color: "var(--app-body)" }}>
                        <LocalTime iso={t.when} pattern="d MMM yyyy" />
                      </span>
                    )}
                    <ArrowRight size={15} aria-hidden style={{ color: "var(--app-body)" }} />
                  </Link>
                </li>
              ))}
              {newInquiries > 0 && (
                <li>
                  <Link href="/admin/inquiries" className="ov-row">
                    <span aria-hidden className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: "var(--color-gold)" }} />
                    <span className="flex-1 min-w-0">
                      <span className="block text-body-sm font-medium" style={{ color: "var(--color-onyx)" }}>
                        Reply to {newInquiries} new inquir{newInquiries === 1 ? "y" : "ies"}
                      </span>
                      <span className="block text-caption" style={{ color: "var(--app-body)" }}>From the website&apos;s walkthrough form</span>
                    </span>
                    <ArrowRight size={15} aria-hidden style={{ color: "var(--app-body)" }} />
                  </Link>
                </li>
              )}
            </ul>
          )}
        </div>
      </section>

      <section aria-label="Platform figures" className="card-raised ov-figures">
        {figures.map((f) => (
          <Link key={f.label} href={f.href} className="ov-figure">
            <span className="ov-figure-value">{f.value.toLocaleString()}</span>
            <span className="block text-body-sm font-medium" style={{ color: "var(--color-onyx)" }}>{f.label}</span>
            <span className="block text-caption" style={{ color: "var(--app-body)" }}>{f.note}</span>
          </Link>
        ))}
      </section>
    </div>
  );
}

function describeBatch(b: { batch_name: string | null; batch_size: number | null; cards_quantity: number | null }) {
  const parts: string[] = [];
  // batch_size counts tags and cards_quantity counts cards, whatever the type.
  if (b.batch_size) parts.push(`${b.batch_size.toLocaleString()} tags`);
  if (b.cards_quantity) parts.push(`${b.cards_quantity.toLocaleString()} cards`);
  const size = parts.join(" and ") || "Size not given";
  return b.batch_name ? `${b.batch_name}: ${size}` : size;
}
