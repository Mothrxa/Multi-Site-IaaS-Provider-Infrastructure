import React from 'react'
import { I } from '../components/icons.jsx'

// ─── Data ────────────────────────────────────────────────────────────────────

const CATS = [
  { id: 'all',        label: 'All'          },
  { id: 'web',        label: 'Web & CMS'    },
  { id: 'data',       label: 'Analytics'    },
  { id: 'devtools',   label: 'Dev Tools'    },
  { id: 'database',   label: 'Databases'    },
  { id: 'selfhosted', label: 'Self-hosted'  },
  { id: 'security',   label: 'Security'     },
  { id: 'ai',         label: 'AI & ML'      },
]

const CAT_META = {
  web:        { color: 'oklch(0.52 0.14 250)', icon: 'globe',    label: 'Web & CMS'   },
  data:       { color: 'oklch(0.50 0.14 195)', icon: 'chart',    label: 'Analytics'   },
  devtools:   { color: 'oklch(0.48 0.12 285)', icon: 'cmd',      label: 'Dev Tools'   },
  database:   { color: 'oklch(0.50 0.12 38)',  icon: 'database', label: 'Databases'   },
  selfhosted: { color: 'oklch(0.48 0.13 148)', icon: 'server',   label: 'Self-hosted' },
  security:   { color: 'oklch(0.48 0.14 12)',  icon: 'lock',     label: 'Security'    },
  ai:         { color: 'oklch(0.50 0.15 320)', icon: 'bolt',     label: 'AI & ML'     },
}

