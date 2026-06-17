// ═══════════════════════════════════════════════════════════════════════════
// BILLING LIFECYCLE — single source of truth for the delinquency schedule.
// Both the daily cron (enforcement) and the admin UI (awareness) read these
// numbers, so behaviour and what the admin sees can never drift apart.
// ═══════════════════════════════════════════════════════════════════════════
import type { SubscriptionStatus } from "@/types/database";
import { formatNaira } from "@/lib/billing/pricing";

// Days after the invoice due date that each automated step fires.
export const OVERDUE_REMINDER_DAYS = [3, 7, 14] as const; // last one is the final warning
export const FINAL_WARNING_DAY = 14;
export const SUSPENSION_DAY = 21;

// Payment windows (days from issue) — mirrors lib/billing/invoices.ts.
export const SUBSCRIPTION_DUE_DAYS = 14;
export const BATCH_DUE_DAYS = 7;

// Pre-trial-end notice points (days before trial_ends_at).
export const TRIAL_NOTICE_DAYS = [7, 1] as const;

type RowStatus = SubscriptionStatus | "unconfigured";

export interface OpenInvoiceLite {
  id: string;
  status: string; // 'sent' | 'overdue' | ...
  due_date: string; // ISO date (yyyy-mm-dd)
  created_at: string;
  amount: number;
}

export interface SubLite {
  status: SubscriptionStatus;
  trial_ends_at: string | null;
  current_period_end: string | null;
}

export interface CyclePosition {
  state: RowStatus;
  /** Where the brand sits right now. */
  headline: string;
  /** The next automated action and when, or null if nothing is scheduled. */
  next: string | null;
  /** ISO date the account suspends if the open invoice stays unpaid, else null. */
  suspendsAt: string | null;
  tone: "neutral" | "info" | "warn" | "danger";
}

function startOfDayUTC(d: Date): Date {
  return new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()));
}

function daysBetween(a: Date, b: Date): number {
  return Math.round((b.getTime() - a.getTime()) / 86400000);
}

function addDays(iso: string, days: number): string {
  const d = startOfDayUTC(new Date(iso));
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString().slice(0, 10);
}

function fmt(iso: string | null): string {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
}

// The single open invoice that drives delinquency: prefer overdue, else the
// oldest still-open ('sent') one. Returns null when nothing is outstanding.
export function pickOpenInvoice(invoices: OpenInvoiceLite[]): OpenInvoiceLite | null {
  const open = invoices.filter((i) => i.status === "sent" || i.status === "overdue");
  if (open.length === 0) return null;
  open.sort((a, b) => a.due_date.localeCompare(b.due_date));
  return open[0];
}

