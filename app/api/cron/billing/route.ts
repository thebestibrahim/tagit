import { createAdminClient } from "@/lib/supabase/admin";
import { log } from "@/lib/logger";
import { NextResponse } from "next/server";
import {
  createSubscriptionInvoice,
  sendInvoiceEmail,
  sendTrialEndedInvoice,
  invoiceNumber,
} from "@/lib/billing/invoices";
import { getEffectivePrice } from "@/lib/billing/pricing";
import {
  sendTrialEnding7Email,
  sendTrialEndingTomorrowEmail,
  sendInvoiceReminderEmail,
  sendAccountSuspendedEmail,
} from "@/lib/email";

// Daily billing cron (08:00). Guarded by CRON_SECRET.
// Four tasks: trial endings, due invoices, overdue escalation, suspensions.
// It NEVER touches chip scanning — /v/[token] always works.
export async function GET(request: Request) {
  const auth = request.headers.get("authorization");
  if (!process.env.CRON_SECRET || auth !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const admin = createAdminClient();
  const today = startOfDay(new Date());
  const todayStr = today.toISOString().slice(0, 10);
  const result = { trials: 0, invoices: 0, reminders: 0, suspensions: 0 };

  // ── Task 1 — trial endings ──────────────────────────────────────────────
  try {
    const { data: trials } = await admin
      .from("subscriptions")
      .select("*, plans(name, monthly_price), companies(name, email)")
      .eq("status", "trialing");

    for (const sub of trials ?? []) {
      const s = sub as typeof sub & {
        plans: { name: string; monthly_price: number } | null;
        companies: { name: string; email: string } | null;
      };
      if (!s.trial_ends_at || !s.companies?.email) continue;
      const endsAt = startOfDay(new Date(s.trial_ends_at));
      const days = daysBetween(today, endsAt);
      const firstAmount = getEffectivePrice(
        s.plans?.monthly_price ?? 0,
        s.custom_monthly_price,
        s.billing_interval
      );

      if (days === 7) {
        await sendTrialEnding7Email(s.companies.email, {
          companyName: s.companies.name,
          trialEndsAt: s.trial_ends_at,
          firstInvoiceAmount: firstAmount,
        }).catch((e) => log.error("cron/billing", "7-day trial email", e));
      } else if (days === 1) {
        await sendTrialEndingTomorrowEmail(s.companies.email, {
          companyName: s.companies.name,
          trialEndsAt: s.trial_ends_at,
          firstInvoiceAmount: firstAmount,
        }).catch((e) => log.error("cron/billing", "1-day trial email", e));
      } else if (endsAt <= today) {
        // Trial over: first invoice (with PDF) + activate.
        const invoice = await createSubscriptionInvoice(admin, s.id);
        await sendTrialEndedInvoice(admin, invoice.id);
        await admin.from("subscriptions").update({ status: "active" }).eq("id", s.id);
        result.trials += 1;
        result.invoices += 1;
      }
    }
  } catch (err) {
    log.error("cron/billing", "Task 1 (trials) failed", err);
  }

  // ── Task 2 — subscription invoices due today ────────────────────────────
  try {
    const { data: due } = await admin
      .from("subscriptions")
      .select("id, current_period_end")
      .eq("status", "active");

    for (const sub of due ?? []) {
      if (!sub.current_period_end) continue;
      if (sub.current_period_end.slice(0, 10) !== todayStr) continue;

      // Guard against double-generation: skip if an invoice already exists for
      // this subscription created today.
      const { data: existing } = await admin
        .from("invoices")
        .select("id")
        .eq("subscription_id", sub.id)
        .gte("created_at", `${todayStr}T00:00:00Z`)
        .maybeSingle();
      if (existing) continue;

      // createSubscriptionInvoice applies + consumes the subscription discount
      // and advances the billing period.
      const invoice = await createSubscriptionInvoice(admin, sub.id);
      await sendInvoiceEmail(admin, invoice.id, "subscription");
      result.invoices += 1;
    }
  } catch (err) {
    log.error("cron/billing", "Task 2 (invoices) failed", err);
  }

  // ── Task 3 + 4 — overdue escalation + suspension ────────────────────────
  try {
    const { data: overdue } = await admin
      .from("invoices")
      .select("*, companies(name, email)")
      .eq("status", "sent")
      .lt("due_date", todayStr);

    for (const inv of overdue ?? []) {
      const i = inv as typeof inv & { companies: { name: string; email: string } | null };
      const email = i.companies?.email;
      const dueDate = startOfDay(new Date(i.due_date));
      const daysOverdue = daysBetween(dueDate, today);
      const now = new Date().toISOString();

      if (daysOverdue >= 21 && !i.suspended_at) {
        await admin.from("invoices").update({ status: "overdue", suspended_at: now }).eq("id", i.id);
        await admin
          .from("subscriptions")
          .update({ status: "suspended", updated_at: now })
          .eq("company_id", i.company_id);
        if (email) {
          await sendAccountSuspendedEmail(email, {
            companyName: i.companies!.name,
            invoiceNumber: invoiceNumber(i),
            amount: i.amount,
            payUrl: i.paystack_payment_link,
          }).catch((e) => log.error("cron/billing", "Suspension email", e));
        }
        result.suspensions += 1;
        continue;
      }

      if (daysOverdue >= 14 && !i.reminder_14_sent_at) {
        if (email) {
          await sendInvoiceReminderEmail(email, {
            companyName: i.companies!.name,
            invoiceNumber: invoiceNumber(i),
            amount: i.amount,
            daysOverdue,
            payUrl: i.paystack_payment_link,
            finalWarning: true,
          }).catch((e) => log.error("cron/billing", "Day 14 email", e));
        }
        await admin.from("invoices").update({ reminder_14_sent_at: now }).eq("id", i.id);
        result.reminders += 1;
      } else if (daysOverdue >= 7 && !i.reminder_7_sent_at) {
        if (email) {
          await sendInvoiceReminderEmail(email, {
            companyName: i.companies!.name,
            invoiceNumber: invoiceNumber(i),
            amount: i.amount,
            daysOverdue,
            payUrl: i.paystack_payment_link,
            finalWarning: false,
          }).catch((e) => log.error("cron/billing", "Day 7 email", e));
        }
        await admin.from("invoices").update({ reminder_7_sent_at: now }).eq("id", i.id);
        result.reminders += 1;
      } else if (daysOverdue >= 3 && !i.reminder_3_sent_at) {
        if (email) {
          await sendInvoiceReminderEmail(email, {
            companyName: i.companies!.name,
            invoiceNumber: invoiceNumber(i),
            amount: i.amount,
            daysOverdue,
            payUrl: i.paystack_payment_link,
            finalWarning: false,
          }).catch((e) => log.error("cron/billing", "Day 3 email", e));
        }
        await admin.from("invoices").update({ reminder_3_sent_at: now }).eq("id", i.id);
        result.reminders += 1;
      }
    }
  } catch (err) {
    log.error("cron/billing", "Task 3/4 (overdue) failed", err);
  }

  return NextResponse.json({ ok: true, ...result });
}

function startOfDay(d: Date): Date {
  return new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()));
}

function daysBetween(a: Date, b: Date): number {
  return Math.round((b.getTime() - a.getTime()) / 86400000);
}