const SOLUTIONS = [
  // Web & CMS
  { id:'nextjs-pg',    cat:'web',        featured:true,  badge:'Popular',
    name:'Next.js + Postgres',        tagline:'Full-stack React, production-grade',
    desc:'Next.js 14 App Router with PostgreSQL, Redis sessions, and nginx. Webhook-based git-push deploys. SSL auto-provisioned via Let\'s Encrypt.',
    stacks:['node:20','postgres:16','redis:7','nginx'],       vms:1, ctrs:3, cost:12, deploy:'55s' },
  { id:'wordpress',    cat:'web',        featured:true,  badge:'Popular',
    name:'WordPress',                 tagline:'The world\'s most-used CMS',
    desc:'WordPress with nginx, MySQL 8, PHP-FPM, and Redis object cache. Auto-HTTPS. Daily backups to object storage included.',
    stacks:['wordpress:php8.3','mysql:8','nginx','redis:7'],  vms:1, ctrs:3, cost:8,  deploy:'42s' },
  { id:'ghost',        cat:'web',        featured:false, badge:null,
    name:'Ghost',                     tagline:'Modern publishing platform',
    desc:'Ghost with MySQL and nginx. Built-in newsletter delivery, memberships, and analytics. Zero-config SSL. Admin UI on /ghost.',
    stacks:['ghost:latest','mysql:8','nginx'],                vms:1, ctrs:2, cost:7,  deploy:'38s' },
  { id:'strapi',       cat:'web',        featured:false, badge:'New',
    name:'Strapi',                    tagline:'Headless CMS & REST / GraphQL API',
    desc:'Open-source headless CMS. Flexible content types, role-based access, REST & GraphQL APIs auto-generated from your schema.',
    stacks:['node:20','postgres:16'],                         vms:1, ctrs:2, cost:9,  deploy:'50s' },
  { id:'directus',     cat:'web',        featured:false, badge:null,
    name:'Directus',                  tagline:'Instant API for any SQL database',
    desc:'Wraps any Postgres, MySQL, or SQLite DB in a REST & GraphQL API and a no-code data studio. SSO ready.',
    stacks:['directus','postgres:16','redis:7'],              vms:1, ctrs:3, cost:10, deploy:'48s' },
  // Analytics
  { id:'plausible',    cat:'data',       featured:true,  badge:'Popular',
    name:'Plausible Analytics',       tagline:'Privacy-first web analytics',
    desc:'GDPR-compliant analytics with no cookies, no consent banners. Lightweight 1 KB script. Own your data completely. Multi-site support.',
    stacks:['elixir','clickhouse','postgres:16'],             vms:1, ctrs:3, cost:14, deploy:'1m 10s' },
  { id:'grafana',      cat:'data',       featured:false, badge:null,
    name:'Grafana + Prometheus',      tagline:'Full observability stack',
    desc:'Prometheus scrapes metrics, Loki ingests logs, Grafana visualises everything. Pre-wired datasources and 12 default dashboards.',
    stacks:['grafana','prometheus','loki','alertmanager'],    vms:1, ctrs:4, cost:13, deploy:'52s' },
  { id:'metabase',     cat:'data',       featured:false, badge:null,
    name:'Metabase',                  tagline:'Business intelligence for everyone',
    desc:'Point-and-click dashboards and reports. Connect to any SQL database. Share with non-technical stakeholders without SQL.',
    stacks:['metabase','postgres:16'],                        vms:1, ctrs:2, cost:10, deploy:'58s' },
  { id:'umami',        cat:'data',       featured:false, badge:null,
    name:'Umami',                     tagline:'Lightweight analytics, zero noise',
    desc:'Simpler alternative to Plausible. Real-time dashboard, custom events, multi-site, shareable public links. Under 50 MB RAM.',
    stacks:['node:20','postgres:16'],                         vms:1, ctrs:2, cost:7,  deploy:'36s' },
  // Dev Tools
  { id:'gitea',        cat:'devtools',   featured:true,  badge:'Popular',
    name:'Gitea',                     tagline:'Self-hosted GitHub alternative',
    desc:'Lightweight Git platform with issues, PRs, CI Actions, container registry, webhooks, and SSH access. Runs on 256 MB RAM.',
    stacks:['gitea:latest','postgres:16','redis:7'],          vms:1, ctrs:3, cost:9,  deploy:'42s' },
  { id:'minio',        cat:'devtools',   featured:false, badge:null,
    name:'MinIO',                     tagline:'S3-compatible object storage',
    desc:'High-performance object storage with a fully S3-compatible API. Drop-in replacement for AWS S3. Admin console on port 9001.',
    stacks:['minio:latest'],                                  vms:1, ctrs:1, cost:8,  deploy:'35s' },
  { id:'n8n',          cat:'devtools',   featured:false, badge:'New',
    name:'n8n',                       tagline:'Visual workflow automation',
    desc:'Open-source Zapier alternative. 400+ integrations, code nodes, and webhooks. Your credentials never leave your VM.',
    stacks:['n8n:latest','postgres:16','redis:7'],            vms:1, ctrs:3, cost:11, deploy:'52s' },
  { id:'vault',        cat:'devtools',   featured:false, badge:null,
    name:'HashiCorp Vault',           tagline:'Secrets & credentials management',
    desc:'Centralized secret management with dynamic credentials, PKI infrastructure, and encryption-as-a-service. Raft storage backend.',
    stacks:['vault:latest','consul:latest'],                  vms:1, ctrs:2, cost:10, deploy:'50s' },
  { id:'portainer',    cat:'devtools',   featured:false, badge:null,
    name:'Portainer',                 tagline:'Container management UI',
    desc:'Web-based Docker management. Deploy stacks, manage volumes, inspect logs, and exec into containers from the browser.',
    stacks:['portainer:ce'],                                  vms:1, ctrs:1, cost:5,  deploy:'28s' },
  // Databases
  { id:'pg-pgadmin',   cat:'database',   featured:false, badge:null,
    name:'PostgreSQL + pgAdmin',      tagline:'Production Postgres with web console',
    desc:'PostgreSQL 16 with pgAdmin 4, PgBouncer connection pooler, and WAL-based daily dumps. Persistent volume. HA-ready.',
    stacks:['postgres:16','pgadmin4','pgbouncer'],            vms:1, ctrs:3, cost:8,  deploy:'36s' },
  { id:'redis-stack',  cat:'database',   featured:false, badge:null,
    name:'Redis Stack',               tagline:'Cache · search · time-series · JSON',
    desc:'Redis with full module suite: RediSearch, RedisJSON, RedisTimeSeries, RedisBloom, plus RedisInsight UI.',
    stacks:['redis-stack','redisinsight'],                    vms:1, ctrs:2, cost:7,  deploy:'30s' },
  { id:'mongodb',      cat:'database',   featured:false, badge:null,
    name:'MongoDB + Mongo Express',   tagline:'Document store with admin UI',
    desc:'MongoDB 7 with Mongo Express admin panel. Auth enabled, persistent volume, replica set configuration ready for production.',
    stacks:['mongo:7','mongo-express'],                       vms:1, ctrs:2, cost:8,  deploy:'38s' },
  { id:'clickhouse',   cat:'database',   featured:false, badge:'New',
    name:'ClickHouse',                tagline:'Columnar analytics database',
    desc:'Sub-second queries on billions of rows. Ideal for time-series, event data, and real-time analytics pipelines. Includes Tabix UI.',
    stacks:['clickhouse:latest','tabix'],                     vms:1, ctrs:2, cost:12, deploy:'44s' },
  // Self-hosted
  { id:'nextcloud',    cat:'selfhosted', featured:true,  badge:'Popular',
    name:'Nextcloud',                 tagline:'Google Workspace alternative',
    desc:'File sync, calendar, contacts, video calls, and collaborative editing. GDPR-compliant. OnlyOffice integration pre-configured.',
    stacks:['nextcloud:hub5','mysql:8','redis:7','nginx'],    vms:1, ctrs:4, cost:14, deploy:'1m 5s' },
  { id:'outline',      cat:'selfhosted', featured:false, badge:null,
    name:'Outline',                   tagline:'Team knowledge base & wiki',
    desc:'Beautiful team wiki with real-time collaboration, Slack integration, SAML SSO, and full-text search. File storage via MinIO.',
    stacks:['outline:latest','postgres:16','redis:7','minio'],vms:1, ctrs:4, cost:13, deploy:'58s' },
  { id:'mattermost',   cat:'selfhosted', featured:false, badge:null,
    name:'Mattermost',                tagline:'Self-hosted team messaging',
    desc:'Slack-compatible team chat with channels, DMs, file sharing, and webhook integrations. Your data never leaves your VM.',
    stacks:['mattermost:latest','postgres:16','redis:7'],     vms:1, ctrs:3, cost:11, deploy:'50s' },
  { id:'calcom',       cat:'selfhosted', featured:false, badge:null,
    name:'Cal.com',                   tagline:'Open-source scheduling infrastructure',
    desc:'Calendly alternative with event types, team scheduling, payment links, and embeddable booking pages. Full data ownership.',
    stacks:['cal.com:latest','postgres:16','redis:7'],        vms:1, ctrs:3, cost:12, deploy:'55s' },
  // Security
  { id:'authelia',     cat:'security',   featured:true,  badge:'Popular',
    name:'Authelia',                  tagline:'SSO & MFA authentication gateway',
    desc:'Protect any service with 2FA and SSO. Works as nginx or Traefik middleware. LDAP and file-based user stores supported.',
    stacks:['authelia:latest','redis:7','mysql:8'],           vms:1, ctrs:3, cost:8,  deploy:'42s' },
  { id:'vaultwarden',  cat:'security',   featured:false, badge:null,
    name:'Vaultwarden',               tagline:'Self-hosted Bitwarden-compatible vault',
    desc:'All official Bitwarden clients work natively. Team password manager on your own infra. Tiny resource footprint (~10 MB RAM).',
    stacks:['vaultwarden:latest','nginx:alpine'],             vms:1, ctrs:2, cost:5,  deploy:'28s' },
  { id:'wireguard',    cat:'security',   featured:false, badge:null,
    name:'WireGuard VPN',             tagline:'Modern zero-config VPN with web UI',
    desc:'wg-easy: WireGuard with a clean web UI. Manage peers, generate QR codes, revoke access in seconds.',
    stacks:['wg-easy:latest'],                                vms:1, ctrs:1, cost:5,  deploy:'28s' },
  { id:'crowdsec',     cat:'security',   featured:false, badge:'New',
    name:'CrowdSec',                  tagline:'Collaborative intrusion prevention',
    desc:'Crowdsourced threat intelligence + local behavioral analysis. Blocks attackers across SSH, HTTP, and app layers.',
    stacks:['crowdsec:latest','crowdsec-dashboard'],          vms:1, ctrs:2, cost:7,  deploy:'38s' },
  // AI & ML — all GPU, all coming soon
  { id:'ollama',       cat:'ai',         featured:true,  badge:'Coming soon',
    name:'Ollama + Open WebUI',       tagline:'Run any open LLM on your own GPU',
    desc:'Pull and run Llama 3.1, Mistral, Phi-3, Gemma 2 and others locally. OpenAI-compatible API. Includes Open-WebUI chat interface.',
    stacks:['ollama:latest','open-webui:latest'],             vms:1, ctrs:2, cost:28, deploy:'1m 20s', gpu:true },
  { id:'jupyter',      cat:'ai',         featured:false, badge:'Coming soon',
    name:'JupyterHub',                tagline:'Multi-user notebook server',
    desc:'JupyterHub with persistent per-user storage and OIDC auth. Pre-installed: pandas, numpy, matplotlib, scikit-learn, torch.',
    stacks:['jupyterhub:latest','postgres:16'],               vms:1, ctrs:2, cost:18, deploy:'58s',   gpu:true },
  { id:'label-studio', cat:'ai',         featured:false, badge:'Coming soon',
    name:'Label Studio',              tagline:'Open-source data labeling platform',
    desc:'Annotate text, images, audio, and video for ML training. Multi-user, project-based, REST API for programmatic label export.',
    stacks:['label-studio:latest','postgres:16','redis:7'],   vms:1, ctrs:3, cost:11, deploy:'50s',   gpu:true },
]

