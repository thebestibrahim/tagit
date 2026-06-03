export type FlagKey =
  | 'certificate_generation'
  | 'brand_customisation'
  | 'ai_persona'
  | 'resale_analytics'
  | 'ownership_transfer_fee'
  | 'bulk_tag_creation'
  | 'tag_migration'
  | 'intelligence_reports'

export type FlagMap = Record<FlagKey, boolean>

export interface FeatureFlag {
  id: string
  key: FlagKey
  name: string
  description: string | null
  enabled: boolean
  rollout_percentage: number
  environments: string[]
  metadata: Record<string, unknown>
  created_at: string
  updated_at: string
  created_by: string | null
  last_updated_by: string | null
}

export interface FlagOverride {
  id: string
  flag_id: string
  entity_type: 'brand' | 'user'
  entity_id: string
  enabled: boolean
  reason: string | null
  created_at: string
  created_by: string | null
}

export interface FlagContext {
  brandId?: string
  userId?: string
  environment?: string
}
