'use client'
import { useState, useTransition } from "react"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import { X } from "lucide-react"

export function CreateFlagModal() {
  const [open, setOpen] = useState(false)
  const [key, setKey] = useState("")
  const [name, setName] = useState("")
  const [description, setDescription] = useState("")
  const [envProd, setEnvProd] = useState(true)
  const [envStaging, setEnvStaging] = useState(true)
  const [keyError, setKeyError] = useState("")
  const [pending, startTransition] = useTransition()
  const router = useRouter()

  function validateKey(val: string) {
    if (val && !/^[a-z0-9_]+$/.test(val)) {
      setKeyError("Only lowercase letters, numbers, and underscores")
    } else {
      setKeyError("")
    }
    setKey(val)
  }

  function reset() {
    setKey(""); setName(""); setDescription(""); setKeyError("")
    setEnvProd(true); setEnvStaging(true)
    setOpen(false)
  }

  function submit() {
    if (!key || !name || keyError) return
    const environments = [envProd && "production", envStaging && "staging"].filter(Boolean) as string[]

    startTransition(async () => {
      const res = await fetch("/api/admin/feature-flags", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ key, name, description: description || null, environments }),
      })
      const data = await res.json() as { error?: string }
      if (!res.ok) {
        toast.error(data.error ?? "Failed to create flag")
        return
      }
      toast.success(`Flag "${name}" created`)
      reset()
      router.refresh()
    })
  }

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="flex items-center gap-2 px-4 py-2 rounded-lg text-body-sm font-medium"
        style={{ backgroundColor: "var(--color-gold)", color: "#1C1A14" }}
      >
        + Create Flag
      </button>

      {open && (
        <div
          style={{
            position: "fixed", inset: 0, zIndex: 50,
            backgroundColor: "rgba(0,0,0,0.5)",
            display: "flex", alignItems: "center", justifyContent: "center",
          }}
          onClick={(e) => { if (e.target === e.currentTarget) reset() }}
        >
          <div
            className="rounded-xl p-6 w-full max-w-md"
            style={{ backgroundColor: "var(--color-pearl)", border: "1px solid var(--color-cream)" }}
          >
            <div className="flex items-center justify-between mb-5">
              <h2 className="font-semibold" style={{ color: "var(--color-charcoal)", fontSize: "var(--text-h3)" }}>
                Create Flag
              </h2>
              <button onClick={reset} style={{ color: "var(--color-mist)" }}>
                <X size={18} />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="text-micro font-medium uppercase tracking-wider block mb-1.5" style={{ color: "var(--color-slate)" }}>
                  Key *
                </label>
                <input
                  value={key}
                  onChange={(e) => validateKey(e.target.value)}
                  placeholder="my_feature_flag"
                  className="w-full px-3 py-2 rounded-lg text-body-sm"
                  style={{
                    backgroundColor: "var(--color-smoke)", color: "var(--color-charcoal)",
                    border: keyError ? "1px solid #DC2626" : "1px solid var(--color-cream)",
                  }}
                />
                {keyError && <p className="text-caption mt-1" style={{ color: "#DC2626" }}>{keyError}</p>}
                <p className="text-caption mt-1" style={{ color: "var(--color-mist)" }}>
                  Immutable after creation. snake_case only.
                </p>
              </div>

              <div>
                <label className="text-micro font-medium uppercase tracking-wider block mb-1.5" style={{ color: "var(--color-slate)" }}>
                  Name *
                </label>
                <input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="My Feature Flag"
                  className="w-full px-3 py-2 rounded-lg text-body-sm"
                  style={{
                    backgroundColor: "var(--color-smoke)", color: "var(--color-charcoal)",
                    border: "1px solid var(--color-cream)",
                  }}
                />
              </div>

              <div>
                <label className="text-micro font-medium uppercase tracking-wider block mb-1.5" style={{ color: "var(--color-slate)" }}>
                  Description
                </label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Optional context for this flag"
                  rows={2}
                  className="w-full px-3 py-2 rounded-lg text-body-sm resize-none"
                  style={{
                    backgroundColor: "var(--color-smoke)", color: "var(--color-charcoal)",
                    border: "1px solid var(--color-cream)",
                  }}
                />
              </div>

              <div>
                <label className="text-micro font-medium uppercase tracking-wider block mb-2" style={{ color: "var(--color-slate)" }}>
                  Environments
                </label>
                <div className="flex gap-4">
                  {[
                    { label: "Production", value: envProd, set: setEnvProd },
                    { label: "Staging", value: envStaging, set: setEnvStaging },
                  ].map(({ label, value, set }) => (
                    <label key={label} className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={value}
                        onChange={(e) => set(e.target.checked)}
                        style={{ accentColor: "var(--color-gold)" }}
                      />
                      <span className="text-body-sm" style={{ color: "var(--color-charcoal)" }}>{label}</span>
                    </label>
                  ))}
                </div>
              </div>
            </div>

            <p className="text-caption mt-4" style={{ color: "var(--color-mist)" }}>
              All new flags start disabled with 0% rollout.
            </p>

            <div className="flex gap-3 mt-6">
              <button
                onClick={reset}
                className="flex-1 py-2 rounded-lg text-body-sm font-medium"
                style={{ backgroundColor: "var(--color-smoke)", color: "var(--color-slate)" }}
              >
                Cancel
              </button>
              <button
                onClick={submit}
                disabled={!key || !name || !!keyError || pending}
                className="flex-1 py-2 rounded-lg text-body-sm font-medium"
                style={{
                  backgroundColor: (!key || !name || !!keyError) ? "var(--color-cream)" : "var(--color-gold)",
                  color: (!key || !name || !!keyError) ? "var(--color-mist)" : "#1C1A14",
                  cursor: (!key || !name || !!keyError || pending) ? "not-allowed" : "pointer",
                }}
              >
                {pending ? "Creating…" : "Create Flag"}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