// ─── Helpers ─────────────────────────────────────────────────────────────────

function wa(color, a) { return color.replace(')', ` / ${a})`) }

function CIcon({ cat, size = 17 }) {
  const Tag = I[CAT_META[cat]?.icon]
  return Tag ? <Tag size={size}/> : null
}

function StackTag({ label }) {
  return (
    <span style={{
      fontSize: 10.5, fontFamily: 'var(--f-mono)', padding: '2px 8px', borderRadius: 5,
      background: 'var(--surface-3)', border: '0.5px solid var(--hairline-2)',
      color: 'var(--text-dim)', whiteSpace: 'nowrap', lineHeight: 1.8,
    }}>{label}</span>
  )
}

function SoonTag() {
  return (
    <span style={{
      fontSize: 10, fontWeight: 700, letterSpacing: '0.04em', padding: '2px 7px', borderRadius: 5,
      background: 'var(--surface-3)', color: 'var(--text-mute)',
      border: '0.5px solid var(--hairline-2)',
    }}>Coming soon</span>
  )
}

function BadgeChip({ label }) {
  if (label === 'Coming soon') return <SoonTag/>
  const isNew = label === 'New'
  return (
    <span style={{
      fontSize: 10, fontWeight: 700, letterSpacing: '0.04em', padding: '2px 7px', borderRadius: 5,
      background: isNew ? 'oklch(0.50 0.14 195 / 0.12)' : 'oklch(0.46 0.09 254 / 0.11)',
      color: isNew ? 'oklch(0.46 0.14 195)' : 'var(--accent)',
      border: `0.5px solid ${isNew ? 'oklch(0.50 0.14 195 / 0.28)' : 'oklch(0.46 0.09 254 / 0.28)'}`,
    }}>{label}</span>
  )
}

