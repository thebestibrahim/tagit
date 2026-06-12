import { createClient } from '@supabase/supabase-js'

const url = process.env.NEXT_PUBLIC_SUPABASE_URL!
const key = process.env.SUPABASE_SERVICE_ROLE_KEY!

// Safety guard — never run on production
if (url.includes('bqmnrcofdgkmqwpotzbf')) {
  throw new Error('SAFETY: Refusing to seed flags on production database. Use seed-flags-prod.ts for production.')
}

const supabase = createClient(url, key)

const initialFlags = [
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
    key: 'analytics_overview',
    name: 'Analytics Overview',
    description: 'The Analytics page Overview tab: scan activity, top products, and scan/claim location',
    enabled: true,
    rollout_percentage: 100,
    environments: ['production', 'staging']
  },
  {
    key: 'resale_analytics',
    name: 'Resale Analytics',
    description: 'The Resale Analytics tab: where items travel after resale (previous vs new owner country)',
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
    name: 'Replace Tags and Cards',
    description: 'Lets brands swap a damaged, failed, or missing tag or card for a fresh one from inventory',
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

async function seedFlags() {
  console.log('Seeding feature flags to:', url)

  const { error } = await supabase
    .from('feature_flags')
    .upsert(initialFlags, { onConflict: 'key' })

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

  console.log('\nFeature flags seeded successfully:')
  data?.forEach(f => {
    console.log(`  ${f.enabled ? '✓' : '○'} ${f.key} (${f.rollout_percentage}%)`)
  })
}

seedFlags()
