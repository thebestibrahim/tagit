import { createClient } from '@supabase/supabase-js'
import crypto from 'crypto'

const url = process.env.NEXT_PUBLIC_SUPABASE_URL!
const key = process.env.SUPABASE_SERVICE_ROLE_KEY!
const hmacSecret = process.env.TAGIT_HMAC_SECRET!

// Safety guard — never run seed on production
if (url.includes('bqmnrcofdgkmqwpotzbf')) {
  throw new Error('SAFETY: Refusing to seed production database. Use only against staging.')
}

const supabase = createClient(url, key)

// Stable UUIDs for reproducible seed data
const OUNJE_ID = 'a1b2c3d4-0001-0000-0000-000000000001'
const KOLA_ID  = 'a1b2c3d4-0002-0000-0000-000000000002'
const ZASHADU_ID = 'a1b2c3d4-0003-0000-0000-000000000003'

function makeToken() {
  return crypto.randomBytes(16).toString('hex')
}

function makeShortId() {
  return crypto.randomBytes(4).toString('hex').toUpperCase()
}

function makeHmac(token: string) {
  return crypto.createHmac('sha256', hmacSecret).update(token).digest('hex')
}

function daysAgo(n: number) {
  const d = new Date()
  d.setDate(d.getDate() - n)
  return d.toISOString()
}

