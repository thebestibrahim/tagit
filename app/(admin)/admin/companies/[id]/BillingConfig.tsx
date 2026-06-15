"use client";

import { useEffect, useState, useCallback } from "react";
import { toast } from "sonner";
import { formatNaira, getEffectivePrice } from "@/lib/billing/pricing";
import { effectiveLimit } from "@/lib/billing/limits";
import type { Plan, Subscription, Discount, Invoice, InvoiceLineItem, VolumeTier, BillingInterval } from "@/types/database";

type InvoiceWithItems = Invoice & { invoice_line_items: InvoiceLineItem[] };

interface BillingData {
  subscription: (Subscription & { plans: { name: string; monthly_price: number } | null }) | null;
  subscription_discount: Discount | null;
  batch_discount: Discount | null;
  pricing: { tag_tiers: VolumeTier[]; card_tiers: VolumeTier[] } | null;
  invoices: InvoiceWithItems[];
  plans: Plan[];
}

const DEFAULT_TIERS: VolumeTier[] = [
  { min: 1, max: 50, price_per_unit: 400000 },
  { min: 51, max: 100, price_per_unit: 350000 },
  { min: 101, max: 200, price_per_unit: 300000 },
  { min: 201, max: null, price_per_unit: 250000 },
];

const INTERVALS: BillingInterval[] = ["monthly", "quarterly", "annually"];

export function BillingConfig({ companyId }: { companyId: string }) {
  const [data, setData] = useState<BillingData | null>(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    const res = await fetch(`/api/admin/billing/${companyId}`);
    if (res.ok) setData(await res.json());
    setLoading(false);
  }, [companyId]);

  // Fetch the billing config once on mount. Standard client data-fetch — state
  // is set inside the async callback, not synchronously in the effect body.
  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => { load(); }, [load]);

  if (loading) return <p className="text-body-sm" style={{ color: "var(--color-mist)" }}>Loading billing…</p>;
  if (!data) return <p className="text-body-sm" style={{ color: "#991B1B" }}>Failed to load billing.</p>;

  return (
    <div className="space-y-8">
      <SubscriptionForm companyId={companyId} data={data} onSaved={load} />
      <DiscountSection companyId={companyId} type="subscription" discount={data.subscription_discount} onChange={load} />
      <DiscountSection companyId={companyId} type="batch" discount={data.batch_discount} onChange={load} />
      <PricingEditor companyId={companyId} data={data} onSaved={load} />
      <InvoiceHistory invoices={data.invoices} onChange={load} />
    </div>
  );
}

function fieldStyle() {
  return { backgroundColor: "var(--color-pearl)", border: "1px solid var(--color-cream)", color: "var(--color-charcoal)" } as const;
}

