"use client";

import { useState } from "react";
import { ChevronDown, BookOpen } from "lucide-react";
import {
  OVERDUE_REMINDER_DAYS,
  FINAL_WARNING_DAY,
  SUSPENSION_DAY,
  SUBSCRIPTION_DUE_DAYS,
  TRIAL_NOTICE_DAYS,
} from "@/lib/billing/lifecycle";

// The whole billing policy in one place, driven by the same constants the cron
// enforces — so this reference can never describe a schedule the system doesn't
// actually run. Collapsible; collapsed by default to keep the page calm.
export function BillingReference() {
  const [open, setOpen] = useState(false);

  return (
    <div className="mt-8 rounded-xl overflow-hidden" style={{ border: "1px solid var(--color-cream)", backgroundColor: "var(--color-pearl)" }}>
      <button
        onClick={() => setOpen((v) => !v)}
        className="w-full flex items-center justify-between px-5 py-4"
        style={{ backgroundColor: "var(--color-smoke)" }}
      >
        <span className="flex items-center gap-2.5">
          <BookOpen size={16} style={{ color: "var(--color-slate)" }} />
          <span className="text-body-sm font-semibold" style={{ color: "var(--color-charcoal)" }}>How billing works (full lifecycle)</span>
        </span>
        <ChevronDown size={16} style={{ color: "var(--color-slate)", transform: open ? "rotate(180deg)" : "none", transition: "transform 0.15s" }} />
      </button>

      {open && (
        <div className="px-6 py-5 space-y-6">
          <Stage
            title="1 · Trial"
            steps={[
              ["On signup", "Welcome email. Subscription is in Trial; the brand has full dashboard access."],
              [`${TRIAL_NOTICE_DAYS[0]} days before trial ends`, "Heads-up email with the first invoice amount."],
              [`${TRIAL_NOTICE_DAYS[1]} day before`, "Final trial reminder email."],
            ]}
          />
          <Stage
            title="2 · Trial ends, no payment yet"
            steps={[
              ["Trial end date", `First invoice is issued (due ${SUBSCRIPTION_DUE_DAYS} days later) with a Paystack link and PDF.`],
              ["Status", "Subscription moves to Awaiting payment (past due). The dashboard stays usable but new chip orders are paused until the first invoice is paid."],
              ["Chip scanning", "Always works. Customer verification is never affected at any stage."],
            ]}
          />
          <Stage
            title="3 · Payment received"
            steps={[
              ["Any time", "Paying via the Paystack link, or an admin marking the invoice paid, settles it instantly."],
              ["Result", "Subscription becomes Active, full access is restored, and the next billing period starts."],
            ]}
          />
          <Stage
            title="4 · Invoice goes unpaid (overdue escalation)"
            tone="warn"
            steps={[
              [`Due date + ${OVERDUE_REMINDER_DAYS[0]} days`, "First overdue reminder email."],
              [`+ ${OVERDUE_REMINDER_DAYS[1]} days`, "Second overdue reminder email."],
              [`+ ${FINAL_WARNING_DAY} days`, "Final warning email."],
              [`+ ${SUSPENSION_DAY} days`, "Dashboard access is suspended and a suspension email is sent. The invoice is marked overdue. Paying restores access immediately."],
            ]}
          />
          <Stage
            title="5 · Active subscriptions (recurring)"
            steps={[
              ["Each period end", `A new invoice is issued automatically (due ${SUBSCRIPTION_DUE_DAYS} days later).`],
              ["If unpaid", "The same overdue escalation in stage 4 applies."],
            ]}
          />
          <Stage
            title="6 · Manual reminders (admin)"
            steps={[
              ["Any open invoice", "From a brand's billing detail, use Send reminder to email the brand about a due-soon or overdue invoice. The email adapts its wording and reuses the invoice's payment link."],
            ]}
          />
        </div>
      )}
    </div>
  );
}

function Stage({ title, steps, tone }: { title: string; steps: [string, string][]; tone?: "warn" }) {
  return (
    <div>
      <h4 className="text-body-sm font-semibold mb-2.5" style={{ color: tone === "warn" ? "#92400E" : "var(--color-charcoal)" }}>{title}</h4>
      <div className="space-y-2">
        {steps.map(([when, what], i) => (
          <div key={i} className="grid grid-cols-[160px_1fr] gap-3 items-start">
            <span className="text-caption font-medium" style={{ color: "var(--color-slate)" }}>{when}</span>
            <span className="text-caption" style={{ color: "var(--color-graphite)" }}>{what}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
