import React from 'react'
import { I, Icon } from '../components/icons.jsx'
import { Btn, Card, Field, Tabs, Toggle, Modal, Pill } from '../components/ui.jsx'
import { accountApi, toast } from '../api/index.js'
import { Loading, Spinner } from '../components/feedback.jsx'

const TIMEZONES = [
  "Africa/Algiers (UTC+1)", "Europe/Paris (UTC+1)", "Europe/London (UTC+0)",
  "America/New_York (UTC-5)", "America/Los_Angeles (UTC-8)", "Asia/Dubai (UTC+4)", "Asia/Tokyo (UTC+9)",
]
const LANGUAGES = ["English", "Français", "العربية"]

function sTimeAgo(iso) {
  if (!iso) return "—"
  const s = Math.floor((Date.now() - new Date(iso).getTime()) / 1000)
  if (s < 60) return "just now"
  if (s < 3600) return `${Math.floor(s/60)}m ago`
  if (s < 86400) return `${Math.floor(s/3600)}h ago`
  return `${Math.floor(s/86400)}d ago`
}

// ── Token reveal modal ────────────────────────────────────────────────────────
function TokenModal({ token, onClose }) {
  const [copied, setCopied] = React.useState(false)
  if (!token) return null
  return (
    <Modal open title="API token created" width={520} onClose={onClose} footer={<Btn kind="primary" onClick={onClose}>Done</Btn>}>
      <div className="banner" style={{ background:"color-mix(in oklab, var(--warn) 10%, transparent)", borderColor:"color-mix(in oklab, var(--warn) 30%, transparent)", marginBottom:14 }}>
        <I.lock size={15} stroke="var(--warn)"/>
        <span style={{ color:"var(--warn)", fontSize:12.5 }}>Copy this token now — you won't be able to see it again.</span>
      </div>
      <div style={{ display:"flex", gap:8 }}>
        <input className="input mono" readOnly value={token.token} style={{ flex:1 }}/>
        <Btn onClick={() => { navigator.clipboard?.writeText(token.token); setCopied(true); setTimeout(()=>setCopied(false),1500); }}>
          {copied ? "Copied" : "Copy"}
        </Btn>
      </div>
    </Modal>
  )
}