function SubscriptionForm({ companyId, data, onSaved }: { companyId: string; data: BillingData; onSaved: () => void }) {
  const sub = data.subscription;
  const [planId, setPlanId] = useState(sub?.plan_id ?? data.plans[0]?.id ?? "");
  const [interval, setInterval] = useState<BillingInterval>(sub?.billing_interval ?? "monthly");
  const [customNaira, setCustomNaira] = useState(sub?.custom_monthly_price ? String(sub.custom_monthly_price / 100) : "");
  const [tagOverride, setTagOverride] = useState(sub?.tag_limit_override != null ? String(sub.tag_limit_override) : "");
  const [cardOverride, setCardOverride] = useState(sub?.card_limit_override != null ? String(sub.card_limit_override) : "");
  const [trialDays, setTrialDays] = useState("0");
  const [saving, setSaving] = useState(false);
  // Once billing is set up, show a read-only summary; the form is revealed only
  // when the admin chooses to change the plan (upgrade/downgrade) or details.
  const [editing, setEditing] = useState(false);

  const selectedPlan = data.plans.find((p) => p.id === planId);
  const planTagLimit = selectedPlan?.tag_limit;
  const planCardLimit = selectedPlan?.card_limit;
  const limitHint = (v: number | null | undefined) => (v == null ? "unlimited (Bespoke)" : `${v} lifetime`);

  const isSetUp = !!sub;
  const currentPlan = data.plans.find((p) => p.id === sub?.plan_id);
  const fmtD = (d: string | null | undefined) =>
    d ? new Date(d).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" }) : "—";
  // A mid-cycle edit: an active brand whose plan/interval/price changed, with no
  // trial being set. New pricing applies on the next invoice (period preserved).
  const newCustom = customNaira ? Math.round(parseFloat(customNaira) * 100) : null;
  const planChanged =
    isSetUp &&
    (planId !== sub?.plan_id || interval !== sub?.billing_interval || newCustom !== (sub?.custom_monthly_price ?? null));
  const midCycle = isSetUp && (sub?.status === "active" || sub?.status === "past_due") && planChanged && (parseInt(trialDays, 10) || 0) === 0;

  async function save() {
    setSaving(true);
    const res = await fetch(`/api/admin/billing/${companyId}/configure`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        plan_id: planId,
        billing_interval: interval,
        custom_monthly_price: customNaira ? Math.round(parseFloat(customNaira) * 100) : null,
        tag_limit_override: tagOverride.trim() === "" ? null : parseInt(tagOverride, 10),
        card_limit_override: cardOverride.trim() === "" ? null : parseInt(cardOverride, 10),
        trial_days: parseInt(trialDays, 10) || 0,
      }),
    });
    setSaving(false);
    if (res.ok) { toast.success("Configuration saved"); setEditing(false); onSaved(); }
    else toast.error("Save failed");
  }

  // Discard edits and return to the summary, restoring the saved values.
  function cancelEdit() {
    setPlanId(sub?.plan_id ?? data.plans[0]?.id ?? "");
    setInterval(sub?.billing_interval ?? "monthly");
    setCustomNaira(sub?.custom_monthly_price ? String(sub.custom_monthly_price / 100) : "");
    setTagOverride(sub?.tag_limit_override != null ? String(sub.tag_limit_override) : "");
    setCardOverride(sub?.card_limit_override != null ? String(sub.card_limit_override) : "");
    setTrialDays("0");
    setEditing(false);
  }

  // ── Read-only summary (shown once billing is set up and not being edited) ──
  if (isSetUp && sub && !editing) {
    const planPrice = currentPlan?.monthly_price ?? sub.plans?.monthly_price ?? 0;
    const intervalAmount = getEffectivePrice(planPrice, sub.custom_monthly_price, sub.billing_interval);
    const tagLimit = effectiveLimit(sub.tag_limit_override, currentPlan?.tag_limit);
    const cardLimit = effectiveLimit(sub.card_limit_override, currentPlan?.card_limit);
    const nextBilling =
      sub.status === "trialing"
        ? `Trial ends ${fmtD(sub.trial_ends_at)}`
        : sub.status === "past_due"
        ? "Awaiting first payment"
        : sub.status === "suspended"
        ? "Suspended — payment required"
        : sub.current_period_end
        ? fmtD(sub.current_period_end)
        : "—";

    return (
      <Block title="Subscription">
        <div className="rounded-xl overflow-hidden" style={{ border: "1px solid var(--color-cream)" }}>
          <div className="flex items-center justify-between px-5 py-4" style={{ backgroundColor: "var(--color-smoke)", borderBottom: "1px solid var(--color-cream)" }}>
            <div className="flex items-center gap-3">
              <span className="text-body font-semibold" style={{ color: "var(--color-charcoal)" }}>{currentPlan?.name ?? sub.plans?.name ?? "Plan"}</span>
              <StatusPill status={sub.status} />
            </div>
            <button onClick={() => setEditing(true)} className="text-micro font-semibold px-3.5 py-1.5 rounded-full" style={{ backgroundColor: "var(--color-charcoal)", color: "var(--color-pearl)" }}>
              Change plan
            </button>
          </div>
          <dl className="grid grid-cols-2 gap-x-6 gap-y-3 px-5 py-4">
            <SummaryRow label="Billing" value={`${cap(sub.billing_interval)} · ${formatNaira(intervalAmount)}`} />
            <SummaryRow label="Next billing" value={nextBilling} />
            <SummaryRow label="Tag allowance" value={tagLimit === null ? "Unlimited" : `${tagLimit.toLocaleString()} lifetime`} />
            <SummaryRow label="Card allowance" value={cardLimit === null ? "Unlimited" : `${cardLimit.toLocaleString()} lifetime`} />
            {sub.custom_monthly_price != null && <SummaryRow label="Custom price" value={`${formatNaira(sub.custom_monthly_price)}/mo`} />}
            <SummaryRow label="Ordered to date" value={`${sub.tags_ordered_total.toLocaleString()} tags · ${sub.cards_ordered_total.toLocaleString()} cards`} />
          </dl>
        </div>
      </Block>
    );
  }

  return (
    <Block title={isSetUp ? "Change plan" : "Subscription configuration"}>
      {/* Current state */}
      <div className="mb-4 rounded-lg px-4 py-3" style={{ backgroundColor: isSetUp ? "var(--color-smoke)" : "var(--color-soft-gold)", border: `1px solid ${isSetUp ? "var(--color-cream)" : "var(--color-champagne)"}` }}>
        {!isSetUp ? (
          <p className="text-body-sm" style={{ color: "var(--color-deep-gold)" }}>
            Billing isn&apos;t set up yet. Choose a plan and save to set it up.
          </p>
        ) : (
          <p className="text-body-sm" style={{ color: "var(--color-charcoal)" }}>
            Changing the plan or price is an upgrade/downgrade — it takes effect on the next invoice; the current period is unchanged. Leave the trial at 0 unless you are starting a new trial.
          </p>
        )}
      </div>

      <div className="grid grid-cols-2 gap-4">
        <Labeled label="Plan">
          <select value={planId} onChange={(e) => setPlanId(e.target.value)} className="w-full px-3 py-2 rounded-lg text-body-sm" style={fieldStyle()}>
            {data.plans.map((p) => <option key={p.id} value={p.id}>{p.name} — {formatNaira(p.monthly_price)}/mo</option>)}
          </select>
        </Labeled>
        <Labeled label="Billing interval">
          <select value={interval} onChange={(e) => setInterval(e.target.value as BillingInterval)} className="w-full px-3 py-2 rounded-lg text-body-sm" style={fieldStyle()}>
            {INTERVALS.map((i) => <option key={i} value={i}>{i[0].toUpperCase() + i.slice(1)}</option>)}
          </select>
        </Labeled>
        <Labeled label="Custom price (₦/month, blank = plan default)">
          <input value={customNaira} onChange={(e) => setCustomNaira(e.target.value)} placeholder="e.g. 120000" className="w-full px-3 py-2 rounded-lg text-body-sm" style={fieldStyle()} />
        </Labeled>
        <Labeled label="Trial period (days from today, 0 = none)">
          <input value={trialDays} onChange={(e) => setTrialDays(e.target.value)} className="w-full px-3 py-2 rounded-lg text-body-sm" style={fieldStyle()} />
        </Labeled>
      </div>

      {/* Lifetime chip limits */}
      <div className="mt-4">
        <p className="text-micro font-semibold uppercase tracking-wider mb-2" style={{ color: "var(--color-mist)" }}>Lifetime chip limits</p>
        <div className="grid grid-cols-2 gap-4">
          <Labeled label={`Tag limit override (plan: ${limitHint(planTagLimit)})`}>
            <input value={tagOverride} onChange={(e) => setTagOverride(e.target.value)} placeholder="Blank = plan default" className="w-full px-3 py-2 rounded-lg text-body-sm" style={fieldStyle()} />
          </Labeled>
          <Labeled label={`Card limit override (plan: ${limitHint(planCardLimit)})`}>
            <input value={cardOverride} onChange={(e) => setCardOverride(e.target.value)} placeholder="Blank = plan default" className="w-full px-3 py-2 rounded-lg text-body-sm" style={fieldStyle()} />
          </Labeled>
        </div>
        {sub && (
          <p className="text-caption mt-2" style={{ color: "var(--color-mist)" }}>
            Ordered so far: {sub.tags_ordered_total} tags · {sub.cards_ordered_total} cards (lifetime, never resets)
          </p>
        )}
      </div>

      {midCycle && (
        <p className="text-caption mt-3 rounded-lg px-3 py-2" style={{ color: "var(--color-deep-gold)", backgroundColor: "var(--color-soft-gold)", border: "1px solid var(--color-champagne)" }}>
          Mid-cycle change: the new plan and pricing take effect on the next invoice ({fmtD(sub?.current_period_end)}). The current period is unchanged.
        </p>
      )}
      <div className="flex items-center gap-2">
        <SaveButton onClick={save} saving={saving}>{isSetUp ? "Save changes" : "Set up billing"}</SaveButton>
        {isSetUp && (
          <button onClick={cancelEdit} disabled={saving} className="mt-4 px-5 py-2 rounded-lg text-body-sm font-medium" style={{ backgroundColor: "var(--color-linen)", color: "var(--color-graphite)" }}>
            Cancel
          </button>
        )}
      </div>
    </Block>
  );
}

