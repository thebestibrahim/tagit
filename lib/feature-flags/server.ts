import { createClient } from '@supabase/supabase-js'
import { cache } from 'react'
import { getUser } from '@/lib/auth'
import type { FlagKey, FlagMap, FlagContext } from './types'

const FLAG_KEYS: FlagKey[] = [
  'certificate_generation',
  'brand_customisation',
  'ai_persona',
  'analytics_overview',
  'resale_analytics',
  'ownership_transfer_fee',
  'bulk_tag_creation',
  'tag_migration',
  'intelligence_reports',
  'exhibitions',
]

const DEFAULT_MAP: FlagMap = FLAG_KEYS.reduce((acc, key) => {
  acc[key] = false
  return acc
}, {} as FlagMap)

// Service role client — bypasses RLS for server-side evaluation only
function getServiceClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
}

function simpleHash(str: string): number {
  let hash = 0
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i)
    hash = ((hash << 5) - hash) + char
    hash = hash & hash
  }
  return Math.abs(hash)
}

export async function isEnabled(
  flagKey: FlagKey,
  context: FlagContext = {}
): Promise<boolean> {
  try {
    const supabase = getServiceClient()
    const env = context.environment
      ?? process.env.NEXT_PUBLIC_ENVIRONMENT
      ?? 'production'

    const { data: flag, error } = await supabase
      .from('feature_flags')
      .select('*')
      .eq('key', flagKey)
      .single()

    if (error || !flag) return false
    if (!flag.environments.includes(env)) return false

    // A brand override always wins — even when the master switch is off.
    // This is how you enable a feature for one brand while it's globally off.
    if (context.brandId) {
      const { data: override } = await supabase
        .from('feature_flag_overrides')
        .select('enabled')
        .eq('flag_id', flag.id)
        .eq('entity_type', 'brand')
        .eq('entity_id', context.brandId)
        .maybeSingle()

      if (override !== null) return override.enabled
    }

    // No override: the master switch gates everyone else.
    if (!flag.enabled) return false

    // Rollout governs brands without an override.
    // 0% = off, 100% = on, in between = a stable per-brand sample.
    if (flag.rollout_percentage >= 100) return true
    if (flag.rollout_percentage <= 0) return false
    if (context.brandId) {
      const hash = simpleHash(context.brandId + flagKey)
      return (hash % 100) < flag.rollout_percentage
    }
    return true
  } catch {
    return false
  }
}

// Load all flags for a brand in two queries. Wrapped in React cache() so the
// layout, a page, and a feature gate within the same request share one lookup.
export const getFlagsForBrand = cache(async (brandId: string): Promise<FlagMap> => {
  try {
    const supabase = getServiceClient()
    const env = process.env.NEXT_PUBLIC_ENVIRONMENT ?? 'production'

    const [{ data: flags }, { data: overrides }] = await Promise.all([
      supabase.from('feature_flags').select('*').in('key', FLAG_KEYS),
      supabase
        .from('feature_flag_overrides')
        .select('flag_id, enabled')
        .eq('entity_type', 'brand')
        .eq('entity_id', brandId),
    ])

    const overrideMap = new Map(
      overrides?.map(o => [o.flag_id, o.enabled]) ?? []
    )

    const result = { ...DEFAULT_MAP }

    for (const key of FLAG_KEYS) {
      const flag = flags?.find(f => f.key === key)

      if (!flag || !flag.environments.includes(env)) {
        result[key] = false
        continue
      }

      // A brand override always wins — even when the master switch is off.
      // This is how you enable a feature for one brand while it's globally off.
      const override = overrideMap.get(flag.id)
      if (override !== undefined) {
        result[key] = override
        continue
      }

      // No override: the master switch gates everyone else.
      if (!flag.enabled) { result[key] = false; continue }

      // Rollout governs brands without an override:
      // 0% = off, 100% = on, in between = a stable per-brand sample.
      if (flag.rollout_percentage >= 100) { result[key] = true; continue }
      if (flag.rollout_percentage <= 0) { result[key] = false; continue }
      const hash = simpleHash(brandId + key)
      result[key] = (hash % 100) < flag.rollout_percentage
    }

    return result
  } catch {
    return { ...DEFAULT_MAP }
  }
})

// Consumer scan page — brandId comes from tag.company_id, not from auth
export async function getFlagsForConsumerPage(brandId: string): Promise<FlagMap> {
  return getFlagsForBrand(brandId)
}

// Flags for the currently authenticated brand. Cached per request; safe to
// call from any dashboard page to gate a feature behind its flag.
export const getCurrentBrandFlags = cache(async (): Promise<FlagMap> => {
  const user = await getUser()
  if (!user) return { ...DEFAULT_MAP }
  return getFlagsForBrand(user.id)
})

// API-route enforcement: true when the flag is on for this brand. Lets write
// routes reject a disabled feature instead of relying on the UI wall alone.
export async function isBrandFlagEnabled(brandId: string, key: FlagKey): Promise<boolean> {
  const flags = await getFlagsForBrand(brandId)
  return flags[key] ?? false
}