function PageSettings({ onGo, user, setUser }) {
  const [tab, setTab] = React.useState("profile")
  const [acct, setAcct] = React.useState(null)

  // profile
  const [name, setName] = React.useState("")
  const [tz, setTz] = React.useState("")
  const [lang, setLang] = React.useState("")
  const [savingProfile, setSavingProfile] = React.useState(false)
  // password
  const [pwCur, setPwCur] = React.useState("")
  const [pwNext, setPwNext] = React.useState("")
  const [savingPw, setSavingPw] = React.useState(false)
  // security data
  const [sessions, setSessions] = React.useState(null)
  const [activity, setActivity] = React.useState(null)
  // tokens / ssh
  const [tokens, setTokens] = React.useState(null)
  const [sshKeys, setSshKeys] = React.useState(null)
  const [newToken, setNewToken] = React.useState(null)
  const [tokenModalOpen, setTokenModalOpen] = React.useState(false)
  const [tokenName, setTokenName] = React.useState("")
  const [sshOpen, setSshOpen] = React.useState(false)
  const [sshName, setSshName] = React.useState("")
  const [sshKey, setSshKey] = React.useState("")

  const loadAcct = () => accountApi.get().then(a => {
    setAcct(a); setName(a.name || ""); setTz(a.timezone || TIMEZONES[0]); setLang(a.language || "English")
  }).catch(() => {})
  React.useEffect(() => { loadAcct() }, [])
  React.useEffect(() => {
    if (tab === "security") { accountApi.sessions().then(setSessions).catch(()=>setSessions([])); accountApi.activity().then(setActivity).catch(()=>setActivity([])) }
    if (tab === "api") accountApi.tokens().then(setTokens).catch(()=>setTokens([]))
    if (tab === "ssh") accountApi.sshKeys().then(setSshKeys).catch(()=>setSshKeys([]))
  }, [tab])

  const saveProfile = async () => {
    setSavingProfile(true)
    try {
      const u = await accountApi.update({ name, timezone: tz, language: lang })
      setAcct(u)
      const merged = { ...user, name: u.name }
      setUser?.(merged); localStorage.setItem('strata_cloud_user', JSON.stringify(merged))
      toast("Profile saved", "success")
    } catch (e) { toast(e.message, "error") }
    finally { setSavingProfile(false) }
  }
  const changePassword = async () => {
    if (!pwNext || pwNext.length < 8) { toast("New password must be at least 8 characters.", "error"); return }
    setSavingPw(true)
    try { await accountApi.password(pwCur, pwNext); setPwCur(""); setPwNext(""); toast("Password changed", "success") }
    catch (e) { toast(e.message, "error") }
    finally { setSavingPw(false) }
  }
  const toggle2fa = async (on) => {
    try { await accountApi.set2fa(on); setAcct({ ...acct, two_factor: on }); toast(on ? "2FA enabled" : "2FA disabled", on ? "success" : "info") }
    catch (e) { toast(e.message, "error") }
  }
  const revokeSession = async (id) => {
    try { await accountApi.revokeSession(id); setSessions(s => s.filter(x => x.id !== id)); toast("Session revoked", "success") }
    catch (e) { toast(e.message, "error") }
  }
  const createToken = async () => {
    if (!tokenName.trim()) { toast("Enter a token name", "error"); return }
    try {
      const t = await accountApi.createToken(tokenName.trim())
      setNewToken(t); setTokenName(""); setTokenModalOpen(false)
      accountApi.tokens().then(setTokens)
    } catch (e) { toast(e.message, "error") }
  }
  const revokeToken = async (id) => { try { await accountApi.revokeToken(id); setTokens(t => t.filter(x=>x.id!==id)); toast("Token revoked","success") } catch(e){ toast(e.message,"error") } }
  const addSshKey = async () => {
    if (!sshName.trim() || !sshKey.trim()) { toast("Name and public key required", "error"); return }
    try { await accountApi.addSshKey(sshName.trim(), sshKey.trim()); setSshName(""); setSshKey(""); setSshOpen(false); accountApi.sshKeys().then(setSshKeys); toast("SSH key added","success") }
    catch (e) { toast(e.message, "error") }
  }
  const removeSshKey = async (id) => { try { await accountApi.removeSshKey(id); setSshKeys(k => k.filter(x=>x.id!==id)); toast("SSH key removed","success") } catch(e){ toast(e.message,"error") } }

  if (!acct) return (
    <div>
      <div className="page-h"><div><h1>Account</h1><div className="sub">Loading…</div></div></div>
      <Loading/>
    </div>
  )

  const initials = (name || acct.email || "?").split(/[\s@]/).filter(Boolean).map(w=>w[0]).join("").slice(0,2).toUpperCase()

  return (
    <div>
      <div className="page-h">
        <div><h1>Account</h1><div className="sub">Profile, security, API tokens, and SSH keys.</div></div>
      </div>

      <Tabs value={tab} onChange={setTab} tabs={[
        { id: "profile",  label: "Profile" },
        { id: "security", label: "Security" },
        { id: "api",      label: "API tokens", count: tokens?.length },
        { id: "ssh",      label: "SSH keys", count: sshKeys?.length },
      ]}/>

      {tab === "profile" && (
        <div className="g cols-12">
          <div style={{ gridColumn: "span 8" }}>
            <Card title="Profile">
              <div className="row" style={{ gap: 18, marginBottom: 20, alignItems: "center" }}>
                <div style={{ width:64, height:64, borderRadius:"50%", flexShrink:0, background:"linear-gradient(135deg, var(--accent), var(--accent-2))", display:"flex", alignItems:"center", justifyContent:"center", fontSize:24, fontWeight:700, color:"#fff" }}>{initials}</div>
                <div className="col" style={{ gap: 4 }}>
                  <div style={{ fontSize: 16, fontWeight: 600 }}>{acct.name}</div>
                  <div className="mute" style={{ fontSize: 12.5 }}>{acct.email} · {acct.plan} plan · joined {acct.created_at ? new Date(acct.created_at).toLocaleDateString() : "—"}</div>
                </div>
              </div>
              <div className="g cols-2" style={{ gap: 14 }}>
                <Field label="Full name"><input className="input" value={name} onChange={e => setName(e.target.value)}/></Field>
                <Field label="Email"><input className="input" value={acct.email} disabled style={{ opacity: 0.7 }}/></Field>
                <Field label="Timezone">
                  <select className="input" value={tz} onChange={e => setTz(e.target.value)}>
                    {TIMEZONES.map(z => <option key={z}>{z}</option>)}
                  </select>
                </Field>
                <Field label="Language">
                  <select className="input" value={lang} onChange={e => setLang(e.target.value)}>
                    {LANGUAGES.map(l => <option key={l}>{l}</option>)}
                  </select>
                </Field>
              </div>
              <div className="row" style={{ justifyContent: "flex-end", marginTop: 18, gap: 10 }}>
                <Btn onClick={() => { setName(acct.name||""); setTz(acct.timezone||TIMEZONES[0]); setLang(acct.language||"English") }}>Reset</Btn>
                <Btn kind="primary" onClick={saveProfile} disabled={savingProfile || (name===acct.name && tz===acct.timezone && lang===acct.language)}>
                  {savingProfile ? "Saving…" : "Save changes"}
                </Btn>
              </div>
            </Card>
          </div>
          <div style={{ gridColumn: "span 4" }}>
            <Card title="Plan">
              <div className="row" style={{ gap: 10, marginBottom: 12 }}>
                <div style={{ width:36, height:36, borderRadius:9, background:"color-mix(in oklab, var(--accent) 14%, transparent)", color:"var(--accent)", display:"flex", alignItems:"center", justifyContent:"center" }}><I.bolt size={16}/></div>
                <div><div style={{ fontSize:14, fontWeight:500, textTransform:"capitalize" }}>{acct.plan}</div><div className="mute" style={{ fontSize:11.5 }}>{acct.status}</div></div>
              </div>
              <Btn kind="ghost sm" onClick={() => onGo("portal-billing")}>Manage billing →</Btn>
            </Card>
          </div>
        </div>
      )}

      {tab === "security" && (
        <div className="col" style={{ gap: 18, maxWidth: 820 }}>
          <Card title="Password">
            <div className="g cols-2" style={{ gap: 14 }}>
              <Field label="Current password"><input className="input" type="password" value={pwCur} onChange={e => setPwCur(e.target.value)}/></Field>
              <Field label="New password" hint="At least 8 characters."><input className="input" type="password" value={pwNext} onChange={e => setPwNext(e.target.value)}/></Field>
            </div>
            <Btn kind="primary" size="sm" style={{ marginTop: 12 }} onClick={changePassword} disabled={savingPw || !pwCur || !pwNext}>{savingPw ? "Updating…" : "Update password"}</Btn>
          </Card>

          <Card title="Two-factor authentication" action={<Toggle on={!!acct.two_factor} onChange={toggle2fa}/>}>
            <div className="dim" style={{ fontSize: 13 }}>
              {acct.two_factor
                ? "2FA is enabled. We'll require a verification step on new device logins."
                : "Add an extra layer of security. When enabled, new logins require a second factor."}
            </div>
          </Card>

          <Card title="Active sessions">
            {!sessions ? <Loading label="Loading sessions…"/> : sessions.length === 0 ? (
              <div className="mute" style={{ fontSize: 13 }}>No active sessions.</div>
            ) : (
              <table className="tbl">
                <thead><tr><th>Device</th><th>IP</th><th>Last seen</th><th></th></tr></thead>
                <tbody>
                  {sessions.map(s => (
                    <tr key={s.id}>
                      <td>{s.os} · {s.browser} {s.current && <Pill kind="accent" style={{ marginLeft: 8 }}>Current</Pill>}</td>
                      <td className="mono">{s.ip}</td>
                      <td className="mute">{sTimeAgo(s.last_seen)}</td>
                      <td style={{ textAlign: "right" }}>{!s.current && <Btn kind="ghost sm" onClick={() => revokeSession(s.id)}>Revoke</Btn>}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </Card>

          <Card title="Audit log">
            {!activity ? <Loading label="Loading…"/> : activity.length === 0 ? (
              <div className="mute" style={{ fontSize: 13 }}>No activity recorded yet.</div>
            ) : (
              <div className="col" style={{ gap: 8 }}>
                {activity.map((e, i) => (
                  <div key={i} className="row" style={{ gap: 10, fontSize: 12.5 }}>
                    <span style={{ width: 6, height: 6, borderRadius: "50%", background: `var(--${e.kind || "text-mute"})` }}/>
                    <span style={{ flex: 1 }}>{e.action}{e.detail ? <span className="mute"> · {e.detail}</span> : ""}</span>
                    <span className="mute mono">{sTimeAgo(e.created_at)}</span>
                  </div>
                ))}
              </div>
            )}
          </Card>
        </div>
      )}

      {tab === "api" && (
        <Card title="API tokens" action={<Btn kind="primary" size="sm" icon={<I.plus size={12}/>} onClick={() => setTokenModalOpen(true)}>Generate token</Btn>}>
          <div className="dim" style={{ fontSize: 13, marginBottom: 16 }}>
            Tokens authenticate the CLI, REST API, and your own scripts. The full token is shown only once at creation.
          </div>
          {!tokens ? <Loading/> : tokens.length === 0 ? (
            <div className="mute" style={{ fontSize: 13, padding: "16px 0", textAlign: "center" }}>No API tokens yet.</div>
          ) : (
            <table className="tbl">
              <thead><tr><th>Name</th><th>Token</th><th>Scope</th><th>Created</th><th>Last used</th><th></th></tr></thead>
              <tbody>
                {tokens.map(t => (
                  <tr key={t.id}>
                    <td className="mono">{t.name}</td>
                    <td className="mono mute" style={{ fontSize: 12 }}>{t.prefix}····</td>
                    <td><Pill kind={t.scope === "read" ? "info" : ""}>{t.scope}</Pill></td>
                    <td className="mute">{t.created_at ? new Date(t.created_at).toLocaleDateString() : "—"}</td>
                    <td className="mute">{t.last_used ? sTimeAgo(t.last_used) : "never"}</td>
                    <td style={{ textAlign: "right" }}><Btn kind="ghost sm" onClick={() => revokeToken(t.id)}>Revoke</Btn></td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </Card>
      )}

      {tab === "ssh" && (
        <Card title="SSH keys" action={<Btn kind="primary" size="sm" icon={<I.plus size={12}/>} onClick={() => setSshOpen(true)}>Add key</Btn>}>
          <div className="dim" style={{ fontSize: 13, marginBottom: 16 }}>
            SSH keys are injected into new VMs at provision time so you can connect without a password.
          </div>
          {!sshKeys ? <Loading/> : sshKeys.length === 0 ? (
            <div className="mute" style={{ fontSize: 13, padding: "16px 0", textAlign: "center" }}>No SSH keys yet.</div>
          ) : (
            <div className="col" style={{ gap: 10 }}>
              {sshKeys.map(k => (
                <div key={k.id} className="card row" style={{ padding: 14, gap: 12, background: "var(--surface-3)" }}>
                  <I.lock size={16} stroke="var(--accent-2)"/>
                  <div className="col" style={{ flex: 1, gap: 2 }}>
                    <div className="row" style={{ gap: 8 }}>
                      <span style={{ fontSize: 13, fontWeight: 500 }}>{k.name}</span>
                      <Pill>{k.key_type}</Pill>
                    </div>
                    <span className="mono mute" style={{ fontSize: 11 }}>{k.fingerprint}</span>
                  </div>
                  <span className="mute" style={{ fontSize: 11.5 }}>{k.created_at ? new Date(k.created_at).toLocaleDateString() : ""}</span>
                  <Btn kind="ghost sm" onClick={() => removeSshKey(k.id)}>Remove</Btn>
                </div>
              ))}
            </div>
          )}
        </Card>
      )}

      {/* Generate token modal */}
      {tokenModalOpen && (
        <Modal open title="Generate API token" width={440} onClose={() => setTokenModalOpen(false)}
          footer={<><Btn onClick={() => setTokenModalOpen(false)}>Cancel</Btn><Btn kind="primary" onClick={createToken} disabled={!tokenName.trim()}>Generate</Btn></>}>
          <Field label="Token name" hint="A label so you can recognise it later.">
            <input className="input" placeholder="ci-deploy" value={tokenName} onChange={e => setTokenName(e.target.value)} autoFocus/>
          </Field>
        </Modal>
      )}
      <TokenModal token={newToken} onClose={() => setNewToken(null)}/>

      {/* Add SSH key modal */}
      {sshOpen && (
        <Modal open title="Add SSH key" width={520} onClose={() => setSshOpen(false)}
          footer={<><Btn onClick={() => setSshOpen(false)}>Cancel</Btn><Btn kind="primary" onClick={addSshKey} disabled={!sshName.trim() || !sshKey.trim()}>Add key</Btn></>}>
          <div className="col" style={{ gap: 12 }}>
            <Field label="Name"><input className="input" placeholder="laptop" value={sshName} onChange={e => setSshName(e.target.value)}/></Field>
            <Field label="Public key" hint="Paste the contents of your .pub file.">
              <textarea className="input mono" rows={4} placeholder="ssh-ed25519 AAAA… user@host" value={sshKey} onChange={e => setSshKey(e.target.value)}/>
            </Field>
          </div>
        </Modal>
      )}
    </div>
  )
}

export { PageSettings }