function StatusPill({ status }: { status: string }) {
  const tones: Record<string, { bg: string; color: string }> = {
    active: { bg: "#DCFCE7", color: "#166534" },
    trialing: { bg: "var(--color-soft-gold)", color: "var(--color-deep-gold)" },
    past_due: { bg: "#FEF2F2", color: "#991B1B" },
    suspended: { bg: "#FEF2F2", color: "#991B1B" },
    cancelled: { bg: "var(--color-cream)", color: "var(--color-mist)" },
  };
  const t = tones[status] ?? tones.cancelled;
  const label = status === "past_due" ? "Awaiting payment" : status.charAt(0).toUpperCase() + status.slice(1);
  return (
    <span className="text-micro font-semibold px-2.5 py-1 rounded-full" style={{ backgroundColor: t.bg, color: t.color }}>
      {label}
    </span>
  );
}

function SummaryRow({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-caption" style={{ color: "var(--color-mist)" }}>{label}</dt>
      <dd className="mt-0.5 text-body-sm font-medium" style={{ color: "var(--color-charcoal)" }}>{value}</dd>
    </div>
  );
}

function cap(s: string): string {
  return s.charAt(0).toUpperCase() + s.slice(1);
}

function DiscountSection({ companyId, type, discount, onChange }: { companyId: string; type: "subscription" | "batch"; discount: Discount | null; onChange: () => void }) {
  const [pct, setPct] = useState("");
  const [dur, setDur] = useState("");
  const [note, setNote] = useState("");
  const [busy, setBusy] = useState(false);
  const unit = type === "subscription" ? "billing cycles" : "batch orders";

  async function apply() {
    const p = parseInt(pct, 10), d = parseInt(dur, 10);
    if (!(p >= 1 && p <= 100) || !(d >= 1)) { toast.error("Enter a valid percentage (1–100) and duration"); return; }
    setBusy(true);
    const res = await fetch(`/api/admin/billing/${companyId}/discount`, {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ type, percentage: p, duration: d, note }),
    });
    setBusy(false);
    if (res.ok) { toast.success("Discount applied"); setPct(""); setDur(""); setNote(""); onChange(); }
    else toast.error("Failed to apply discount");
  }

  async function remove() {
    if (!discount) return;
    setBusy(true);
    const res = await fetch(`/api/admin/billing/${companyId}/discount/${discount.id}`, { method: "DELETE" });
    setBusy(false);
    if (res.ok) { toast.success("Discount removed"); onChange(); }
    else toast.error("Failed to remove discount");
  }

  return (
    <Block title={`${type === "subscription" ? "Subscription" : "Batch order"} discount`}>
      <p className="text-body-sm mb-3" style={{ color: discount ? "var(--color-gold)" : "var(--color-mist)" }}>
        {discount ? `Active: ${discount.percentage}% off — ${discount.used} of ${discount.duration} ${unit} used` : "Active: None"}
      </p>
      <div className="grid grid-cols-2 gap-4">
        <Labeled label="Percentage"><input value={pct} onChange={(e) => setPct(e.target.value)} placeholder="20" className="w-full px-3 py-2 rounded-lg text-body-sm" style={fieldStyle()} /></Labeled>
        <Labeled label={`Duration (${unit})`}><input value={dur} onChange={(e) => setDur(e.target.value)} placeholder="3" className="w-full px-3 py-2 rounded-lg text-body-sm" style={fieldStyle()} /></Labeled>
      </div>
      <div className="mt-4"><Labeled label="Internal note (optional)"><input value={note} onChange={(e) => setNote(e.target.value)} className="w-full px-3 py-2 rounded-lg text-body-sm" style={fieldStyle()} /></Labeled></div>
      <div className="flex gap-2 mt-4">
        <SaveButton onClick={apply} saving={busy}>Apply {type} discount</SaveButton>
        {discount && (
          <button onClick={remove} disabled={busy} className="px-4 py-2 rounded-lg text-body-sm font-medium" style={{ backgroundColor: "#FEF2F2", color: "#991B1B", border: "1px solid #FECACA" }}>Remove</button>
        )}
      </div>
    </Block>
  );
}

