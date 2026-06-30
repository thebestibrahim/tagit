"use client";

import { useEffect, useState, useCallback } from "react";
import { toast } from "sonner";
import type { FlagKey } from "@/lib/feature-flags/types";

const FLAG_DISPLAY: { key: FlagKey; name: string; description: string }[] = [
  { key: "custom_domain", name: "Custom Domain", description: "Connect their own domain (e.g. bushuaart.com) to serve their Tagit brand page" },
  { key: "ai_persona", name: "AI Product Persona", description: "Consumers can chat with an AI that speaks as the product on the scan page" },
  { key: "resale_analytics", name: "Resale Analytics", description: "Where items travel after resale, by country" },
  { key: "ownership_transfer_fee", name: "Ownership Transfer Fee", description: "₦3,500 verification fee charged when items change ownership" },
  { key: "bulk_tag_creation", name: "Bulk Tag Creation", description: "Create multiple tags in a single batch operation" },
  { key: "tag_migration", name: "Replace Tags and Cards", description: "Swap a damaged, failed, or missing tag or card for a fresh one from inventory" },
  { key: "intelligence_reports", name: "Intelligence Reports", description: "Premium market intelligence reports on brand performance and resale trends" },
];

interface Override {
  key: FlagKey;
  enabled: boolean | null; // null = no override (global default applies)
}

export function FeatureFlagOverrides({ companyId }: { companyId: string }) {
  const [overrides, setOverrides] = useState<Override[]>(
    FLAG_DISPLAY.map((f) => ({ key: f.key, enabled: null }))
  );
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState<FlagKey | null>(null);

  const load = useCallback(async () => {
    const res = await fetch(`/api/admin/flags/${companyId}`);
    if (res.ok) {
      const data: { key: FlagKey; enabled: boolean | null }[] = await res.json();
      setOverrides(
        FLAG_DISPLAY.map((f) => {
          const found = data.find((d) => d.key === f.key);
          return { key: f.key, enabled: found?.enabled ?? null };
        })
      );
    }
    setLoading(false);
  }, [companyId]);

  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => { load(); }, [load]);

  async function toggle(key: FlagKey, currentEnabled: boolean | null) {
    // Cycle: null (default) → true (force on) → false (force off) → null (clear)
    let next: boolean | null;
    if (currentEnabled === null) next = true;
    else if (currentEnabled === true) next = false;
    else next = null;

    setSaving(key);
    const res = await fetch(`/api/admin/flags/${companyId}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ key, enabled: next }),
    });
    setSaving(null);

    if (res.ok) {
      setOverrides((prev) =>
        prev.map((o) => (o.key === key ? { ...o, enabled: next } : o))
      );
      const label = next === null ? "reset to default" : next ? "enabled" : "disabled";
      toast.success(`${FLAG_DISPLAY.find((f) => f.key === key)?.name} ${label}`);
    } else {
      toast.error("Failed to update flag override");
    }
  }

  if (loading) return <p className="text-body-sm" style={{ color: "var(--color-mist)" }}>Loading feature flags…</p>;

  return (
    <div className="space-y-3">
      {FLAG_DISPLAY.map((feature) => {
        const override = overrides.find((o) => o.key === feature.key);
        const enabled = override?.enabled;
        const isBusy = saving === feature.key;

        const stateLabel =
          enabled === true ? "On (override)" :
          enabled === false ? "Off (override)" :
          "Default";
        const stateColor =
          enabled === true ? "#166534" :
          enabled === false ? "#991B1B" :
          "var(--color-mist)";
        const stateBg =
          enabled === true ? "#DCFCE7" :
          enabled === false ? "#FEF2F2" :
          "var(--color-cream)";

        return (
          <div
            key={feature.key}
            className="flex items-start justify-between gap-4 px-4 py-3 rounded-xl"
            style={{ backgroundColor: "var(--color-smoke)", border: "1px solid var(--color-cream)" }}
          >
            <div className="flex-1 min-w-0">
              <p className="font-medium text-body-sm" style={{ color: "var(--color-charcoal)" }}>
                {feature.name}
              </p>
              <p className="mt-0.5 text-caption" style={{ color: "var(--color-mist)" }}>
                {feature.description}
              </p>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <span
                className="text-micro font-semibold px-2.5 py-1 rounded-full"
                style={{ backgroundColor: stateBg, color: stateColor }}
              >
                {stateLabel}
              </span>
              <button
                onClick={() => toggle(feature.key, enabled ?? null)}
                disabled={isBusy}
                className="text-micro font-semibold px-3 py-1.5 rounded-full"
                style={{
                  backgroundColor: "var(--color-charcoal)",
                  color: "var(--color-pearl)",
                  opacity: isBusy ? 0.5 : 1,
                }}
              >
                {isBusy ? "…" : enabled === null ? "Enable" : enabled ? "Disable" : "Clear"}
              </button>
            </div>
          </div>
        );
      })}
      <p className="text-caption" style={{ color: "var(--color-mist)" }}>
        Click once to force on, again to force off, again to clear the override and return to global default.
      </p>
    </div>
  );
}
