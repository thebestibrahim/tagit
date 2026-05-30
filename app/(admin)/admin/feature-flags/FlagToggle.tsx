'use client'
import { useState, useTransition } from "react"
import { useRouter } from "next/navigation"
import { toast } from "sonner"

interface FlagToggleProps {
  flagKey: string
  enabled: boolean
  rolloutPercentage: number
  flagName: string
}

export function FlagToggle({ flagKey, enabled, rolloutPercentage, flagName }: FlagToggleProps) {
  const [optimistic, setOptimistic] = useState(enabled)
  const [pending, startTransition] = useTransition()
  const router = useRouter()

  async function toggle() {
    const next = !optimistic

    // Confirmation when disabling a fully rolled out flag
    if (!next && rolloutPercentage === 100 && optimistic) {
      const confirmed = window.confirm(
        `This will disable ${flagName} for all brands. Confirm?`
      )
      if (!confirmed) return
    }

    setOptimistic(next)

    startTransition(async () => {
      const res = await fetch(`/api/admin/feature-flags/${flagKey}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ enabled: next }),
      })

      if (!res.ok) {
        setOptimistic(!next) // roll back
        toast.error("Failed to update flag")
        return
      }

      toast.success(`${flagName} ${next ? "enabled" : "disabled"}`)
      router.refresh()
    })
  }

  return (
    <button
      onClick={toggle}
      disabled={pending}
      aria-label={optimistic ? "Disable flag" : "Enable flag"}
      style={{
        width: 40,
        height: 22,
        borderRadius: 11,
        backgroundColor: optimistic ? "#16A34A" : "#D1D5DB",
        border: "none",
        cursor: pending ? "wait" : "pointer",
        position: "relative",
        transition: "background-color 150ms",
        flexShrink: 0,
        opacity: pending ? 0.6 : 1,
      }}
    >
      <span
        style={{
          position: "absolute",
          top: 2,
          left: optimistic ? 20 : 2,
          width: 18,
          height: 18,
          borderRadius: "50%",
          backgroundColor: "#fff",
          transition: "left 150ms",
          boxShadow: "0 1px 2px rgba(0,0,0,0.2)",
        }}
      />
    </button>
  )
}