function PricingEditor({ companyId, data, onSaved }: { companyId: string; data: BillingData; onSaved: () => void }) {
  const [tagTiers, setTagTiers] = useState<VolumeTier[]>(data.pricing?.tag_tiers ?? DEFAULT_TIERS);
  const [cardTiers, setCardTiers] = useState<VolumeTier[]>(data.pricing?.card_tiers ?? DEFAULT_TIERS);
  const [saving, setSaving] = useState(false);

  // Pricing saves through the configure endpoint, which also needs plan +
  // interval. Reuse the brand's current subscription, falling back to the
  // first plan if billing has not been configured yet.
  const planId = data.subscription?.plan_id ?? data.plans[0]?.id ?? "";
  const interval: BillingInterval = data.subscription?.billing_interval ?? "monthly";

  function update(set: typeof setTagTiers, tiers: VolumeTier[], idx: number, naira: string) {
    const next = tiers.map((t, i) => i === idx ? { ...t, price_per_unit: Math.round((parseFloat(naira) || 0) * 100) } : t);
    set(next);
  }

  async function save() {
    if (!planId) { toast.error("Set the plan first"); return; }
    setSaving(true);
    const res = await fetch(`/api/admin/billing/${companyId}/configure`, {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        plan_id: planId,
        billing_interval: interval,
        custom_monthly_price: data.subscription?.custom_monthly_price ?? null,
        tag_tiers: tagTiers,
        card_tiers: cardTiers,
      }),
    });
    setSaving(false);
    if (res.ok) { toast.success("Pricing saved"); onSaved(); }
    else toast.error("Save failed");
  }

  function tierRows(tiers: VolumeTier[], set: typeof setTagTiers) {
    return tiers.map((t, idx) => (
      <div key={idx} className="grid grid-cols-2 gap-3 items-center mb-2">
        <span className="text-body-sm" style={{ color: "var(--color-slate)" }}>{t.min}{t.max === null ? "+" : ` — ${t.max}`}</span>
        <input defaultValue={t.price_per_unit / 100} onChange={(e) => update(set, tiers, idx, e.target.value)} className="w-full px-3 py-1.5 rounded-lg text-body-sm" style={fieldStyle()} />
      </div>
    ));
  }

  return (
    <Block title="Custom chip pricing (₦ per chip)">
      <div className="grid grid-cols-2 gap-6">
        <div>
          <p className="text-micro font-semibold uppercase tracking-wider mb-3" style={{ color: "var(--color-mist)" }}>Tags</p>
          {tierRows(tagTiers, setTagTiers)}
        </div>
        <div>
          <p className="text-micro font-semibold uppercase tracking-wider mb-3" style={{ color: "var(--color-mist)" }}>Cards</p>
          {tierRows(cardTiers, setCardTiers)}
        </div>
      </div>
      <SaveButton onClick={save} saving={saving}>Save pricing</SaveButton>
    </Block>
  );
}