// ─── Featured card ────────────────────────────────────────────────────────────

function FeaturedCard({ s, onClick }) {
  const { color } = CAT_META[s.cat]
  const soon = s.gpu
  const [hov, setHov] = React.useState(false)
  return (
    <div
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
      onClick={() => !soon && onClick(s)}
      style={{
        padding: '18px 20px', borderRadius: 14,
        cursor: soon ? 'default' : 'pointer',
        opacity: soon ? 0.6 : 1,
        background: `linear-gradient(140deg, var(--surface) 0%, ${wa(color, 0.07)} 100%)`,
        border: `1px solid ${wa(color, hov && !soon ? 0.38 : 0.18)}`,
        boxShadow: hov && !soon ? `0 6px 28px ${wa(color, 0.15)}` : '0 1px 4px rgba(0,0,0,0.04)',
        transition: 'all 0.18s',
        display: 'flex', flexDirection: 'column', gap: 11,
        position: 'relative', overflow: 'hidden',
      }}
    >
      {soon && (
        <div style={{ position: 'absolute', inset: 0, borderRadius: 14,
          background: 'repeating-linear-gradient(45deg, transparent, transparent 8px, rgba(0,0,0,0.018) 8px, rgba(0,0,0,0.018) 16px)',
          pointerEvents: 'none' }}/>
      )}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div style={{ width: 38, height: 38, borderRadius: 10, flexShrink: 0,
          background: wa(color, 0.13), border: `1px solid ${wa(color, 0.22)}`,
          display: 'flex', alignItems: 'center', justifyContent: 'center', color }}>
          <CIcon cat={s.cat}/>
        </div>
        <div style={{ display: 'flex', gap: 5, flexWrap: 'wrap', justifyContent: 'flex-end' }}>
          {s.gpu && <span style={{ fontSize: 10, fontWeight: 700, padding: '2px 7px', borderRadius: 5, background: 'oklch(0.52 0.15 320 / 0.11)', color: 'oklch(0.50 0.15 320)', border: '0.5px solid oklch(0.52 0.15 320 / 0.25)' }}>GPU</span>}
          {s.badge && <BadgeChip label={s.badge}/>}
        </div>
      </div>
      <div>
        <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--text)' }}>{s.name}</div>
        <div style={{ fontSize: 11.5, color: 'var(--text-mute)', marginTop: 2 }}>{s.tagline}</div>
      </div>
      <div style={{ fontSize: 12, color: 'var(--text-dim)', lineHeight: 1.55, flex: 1,
        display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
        {s.desc}
      </div>
      <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
        {s.stacks.slice(0, 3).map(t => <StackTag key={t} label={t}/>)}
        {s.stacks.length > 3 && <StackTag label={`+${s.stacks.length - 3}`}/>}
      </div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        paddingTop: 10, borderTop: `0.5px solid ${wa(color, 0.15)}` }}>
        <span style={{ fontSize: 11.5, color: 'var(--text-mute)' }}>
          {soon ? 'Requires GPU nodes' : <><b style={{ color: 'var(--text-dim)' }}>${s.cost}</b>/mo · {s.vms}VM{s.ctrs ? ` · ${s.ctrs}ctr` : ''}</>}
        </span>
        {!soon && (
          <span style={{ fontSize: 11.5, color, fontWeight: 600, display: 'flex', alignItems: 'center', gap: 3 }}>
            Deploy <I.arrowR size={11}/>
          </span>
        )}
      </div>
    </div>
  )
}

