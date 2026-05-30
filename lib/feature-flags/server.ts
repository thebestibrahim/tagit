import { createClient } from '@supabase/supabase-js'
import type { FlagKey, FlagMap, FlagContext } from './types'

const FLAG_KEYS: FlagKey[] = [
  'certificate_generation',
  'brand_customisation',
  'ai_persona',
  'resale_analytics',
  'ownership_transfer_fee',
  'bulk_tag_creation',
  'chip_migration',
  'intelligence_reports',
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
    if (!flag.enabled) return false

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

    if (
      flag.rollout_percentage > 0 &&
      flag.rollout_percentage < 100 &&
      context.brandId
    ) {
      const hash = simpleHash(context.brandId + flagKey)
      return (hash % 100) < flag.rollout_percentage
    }

    return flag.enabled
  } catch {
    return false
  }
}

// Load all flags for a brand in two queries — call at layout level only
export async function getFlagsForBrand(brandId: string): Promise<FlagMap> {
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

      if (!flag || !flag.environments.includes(env) || !flag.enabled) {
        result[key] = false
        continue
      }

      const override = overrideMap.get(flag.id)
      if (override !== undefined) {
        result[key] = override
        continue
      }

      if (flag.rollout_percentage > 0 && flag.rollout_percentage < 100) {
        const hash = simpleHash(brandId + key)
        result[key] = (hash % 100) < flag.rollout_percentage
        continue
      }

      result[key] = flag.enabled
    }

    return result
  } catch {
    return { ...DEFAULT_MAP }
  }
}

// Consumer scan page — brandId comes from tag.company_id, not from auth
export async function getFlagsForConsumerPage(brandId: string): Promise<FlagMap> {
  return getFlagsForBrand(brandId)
}