function InvoiceHistory({ invoices, onChange }: { invoices: InvoiceWithItems[]; onChange: () => void }) {
  const [busyId, setBusyId] = useState<string | null>(null);

  async function markPaid(id: string) {
    setBusyId(id);
    const res = await fetch(`/api/admin/billing/invoices/${id}/mark-paid`, { method: "POST" });
    setBusyId(null);
    if (res.ok) { toast.success("Invoice marked paid"); onChange(); }
    else toast.error("Failed");
  }

  return (
    <Block title="Invoice history">
      {invoices.length === 0 ? (
        <p className="text-body-sm" style={{ color: "var(--color-mist)" }}>No invoices yet.</p>
      ) : (
        <div className="rounded-xl overflow-hidden" style={{ border: "1px solid var(--color-cream)" }}>
          {invoices.map((inv, idx) => (
            <div key={inv.id} className="grid grid-cols-[1fr_1fr_1fr_1fr_auto] gap-3 items-center px-4 py-3" style={{ borderTop: idx === 0 ? "none" : "1px solid var(--color-cream)", backgroundColor: "var(--color-pearl)" }}>
              <span className="text-body-sm" style={{ color: "var(--color-slate)" }}>{new Date(inv.created_at).toLocaleDateString("en-GB", { day: "numeric", month: "short" })}</span>
              <span className="text-body-sm" style={{ color: "var(--color-slate)" }}>{inv.type === "batch" ? "Batch" : "Subscription"}</span>
              <span className="text-body-sm tabular-nums" style={{ color: "var(--color-charcoal)" }}>{formatNaira(inv.amount)}</span>
              <span className="text-body-sm" style={{ color: inv.status === "paid" ? "#166534" : inv.status === "overdue" ? "#991B1B" : "var(--color-slate)" }}>{inv.status}</span>
              {inv.status !== "paid" && inv.status !== "cancelled" ? (
                <button onClick={() => markPaid(inv.id)} disabled={busyId === inv.id} className="text-micro font-semibold px-3 py-1.5 rounded-full" style={{ backgroundColor: "var(--color-charcoal)", color: "var(--color-pearl)" }}>Mark paid</button>
              ) : <span />}
            </div>
          ))}
        </div>
      )}
    </Block>
  );
}

function Block({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <h3 className="text-body font-semibold mb-4" style={{ color: "var(--color-charcoal)" }}>{title}</h3>
      {children}
    </div>
  );
}

function Labeled({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="block text-caption mb-1.5" style={{ color: "var(--color-mist)" }}>{label}</span>
      {children}
    </label>
  );
}

function SaveButton({ onClick, saving, children }: { onClick: () => void; saving: boolean; children: React.ReactNode }) {
  return (
    <button onClick={onClick} disabled={saving} className="mt-4 px-5 py-2 rounded-lg text-body-sm font-semibold" style={{ backgroundColor: "var(--color-charcoal)", color: "var(--color-pearl)", opacity: saving ? 0.6 : 1 }}>
      {saving ? "Saving…" : children}
    </button>
  );
}
