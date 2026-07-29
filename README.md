# Strata — Multi-Site IaaS Provider Infrastructure

Design and deployment of the network and systems infrastructure for **Strata**, a
fictional Infrastructure-as-a-Service (IaaS) provider, built for the M1-RSE
"Deployment and Security Evaluation of a Multi-Site IaaS Cloud Provider
Infrastructure" project (University of Algiers 1). Full assignment brief in
`Project-Assignement.pdf` (repo root's parent directory).

Strata operates two physically distinct sites connected over an untrusted ISP
transit: a **Headquarters (HQ)** running the internal corporate network, and a
**Cloud Datacenter** hosting the customer-facing IaaS platform. This repository
covers everything on the network/systems side: topology, routing, redundancy,
perimeter and inter-site security, core services, database high availability,
automation, and the two web applications that sit on top of the infrastructure.

Intrusion detection and the controlled attack-simulation campaign are a
teammate's deliverable and are documented separately — not covered here.

A full written report is in
[`Strata_Report_Revised.pdf`](Strata_Report_Revised.pdf) (source in
`Strata_Report_Revised.docx`).

## Architecture at a glance

<p float="left">
  <img src="Architecture/Branch A.png" alt="Branch A (HQ) topology" width="48%" />
  <img src="Architecture/Branch B.png" alt="Branch B (Cloud Datacenter) topology" width="48%" />
</p>

- **HQ (`Architecture/Branch A.png`)** — classic redundant campus design:
  dual firewalls (F1/F2) → dual core routers (R1/R2) → dual distribution
  switches (DSW1/DSW2) → access layer split into IT/HR/BizOps VLANs, a DMZ
  hosting the employee-facing web tier, and a Data Center segment hosting
  DHCP/DNS/AAA/mail/monitoring/database services. No single link or device is
  a single point of failure.
- **Cloud Datacenter (`Architecture/Branch B.png`)** — a spine-leaf Clos
  fabric (2 spines, 4 leaves) behind its own redundant firewall/router pair,
  hosting the customer-facing IaaS platform and its workloads.
- The two sites interconnect through their respective ISP routers over a
  site-to-site IPsec VPN, terminated at each site's perimeter firewall.

## Network design

| Layer | Details |
|---|---|
| Routing | OSPF area 0 (HQ) / area 1 (Datacenter fabric), point-to-point on every inter-device link |
| First-hop redundancy | HSRP on every distribution-switch VLAN SVI, active/standby load-shared across DSW1/DSW2 |
| Link redundancy | LACP EtherChannel between the DSW and DMZ switch pairs |
| Fabric | 2-spine / 4-leaf Clos topology, ECMP across spine uplinks |
| Addressing | `10.0.0.0/16` internal (loopbacks, VLANs, fabric point-to-points), documented end-to-end in `Adressing/` |
| VLANs | Management (90), IT (100), HR (200), BizOps (300), Data Center (400), DMZ (10) |
| Perimeter | pfSense firewalls at both sites — stateful zone-to-zone rules, NAT, IPsec VPN termination |

Device configs live under `Config/Devices/`: `V_Alpha` (Cisco IOS/IOSvl2,
GNS3/EVE — the full HQ build), `Containerlab` (Cisco IOL + Arista cEOS —
the containerized spine-leaf Datacenter build and the NAT gateway that maps
customer VM/container private addresses to a public pool), and `GNS3`
(earlier staging area for the pfSense firewall build).

## Core services

| Service | Software |
|---|---|
| DHCP | ISC `dhcpd`, dynamic DNS updates to BIND via TSIG |
| DNS | ISC BIND9, forward + reverse zones for `pfe2627.xyz` |
| AAA | FreeRADIUS + PostgreSQL backend |
| SMTP | Postfix (virtual mailboxes, SASL via Dovecot, TLS relay) |
| IMAP | Dovecot (Maildir, SASL backend for Postfix) |
| SNMP / metrics | LibreNMS |
| Centralized logging | Graylog (MongoDB-backed), every device/service configured to ship logs there |
| NTP | Per-device NTP client config pushed via Ansible |

All software choices are listed in `Config/Software tools`.

## Database high availability

Both application databases (the Cloud platform's and the internal Portal's)
run PostgreSQL in a **Patroni-managed primary–replica** configuration —
Patroni handles leader election and automatic failover on top of native
PostgreSQL streaming replication, backed by a DCS (etcd) for consensus, with
periodic base backups for disaster recovery. See the report for the full
write-up and references.

## Automation

- **Ansible** (`Automation/Ansible/`) — network-device configuration
  (NTP, SNMP, syslog, global console/logging hygiene, STP edge hardening on
  access ports) over `cisco.ios`, plus baseline provisioning of the web-app
  hosts (Node.js/nginx/pm2). Vaulted credentials per host group.
- **Terraform** (`Automation/Terraform/`) — self-service compute
  provisioning for the Cloud platform: `VPS.tf`/`cloudinit.tf` provision KVM
  VMs via `libvirt` (per-tenant storage pool, cloud-init–driven user/SSH-key
  injection), `Container.tf` provisions Docker containers via the
  `kreuzwerker/docker` provider — the same platform's two compute tiers.

## Web platforms

Two applications run on top of this infrastructure — network/systems work
above is the primary scope of this project; both apps are documented in
detail in the report but summarized only briefly here.

- **Cloud platform** (customer-facing, Datacenter DMZ) — the public IaaS
  portal: account signup, VM/container provisioning (multiple OS images,
  bring-your-own-image support), start/stop/reboot lifecycle control, a
  real in-browser console, live resource metrics, and public-IP exposure
  for provisioned workloads through the datacenter's NAT gateway.
- **Employee Portal** (internal, HQ only) — the unified internal app for
  Strata's ~20 staff across IT (Engineering/Operations/Support), HR, and
  Management: internal mail, file sharing, IT helpdesk ticketing, HR
  self-service, a cloud-operations dashboard, and a company announcement
  board, all behind a centralized directory-backed login.

## Repository layout

```
Adressing/        IP addressing plan and device connection matrix (PDF)
Architecture/      Topology diagrams for both sites
Automation/         Ansible playbooks + Terraform templates
Config/Devices/     Router/switch/firewall configs (GNS3, Containerlab, V_Alpha)
Config/Services/    DHCP, DNS, AAA, SMTP, IMAP, SNMP, Syslog configs
Strata_Report_Revised.docx/.pdf   Written report (source + compiled PDF)
Websites/           (see Web platforms above — apps developed alongside this repo)
```

## Project credit

The cloud-computing service builds on and extends an earlier final-year
project by Bessaa, adding multi-tenant VRF-style isolation and the automated
provisioning pipeline described above.
