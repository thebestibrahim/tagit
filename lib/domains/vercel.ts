// Vercel Domains API integration for custom domain provisioning.
// Requires VERCEL_API_TOKEN and VERCEL_PROJECT_ID in environment variables.

export interface VercelVerificationRecord {
  type: string
  name: string
  value: string
}

export interface AddDomainResult {
  vercelDomainId: string
  verificationRecords: VercelVerificationRecord[]
}

function vercelFetch(path: string, options: RequestInit = {}): Promise<Response> {
  const token = process.env.VERCEL_API_TOKEN
  if (!token) throw new Error('VERCEL_API_TOKEN is not set')

  return fetch(`https://api.vercel.com${path}`, {
    ...options,
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
      ...(options.headers ?? {}),
    },
  })
}

function projectPath(suffix: string): string {
  const projectId = process.env.VERCEL_PROJECT_ID
  if (!projectId) throw new Error('VERCEL_PROJECT_ID is not set')
  return `/v10/projects/${projectId}${suffix}`
}

// Add a domain to the Vercel project. Returns the domain ID and DNS records
// the brand must create for verification. Vercel returns a distinct error when
// the domain is already claimed by another project — surface that specifically.
export async function addDomainToVercel(domain: string): Promise<AddDomainResult> {
  const res = await vercelFetch(projectPath('/domains'), {
    method: 'POST',
    body: JSON.stringify({ name: domain }),
  })

  const body = await res.json()

  if (!res.ok) {
    // Domain already attached to a different Vercel project
    if (body?.error?.code === 'domain_taken') {
      throw new DomainTakenError(domain)
    }
    throw new VercelAPIError(
      body?.error?.message ?? `Vercel API error ${res.status}`,
      res.status
    )
  }

  const records: VercelVerificationRecord[] = (body.verification ?? []).map(
    (v: { type: string; domain: string; value: string }) => ({
      type: v.type,
      name: v.domain === domain ? '@' : v.domain.replace(`.${domain}`, ''),
      value: v.value,
    })
  )

  // If no verification records came back the domain is already verified
  // (e.g. already on the same account). Provide the standard CNAME as fallback.
  if (records.length === 0) {
    records.push({ type: 'CNAME', name: '@', value: 'cname.vercel-dns.com' })
  }

  return {
    vercelDomainId: body.name ?? domain,
    verificationRecords: records,
  }
}

// Check whether Vercel has verified the domain and issued an SSL cert.
export async function checkDomainStatus(
  domain: string
): Promise<{ verified: boolean; sslReady: boolean }> {
  const res = await vercelFetch(
    `/v9/projects/${process.env.VERCEL_PROJECT_ID}/domains/${domain}`
  )

  if (!res.ok) {
    const body = await res.json()
    throw new VercelAPIError(
      body?.error?.message ?? `Vercel API error ${res.status}`,
      res.status
    )
  }

  const body = await res.json()
  return {
    verified: body.verified === true,
    sslReady: body.sslCertificate?.type !== undefined && body.verified === true,
  }
}

// Remove a domain from the Vercel project. Silently succeeds if the domain
// is not attached (404 from Vercel is treated as already removed).
export async function removeDomainFromVercel(domain: string): Promise<void> {
  const res = await vercelFetch(
    `/v9/projects/${process.env.VERCEL_PROJECT_ID}/domains/${domain}`,
    { method: 'DELETE' }
  )

  if (!res.ok && res.status !== 404) {
    const body = await res.json()
    throw new VercelAPIError(
      body?.error?.message ?? `Vercel API error ${res.status}`,
      res.status
    )
  }
}

// Configure www to redirect to the apex domain by adding www as a Vercel domain
// with a redirect. If the apex is the target, we add www pointing to apex.
export async function configureWwwRedirect(apexDomain: string): Promise<void> {
  const wwwDomain = `www.${apexDomain}`

  const res = await vercelFetch(projectPath('/domains'), {
    method: 'POST',
    body: JSON.stringify({
      name: wwwDomain,
      redirect: apexDomain,
      redirectStatusCode: 308,
    }),
  })

  // Treat "already exists" or "already taken on this project" as success —
  // the redirect is already configured.
  if (!res.ok) {
    const body = await res.json()
    const code = body?.error?.code
    if (code === 'domain_already_in_use' || code === 'domain_already_exists') return
    // Non-fatal: www redirect failing should not block the apex setup
    console.warn(`[domains] www redirect config failed for ${wwwDomain}: ${body?.error?.message}`)
  }
}

export class VercelAPIError extends Error {
  constructor(
    message: string,
    public readonly status: number
  ) {
    super(message)
    this.name = 'VercelAPIError'
  }
}

export class DomainTakenError extends Error {
  constructor(public readonly domain: string) {
    super(`${domain} is already connected to another account`)
    this.name = 'DomainTakenError'
  }
}
