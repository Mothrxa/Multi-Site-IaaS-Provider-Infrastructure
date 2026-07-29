// Customers can point a VM's OS at a URL of their own choosing ("bring your
// own image"), which the backend then downloads onto the hypervisor. That's
// an SSRF/abuse surface (arbitrary outbound fetch + disk write triggered by
// a customer-supplied string), so this is intentionally strict: only known
// official distro cloud-image mirrors, https only, only cloud-image
// extensions, and a HEAD check before anything is ever downloaded.
const ALLOWED_HOSTS = [
  'cloud-images.ubuntu.com',
  'cloud.debian.org',
  'cdimage.debian.org',
  'download.fedoraproject.org',
  'repo.almalinux.org',
  'dl.rockylinux.org',
  'cloud.centos.org',
]

const ALLOWED_EXTENSIONS = ['.qcow2', '.img', '.raw']
export const MAX_BYTES = 50 * 1024 * 1024 * 1024 // 50 GB

function hostAllowed(hostname) {
  const h = hostname.toLowerCase()
  return ALLOWED_HOSTS.some(allowed => h === allowed || h.endsWith(`.${allowed}`))
}

// Throws with a user-facing message on rejection; returns nothing on success.
export async function validateCustomImageUrl(rawUrl) {
  let url
  try {
    url = new URL(rawUrl)
  } catch {
    throw new Error('Invalid image URL.')
  }

  if (url.protocol !== 'https:') {
    throw new Error('Image URL must use https.')
  }
  if (!hostAllowed(url.hostname)) {
    throw new Error(`Image host not trusted. Allowed sources: ${ALLOWED_HOSTS.join(', ')}`)
  }
  const path = url.pathname.toLowerCase()
  if (!ALLOWED_EXTENSIONS.some(ext => path.endsWith(ext))) {
    throw new Error(`Image URL must end in one of: ${ALLOWED_EXTENSIONS.join(', ')}`)
  }

  let res
  try {
    res = await fetch(url, { method: 'HEAD', redirect: 'follow', signal: AbortSignal.timeout(10_000) })
  } catch (e) {
    throw new Error(`Could not reach image URL: ${e.message}`)
  }
  if (!res.ok) {
    throw new Error(`Image URL returned HTTP ${res.status}.`)
  }
  const len = Number(res.headers.get('content-length') || 0)
  if (len > 0 && len > MAX_BYTES) {
    throw new Error(`Image is too large (${(len / 1e9).toFixed(1)} GB, max ${MAX_BYTES / 1e9} GB).`)
  }
  const contentType = res.headers.get('content-type') || ''
  if (/^text\/html/i.test(contentType)) {
    throw new Error('Image URL does not point to a binary image file (got HTML).')
  }
}