// ─── Solution card ────────────────────────────────────────────────────────────

function SolutionCard({ s, onClick }) {
  const { color } = CAT_META[s.cat]
  const soon = s.gpu
  const [hov, setHov] = React.useState(false)
  return (
    <div
      onMouseEnter={() => !soon && setHov(true)}
      onMouseLeave={() => setHov(false)}
      onClick={() => !soon && onClick(s)}
      style={{
        padding: '18px 20px', borderRadius: 14,
        cursor: soon ? 'default' : 'pointer',
        background: soon ? 'var(--surface-3)' : 'var(--surface)',
        border: `1px solid ${hov ? wa(color, 0.32) : 'var(--hairline)'}`,
        boxShadow: hov ? `0 4px 20px ${wa(color, 0.10)}` : '0 1px 3px rgba(0,0,0,0.04)',
        transition: 'all 0.18s',
        transform: hov ? 'translateY(-2px)' : 'none',
        display: 'flex', flexDirection: 'column',
        position: 'relative', overflow: 'hidden',
      }}
    >
      {soon && (
        <div style={{ position: 'absolute', inset: 0, borderRadius: 14,
          background: 'repeating-linear-gradient(45deg, transparent, transparent 8px, rgba(0,0,0,0.018) 8px, rgba(0,0,0,0.018) 16px)',
          pointerEvents: 'none' }}/>
      )}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
        <div style={{ width: 38, height: 38, borderRadius: 10, flexShrink: 0,
          background: wa(color, soon ? 0.07 : 0.11), border: `1px solid ${wa(color, soon ? 0.12 : 0.18)}`,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          color: soon ? wa(color, 0.5) : color }}>
          <CIcon cat={s.cat}/>
        </div>
        <div style={{ display: 'flex', gap: 5, flexWrap: 'wrap', justifyContent: 'flex-end' }}>
          {s.gpu && <span style={{ fontSize: 10, fontWeight: 700, padding: '2px 7px', borderRadius: 5, background: 'oklch(0.52 0.15 320 / 0.08)', color: 'oklch(0.50 0.15 320 / 0.7)', border: '0.5px solid oklch(0.52 0.15 320 / 0.18)' }}>GPU</span>}
          {s.badge && <BadgeChip label={s.badge}/>}
        </div>
      </div>

      <div style={{ fontSize: 14, fontWeight: 600, color: soon ? 'var(--text-dim)' : 'var(--text)' }}>{s.name}</div>
      <div style={{ fontSize: 11.5, color: 'var(--text-mute)', marginTop: 2, marginBottom: 10 }}>{s.tagline}</div>

      <div style={{ fontSize: 12.5, color: 'var(--text-dim)', lineHeight: 1.55, flex: 1,
        display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden',
        opacity: soon ? 0.6 : 1 }}>
        {s.desc}
      </div>

      <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap', marginTop: 13 }}>
        {s.stacks.slice(0, 4).map(t => <StackTag key={t} label={t}/>)}
        {s.stacks.length > 4 && <StackTag label={`+${s.stacks.length - 4}`}/>}
      </div>

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        marginTop: 13, paddingTop: 11, borderTop: '0.5px solid var(--hairline)' }}>
        {soon ? (
          <span style={{ fontSize: 11.5, color: 'var(--text-mute)', fontStyle: 'italic' }}>GPU nodes required · not yet available</span>
        ) : (
          <>
            <div style={{ display: 'flex', gap: 14, fontSize: 11.5, alignItems: 'center' }}>
              <span style={{ color: 'var(--text-mute)' }}><b style={{ color: 'var(--text-dim)', fontWeight: 600 }}>${s.cost}</b>/mo</span>
              <span style={{ color: 'var(--text-mute)' }}>
                <I.bolt size={10} style={{ marginRight: 2, opacity: 0.5 }}/>{s.deploy}
              </span>
            </div>
            <span style={{ fontSize: 11, color: 'var(--text-mute)', fontFamily: 'var(--f-mono)' }}>
              {[s.vms && `${s.vms}vm`, s.ctrs && `${s.ctrs}ctr`].filter(Boolean).join(' + ')}
            </span>
          </>
        )}
      </div>
    </div>
  )
}

