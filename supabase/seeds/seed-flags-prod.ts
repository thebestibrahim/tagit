import { createClient } from '@supabase/supabase-js'

const url = process.env.NEXT_PUBLIC_SUPABASE_URL!
const key = process.env.SUPABASE_SERVICE_ROLE_KEY!

// Must be run against production explicitly
if (!url.includes('bqmnrcofdgkmqwpotzbf')) {
  throw new Error('This script is for production only. Use seed-flags.ts for staging.')
}

const supabase = createClient(url, key)

const productionFlags = [
  {
    key: 'certificate_generation',
    name: 'Certificate of Authenticity',
    description: 'Generates and sends PDF certificates when ownership is confirmed',
    enabled: true,
    rollout_percentage: 100,
    environments: ['production', 'staging']
  },
  {
    key: 'brand_customisation',
    name: 'Brand Page Customisation',
    description: 'Brands can customise colours, fonts, and logo on their consumer page',
    enabled: true,
    rollout_percentage: 100,
    environments: ['production', 'staging']
  },
  {
    key: 'ai_persona',
    name: 'AI Product Persona',
    description: 'Consumers can chat with an AI that speaks as the product on the scan page',
    enabled: false,
    rollout_percentage: 0,
    environments: ['production', 'staging']
  },
  {
    key: 'resale_analytics',
    name: 'Resale Analytics Dashboard',
    description: 'Shows brands detailed analytics on how their items perform in the secondary market',
    enabled: false,
    rollout_percentage: 0,
    environments: ['production', 'staging']
  },
  {
    key: 'ownership_transfer_fee',
    name: 'Ownership Transfer Fee',
    description: 'Enables the ₦3,500 verification fee charged when items change ownership',
    enabled: false,
    rollout_percentage: 0,
    environments: ['production', 'staging']
  },
  {
    key: 'bulk_tag_creation',
    name: 'Bulk Tag Creation',
    description: 'Allows brands to create multiple tags in a single batch operation',
    enabled: false,
    rollout_percentage: 0,
    environments: ['production', 'staging']
  },
  {
    key: 'tag_migration',
    name: 'Tag Migration Request',
    description: 'Allows brands to request tag replacement for damaged or failed tags',
    enabled: false,
    rollout_percentage: 0,
    environments: ['production', 'staging']
  },
  {
    key: 'intelligence_reports',
    name: 'Intelligence Reports',
    description: 'Premium market intelligence reports on brand performance and resale trends',
    enabled: false,
    rollout_percentage: 0,
    environments: ['production']
  }
]

async function seedProdFlags() {
  console.log('⚠ Seeding feature flags to PRODUCTION:', url)
  console.log('certificate_generation and brand_customisation will be set to enabled: true')

  const { error } = await supabase
    .from('feature_flags')
    .upsert(productionFlags, { onConflict: 'key' })

  if (error) {
    console.error('Error seeding flags:', error)
    process.exit(1)
  }

  const { data, error: readError } = await supabase
    .from('feature_flags')
    .select('key, name, enabled, rollout_percentage')
    .order('key')

  if (readError) {
    console.error('Error reading flags:', readError)
    process.exit(1)
  }

  console.log('\nProduction feature flags seeded successfully:')
  data?.forEach(f => {
    const status = f.enabled ? '✓ ENABLED' : '○ disabled'
    console.log(`  ${status}  ${f.key} (${f.rollout_percentage}%)`)
  })
}

seedProdFlags()
