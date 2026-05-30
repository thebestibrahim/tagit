'use client'
import { useState, useTransition } from "react"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import { X, Trash2 } from "lucide-react"

// ── Rollout slider ───────────────────────────────────────────────────────────

interface GlobalSettingsProps {
  flagKey: string
  flagName: string
  enabled: boolean
  rolloutPercentage: number
  environments: string[]
}

export function GlobalSettings({ flagKey, flagName, enabled, rolloutPercentage, environments }: GlobalSettingsProps) {
  const [en, setEn] = useState(enabled)
  const [rollout, setRollout] = useState(rolloutPercentage)
  const [envs, setEnvs] = useState<string[]>(environments)
  const [pending, startTransition] = useTransition()
  const router = useRouter()

  function save() {
    startTransition(async () => {
      const res = await fetch(`/api/admin/feature-flags/${flagKey}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ enabled: en, rollout_percentage: rollout, environments: envs }),
      })
      if (!res.ok) { toast.error("Failed to save"); return }
      toast.success("Flag updated")
      router.refresh()
    })
  }

  function toggleEnv(env: string) {
    setEnvs(prev => prev.includes(env) ? prev.filter(e => e !== env) : [...prev, env])
  }

  return (
    <div className="card-raised p-6 space-y-5">
      <h2 className="font-semibold" style={{ color: "var(--color-charcoal)", fontSize: "var(--text-h3)" }}>
        Global Settings
      </h2>

      <div className="flex items-center justify-between">
        <div>
          <p className="text-body-sm font-medium" style={{ color: "var(--color-charcoal)" }}>Enabled</p>
          <p className="text-caption" style={{ color: "var(--color-mist)" }}>Global on/off switch for this flag</p>
        </div>
        <button
          onClick={() => {
            if (en && rollout === 100) {
              const ok = window.confirm(`This will disable ${flagName} for all brands. Confirm?`)
              if (!ok) return
            }
            setEn(!en)
          }}
          style={{
            width: 44, height: 24, borderRadius: 12,
            backgroundColor: en ? "#16A34A" : "#D1D5DB",
            border: "none", cursor: "pointer", position: "relative", transition: "background-color 150ms",
          }}
        >
          <span style={{
            position: "absolute", top: 3, left: en ? 22 : 3,
            width: 18, height: 18, borderRadius: "50%", backgroundColor: "#fff",
            transition: "left 150ms", boxShadow: "0 1px 2px rgba(0,0,0,0.2)",
          }} />
        </button>
      </div>

      <div>
        <div className="flex items-center justify-between mb-2">
          <p className="text-body-sm font-medium" style={{ color: "var(--color-charcoal)" }}>Rollout Percentage</p>
          <span className="text-body-sm font-semibold" style={{ color: "var(--color-gold)" }}>{rollout}%</span>
        </div>
        <input
          type="range"
          min={0} max={100} step={10}
          value={rollout}
          onChange={(e) => setRollout(Number(e.target.value))}
          style={{ width: "100%", accentColor: "var(--color-gold)" }}
        />
        <div className="flex justify-between mt-1">
          {[0, 10, 25, 50, 75, 100].map(v => (
            <span key={v} className="text-caption" style={{ color: "var(--color-mist)" }}>{v}%</span>
          ))}
        </div>
      </div>

      <div>
        <p className="text-body-sm font-medium mb-2" style={{ color: "var(--color-charcoal)" }}>Environments</p>
        <div className="flex gap-4">
          {["production", "staging"].map(env => (
            <label key={env} className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={envs.includes(env)}
                onChange={() => toggleEnv(env)}
                style={{ accentColor: "var(--color-gold)" }}
              />
              <span className="text-body-sm capitalize" style={{ color: "var(--color-charcoal)" }}>{env}</span>
            </label>
          ))}
        </div>
      </div>

      <button
        onClick={save}
        disabled={pending}
        className="px-5 py-2 rounded-lg text-body-sm font-medium"
        style={{ backgroundColor: "var(--color-gold)", color: "#1C1A14" }}
      >
        {pending ? "Saving…" : "Save Changes"}
      </button>
    </div>
  )
}

// ── Brand Overrides ──────────────────────────────────────────────────────────

type Override = {
  id: string
  entity_id: string
  entity_type: string
  enabled: boolean
  reason: string | null
  created_at: string
}

type Brand = { id: string; name: string }

interface OverridesCardProps {
  flagKey: string
  overrides: Override[]
  brands: Brand[]
}

export function OverridesCard({ flagKey, overrides, brands }: OverridesCardProps) {
  const [showModal, setShowModal] = useState(false)
  const [selectedBrand, setSelectedBrand] = useState("")
  const [overrideEnabled, setOverrideEnabled] = useState(true)
  const [reason, setReason] = useState("")
  const [pending, startTransition] = useTransition()
  const router = useRouter()

  function brandName(id: string) {
    return brands.find(b => b.id === id)?.name ?? id.slice(0, 8) + "…"
  }

  function addOverride() {
    if (!selectedBrand) return
    startTransition(async () => {
      const res = await fetch(`/api/admin/feature-flags/${flagKey}/overrides`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ entity_id: selectedBrand, entity_type: "brand", enabled: overrideEnabled, reason: reason || null }),
      })
      if (!res.ok) { toast.error("Failed to add override"); return }
      toast.success("Override added")
      setShowModal(false)
      setSelectedBrand(""); setReason(""); setOverrideEnabled(true)
      router.refresh()
    })
  }

  function removeOverride(overrideId: string) {
    startTransition(async () => {
      const res = await fetch(`/api/admin/feature-flags/${flagKey}/overrides/${overrideId}`, {
        method: "DELETE",
      })
      if (!res.ok) { toast.error("Failed to remove override"); return }
      toast.success("Override removed")
      router.refresh()
    })
  }

  return (
    <div className="card-raised p-6">
      <div className="flex items-center justify-between mb-5">
        <h2 className="font-semibold" style={{ color: "var(--color-charcoal)", fontSize: "var(--text-h3)" }}>
          Brand Overrides
        </h2>
        <button
          onClick={() => setShowModal(true)}
          className="px-4 py-1.5 rounded-lg text-body-sm font-medium"
          style={{ backgroundColor: "var(--color-soft-gold)", color: "var(--color-deep-gold)" }}
        >
          + Add Override
        </button>
      </div>

      {overrides.length === 0 ? (
        <p className="text-body-sm py-4 text-center" style={{ color: "var(--color-mist)" }}>
          No overrides — all brands follow the global setting
        </p>
      ) : (
        <div className="space-y-2">
          {overrides.map(ov => (
            <div
              key={ov.id}
              className="flex items-center justify-between px-4 py-3 rounded-lg"
              style={{ backgroundColor: "var(--color-smoke)", border: "1px solid var(--color-cream)" }}
            >
              <div>
                <p className="text-body-sm font-medium" style={{ color: "var(--color-charcoal)" }}>
                  {brandName(ov.entity_id)}
                </p>
                {ov.reason && (
                  <p className="text-caption" style={{ color: "var(--color-mist)" }}>{ov.reason}</p>
                )}
              </div>
              <div className="flex items-center gap-3">
                <span
                  className="text-caption font-semibold px-2.5 py-1 rounded-full"
                  style={{
                    backgroundColor: ov.enabled ? "#DCFCE7" : "#FEE2E2",
                    color: ov.enabled ? "#166534" : "#991B1B",
                  }}
                >
                  {ov.enabled ? "Enabled" : "Disabled"}
                </span>
                <button
                  onClick={() => removeOverride(ov.id)}
                  style={{ color: "var(--color-mist)" }}
                  title="Remove override"
                >
                  <Trash2 size={14} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {showModal && (
        <div
          style={{
            position: "fixed", inset: 0, zIndex: 50,
            backgroundColor: "rgba(0,0,0,0.5)",
            display: "flex", alignItems: "center", justifyContent: "center",
          }}
          onClick={(e) => { if (e.target === e.currentTarget) setShowModal(false) }}
        >
          <div
            className="rounded-xl p-6 w-full max-w-md"
            style={{ backgroundColor: "var(--color-pearl)", border: "1px solid var(--color-cream)" }}
          >
            <div className="flex items-center justify-between mb-5">
              <h3 className="font-semibold" style={{ color: "var(--color-charcoal)", fontSize: "var(--text-h3)" }}>
                Add Override
              </h3>
              <button onClick={() => setShowModal(false)} style={{ color: "var(--color-mist)" }}>
                <X size={18} />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="text-micro font-medium uppercase tracking-wider block mb-1.5" style={{ color: "var(--color-slate)" }}>
                  Brand
                </label>
                <select
                  value={selectedBrand}
                  onChange={(e) => setSelectedBrand(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg text-body-sm"
                  style={{
                    backgroundColor: "var(--color-smoke)", color: "var(--color-charcoal)",
                    border: "1px solid var(--color-cream)",
                  }}
                >
                  <option value="">Select a brand…</option>
                  {brands.map(b => (
                    <option key={b.id} value={b.id}>{b.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-micro font-medium uppercase tracking-wider block mb-2" style={{ color: "var(--color-slate)" }}>
                  Access
                </label>
                <div className="flex gap-4">
                  {[
                    { label: "Enable", value: true },
                    { label: "Disable", value: false },
                  ].map(({ label, value }) => (
                    <label key={label} className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="radio"
                        checked={overrideEnabled === value}
                        onChange={() => setOverrideEnabled(value)}
                        style={{ accentColor: "var(--color-gold)" }}
                      />
                      <span className="text-body-sm" style={{ color: "var(--color-charcoal)" }}>{label}</span>
                    </label>
                  ))}
                </div>
              </div>

              <div>
                <label className="text-micro font-medium uppercase tracking-wider block mb-1.5" style={{ color: "var(--color-slate)" }}>
                  Reason (optional)
                </label>
                <input
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  placeholder="Beta tester, VIP brand, etc."
                  className="w-full px-3 py-2 rounded-lg text-body-sm"
                  style={{
                    backgroundColor: "var(--color-smoke)", color: "var(--color-charcoal)",
                    border: "1px solid var(--color-cream)",
                  }}
                />
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <button
                onClick={() => setShowModal(false)}
                className="flex-1 py-2 rounded-lg text-body-sm font-medium"
                style={{ backgroundColor: "var(--color-smoke)", color: "var(--color-slate)" }}
              >
                Cancel
              </button>
              <button
                onClick={addOverride}
                disabled={!selectedBrand || pending}
                className="flex-1 py-2 rounded-lg text-body-sm font-medium"
                style={{
                  backgroundColor: !selectedBrand ? "var(--color-cream)" : "var(--color-gold)",
                  color: !selectedBrand ? "var(--color-mist)" : "#1C1A14",
                  cursor: (!selectedBrand || pending) ? "not-allowed" : "pointer",
                }}
              >
                {pending ? "Saving…" : "Save Override"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