// ─── Deploy modal ─────────────────────────────────────────────────────────────

function DeployModal({ s, onClose, onGo }) {
  const { color } = CAT_META[s.cat]
  React.useEffect(() => {
    const onKey = e => e.key === 'Escape' && onClose()
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onClose])

  return (
    <div onClick={onClose} style={{ position: 'fixed', inset: 0, zIndex: 200,
      background: 'rgba(20,16,10,0.44)', backdropFilter: 'blur(7px)',
      display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
      <div onClick={e => e.stopPropagation()} style={{
        width: 530, borderRadius: 18, background: 'var(--bg-2)',
        border: `1px solid ${wa(color, 0.22)}`,
        boxShadow: `0 28px 80px ${wa(color, 0.16)}, 0 0 0 1px var(--hairline)`,
        overflow: 'hidden',
      }}>
        <div style={{ height: 3, background: `linear-gradient(90deg, ${wa(color, 0.5)}, ${color})` }}/>

        <div style={{ padding: '24px 28px 28px' }}>
          {/* Header */}
          <div style={{ display: 'flex', gap: 14, alignItems: 'flex-start', marginBottom: 18 }}>
            <div style={{ width: 48, height: 48, borderRadius: 12, flexShrink: 0,
              background: wa(color, 0.12), border: `1px solid ${wa(color, 0.22)}`,
              display: 'flex', alignItems: 'center', justifyContent: 'center', color }}>
              <CIcon cat={s.cat} size={22}/>
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                <span style={{ fontSize: 17, fontWeight: 700 }}>{s.name}</span>
                {s.badge && s.badge !== 'Coming soon' && <BadgeChip label={s.badge}/>}
              </div>
              <div style={{ fontSize: 12.5, color: 'var(--text-mute)', marginTop: 3 }}>{s.tagline}</div>
            </div>
            <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer',
              color: 'var(--text-mute)', padding: 4, borderRadius: 6, display: 'flex' }}>
              <I.x size={16}/>
            </button>
          </div>

          {/* Description */}
          <p style={{ fontSize: 13, color: 'var(--text-dim)', lineHeight: 1.65, margin: '0 0 18px' }}>{s.desc}</p>

          {/* What gets deployed */}
          <div style={{ background: 'var(--surface-3)', borderRadius: 11, border: '0.5px solid var(--hairline)', padding: '13px 16px', marginBottom: 14 }}>
            <div style={{ fontSize: 10.5, fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--text-mute)', marginBottom: 11 }}>What gets deployed</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 9 }}>
              {s.vms > 0 && (
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13 }}>
                  <span style={{ display: 'flex', alignItems: 'center', gap: 8, color: 'var(--text-dim)' }}>
                    <I.server size={13} style={{ color }}/>{s.vms} Virtual machine{s.vms > 1 ? 's' : ''}
                  </span>
                  <span style={{ color: 'var(--text-mute)', fontSize: 11.5, fontFamily: 'var(--f-mono)' }}>2 vCPU · 4 GB · 80 GB SSD</span>
                </div>
              )}
              {s.ctrs > 0 && (
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13 }}>
                  <span style={{ display: 'flex', alignItems: 'center', gap: 8, color: 'var(--text-dim)' }}>
                    <I.cloud size={13} style={{ color }}/>{s.ctrs} Container{s.ctrs > 1 ? 's' : ''}
                  </span>
                  <span style={{ color: 'var(--text-mute)', fontSize: 11.5 }}>auto-configured via compose</span>
                </div>
              )}
            </div>
          </div>

          {/* Stack */}
          <div style={{ marginBottom: 18 }}>
            <div style={{ fontSize: 10.5, fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--text-mute)', marginBottom: 8 }}>Stack</div>
            <div style={{ display: 'flex', gap: 5, flexWrap: 'wrap' }}>
              {s.stacks.map(t => <StackTag key={t} label={t}/>)}
            </div>
          </div>

          {/* Stats bar */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', borderRadius: 10,
            border: '0.5px solid var(--hairline)', overflow: 'hidden', marginBottom: 20 }}>
            {[
              { label: 'Est. cost', val: `$${s.cost}/mo` },
              { label: 'Deploy time', val: s.deploy },
              { label: 'Region', val: 'Algiers DC' },
            ].map((item, i) => (
              <div key={i} style={{ padding: '11px 14px', background: 'var(--surface-3)',
                borderLeft: i ? '0.5px solid var(--hairline)' : 'none' }}>
                <div style={{ fontSize: 10, color: 'var(--text-mute)', fontWeight: 700, letterSpacing: '0.07em', textTransform: 'uppercase', marginBottom: 4 }}>{item.label}</div>
                <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--text)' }}>{item.val}</div>
              </div>
            ))}
          </div>

          {/* Note */}
          <div style={{ fontSize: 11.5, color: 'var(--text-mute)', marginBottom: 16, lineHeight: 1.55,
            padding: '9px 12px', borderRadius: 8, background: wa(color, 0.06), border: `0.5px solid ${wa(color, 0.14)}` }}>
            <b style={{ color: 'var(--text-dim)' }}>How it works:</b> STRATA provisions a VM, injects a cloud-init script that installs and configures the full stack, then hands you the IP and credentials. You own the VM — cancel or resize at any time.
          </div>

          {/* Actions */}
          <div style={{ display: 'flex', gap: 9 }}>
            <button onClick={onClose} style={{ flex: 1, height: 40, borderRadius: 10,
              border: '1px solid var(--hairline)', background: 'none', cursor: 'pointer',
              fontSize: 13, color: 'var(--text-dim)', fontFamily: 'inherit' }}>
              Cancel
            </button>
            <button onClick={() => { onClose(); onGo('portal-create-vps') }}
              style={{ flex: 2, height: 40, borderRadius: 10, border: 'none', cursor: 'pointer',
                background: color, color: '#fff', fontSize: 13, fontWeight: 600,
                fontFamily: 'inherit', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 7,
                boxShadow: `0 2px 14px ${wa(color, 0.32)}` }}>
              <I.bolt size={14}/> Deploy {s.name}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

