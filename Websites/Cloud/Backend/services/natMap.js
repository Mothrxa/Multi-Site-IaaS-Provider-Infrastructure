import { readFile } from 'fs/promises'

const MAP_FILE = process.env.NAT_MAP_FILE || '/var/lib/dhcp/nat-map.txt'

// Backend and dhcpd run on the same host — nat-add.sh/nat-remove.sh maintain
// this flat "private public" mapping file under their own flock, so we just
// read it directly instead of needing SSH access to the nat node.
export async function getPublicIp(privateIp) {
  if (!privateIp) return null
  let text
  try {
    text = await readFile(MAP_FILE, 'utf8')
  } catch {
    return null
  }
  for (const line of text.split('\n')) {
    const [priv, pub] = line.trim().split(/\s+/)
    if (priv === privateIp) return pub || null
  }
  return null
}
