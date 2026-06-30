'use client'
import { createContext, useContext, type ReactNode } from 'react'
import type { FlagKey, FlagMap } from './types'

const defaultFlags: FlagMap = {
  certificate_generation: false,
  brand_customisation: false,
  ai_persona: false,
  analytics_overview: false,
  resale_analytics: false,
  ownership_transfer_fee: false,
  bulk_tag_creation: false,
  tag_migration: false,
  intelligence_reports: false,
  exhibitions: false,
  custom_domain: false,
}

const FlagContext = createContext<FlagMap>(defaultFlags)

export function FlagProvider({
  flags,
  children,
}: {
  flags: FlagMap
  children: ReactNode
}) {
  return (
    <FlagContext.Provider value={flags}>
      {children}
    </FlagContext.Provider>
  )
}

export function useFlag(key: FlagKey): boolean {
  const flags = useContext(FlagContext)
  return flags[key] ?? false
}

export function useFlags(): FlagMap {
  return useContext(FlagContext)
}