// ─── Section divider for "All" view ──────────────────────────────────────────

function CatSection({ catId, solutions, onClick }) {
  const { color, label, icon } = CAT_META[catId]
  const Tag = I[icon]
  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 9, marginBottom: 14 }}>
        <div style={{ width: 24, height: 24, borderRadius: 7,
          background: wa(color, 0.12), border: `1px solid ${wa(color, 0.20)}`,
          display: 'flex', alignItems: 'center', justifyContent: 'center', color, flexShrink: 0 }}>
          {Tag && <Tag size={13}/>}
        </div>
        <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-dim)' }}>{label}</span>
        <span style={{ fontSize: 11.5, color: 'var(--text-mute)', fontFamily: 'var(--f-mono)' }}>{solutions.length}</span>
        <div style={{ flex: 1, height: '0.5px', background: 'var(--hairline)' }}/>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12 }}>
        {solutions.map(s => <SolutionCard key={s.id} s={s} onClick={onClick}/>)}
      </div>
    </div>
  )
}

// ─── Page ────────────────────────────────────────────────────────────────────

const CAT_ORDER = ['web','data','devtools','database','selfhosted','security','ai']

function PageCatalog({ onGo }) {
  const [cat,    setCat]    = React.useState('all')
  const [sort,   setSort]   = React.useState('default')
  const [search, setSearch] = React.useState('')
  const [modal,  setModal]  = React.useState(null)

  const featured = React.useMemo(() => SOLUTIONS.filter(s => s.featured), [])

  const filtered = React.useMemo(() => {
    let list = SOLUTIONS
    if (cat !== 'all') list = list.filter(s => s.cat === cat)
    if (search.trim()) {
      const q = search.trim().toLowerCase()
      list = list.filter(s =>
        s.name.toLowerCase().includes(q) ||
        s.tagline.toLowerCase().includes(q) ||
        s.stacks.some(t => t.toLowerCase().includes(q))
      )
    }
    if (sort === 'price-asc')  list = [...list].sort((a, b) => a.cost - b.cost)
    if (sort === 'price-desc') list = [...list].sort((a, b) => b.cost - a.cost)
    if (sort === 'fastest')    list = [...list].sort((a, b) => a.deploy.localeCompare(b.deploy))
    return list
  }, [cat, search, sort])

  const showFeatured  = !search.trim() && cat === 'all' && sort === 'default'
  const showGrouped   = !search.trim() && cat === 'all' && sort === 'default'
  const availableCount = SOLUTIONS.filter(s => !s.gpu).length
  const soonCount      = SOLUTIONS.filter(s =>  s.gpu).length

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 26 }}>

      {/* Header */}
      <div className="page-h">
        <div>
          <h1>Marketplace</h1>
          <div className="sub">
            {availableCount} solutions ready to deploy · {soonCount} coming soon · one-click provisioned VM
          </div>
        </div>
        <div style={{ position: 'relative' }}>
          <I.search size={14} style={{ position: 'absolute', left: 11, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-mute)', pointerEvents: 'none' }}/>
          <input className="input" placeholder="Search by name, stack, or use-case…"
            style={{ paddingLeft: 36, width: 300 }}
            value={search} onChange={e => setSearch(e.target.value)}/>
          {search && (
            <button onClick={() => setSearch('')} style={{ position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-mute)', padding: 2, display: 'flex' }}>
              <I.x size={13}/>
            </button>
          )}
        </div>
      </div>

      {/* How it works banner */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '11px 16px', borderRadius: 11,
        background: 'var(--surface-3)', border: '0.5px solid var(--hairline)' }}>
        <I.bolt size={14} style={{ color: 'var(--accent)', flexShrink: 0 }}/>
        <span style={{ fontSize: 12.5, color: 'var(--text-dim)', lineHeight: 1.5 }}>
          <b style={{ color: 'var(--text)', fontWeight: 600 }}>1-click deploy:</b> pick a solution, STRATA spins up a VM and bootstraps the full stack via cloud-init — you get an IP and credentials, nothing to install.
        </span>
        <span style={{ fontSize: 11.5, color: 'var(--text-mute)', whiteSpace: 'nowrap', marginLeft: 'auto', flexShrink: 0 }}>
          You own the VM · resize or cancel anytime
        </span>
      </div>

      {/* Featured */}
      {showFeatured && (
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 13 }}>
            <span style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.09em', textTransform: 'uppercase', color: 'var(--text-mute)' }}>Featured</span>
            <div style={{ flex: 1, height: '0.5px', background: 'var(--hairline)' }}/>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12 }}>
            {featured.map(s => <FeaturedCard key={s.id} s={s} onClick={setModal}/>)}
          </div>
        </div>
      )}

      {/* Filter + sort bar */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
        <div style={{ display: 'flex', gap: 5, flexWrap: 'wrap' }}>
          {CATS.map(c => {
            const active = cat === c.id
            const color  = c.id === 'all' ? 'var(--accent)' : CAT_META[c.id]?.color
            const glow   = c.id === 'all' ? 'oklch(0.46 0.09 254 / 0.22)' : (color ? wa(color, 0.22) : 'transparent')
            const count  = c.id === 'all' ? SOLUTIONS.length : SOLUTIONS.filter(s => s.cat === c.id).length
            return (
              <button key={c.id} onClick={() => setCat(c.id)} style={{
                display: 'flex', alignItems: 'center', gap: 5,
                padding: '6px 13px', borderRadius: 8, border: 'none', cursor: 'pointer',
                fontSize: 12.5, fontWeight: active ? 600 : 400, fontFamily: 'inherit',
                background: active ? (c.id === 'all' ? 'var(--accent)' : color) : 'var(--surface-3)',
                color: active ? '#fff' : 'var(--text-dim)',
                boxShadow: active ? `0 2px 10px ${glow}` : 'none',
                transition: 'all 0.15s',
              }}>
                {c.label}
                <span style={{ fontSize: 10.5, opacity: active ? 0.75 : 0.45, fontFamily: 'var(--f-mono)' }}>{count}</span>
              </button>
            )
          })}
        </div>
        <select value={sort} onChange={e => setSort(e.target.value)} style={{
          height: 34, padding: '0 10px', borderRadius: 8, border: '1px solid var(--hairline)',
          background: 'var(--surface-3)', color: 'var(--text-dim)', fontSize: 12.5,
          cursor: 'pointer', fontFamily: 'inherit', outline: 'none' }}>
          <option value="default">Sort: Default</option>
          <option value="price-asc">Price: low → high</option>
          <option value="price-desc">Price: high → low</option>
          <option value="fastest">Fastest to deploy</option>
        </select>
      </div>

      {/* Grid — grouped when on All + default sort, flat otherwise */}
      {filtered.length === 0 ? (
        <div style={{ padding: '64px 0', textAlign: 'center', color: 'var(--text-mute)' }}>
          <I.search size={32} style={{ opacity: 0.25, marginBottom: 14 }}/>
          <div style={{ fontSize: 14, fontWeight: 500, marginBottom: 6 }}>No results for "{search}"</div>
          <button onClick={() => setSearch('')} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--accent)', fontSize: 13, fontFamily: 'inherit', fontWeight: 500 }}>
            Clear search
          </button>
        </div>
      ) : showGrouped ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 32 }}>
          {CAT_ORDER.map(catId => {
            const solutions = SOLUTIONS.filter(s => s.cat === catId)
            return <CatSection key={catId} catId={catId} solutions={solutions} onClick={setModal}/>
          })}
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12 }}>
          {filtered.map(s => <SolutionCard key={s.id} s={s} onClick={setModal}/>)}
        </div>
      )}

      {modal && <DeployModal s={modal} onClose={() => setModal(null)} onGo={onGo}/>}
    </div>
  )
}

export { PageCatalog }
