sudo iptables -t nat -A POSTROUTING -s 203.0.113.0/30 -o wlo1 -j MASQUERADE
sudo iptables -t nat -A POSTROUTING -s 203.0.113.4/30 -o wlo1 -j MASQUERADE
sudo iptables -t nat -A POSTROUTING -s 198.51.100.0/30 -o wlo1 -j MASQUERADE
sudo iptables -A FORWARD -i tap-cloud -o wlo1 -j ACCEPT
sudo iptables -A FORWARD -i wlo1 -o tap-cloud -m state --state RELATED,ESTABLISHED -j ACCEPT


bcdedit /set hypervisorlaunchtype off

Disable-WindowsOptionalFeature -Online -FeatureName Microsoft-Hyper-V-All
Disable-WindowsOptionalFeature -Online -FeatureName VirtualMachinePlatform
Disable-WindowsOptionalFeature -Online -FeatureName HypervisorPlatform


sudo iptables -t nat -A PREROUTING -i wlo1 -p tcp --dport 25 -j DNAT --to-destination 203.0.113.2:25
sudo iptables -t nat -A POSTROUTING -o tap-cloud -j MASQUERADE
sudo iptables -A FORWARD -i wlo1 -o tap-cloud -p tcp --dport 25 -d 203.0.113.2 -j ACCEPT