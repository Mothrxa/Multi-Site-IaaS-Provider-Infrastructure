import * as virsh from './virsh.js'

// `virsh domstats` reports cumulative counters (cpu.time in ns, block/net
// byte counts since boot) — turning those into a live percent/rate needs a
// previous sample to diff against. Kept in-memory (per backend process) since
// it's a live-view cache, not data anyone needs persisted across restarts.
const lastSample = new Map() // resourceId -> { t, cpuTimeNs, rdBytes, wrBytes, rxBytes, txBytes }

function num(v) {
  const n = Number(v)
  return Number.isFinite(n) ? n : 0
}

export async function getVmStats(id, vcpuCount) {
  const raw = await virsh.getDomStats(id)
  const now = Date.now()

  const cpuTimeNs = num(raw['cpu.time'])
  const memTotalKiB = num(raw['balloon.maximum'])
  // balloon.available only shows up once qemu-guest-agent's memory stats are
  // flowing — "Available" as seen in the guest's /proc/meminfo — treat it as
  // unknown (not zero) until then so we don't report 100% used on a fresh VM.
  const hasMemAvail = Object.prototype.hasOwnProperty.call(raw, 'balloon.available')
  const memUsedKiB = hasMemAvail ? Math.max(0, memTotalKiB - num(raw['balloon.available'])) : null

  let rdBytes = 0, wrBytes = 0
  const blockCount = num(raw['block.count'])
  for (let i = 0; i < blockCount; i++) {
    rdBytes += num(raw[`block.${i}.rd.bytes`])
    wrBytes += num(raw[`block.${i}.wr.bytes`])
  }

  let rxBytes = 0, txBytes = 0
  const netCount = num(raw['net.count'])
  for (let i = 0; i < netCount; i++) {
    rxBytes += num(raw[`net.${i}.rx.bytes`])
    txBytes += num(raw[`net.${i}.tx.bytes`])
  }

  const prev = lastSample.get(id)
  lastSample.set(id, { t: now, cpuTimeNs, rdBytes, wrBytes, rxBytes, txBytes })

  let cpuPercent = 0, diskReadBps = 0, diskWriteBps = 0, netRxBps = 0, netTxBps = 0
  if (prev) {
    const elapsedS = (now - prev.t) / 1000
    if (elapsedS > 0) {
      const elapsedNs = elapsedS * 1e9
      cpuPercent   = Math.max(0, Math.min(100, ((cpuTimeNs - prev.cpuTimeNs) / elapsedNs / (vcpuCount || 1)) * 100))
      diskReadBps  = Math.max(0, (rdBytes - prev.rdBytes) / elapsedS)
      diskWriteBps = Math.max(0, (wrBytes - prev.wrBytes) / elapsedS)
      netRxBps     = Math.max(0, (rxBytes - prev.rxBytes) / elapsedS)
      netTxBps     = Math.max(0, (txBytes - prev.txBytes) / elapsedS)
    }
  }

  return {
    cpuPercent:   Math.round(cpuPercent * 10) / 10,
    memUsedMB:    memUsedKiB === null ? null : Math.round(memUsedKiB / 1024),
    memTotalMB:   memTotalKiB ? Math.round(memTotalKiB / 1024) : null,
    diskReadBps:  Math.round(diskReadBps),
    diskWriteBps: Math.round(diskWriteBps),
    netRxBps:     Math.round(netRxBps),
    netTxBps:     Math.round(netTxBps),
  }
}

export function clearStats(id) {
  lastSample.delete(id)
}
