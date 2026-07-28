#!/bin/sh
set -e
while ! ip link show eth1 >/dev/null 2>&1; do
  sleep 1
done

ip addr add 10.0.255.22/30 dev eth1
ip link set eth1 up
ip route add default via 10.0.255.21 dev eth1
sysctl -w net.ipv4.ip_forward=1
nft -f /etc/nftables.nft
exec /usr/sbin/sshd -D