// Compute where a brand sits in the billing lifecycle and what happens next.
// Pure and client-safe — used by the admin brand-detail panel.
export function billingCyclePosition(
  sub: SubLite | null,
  openInvoice: OpenInvoiceLite | null,
  now: Date = new Date()
): CyclePosition {
  const today = startOfDayUTC(now);

  if (!sub) {
    return { state: "unconfigured", headline: "Billing not set up", next: "Configure a plan to begin.", suspendsAt: null, tone: "neutral" };
  }

  if (sub.status === "cancelled") {
    return { state: "cancelled", headline: "Subscription cancelled", next: null, suspendsAt: null, tone: "neutral" };
  }

  if (sub.status === "trialing") {
    const endsAt = sub.trial_ends_at;
    return {
      state: "trialing",
      headline: endsAt ? `On trial until ${fmt(endsAt)}` : "On trial",
      next: endsAt ? `First invoice issues ${fmt(endsAt)} (due ${fmt(addDays(endsAt, SUBSCRIPTION_DUE_DAYS))}).` : null,
      suspendsAt: null,
      tone: "info",
    };
  }

  // From here a delinquency state is driven by the open invoice, if any.
  if (openInvoice) {
    const dueDate = startOfDayUTC(new Date(openInvoice.due_date));
    const suspendsAt = addDays(openInvoice.due_date, SUSPENSION_DAY);
    const daysOverdue = daysBetween(dueDate, today);
    const awaitingFirst = sub.status === "past_due";

    if (daysOverdue <= 0) {
      const inDays = -daysOverdue;
      return {
        state: sub.status,
        headline: awaitingFirst ? "Trial ended — awaiting first payment" : "Invoice issued, not yet due",
        next: `Due ${fmt(openInvoice.due_date)}${inDays > 0 ? ` (in ${inDays} day${inDays === 1 ? "" : "s"})` : " (today)"}. First reminder fires ${OVERDUE_REMINDER_DAYS[0]} days after the due date.`,
        suspendsAt,
        tone: awaitingFirst ? "warn" : "neutral",
      };
    }

    // Overdue: find the next scheduled step.
    let next: string;
    if (daysOverdue < OVERDUE_REMINDER_DAYS[0]) {
      next = `Reminder in ${OVERDUE_REMINDER_DAYS[0] - daysOverdue} day(s).`;
    } else if (daysOverdue < OVERDUE_REMINDER_DAYS[1]) {
      next = `Reminder in ${OVERDUE_REMINDER_DAYS[1] - daysOverdue} day(s).`;
    } else if (daysOverdue < FINAL_WARNING_DAY) {
      next = `Final warning in ${FINAL_WARNING_DAY - daysOverdue} day(s).`;
    } else if (daysOverdue < SUSPENSION_DAY) {
      next = `Suspends in ${SUSPENSION_DAY - daysOverdue} day(s) if unpaid.`;
    } else {
      next = "Suspension is due on the next cron run.";
    }

    return {
      state: sub.status,
      headline: `${awaitingFirst ? "First invoice" : "Invoice"} ${daysOverdue} day${daysOverdue === 1 ? "" : "s"} overdue`,
      next: `${next} Suspends ${fmt(suspendsAt)} if unpaid.`,
      suspendsAt,
      tone: daysOverdue >= FINAL_WARNING_DAY ? "danger" : "warn",
    };
  }

  if (sub.status === "suspended") {
    return { state: "suspended", headline: "Suspended for non-payment", next: "Settle the outstanding invoice to restore dashboard access.", suspendsAt: null, tone: "danger" };
  }

  if (sub.status === "past_due") {
    return { state: "past_due", headline: "Awaiting first payment", next: "No open invoice on file — check that the trial-end invoice was issued.", suspendsAt: null, tone: "warn" };
  }

  // active, nothing outstanding.
  return {
    state: "active",
    headline: "Active and current",
    next: sub.current_period_end ? `Next invoice ${fmt(sub.current_period_end)}.` : null,
    suspendsAt: null,
    tone: "neutral",
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// BILLING TIMELINE — the whole relationship as a chronological event feed plus
// the key dates (signed up, trial window, current period, renews on, last
// payment). Pure and client-safe; payment events are derived from invoice
// paid_at so no extra query is needed.
// ─────────────────────────────────────────────────────────────────────────────
export interface TimelineSub {
  status: SubscriptionStatus;
  billing_interval: string;
  created_at: string;
  trial_starts_at: string | null;
  trial_ends_at: string | null;
  current_period_start: string | null;
  current_period_end: string | null;
}

export interface TimelineInvoice {
  id: string;
  type: string;
  amount: number;
  status: string;
  created_at: string;
  due_date: string;
  paid_at: string | null;
  suspended_at: string | null;
}

export type EventKind = "created" | "trial_start" | "trial_end" | "invoice" | "payment" | "suspended" | "scheduled";

export interface TimelineEvent {
  date: string; // ISO
  kind: EventKind;
  title: string;
  detail?: string;
  /** True when the event is in the future (e.g. trial ending, next renewal). */
  upcoming?: boolean;
  tone: "neutral" | "info" | "success" | "warn" | "danger";
}

// Short invoice number — mirrors invoiceNumber() in lib/billing/invoices.ts but
// kept local so this module stays free of the server-only invoice helpers.
function invoiceNo(inv: { id: string; created_at: string }): string {
  return `TGT-${new Date(inv.created_at).getFullYear()}-${inv.id.replace(/-/g, "").slice(0, 8).toUpperCase()}`;
}

export interface KeyDate {
  label: string;
  value: string;
}

// The headline dates for a subscription, in display order.
export function billingKeyDates(sub: TimelineSub | null, invoices: TimelineInvoice[]): KeyDate[] {
  if (!sub) return [];
  const lastPaid = invoices
    .filter((i) => i.paid_at)
    .map((i) => i.paid_at as string)
    .sort()
    .at(-1);

  const dates: KeyDate[] = [
    { label: "Customer since", value: fmt(sub.created_at) },
    {
      label: "Trial period",
      value: sub.trial_starts_at && sub.trial_ends_at ? `${fmt(sub.trial_starts_at)} → ${fmt(sub.trial_ends_at)}` : "No trial",
    },
    {
      label: "Current period",
      value: sub.current_period_start && sub.current_period_end ? `${fmt(sub.current_period_start)} → ${fmt(sub.current_period_end)}` : "—",
    },
    {
      label: sub.status === "active" ? "Renews on" : "Next invoice",
      value: sub.current_period_end ? fmt(sub.current_period_end) : sub.trial_ends_at ? `${fmt(sub.trial_ends_at)} (trial end)` : "—",
    },
    { label: "Billing interval", value: sub.billing_interval.charAt(0).toUpperCase() + sub.billing_interval.slice(1) },
    { label: "Last payment", value: lastPaid ? fmt(lastPaid) : "None yet" },
  ];
  return dates;
}

// Build the chronological event feed (oldest first) for a subscription. Includes
// a trailing "scheduled" marker for the next renewal / trial end when relevant.
export function buildBillingTimeline(
  sub: TimelineSub | null,
  invoices: TimelineInvoice[],
  now: Date = new Date()
): TimelineEvent[] {
  if (!sub) return [];
  const events: TimelineEvent[] = [];
  const today = startOfDayUTC(now);

  if (sub.trial_starts_at && sub.trial_ends_at) {
    events.push({ date: sub.trial_starts_at, kind: "trial_start", title: "Trial started", tone: "info" });
    const ended = startOfDayUTC(new Date(sub.trial_ends_at)) <= today;
    events.push({
      date: sub.trial_ends_at,
      kind: "trial_end",
      title: ended ? "Trial ended" : "Trial ends",
      detail: ended ? "First invoice issued, awaiting payment." : undefined,
      upcoming: !ended,
      tone: ended ? "warn" : "info",
    });
  } else {
    events.push({ date: sub.created_at, kind: "created", title: "Subscription created", tone: "neutral" });
  }

  for (const inv of invoices) {
    const overdue = inv.status === "overdue" || (inv.status === "sent" && startOfDayUTC(new Date(inv.due_date)) < today);
    events.push({
      date: inv.created_at,
      kind: "invoice",
      title: `Invoice ${invoiceNo(inv)} issued`,
      detail: `${inv.type === "batch" ? "Batch order" : "Subscription"} · ${formatNaira(inv.amount)} · due ${fmt(inv.due_date)}`,
      tone: overdue ? "warn" : "neutral",
    });
    if (inv.paid_at) {
      events.push({
        date: inv.paid_at,
        kind: "payment",
        title: "Payment received",
        detail: `${formatNaira(inv.amount)} · invoice ${invoiceNo(inv)}`,
        tone: "success",
      });
    }
    if (inv.suspended_at) {
      events.push({
        date: inv.suspended_at,
        kind: "suspended",
        title: "Account suspended for non-payment",
        detail: `Invoice ${invoiceNo(inv)} unpaid past ${SUSPENSION_DAY} days.`,
        tone: "danger",
      });
    }
  }

  // Forward-looking marker: the next renewal (active) or trial end (trialing).
  if (sub.status === "active" && sub.current_period_end && startOfDayUTC(new Date(sub.current_period_end)) > today) {
    events.push({ date: sub.current_period_end, kind: "scheduled", title: "Next invoice (renewal)", upcoming: true, tone: "info" });
  }

  events.sort((a, b) => a.date.localeCompare(b.date));
  return events;
}
