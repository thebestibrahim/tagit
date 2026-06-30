// Domain validation and normalisation for the custom domain feature.
// All validation runs before calling Vercel — invalid input never reaches the API.

// Known Tagit-controlled hostnames. Custom domains must not resolve to these.
const TAGIT_HOSTNAMES = new Set([
  'tagitlux.com',
  'www.tagitlux.com',
  'staging.tagitlux.com',
  'vercel.app',
  'localhost',
])

// Simple label regex: 1-63 chars, alphanumeric + hyphens, no leading/trailing hyphen
const LABEL_RE = /^[a-z0-9]([a-z0-9-]{0,61}[a-z0-9])?$/i

export type NormaliseResult =
  | { ok: true; apex: string; hasWww: boolean }
  | { ok: false; error: string }

// Normalise a domain string entered by a brand:
// - Strips protocol, path, query string, trailing slashes
// - Lowercases
// - If www.X entered, returns apex=X with hasWww=true so the caller can
//   configure the www redirect
// - Validates the resulting apex for syntactic correctness
// - Rejects reserved/Tagit hostnames
export function normaliseDomain(input: string): NormaliseResult {
  if (!input || typeof input !== 'string') {
    return { ok: false, error: 'Please enter a domain name.' }
  }

  let raw = input.trim().toLowerCase()

  // Strip protocol
  raw = raw.replace(/^https?:\/\//i, '')

  // Strip path, query, hash
  raw = raw.split('/')[0].split('?')[0].split('#')[0]

  // Strip trailing dot (some DNS tools append one)
  raw = raw.replace(/\.$/, '')

  if (!raw) return { ok: false, error: 'Please enter a domain name.' }

  const hasWww = raw.startsWith('www.')
  const apex = hasWww ? raw.slice(4) : raw

  if (!apex) return { ok: false, error: 'Please enter a valid domain name.' }

  // Must have at least one dot (e.g. bushuaart.com, not just "bushuaart")
  const labels = apex.split('.')
  if (labels.length < 2) {
    return { ok: false, error: 'Enter a full domain name including the extension, e.g. bushuaart.com' }
  }

  // Each label must be syntactically valid
  for (const label of labels) {
    if (!label) return { ok: false, error: `"${apex}" is not a valid domain name.` }
    if (!LABEL_RE.test(label)) {
      return { ok: false, error: `"${apex}" is not a valid domain name.` }
    }
  }

  // Must have a real TLD (at least 2 chars)
  const tld = labels[labels.length - 1]
  if (tld.length < 2) {
    return { ok: false, error: `"${apex}" is not a valid domain name.` }
  }

  // Reject Tagit-controlled hostnames
  if (TAGIT_HOSTNAMES.has(apex) || apex.endsWith('.tagitlux.com') || apex.endsWith('.vercel.app')) {
    return { ok: false, error: 'You cannot connect a Tagit or Vercel system domain.' }
  }

  return { ok: true, apex, hasWww }
}
