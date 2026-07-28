#!/bin/bash
set -euo pipefail

PRIVATE_IP="$1"
NAT_HOST="10.0.255.22"
SSH_KEY="/var/lib/dhcp/nat_automation"
LOCKFILE="/var/lib/dhcp/nat-alloc.lock"
MAP_FILE="/var/lib/dhcp/nat-map.txt"

SSH=/usr/bin/ssh
FLOCK=/usr/bin/flock
GREP=/usr/bin/grep

export HOME=/var/lib/dhcp
KNOWN_HOSTS="/var/lib/dhcp/.ssh/known_hosts"

ssh_nat() {
  "$SSH" -o BatchMode=yes -o StrictHostKeyChecking=accept-new -o UserKnownHostsFile="$KNOWN_HOSTS" -i "$SSH_KEY" root@"$NAT_HOST" "$@"
}

exec 200>"$LOCKFILE"
"$FLOCK" -w 10 200

remove_mapping() {
  [[ -f "$MAP_FILE" ]] || return 0
  "$GREP" -v "^$PRIVATE_IP " "$MAP_FILE" > "$MAP_FILE.tmp" || true
  mv "$MAP_FILE.tmp" "$MAP_FILE"
}

pre_line=$(ssh_nat "nft -a list chain ip nat prerouting" | "$GREP" "dnat to $PRIVATE_IP " || true)
if [[ -z "$pre_line" ]]; then
  remove_mapping
  echo "No NAT mapping found for $PRIVATE_IP — nothing to remove"
  exit 0
fi
public_ip=$(echo "$pre_line" | "$GREP" -oP 'ip daddr \K[0-9.]+')
pre_handle=$(echo "$pre_line" | "$GREP" -oP 'handle \K[0-9]+')

post_line=$(ssh_nat "nft -a list chain ip nat postrouting" | "$GREP" "ip saddr $PRIVATE_IP snat to $public_ip" || true)
post_handle=$(echo "$post_line" | "$GREP" -oP 'handle \K[0-9]+' || true)

ssh_nat "nft delete rule ip nat prerouting handle $pre_handle"
[[ -n "$post_handle" ]] && ssh_nat "nft delete rule ip nat postrouting handle $post_handle"
remove_mapping

echo "Removed NAT mapping for $PRIVATE_IP (was -> $public_ip)"