async function seed() {
  console.log('Seeding staging data to:', url)

  // ── Truncate in dependency order ──────────────────────────────────
  console.log('\nTruncating existing staging data...')
  await supabase.from('feature_flag_overrides').delete().neq('id', '00000000-0000-0000-0000-000000000000')
  await supabase.from('feature_flag_audit').delete().neq('id', '00000000-0000-0000-0000-000000000000')
  await supabase.from('feature_flags').delete().neq('id', '00000000-0000-0000-0000-000000000000')
  await supabase.from('ownership_claims').delete().neq('id', '00000000-0000-0000-0000-000000000000')
  await supabase.from('ownership_records').delete().neq('id', '00000000-0000-0000-0000-000000000000')
  await supabase.from('tags').delete().neq('id', '00000000-0000-0000-0000-000000000000')
  await supabase.from('companies').delete().in('id', [OUNJE_ID, KOLA_ID, ZASHADU_ID])

  // ── Companies ────────────────────────────────────────────────────
  console.log('Seeding companies...')
  const { error: companyError } = await supabase.from('companies').insert([
    {
      id: OUNJE_ID,
      name: 'Ounje Studio',
      email: 'hello@ounjestudio.example.com',
      industry: 'Fashion',
      status: 'approved',
      approved_at: daysAgo(20),
    },
    {
      id: KOLA_ID,
      name: 'Kola Arts',
      email: 'info@kolaarts.example.com',
      industry: 'Arts',
      status: 'approved',
      approved_at: daysAgo(15),
    },
    {
      id: ZASHADU_ID,
      name: 'Zashadu Lagos',
      email: 'contact@zashadulagos.example.com',
      industry: 'Collectibles',
      status: 'pending',
    },
  ])
  if (companyError) { console.error('Company seed error:', companyError); process.exit(1) }

  // ── Tags — Ounje Studio (Fashion) ────────────────────────────────
  console.log('Seeding tags...')
  const ounjeTags = [
    { status: 'created' },
    { status: 'created' },
    { status: 'live', activated_at: daysAgo(12) },
    { status: 'live', activated_at: daysAgo(8) },
    { status: 'owned', activated_at: daysAgo(10) },
  ].map(t => {
    const token = makeToken()
    return {
      ...t,
      token,
      short_id: makeShortId(),
      hmac_signature: makeHmac(token),
      company_id: OUNJE_ID,
      industry: 'Fashion',
      created_at: daysAgo(25),
    }
  })

  const kolaTagData = [
    { status: 'created' },
    { status: 'created' },
    { status: 'created' },
    { status: 'live', activated_at: daysAgo(5) },
    { status: 'live', activated_at: daysAgo(3) },
  ].map(t => {
    const token = makeToken()
    return {
      ...t,
      token,
      short_id: makeShortId(),
      hmac_signature: makeHmac(token),
      company_id: KOLA_ID,
      industry: 'Arts',
      created_at: daysAgo(18),
    }
  })

  const { error: tagError } = await supabase.from('tags').insert([...ounjeTags, ...kolaTagData])
  if (tagError) { console.error('Tag seed error:', tagError); process.exit(1) }

  // ── Ownership records ────────────────────────────────────────────
  console.log('Seeding ownership records...')
  const { data: ownedTags } = await supabase
    .from('tags')
    .select('id')
    .eq('status', 'owned')
    .limit(3)

  if (ownedTags && ownedTags.length > 0) {
    const owners = [
      { name: 'Adaeze Okonkwo', email: 'adaeze@example.com' },
      { name: 'Chukwuemeka Eze', email: 'emeka@example.com' },
      { name: 'Ngozi Adeyemi', email: 'ngozi@example.com' },
    ]

    const ownershipRecords = ownedTags.map((tag, i) => ({
      tag_id: tag.id,
      owner_name: owners[i % owners.length].name,
      owner_email: owners[i % owners.length].email,
      acquired_at: daysAgo(10 - i * 3),
    }))

    const { error: ownerError } = await supabase.from('ownership_records').insert(ownershipRecords)
    if (ownerError) { console.error('Ownership seed error:', ownerError); process.exit(1) }
  }

  // ── Feature flags ────────────────────────────────────────────────
  console.log('Seeding feature flags...')
  const initialFlags = [
    {
      key: 'certificate_generation',
      name: 'Certificate of Authenticity',
      description: 'Generates and sends PDF certificates when ownership is confirmed',
      enabled: true,
      rollout_percentage: 100,
      environments: ['production', 'staging'],
    },
    {
      key: 'brand_customisation',
      name: 'Brand Page Customisation',
      description: 'Brands can customise colours, fonts, and logo on their consumer page',
      enabled: true,
      rollout_percentage: 100,
      environments: ['production', 'staging'],
    },
    {
      key: 'ai_persona',
      name: 'AI Product Persona',
      description: 'Consumers can chat with an AI that speaks as the product on the scan page',
      enabled: false,
      rollout_percentage: 0,
      environments: ['production', 'staging'],
    },
    {
      key: 'resale_analytics',
      name: 'Resale Analytics Dashboard',
      description: 'Shows brands detailed analytics on how their items perform in the secondary market',
      enabled: false,
      rollout_percentage: 0,
      environments: ['production', 'staging'],
    },
    {
      key: 'ownership_transfer_fee',
      name: 'Ownership Transfer Fee',
      description: 'Enables the ₦3,500 verification fee charged when items change ownership',
      enabled: false,
      rollout_percentage: 0,
      environments: ['production', 'staging'],
    },
    {
      key: 'bulk_tag_creation',
      name: 'Bulk Tag Creation',
      description: 'Allows brands to create multiple tags in a single batch operation',
      enabled: false,
      rollout_percentage: 0,
      environments: ['production', 'staging'],
    },
    {
      key: 'tag_migration',
      name: 'Tag Migration Request',
      description: 'Allows brands to request tag replacement for damaged or failed tags',
      enabled: false,
      rollout_percentage: 0,
      environments: ['production', 'staging'],
    },
    {
      key: 'intelligence_reports',
      name: 'Intelligence Reports',
      description: 'Premium market intelligence reports on brand performance and resale trends',
      enabled: false,
      rollout_percentage: 0,
      environments: ['production'],
    },
  ]

  const { error: flagError } = await supabase
    .from('feature_flags')
    .upsert(initialFlags, { onConflict: 'key' })
  if (flagError) { console.error('Flag seed error:', flagError); process.exit(1) }

  // ── Summary ───────────────────────────────────────────────────────
  const { count: tagCount } = await supabase.from('tags').select('*', { count: 'exact', head: true })
  const { count: flagCount } = await supabase.from('feature_flags').select('*', { count: 'exact', head: true })

  console.log('\n✓ Staging seed complete:')
  console.log(`  Companies:      3 (2 approved, 1 pending)`)
  console.log(`  Tags:           ${tagCount ?? 10}`)
  console.log(`  Feature flags:  ${flagCount ?? 8}`)
}

seed()
