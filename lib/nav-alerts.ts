import { createAdminClient } from "@/lib/supabase/admin";

// Nav alert dots. Each result is cached at module level for 60s so we don't
// re-query on every page load within a dashboard session. (React cache() only
// dedupes within a single request; we want a short cross-request TTL.)

const TTL_MS = 60_000;

interface Cached<T> {
  at: number;
  data: T;
}

export interface BrandNavAlerts {
  billing: boolean;
  ownership: boolean;
}

export interface AdminNavAlerts {
  companies: boolean;
  billing: boolean;
  batches: boolean;
}

// Admin: a batch awaiting payment for longer than this many days is flagged.
const AWAITING_PAYMENT_ALERT_DAYS = 2;

const brandCache = new Map<string, Cached<BrandNavAlerts>>();
let adminCache: Cached<AdminNavAlerts> | null = null;

function todayISO(): string {
  return new Date().toISOString().slice(0, 10);
}

// Brand dashboard: Billing dot (overdue invoice or past_due/suspended sub),
// Ownership dot (a pending ownership claim on one of the brand's tags).
export async function getBrandNavAlerts(companyId: string): Promise<BrandNavAlerts> {
  const cached = brandCache.get(companyId);
  if (cached && Date.now() - cached.at < TTL_MS) return cached.data;

  const admin = createAdminClient();
  const today = todayISO();

  const [{ data: sub }, { count: overdueCount }, { data: tagRows }] = await Promise.all([
    admin.from("subscriptions").select("status").eq("company_id", companyId).maybeSingle(),
    admin
      .from("invoices")
      .select("id", { count: "exact", head: true })
      .eq("company_id", companyId)
      .eq("status", "sent")
      .lte("due_date", today),
    admin.from("tags").select("id").eq("company_id", companyId),
  ]);

  const billing =
    sub?.status === "past_due" ||
    sub?.status === "suspended" ||
    (overdueCount ?? 0) > 0;

  let ownership = false;
  const tagIds = (tagRows ?? []).map((t) => t.id);
  if (tagIds.length) {
    const { count } = await admin
      .from("ownership_claims")
      .select("id", { count: "exact", head: true })
      .eq("status", "pending")
      .in("tag_id", tagIds);
    ownership = (count ?? 0) > 0;
  }

  const data: BrandNavAlerts = { billing, ownership };
  brandCache.set(companyId, { at: Date.now(), data });
  return data;
}

// Admin dashboard: Companies dot (a company awaiting approval), Billing dot
// (any past_due/suspended subscription), Batches dot (a batch awaiting payment
// for more than AWAITING_PAYMENT_ALERT_DAYS).
export async function getAdminNavAlerts(): Promise<AdminNavAlerts> {
  if (adminCache && Date.now() - adminCache.at < TTL_MS) return adminCache.data;

  const admin = createAdminClient();
  const staleBefore = new Date(Date.now() - AWAITING_PAYMENT_ALERT_DAYS * 86400000).toISOString();

  const [{ count: pendingCompanies }, { data: pastDueSubs }, { count: staleBatches }] = await Promise.all([
    admin.from("companies").select("id", { count: "exact", head: true }).eq("status", "pending"),
    admin.from("subscriptions").select("id").in("status", ["past_due", "suspended"]).limit(1),
    admin
      .from("tag_batches")
      .select("id", { count: "exact", head: true })
      .eq("status", "awaiting_payment")
      .lt("created_at", staleBefore),
  ]);

  const data: AdminNavAlerts = {
    companies: (pendingCompanies ?? 0) > 0,
    billing: (pastDueSubs ?? []).length > 0,
    batches: (staleBatches ?? 0) > 0,
  };
  adminCache = { at: Date.now(), data };
  return data;
}
