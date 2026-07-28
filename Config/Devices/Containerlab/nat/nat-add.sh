#!/bin/bash
set -euo pipefail

PRIVATE_IP="$1"
NAT_HOST="10.0.255.22"
SSH_KEY="/var/lib/dhcp/nat_automation"
LOCKFILE="/var/lib/dhcp/nat-alloc.lock"
POOL_PREFIX="192.0.2"
POOL_START=10
POOL_END=250
MAP_FILE="/var/lib/dhcp/nat-map.txt"

SSH=/usr/bin/ssh
FLOCK=/usr/bin/flock
GREP=/usr/bin/grep
SEQ=/usr/bin/seq

export HOME=/var/lib/dhcp
KNOWN_HOSTS="/var/lib/dhcp/.ssh/known_hosts"

ssh_nat() {
  "$SSH" -o BatchMode=yes -o StrictHostKeyChecking=accept-new -o UserKnownHostsFile="$KNOWN_HOSTS" -i "$SSH_KEY" root@"$NAT_HOST" "$@"
}

exec 200>"$LOCKFILE"
"$FLOCK" -w 10 200

touch "$MAP_FILE"
chmod 644 "$MAP_FILE"

# record/refresh the private->public mapping for the backend to read (same
# host as dhcpd — no SSH/credentials needed on that side, just a flat file)
record_mapping() {
  "$GREP" -v "^$PRIVATE_IP " "$MAP_FILE" > "$MAP_FILE.tmp" || true
  echo "$PRIVATE_IP $1" >> "$MAP_FILE.tmp"
  mv "$MAP_FILE.tmp" "$MAP_FILE"
}

RULES=$(ssh_nat "nft -a list chain ip nat prerouting")

# 1. idempotency: already mapped?
existing_line=$(echo "$RULES" | "$GREP" "dnat to $PRIVATE_IP " || true)
if [[ -n "$existing_line" ]]; then
  existing_ip=$(echo "$existing_line" | "$GREP" -oP 'ip daddr \K[0-9.]+')
  record_mapping "$existing_ip"
  echo "Already mapped: $PRIVATE_IP -> $existing_ip"
  exit 0
fi

# 2. find first free public IP in pool
used_ips=$(echo "$RULES" | "$GREP" -oP 'ip daddr \K[0-9.]+' || true)
free_ip=""
for i in $("$SEQ" $POOL_START $POOL_END); do
  candidate="$POOL_PREFIX.$i"
  "$GREP" -qx "$candidate" <<< "$used_ips" || { free_ip="$candidate"; break; }
done
[[ -z "$free_ip" ]] && { echo "pool exhausted" >&2; exit 1; }

# 3. create DNAT (inbound) + SNAT (outbound) rules
#    (192.0.2.0/24 is routed to nat via F2's static route pointing at
#    10.0.255.22 — no per-IP interface aliasing needed, traffic just arrives)
ssh_nat "nft add rule ip nat prerouting  ip daddr $free_ip    dnat to $PRIVATE_IP"
ssh_nat "nft add rule ip nat postrouting ip saddr $PRIVATE_IP snat to $free_ip"
record_mapping "$free_ip"

echo "Mapped $PRIVATE_IP -> $free_ip"
