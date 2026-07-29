// Maps each app's hostname to its counterpart.
// Works with Caddy domains AND IP fallback for local testing.

const DOMAIN_MAP = {
  portal:  { domain: 'cloud.pfe2627.xyz',   fallbackPort: 8800  },
  landing: { domain: 'strata.pfe2627.xyz',  fallbackPort: 8000  },
}

function resolveUrl(targetApp) {
  if (typeof window === 'undefined') return ''
  const cfg = DOMAIN_MAP[targetApp]
  const host = window.location.hostname
  // If currently on a known domain, use the mapped domain with HTTPS
  const knownDomains = Object.values(DOMAIN_MAP).map(c => c.domain)
  if (knownDomains.includes(host)) {
    return `https://${cfg.domain}`
  }
  // IP / localhost fallback
  const proto = window.location.protocol
  return `${proto}//${host}:${cfg.fallbackPort}`
}

export const PORTAL_URL  = resolveUrl('portal')
export const LANDING_URL = resolveUrl('landing')
