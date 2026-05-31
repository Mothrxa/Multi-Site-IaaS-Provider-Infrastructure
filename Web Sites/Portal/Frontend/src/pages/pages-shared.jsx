import React from 'react'
import { I } from '../components/icons.jsx'
import { Card, Stat, Pill, SectionHeader, Avatar, TabBar, Progress, EmptyHint } from '../components/ui.jsx'
import { Donut } from '../components/charts.jsx'
import { mailApi } from '../api/mail.js'
import { announcementsApi, helpdeskApi, selfServiceApi, documentsApi } from '../api/index.js'

// pages-shared.jsx — Shared service pages (Mail, Announcements, Helpdesk, HR Self-Service)

// ====================== MAIL ======================
function MailPage({ user, composeTo }) {
  const [folder,   setFolder]   = React.useState("inbox");
  const [messages, setMessages] = React.useState([]);
  const [loading,  setLoading]  = React.useState(false);
  const [openMsg,  setOpenMsg]  = React.useState(null);
  const [compose,  setCompose]  = React.useState(false);

  // Auto-open compose when triggered externally (e.g. from HR Directory)
  React.useEffect(() => { if (composeTo) setCompose(true); }, [composeTo]);

  // Fetch message list when folder changes
  React.useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setOpenMsg(null);
    mailApi.list(folder)
      .then(data => { if (!cancelled) { setMessages(data.messages); setLoading(false); } })
      .catch(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [folder]);

  // Open a message — fetch full body and mark read
  function openMessage(msg) {
    mailApi.get(msg.uid, folder).then(full => {
      setOpenMsg(full);
      if (msg.unread) {
        mailApi.markRead(msg.uid, folder, true);
        setMessages(prev => prev.map(m => m.uid === msg.uid ? { ...m, unread: false } : m));
      }
    });
  }

  function handleDelete(uid) {
    mailApi.delete(uid, folder).then(() =>
      setMessages(prev => prev.filter(m => m.uid !== uid))
    );
    if (openMsg?.uid === uid) setOpenMsg(null);
  }

  function handleRefresh() {
    setLoading(true);
    mailApi.list(folder)
      .then(data => { setMessages(data.messages); setLoading(false); })
      .catch(() => setLoading(false));
  }

  const opened = openMsg;

  const unreadCount = messages.filter(m => m.unread).length;
  const folders = [
    { id: "inbox",  label: "Inbox",   icon: <I.inbox size={15}/>, n: folder === "inbox" ? unreadCount || null : null },
    { id: "star",   label: "Starred", icon: <I.star size={15}/> },
    { id: "sent",   label: "Sent",    icon: <I.send size={15}/> },
    { id: "draft",  label: "Drafts",  icon: <I.doc size={15}/> },
    { id: "arch",   label: "Archive", icon: <I.archive size={15}/> },
  ];

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 18, height: "100%" }}>
      <SectionHeader title="Mail" subtitle="Internal mail across all departments"
        actions={<>
          <button className="btn" onClick={handleRefresh} disabled={loading}><I.refresh size={14}/>{loading ? "Loading…" : "Refresh"}</button>
          <button className="btn primary" onClick={() => setCompose(true)}><I.send size={14}/>Compose</button>
        </>}/>

      <div style={{ flex: 1, display: "grid", gridTemplateColumns: "200px 360px 1fr", gap: 14, minHeight: 0 }}>
        {/* Folders */}
        <Card padding={14} style={{ display: "flex", flexDirection: "column", gap: 4 }}>
          {folders.map(f => (
            <button key={f.id} onClick={() => setFolder(f.id)} style={{
              display: "flex", alignItems: "center", gap: 10,
              padding: "8px 10px", borderRadius: 8, border: "none",
              background: folder === f.id ? "color-mix(in oklab, var(--accent) 16%, transparent)" : "transparent",
              color: folder === f.id ? "var(--text)" : "var(--text-dim)",
              cursor: "pointer", fontSize: 13, fontWeight: folder === f.id ? 500 : 400,
              textAlign: "left",
            }}>
              <span style={{ color: folder === f.id ? "var(--accent)" : "var(--text-dim)" }}>{f.icon}</span>
              <span style={{ flex: 1 }}>{f.label}</span>
              {f.n && <span className="mono" style={{ fontSize: 11, color: "var(--text-mute)" }}>{f.n}</span>}
            </button>
          ))}
          <div style={{ fontSize: 10, color: "var(--text-mute)", padding: "16px 10px 6px", letterSpacing: "0.06em", textTransform: "uppercase", fontWeight: 600 }}>Labels</div>
          {[
            { n: "Internal",      c: "var(--accent)" },
            { n: "HR",            c: "var(--hr-accent)" },
            { n: "Helpdesk",      c: "var(--warn)" },
            { n: "BizOps",        c: "var(--biz-accent)" },
            { n: "Announcement",  c: "var(--good)" },
            { n: "Notification",  c: "var(--text-mute)" },
          ].map(l => (
            <button key={l.n} style={{
              display: "flex", alignItems: "center", gap: 10,
              padding: "6px 10px", borderRadius: 8, border: "none",
              background: "transparent", color: "var(--text-dim)",
              cursor: "pointer", fontSize: 12, textAlign: "left",
            }}>
              <span style={{ width: 9, height: 9, borderRadius: 2, background: l.c }}/>
              <span>{l.n}</span>
            </button>
          ))}
        </Card>

        {/* List */}
        <Card padding={0} style={{ display: "flex", flexDirection: "column", overflow: "hidden" }}>
          <div style={{ padding: "12px 14px", borderBottom: "0.5px solid var(--hairline)", display: "flex", gap: 8, alignItems: "center" }}>
            <span style={{ fontSize: 13, fontWeight: 600 }}>{folders.find(f => f.id === folder)?.label || "Inbox"}</span>
            <span style={{ fontSize: 11, color: "var(--text-mute)" }}>{messages.length} messages</span>
            <div style={{ flex: 1 }}/>
            <button className="btn ghost icon" style={{ width: 26, height: 26 }}><I.filter size={13}/></button>
          </div>
          <div style={{ flex: 1, overflowY: "auto" }}>
            {loading && <div style={{ padding: 24, textAlign: "center", color: "var(--text-mute)", fontSize: 13 }}>Loading…</div>}
            {!loading && messages.length === 0 && <EmptyHint icon={<I.inbox size={28}/>}>No messages in this folder</EmptyHint>}
            {messages.map(m => (
              <button key={m.uid} onClick={() => openMessage(m)} style={{
                display: "flex", flexDirection: "column", gap: 4,
                width: "100%", textAlign: "left",
                padding: "14px 14px",
                background: openMsg?.uid === m.uid ? "color-mix(in oklab, var(--accent) 14%, transparent)" : "transparent",
                border: "none", borderBottom: "0.5px solid var(--hairline)",
                color: "var(--text)", cursor: "pointer", position: "relative",
              }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", gap: 8 }}>
                  <span style={{ fontSize: 13, fontWeight: m.unread ? 600 : 500, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{m.from}</span>
                  <span style={{ fontSize: 11, color: "var(--text-mute)", whiteSpace: "nowrap" }} className="mono">{m.time}</span>
                </div>
                <div style={{ fontSize: 12.5, fontWeight: m.unread ? 500 : 400, color: m.unread ? "var(--text)" : "var(--text-dim)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{m.subject}</div>
                <div style={{ fontSize: 11.5, color: "var(--text-mute)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{m.preview}</div>
                <div style={{ display: "flex", gap: 4, marginTop: 4 }}>
                  {m.labels?.map(l => <Pill key={l} style={{ height: 18, padding: "0 7px", fontSize: 10 }}>{l}</Pill>)}
                </div>
                {m.unread && (
                  <span style={{ position: "absolute", left: 4, top: "50%", width: 4, height: 28, transform: "translateY(-50%)", background: "var(--accent)", borderRadius: "0 2px 2px 0" }}/>
                )}
              </button>
            ))}
          </div>
        </Card>

        {/* Reader */}
        <Card padding={0} style={{ display: "flex", flexDirection: "column", overflow: "hidden" }}>
          {!opened && (
            <EmptyHint icon={<I.envelope size={28}/>}>Select a message to read</EmptyHint>
          )}
          {opened && (
            <>
              <div style={{ padding: 22, borderBottom: "0.5px solid var(--hairline)" }}>
                <h2 style={{ fontSize: 20, marginBottom: 14 }}>{opened.subject}</h2>
                <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                  <Avatar name={opened.from} size={36}/>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 13, fontWeight: 500 }}>{opened.from}
                      {opened.fromEmail && <span style={{ color: "var(--text-mute)", fontWeight: 400 }}> &lt;{opened.fromEmail}&gt;</span>}
                    </div>
                    <div style={{ fontSize: 11, color: "var(--text-mute)" }}>to {user.name} · {opened.time}</div>
                  </div>
                  <button className="btn ghost icon"><I.star size={14}/></button>
                  <button className="btn ghost icon" onClick={() => handleDelete(opened.uid)}><I.archive size={14}/></button>
                  <button className="btn ghost icon"><I.more size={14}/></button>
                </div>
              </div>
              <div
                style={{ padding: 22, flex: 1, overflowY: "auto", color: "var(--text-dim)", fontSize: 13.5, lineHeight: 1.65 }}
                dangerouslySetInnerHTML={{ __html: opened.body }}
              />
              <div style={{ padding: 14, borderTop: "0.5px solid var(--hairline)", display: "flex", gap: 8 }}>
                <button className="btn primary" style={{ flex: 1 }} onClick={() => setCompose(true)}><I.send size={14}/>Reply</button>
                <button className="btn" style={{ flex: 1 }}>Reply all</button>
                <button className="btn" style={{ flex: 1 }}>Forward</button>
              </div>
            </>
          )}
        </Card>
      </div>

      {compose && <ComposeMail onClose={() => setCompose(false)} defaultTo={composeTo || ""}/>}
    </div>
  );
}

function ComposeMail({ onClose, defaultTo = "", defaultSubject = "" }) {
  const [to,      setTo]      = React.useState(defaultTo);
  const [subject, setSubject] = React.useState(defaultSubject);
  const [body,    setBody]    = React.useState("");
  const [sending, setSending] = React.useState(false);
  const [sent,    setSent]    = React.useState(false);

  function handleSend() {
    if (!to.trim() || !subject.trim()) return;
    setSending(true);
    mailApi.send(to.trim(), subject.trim(), body)
      .then(() => { setSent(true); setTimeout(onClose, 1200); })
      .catch(() => setSending(false));
  }

  return (
    <div style={{ position: "fixed", right: 24, bottom: 24, width: 480, height: 480, zIndex: 200, animation: "slideup 0.3s both" }}>
      <Card padding={0} style={{ display: "flex", flexDirection: "column", height: "100%", boxShadow: "var(--shadow-pop)" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "10px 14px", borderBottom: "0.5px solid var(--hairline)" }}>
          <span style={{ fontSize: 13, fontWeight: 600 }}>{sent ? "Sent!" : "New Message"}</span>
          <button className="btn ghost icon" onClick={onClose}><I.x size={14}/></button>
        </div>
        <input className="input" placeholder="To" value={to} onChange={e => setTo(e.target.value)}
          style={{ border: "none", borderBottom: "0.5px solid var(--hairline)", borderRadius: 0, background: "transparent" }}/>
        <input className="input" placeholder="Subject" value={subject} onChange={e => setSubject(e.target.value)}
          style={{ border: "none", borderBottom: "0.5px solid var(--hairline)", borderRadius: 0, background: "transparent" }}/>
        <textarea placeholder="Write your message…" value={body} onChange={e => setBody(e.target.value)} style={{
          flex: 1, padding: 14, fontFamily: "var(--f-sans)", fontSize: 13,
          background: "transparent", border: "none", outline: "none", color: "var(--text)",
          resize: "none",
        }}/>
        <div style={{ display: "flex", gap: 8, padding: 12, borderTop: "0.5px solid var(--hairline)" }}>
          <button className="btn primary" onClick={handleSend} disabled={sending || sent || !to || !subject}>
            <I.send size={14}/>{sending ? "Sending…" : sent ? "Sent" : "Send"}
          </button>
          <button className="btn ghost icon"><I.paperclip size={14}/></button>
          <div style={{ flex: 1 }}/>
          <button className="btn ghost icon" onClick={onClose}><I.archive size={14}/></button>
        </div>
      </Card>
    </div>
  );
}

// ====================== ANNOUNCEMENTS ======================
function AnnouncementsPage({ user }) {
  const isAdmin = ['superadmin', 'it_admin'].includes(user?.role);
  const [items,   setItems]   = React.useState([]);
  const [filter,  setFilter]  = React.useState("all");
  const [compose, setCompose] = React.useState(false);
  const [form,    setForm]    = React.useState({ scope: "company", title: "", body: "" });
  const [posting, setPosting] = React.useState(false);

  React.useEffect(() => {
    announcementsApi.list().then(setItems).catch(() => {});
  }, []);

  const filtered = filter === "all" ? items
    : filter === "co"   ? items.filter(a => a.scope === "company")
    : items.filter(a => a.scope === user?.dept);

  function handleReact(id, emoji) {
    announcementsApi.react(id, emoji).then(({ count }) =>
      setItems(prev => prev.map(a => a.id === id ? { ...a, reaction_count: count, my_reaction: a.my_reaction === emoji ? null : emoji } : a))
    );
  }

  function handlePost() {
    if (!form.title || !form.body) return;
    setPosting(true);
    announcementsApi.create(form)
      .then(created => { setItems(prev => [created, ...prev]); setCompose(false); setForm({ scope: "company", title: "", body: "" }); })
      .catch(() => {})
      .finally(() => setPosting(false));
  }

  function fmtTime(ts) {
    const d = new Date(ts), now = new Date();
    const diff = (now - d) / 1000;
    if (diff < 3600)  return `${Math.floor(diff / 60)}m ago`;
    if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
    return `${Math.floor(diff / 86400)}d ago`;
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 22 }}>
      <SectionHeader title="Announcement Board"
        subtitle="Company-wide and per-department notices"
        actions={<>
          <TabBar dense tabs={[{ id: "all", label: "All" }, { id: "co", label: "Company" }, { id: "dept", label: "My dept" }]} active={filter} onChange={setFilter}/>
          {isAdmin && <button className="btn primary" onClick={() => setCompose(true)}><I.plus size={14}/>Post</button>}
        </>}/>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 280px", gap: "var(--gap-grid)", alignItems: "flex-start" }}>
        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          {filtered.length === 0 && <div style={{ padding: 40, textAlign: "center", color: "var(--text-mute)", fontSize: 13 }}>No announcements yet.</div>}
          {filtered.map(a => (
            <Card key={a.id} style={{ padding: 20 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 14 }}>
                <Avatar name={a.author_name} size={36}/>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 13, fontWeight: 500 }}>{a.author_name}</div>
                  <div style={{ fontSize: 11, color: "var(--text-mute)", marginTop: 1 }}>{fmtTime(a.created_at)}</div>
                </div>
                <Pill tone={a.scope === "company" ? "info" : undefined}>{a.scope}</Pill>
                {!!a.pinned && <Pill tone="warn">📌 Pinned</Pill>}
              </div>
              <h3 style={{ fontSize: 18, marginBottom: 10 }}>{a.title}</h3>
              <p style={{ fontSize: 14, lineHeight: 1.6, color: "var(--text-dim)" }}>{a.body}</p>
              <div style={{ display: "flex", alignItems: "center", gap: 14, marginTop: 16, paddingTop: 14, borderTop: "0.5px solid var(--hairline)" }}>
                <span style={{ fontSize: 11, color: "var(--text-mute)" }}>👍 {a.reaction_count ?? 0} reactions</span>
                <div style={{ flex: 1 }}/>
                {["👍","🎉","👏","❤️"].map(e => (
                  <button key={e} onClick={() => handleReact(a.id, e)} style={{
                    padding: "3px 8px", borderRadius: 8, fontSize: 14, border: "0.5px solid",
                    borderColor: a.my_reaction === e ? "var(--accent)" : "var(--hairline)",
                    background: a.my_reaction === e ? "color-mix(in oklab, var(--accent) 14%, transparent)" : "transparent",
                    cursor: "pointer",
                  }}>{e}</button>
                ))}
              </div>
            </Card>
          ))}
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 14, position: "sticky", top: 0 }}>
          <Card title="Quick links">
            {[
              { n: "Employee handbook",  i: <I.doc size={14}/> },
              { n: "Submit a ticket",    i: <I.ticket size={14}/> },
              { n: "Request leave",      i: <I.cal size={14}/> },
              { n: "Office WiFi guide",  i: <I.wifi size={14}/> },
            ].map((l, i) => (
              <button key={i} style={{
                display: "flex", alignItems: "center", gap: 10, width: "100%",
                padding: "8px 0", borderTop: i ? "0.5px solid var(--hairline)" : "none",
                background: "transparent", border: "none",
                color: "var(--text-dim)", cursor: "pointer", fontSize: 12, textAlign: "left",
              }}>{l.i}<span style={{ flex: 1 }}>{l.n}</span><I.arrowR size={12}/></button>
            ))}
          </Card>
        </div>
      </div>

      {compose && (
        <div onClick={() => setCompose(false)} style={{ position: "fixed", inset: 0, background: "rgba(8,10,14,0.5)", zIndex: 200, WebkitBackdropFilter: "blur(8px)", backdropFilter: "blur(8px)", display: "flex", alignItems: "center", justifyContent: "center" }} className="fadein">
          <Card onClick={e => e.stopPropagation()} style={{ width: 560, padding: 24 }}>
            <h3 style={{ marginBottom: 14 }}>New announcement</h3>
            <div style={{ display: "flex", gap: 8, marginBottom: 10 }}>
              <select className="input" value={form.scope} onChange={e => setForm(f => ({ ...f, scope: e.target.value }))}>
                <option value="company">Company</option>
                <option value="it">IT</option>
                <option value="hr">HR</option>
                <option value="biz">BizOps</option>
              </select>
              <input className="input" placeholder="Title" style={{ flex: 1 }} value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))}/>
            </div>
            <textarea placeholder="What do you want to share?" value={form.body} onChange={e => setForm(f => ({ ...f, body: e.target.value }))} style={{
              width: "100%", height: 180, padding: 12, fontFamily: "var(--f-sans)", fontSize: 13,
              background: "var(--surface-3)", color: "var(--text)",
              border: "0.5px solid var(--hairline-2)", borderRadius: 10, outline: "none", resize: "none",
            }}/>
            <div style={{ display: "flex", gap: 8, marginTop: 14 }}>
              <button className="btn primary" style={{ flex: 1 }} onClick={handlePost} disabled={posting || !form.title || !form.body}>
                <I.send size={14}/>{posting ? "Publishing…" : "Publish"}
              </button>
              <button className="btn" onClick={() => setCompose(false)}>Cancel</button>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
}

// ====================== HELPDESK (submission) ======================
function HelpdeskPage({ user }) {
  const PRIO_MAP = { "Low": "P4", "Normal": "P3", "High": "P2", "Urgent": "P1" };
  const [form,      setForm]      = React.useState({ category: "VPN", priority: "Normal", subject: "", body: "" });
  const [tickets,   setTickets]   = React.useState([]);
  const [submitting, setSubmitting] = React.useState(false);
  const [submitted,  setSubmitted]  = React.useState(false);

  React.useEffect(() => {
    helpdeskApi.list().then(setTickets).catch(() => {});
  }, []);

  function handleSubmit() {
    if (!form.subject) return;
    setSubmitting(true);
    helpdeskApi.submit({
      title: `[${form.category}] ${form.subject}`,
      description: form.body,
      priority: PRIO_MAP[form.priority] || "P3",
    }).then(t => {
      setTickets(prev => [t, ...prev]);
      setSubmitted(true);
      setForm({ category: "VPN", priority: "Normal", subject: "", body: "" });
      setTimeout(() => setSubmitted(false), 3000);
    }).catch(() => {}).finally(() => setSubmitting(false));
  }

  const STATUS_TONE = { open: "info", in_progress: "warn", resolved: "good", closed: undefined };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 22 }}>
      <SectionHeader title="IT Helpdesk"
        subtitle="Report a technical issue or submit a service request"
        actions={<button className="btn"><I.question size={14}/>Knowledge base</button>}/>

      <div style={{ display: "grid", gridTemplateColumns: "1.4fr 1fr", gap: "var(--gap-grid)", alignItems: "flex-start" }}>
        <Card title="Submit a ticket" subtitle="Tickets are routed to the Support team and you'll get an update by email">
          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            <FormField label="Category">
              <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                {["VPN", "Cloud", "Hardware", "Account", "Software", "Other"].map(c => (
                  <button key={c} onClick={() => setForm({ ...form, category: c })} style={{
                    padding: "8px 14px", borderRadius: 999, border: "0.5px solid var(--hairline-2)",
                    background: form.category === c ? "color-mix(in oklab, var(--accent) 18%, transparent)" : "var(--surface-3)",
                    color: form.category === c ? "var(--text)" : "var(--text-dim)",
                    fontSize: 12, cursor: "pointer", fontWeight: form.category === c ? 500 : 400,
                  }}>{c}</button>
                ))}
              </div>
            </FormField>
            <FormField label="Priority">
              <div style={{ display: "flex", gap: 8 }}>
                {[
                  { p: "Low",     t: "info" },
                  { p: "Normal",  t: "good" },
                  { p: "High",    t: "warn" },
                  { p: "Urgent",  t: "bad"  },
                ].map(p => (
                  <button key={p.p} onClick={() => setForm({ ...form, priority: p.p })} style={{
                    flex: 1, padding: "10px 14px", borderRadius: 10, border: "0.5px solid var(--hairline-2)",
                    background: form.priority === p.p ? `color-mix(in oklab, var(--${p.t}) 18%, transparent)` : "var(--surface-3)",
                    color: "var(--text)", fontSize: 13, cursor: "pointer", fontWeight: 500,
                    display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
                  }}>
                    <span style={{ width: 8, height: 8, borderRadius: "50%", background: `var(--${p.t})` }}/>
                    {p.p}
                  </button>
                ))}
              </div>
            </FormField>
            <FormField label="Subject">
              <input className="input" style={{ width: "100%", height: 38 }} value={form.subject} onChange={e => setForm({ ...form, subject: e.target.value })} placeholder="Short description of the problem"/>
            </FormField>
            <FormField label="Describe what's happening" hint="Include any steps to reproduce, error messages, and what you expected to happen.">
              <textarea value={form.body} onChange={e => setForm({ ...form, body: e.target.value })} placeholder="The more detail the better — include screenshots if you have them." style={{
                width: "100%", height: 160, padding: 12, fontFamily: "var(--f-sans)", fontSize: 13,
                background: "var(--surface-3)", color: "var(--text)",
                border: "0.5px solid var(--hairline-2)", borderRadius: 10, outline: "none", resize: "none",
              }}/>
            </FormField>
            <FormField label="Attachments">
              <button className="btn" style={{ width: "100%", height: 44, justifyContent: "center", border: "0.5px dashed var(--hairline-2)" }}>
                <I.paperclip size={14}/>Drop files or click to upload
              </button>
            </FormField>
            <div style={{ display: "flex", gap: 8, marginTop: 4 }}>
              <button className="btn primary" style={{ flex: 1 }} onClick={handleSubmit} disabled={submitting || !form.subject}>
                <I.send size={14}/>{submitted ? "Submitted!" : submitting ? "Submitting…" : "Submit ticket"}
              </button>
            </div>
          </div>
        </Card>

        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          <Card title="Your recent tickets">
            {tickets.length === 0 && <div style={{ padding: 16, textAlign: "center", color: "var(--text-mute)", fontSize: 12 }}>No tickets yet.</div>}
            {tickets.slice(0, 6).map((t, i) => (
              <div key={t.id} style={{ display: "flex", gap: 10, padding: "10px 0", borderTop: i ? "0.5px solid var(--hairline)" : "none", alignItems: "center" }}>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 12, fontWeight: 500 }}>{t.title}</div>
                  <div style={{ fontSize: 11, color: "var(--text-mute)", marginTop: 2 }} className="mono">#{t.number} · {t.priority}</div>
                </div>
                <Pill tone={STATUS_TONE[t.status]}>{t.status.replace("_", " ")}</Pill>
              </div>
            ))}
          </Card>

          <Card title="Common issues" subtitle="Self-service answers">
            {[
              { n: "Reset your VPN credentials",          time: "2 min" },
              { n: "Reconnect to Algiers HQ WiFi",        time: "1 min" },
              { n: "Enable 2FA on a new phone",           time: "5 min" },
              { n: "Set up the company email on iPhone",  time: "4 min" },
              { n: "Request additional VPS",              time: "3 min" },
            ].map((k, i) => (
              <button key={i} style={{
                display: "flex", alignItems: "center", gap: 10, width: "100%",
                padding: "10px 0", borderTop: i ? "0.5px solid var(--hairline)" : "none",
                background: "transparent", border: "none", color: "var(--text-dim)",
                cursor: "pointer", textAlign: "left",
              }}>
                <I.question size={14}/>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 12, color: "var(--text)" }}>{k.n}</div>
                  <div style={{ fontSize: 11, color: "var(--text-mute)", marginTop: 1 }}>{k.time} read</div>
                </div>
                <I.arrowR size={12}/>
              </button>
            ))}
          </Card>
        </div>
      </div>
    </div>
  );
}

function FormField({ label, hint, children }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 7 }}>
      <label style={{ fontSize: 12, color: "var(--text-dim)", fontWeight: 500 }}>{label}</label>
      {children}
      {hint && <span style={{ fontSize: 11, color: "var(--text-mute)" }}>{hint}</span>}
    </div>
  );
}

// ====================== FILE SHARING ======================
function FilesPage({ user }) {
  const [docs,      setDocs]      = React.useState([]);
  const [search,    setSearch]    = React.useState("");
  const [deptTab,   setDeptTab]   = React.useState("all");
  const [dlError,   setDlError]   = React.useState("");

  React.useEffect(() => {
    documentsApi.list().then(setDocs).catch(() => {});
  }, []);

  function handleDownload(doc) {
    setDlError("");
    documentsApi.download(doc.id, doc.name).catch(err => setDlError(err.message));
  }

  const mimeIcon = (mime) => {
    const base = { width: 32, height: 32, borderRadius: 7, display: "inline-flex", alignItems: "center", justifyContent: "center", flex: "0 0 auto", fontSize: 11, fontWeight: 600 };
    if (mime?.includes("pdf"))   return <div style={{ ...base, background: "color-mix(in oklab, var(--bad)  16%, transparent)", color: "var(--bad)"  }}>PDF</div>;
    if (mime?.includes("word") || mime?.includes("doc")) return <div style={{ ...base, background: "color-mix(in oklab, var(--info) 16%, transparent)", color: "var(--info)" }}>DOC</div>;
    if (mime?.includes("sheet") || mime?.includes("excel")) return <div style={{ ...base, background: "color-mix(in oklab, var(--good) 16%, transparent)", color: "var(--good)" }}>XLS</div>;
    if (mime?.includes("image")) return <div style={{ ...base, background: "color-mix(in oklab, var(--warn) 16%, transparent)", color: "var(--warn)" }}>IMG</div>;
    return <div style={{ ...base, background: "var(--surface-3)", color: "var(--text-mute)" }}><I.doc size={16}/></div>;
  };

  const DEPT_ACCENT = { it: "var(--it-accent)", hr: "var(--hr-accent)", biz: "var(--biz-accent)", company: "var(--accent)" };
  const filtered = docs
    .filter(d => deptTab === "all" || d.dept === deptTab)
    .filter(d => !search || d.name.toLowerCase().includes(search.toLowerCase()));

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 18, height: "100%" }}>
      <SectionHeader title="Documents" subtitle="Department-scoped document repository"
        actions={<input className="input" placeholder="Search…" value={search} onChange={e => setSearch(e.target.value)} style={{ width: 200 }}/>}/>

      {dlError && (
        <div style={{ padding: "10px 14px", borderRadius: 10, fontSize: 13, background: "color-mix(in oklab, var(--bad) 12%, transparent)", border: "0.5px solid color-mix(in oklab, var(--bad) 30%, transparent)", color: "var(--bad)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <span>{dlError}</span>
          <button className="btn ghost icon" onClick={() => setDlError("")} style={{ width: 24, height: 24 }}><I.x size={12}/></button>
        </div>
      )}

      <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
        <TabBar dense
          tabs={[
            { id: "all",     label: `All (${docs.length})` },
            { id: "company", label: "Company" },
            { id: "it",      label: "IT" },
            { id: "hr",      label: "HR" },
            { id: "biz",     label: "BizOps" },
          ]}
          active={deptTab} onChange={setDeptTab}
        />
      </div>

      <Card padding={0} style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden" }}>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 120px 120px 120px 40px", padding: "10px 18px", borderBottom: "0.5px solid var(--hairline)", fontSize: 11, color: "var(--text-mute)", letterSpacing: "0.06em", textTransform: "uppercase", fontWeight: 600 }}>
          <span>Name</span><span>Dept</span><span>Access</span><span>Uploaded</span><span/>
        </div>
        <div style={{ flex: 1, overflowY: "auto" }}>
          {filtered.length === 0 && <EmptyHint icon={<I.archive size={32}/>}>No documents{search ? " match your search" : " yet"}.</EmptyHint>}
          {filtered.map(doc => (
            <div key={doc.id} style={{
              display: "grid", gridTemplateColumns: "1fr 120px 120px 120px 40px",
              alignItems: "center", gap: 10, padding: "12px 18px",
              borderBottom: "0.5px solid var(--hairline)",
            }}>
              <div style={{ display: "flex", alignItems: "center", gap: 12, minWidth: 0 }}>
                {mimeIcon(doc.mime_type)}
                <div style={{ minWidth: 0 }}>
                  <div style={{ fontSize: 13, fontWeight: 500, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{doc.name}</div>
                  <div style={{ fontSize: 11, color: "var(--text-mute)", marginTop: 1 }}>by {doc.owner_name} · {doc.size_bytes > 0 ? `${Math.round(doc.size_bytes / 1024)} KB` : "—"}</div>
                </div>
              </div>
              <div style={{ width: 9, height: 9, borderRadius: 2, background: DEPT_ACCENT[doc.dept] || "var(--accent)", display: "inline-block", marginRight: 6 }}/>
              <Pill style={{ height: 20, fontSize: 10 }}>{doc.acl}</Pill>
              <span style={{ fontSize: 11, color: "var(--text-dim)" }} className="mono">
                {new Date(doc.uploaded_at).toLocaleDateString([], { month: "short", day: "numeric" })}
              </span>
              <button className="btn ghost icon" style={{ width: 28, height: 28 }} title="Download" onClick={() => handleDownload(doc)}>
                <I.download size={13}/>
              </button>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}

// ====================== DEPT DOCUMENTS (IT, BizOps) ======================
function DeptDocumentsPage({ user }) {
  const dept    = user?.dept || 'it';
  const isAdmin = ['superadmin', 'it_admin'].includes(user?.role);

  const [docs,       setDocs]       = React.useState([]);
  const [search,     setSearch]     = React.useState("");
  const [showUpload, setShowUpload] = React.useState(false);
  const [file,       setFile]       = React.useState(null);
  const [upForm,     setUpForm]     = React.useState({ name: '', description: '' });
  const [uploading,  setUploading]  = React.useState(false);
  const [upError,    setUpError]    = React.useState('');
  const [actionErr,  setActionErr]  = React.useState('');

  const DEPT_LABELS = { it: 'IT', hr: 'HR', biz: 'BizOps', company: 'Company' };

  const refresh = () => documentsApi.list().then(setDocs).catch(() => {});
  React.useEffect(() => { refresh() }, []);

  const filtered = docs.filter(d =>
    (d.dept === dept || d.dept === 'company') &&
    (!search || d.name.toLowerCase().includes(search.toLowerCase()))
  );

  const mimeIcon = (mime) => {
    const base = { width: 32, height: 32, borderRadius: 7, display: "inline-flex", alignItems: "center", justifyContent: "center", flex: "0 0 auto", fontSize: 11, fontWeight: 600 };
    if (mime?.includes("pdf"))   return <div style={{ ...base, background: "color-mix(in oklab, var(--bad) 16%, transparent)", color: "var(--bad)" }}>PDF</div>;
    if (mime?.includes("word") || mime?.includes("doc")) return <div style={{ ...base, background: "color-mix(in oklab, var(--info) 16%, transparent)", color: "var(--info)" }}>DOC</div>;
    if (mime?.includes("sheet") || mime?.includes("excel")) return <div style={{ ...base, background: "color-mix(in oklab, var(--good) 16%, transparent)", color: "var(--good)" }}>XLS</div>;
    if (mime?.includes("image")) return <div style={{ ...base, background: "color-mix(in oklab, var(--warn) 16%, transparent)", color: "var(--warn)" }}>IMG</div>;
    return <div style={{ ...base, background: "var(--surface-3)", color: "var(--text-mute)" }}><I.doc size={16}/></div>;
  };

  function handleUpload() {
    if (!file) return;
    setUploading(true); setUpError('');
    const fd = new FormData();
    fd.append('file', file);
    fd.append('name', upForm.name || file.name);
    fd.append('description', upForm.description);
    fd.append('dept', dept);
    fd.append('acl', 'dept_only');
    documentsApi.upload(fd)
      .then(d => { setDocs(prev => [d, ...prev]); setShowUpload(false); setFile(null); setUpForm({ name: '', description: '' }); })
      .catch(err => setUpError(err.message))
      .finally(() => setUploading(false));
  }

  function handleDownload(doc) {
    setActionErr('');
    documentsApi.download(doc.id, doc.name).catch(err => setActionErr(err.message));
  }

  function handleDelete(doc) {
    if (!window.confirm(`Delete "${doc.name}"?`)) return;
    setActionErr('');
    documentsApi.delete(doc.id)
      .then(() => setDocs(prev => prev.filter(d => d.id !== doc.id)))
      .catch(err => setActionErr(err.message));
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
      <SectionHeader
        title="Documents"
        subtitle={`${DEPT_LABELS[dept]} documents and company-wide resources`}
        breadcrumbs={[DEPT_LABELS[dept] + ' Workspace', 'Documents']}
        actions={<>
          <input className="input" placeholder="Search…" value={search} onChange={e => setSearch(e.target.value)} style={{ width: 200 }}/>
          <button className="btn primary" onClick={() => setShowUpload(true)}><I.plus size={14}/>Upload</button>
        </>}/>

      {actionErr && (
        <div style={{ padding: "10px 14px", borderRadius: 10, fontSize: 13, background: "color-mix(in oklab, var(--bad) 12%, transparent)", border: "0.5px solid color-mix(in oklab, var(--bad) 30%, transparent)", color: "var(--bad)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <span>{actionErr}</span>
          <button className="btn ghost icon" onClick={() => setActionErr("")} style={{ width: 24, height: 24 }}><I.x size={12}/></button>
        </div>
      )}

      <Card padding={0}>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 100px 100px 80px", padding: "10px 18px", borderBottom: "0.5px solid var(--hairline)", fontSize: 11, color: "var(--text-mute)", letterSpacing: "0.06em", textTransform: "uppercase", fontWeight: 600 }}>
          <span>Name</span><span>Scope</span><span>Date</span><span style={{ textAlign: 'right' }}>Actions</span>
        </div>
        <div style={{ maxHeight: 520, overflowY: "auto" }}>
          {filtered.length === 0 && <EmptyHint icon={<I.doc size={32}/>}>No documents yet — upload one to get started.</EmptyHint>}
          {filtered.map(doc => (
            <div key={doc.id} style={{ display: "grid", gridTemplateColumns: "1fr 100px 100px 80px", alignItems: "center", gap: 10, padding: "12px 18px", borderBottom: "0.5px solid var(--hairline)" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 12, minWidth: 0 }}>
                {mimeIcon(doc.mime_type)}
                <div style={{ minWidth: 0 }}>
                  <div style={{ fontSize: 13, fontWeight: 500, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{doc.name}</div>
                  <div style={{ fontSize: 11, color: "var(--text-mute)", marginTop: 1 }}>by {doc.owner_name}{doc.size_bytes > 0 ? ` · ${Math.round(doc.size_bytes / 1024)} KB` : ''}</div>
                </div>
              </div>
              <Pill style={{ height: 20, fontSize: 10 }}>{DEPT_LABELS[doc.dept] ?? doc.dept}</Pill>
              <span style={{ fontSize: 11, color: "var(--text-dim)" }} className="mono">
                {new Date(doc.uploaded_at).toLocaleDateString([], { month: "short", day: "numeric" })}
              </span>
              <div style={{ display: "flex", gap: 4, justifyContent: "flex-end" }}>
                <button className="btn ghost icon" style={{ width: 28, height: 28 }} onClick={() => handleDownload(doc)} title="Download"><I.download size={13}/></button>
                {(isAdmin || doc.owner_id === user?.id) && (
                  <button className="btn ghost icon" style={{ width: 28, height: 28, color: "var(--bad)" }} onClick={() => handleDelete(doc)} title="Delete"><I.x size={13}/></button>
                )}
              </div>
            </div>
          ))}
        </div>
      </Card>

      {showUpload && (
        <div onClick={() => setShowUpload(false)} style={{ position: "fixed", inset: 0, background: "rgba(7,9,15,0.55)", zIndex: 200, WebkitBackdropFilter: "blur(8px)", backdropFilter: "blur(8px)", display: "flex", alignItems: "center", justifyContent: "center" }} className="fadein">
          <div onClick={e => e.stopPropagation()} style={{ width: 480, background: "var(--bg-2)", border: "0.5px solid var(--hairline-2)", borderRadius: 18, boxShadow: "var(--shadow-pop)", padding: 26, display: "flex", flexDirection: "column", gap: 14 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <h3 style={{ margin: 0, fontSize: 16 }}>Upload document</h3>
              <button className="btn ghost icon" onClick={() => setShowUpload(false)}><I.x size={15}/></button>
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
              <label style={{ fontSize: 12, color: "var(--text-dim)", fontWeight: 500 }}>File</label>
              <input type="file" onChange={e => setFile(e.target.files[0])} style={{ fontSize: 13, color: "var(--text)" }}/>
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
              <label style={{ fontSize: 12, color: "var(--text-dim)", fontWeight: 500 }}>Display name (optional)</label>
              <input className="input" style={{ width: "100%" }} value={upForm.name} onChange={e => setUpForm(f => ({ ...f, name: e.target.value }))} placeholder="Leave blank to use filename"/>
            </div>
            {upError && <div style={{ fontSize: 12, color: "var(--bad)" }}>{upError}</div>}
            <div style={{ display: "flex", gap: 8, justifyContent: "flex-end", marginTop: 4 }}>
              <button className="btn" onClick={() => setShowUpload(false)}>Cancel</button>
              <button className="btn primary" onClick={handleUpload} disabled={uploading || !file}>
                {uploading ? "Uploading…" : "Upload"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ====================== HR SELF-SERVICE ======================
function SelfServicePage({ user }) {
  const [leaveRequests, setLeaveRequests] = React.useState([]);
  const [payslips,      setPayslips]      = React.useState([]);
  const [profile,       setProfile]       = React.useState(null);
  const [expenses,      setExpenses]      = React.useState([]);
  const [referrals,     setReferrals]     = React.useState([]);
  const [modal,         setModal]         = React.useState(null); // 'leave'|'profile'|'expense'|'referral'
  const [submitting,    setSubmitting]    = React.useState(false);
  const [fileError,     setFileError]     = React.useState("");

  // forms
  const [leaveForm,   setLeaveForm]   = React.useState({ type: "annual", start_date: "", end_date: "", reason: "" });
  const [profileForm, setProfileForm] = React.useState({ phone: "", address: "", emergency_name: "", emergency_phone: "", iban: "", personal_email: "" });
  const [expenseForm, setExpenseForm] = React.useState({ description: "", amount: "", currency: "DZD", category: "Transport" });
  const [referralForm,setReferralForm]= React.useState({ candidate_name: "", candidate_email: "", role_applied: "", notes: "" });

  const [leaveBalance, setLeaveBalance] = React.useState(null);

  React.useEffect(() => {
    selfServiceApi.listLeave().then(setLeaveRequests).catch(() => {});
    selfServiceApi.listPayslips().then(setPayslips).catch(() => {});
    selfServiceApi.listExpenses().then(setExpenses).catch(() => {});
    selfServiceApi.listReferrals().then(setReferrals).catch(() => {});
    selfServiceApi.leaveBalance().then(setLeaveBalance).catch(() => {});
    selfServiceApi.getProfile().then(d => {
      setProfile(d);
      if (d.profile) setProfileForm(f => ({ ...f, ...d.profile }));
    }).catch(() => {});
  }, []);

  function openModal(which) {
    setFileError("");
    setModal(which);
  }

  async function handleDownload(type) {
    setFileError("");
    try {
      const path = type === "certificate"
        ? "/api/self-service/file/certificate"
        : "/api/self-service/file/payslip";
      const filename = type === "certificate" ? "Work_Certificate.pdf" : "Payslip.pdf";
      await selfServiceApi.downloadFile(path, filename);
    } catch (err) {
      setFileError(err.message);
    }
  }

  function submit(apiCall, onSuccess) {
    setSubmitting(true);
    apiCall()
      .then(r => { onSuccess(r); setModal(null); })
      .catch(() => {})
      .finally(() => setSubmitting(false));
  }

  const LEAVE_TONE = { pending: "warn", approved: "good", rejected: "bad", cancelled: undefined };
  const EXPENSE_TONE = { pending: "warn", approved: "good", rejected: "bad" };
  const lastPayslip = payslips[0];

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 22 }}>
      <SectionHeader title="HR Self-Service" subtitle="Time off, payslips, and personal documents"/>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "var(--gap-grid)" }}>
        <Card>
          <Stat label="Annual leave balance"
            value={leaveBalance ? leaveBalance.annual.remaining : '…'}
            suffix="days"
            hint={leaveBalance ? `of ${leaveBalance.annual.total} · ${leaveBalance.annual.used} used` : ''}/>
          <Progress value={leaveBalance ? leaveBalance.annual.used : 0} max={leaveBalance?.annual.total ?? 22} tone="accent" height={6}/>
        </Card>
        <Card>
          <Stat label="Sick leave"
            value={leaveBalance ? leaveBalance.sick.remaining : '…'}
            suffix={`of ${leaveBalance?.sick.total ?? 10} days`}/>
          <Progress value={leaveBalance ? leaveBalance.sick.used : 0} max={leaveBalance?.sick.total ?? 10} tone="warn" height={6}/>
        </Card>
        <Card>
          <Stat label="Next payday" value="25th" hint="of each month"/>
        </Card>
        <Card>
          <Stat label="Last payslip" value={lastPayslip ? `DZD ${lastPayslip.net.toLocaleString()}` : "—"} hint={lastPayslip ? `${lastPayslip.period} · net` : "No payslips yet"}/>
        </Card>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "var(--gap-grid)" }}>
        <Card title="Quick actions">
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginTop: 4 }}>
            {[
              { i: <I.cal size={18}/>,       n: "Request leave",          d: "Annual, sick or personal",    action: () => openModal("leave") },
              { i: <I.cash size={18}/>,      n: "Download payslip",       d: "Latest PDF from your folder",  action: () => handleDownload("payslip") },
              { i: <I.doc size={18}/>,       n: "Work certificate",       d: "Work_Certificate.pdf",         action: () => handleDownload("certificate") },
              { i: <I.user size={18}/>,      n: "Personal info",          d: "Address, IBAN, contacts",      action: () => openModal("profile") },
              { i: <I.cash size={18}/>,      n: "Expense claim",          d: "Submit for reimbursement",     action: () => openModal("expense") },
              { i: <I.briefcase size={18}/>, n: "Refer a candidate",      d: "Bonus on hire",                action: () => openModal("referral") },
            ].map((a, i) => (
              <button key={i} onClick={a.action} style={{
                padding: 14, borderRadius: 12, border: "0.5px solid var(--hairline-2)",
                background: "var(--surface-3)", textAlign: "left", cursor: "pointer",
                color: "var(--text)", display: "flex", flexDirection: "column", gap: 8,
              }} onMouseEnter={e => e.currentTarget.style.background = "color-mix(in oklab, var(--hr-accent) 12%, var(--surface-3))"}
                 onMouseLeave={e => e.currentTarget.style.background = "var(--surface-3)"}>
                <span style={{
                  width: 32, height: 32, borderRadius: 8,
                  background: "color-mix(in oklab, var(--hr-accent) 18%, transparent)",
                  color: "var(--hr-accent)",
                  display: "inline-flex", alignItems: "center", justifyContent: "center",
                }}>{a.i}</span>
                <div>
                  <div style={{ fontSize: 13, fontWeight: 500 }}>{a.n}</div>
                  <div style={{ fontSize: 11, color: "var(--text-mute)", marginTop: 2 }}>{a.d}</div>
                </div>
              </button>
            ))}
          </div>
        </Card>

        {fileError && (
          <div style={{ padding: "10px 14px", borderRadius: 10, fontSize: 13,
            background: "color-mix(in oklab, var(--bad) 12%, transparent)",
            border: "0.5px solid color-mix(in oklab, var(--bad) 30%, transparent)",
            color: "var(--bad)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <span>{fileError}</span>
            <button className="btn ghost icon" onClick={() => setFileError("")} style={{ width: 24, height: 24 }}><I.x size={12}/></button>
          </div>
        )}

        <Card title="My payslips">
          {payslips.length === 0 && <div style={{ padding: 16, textAlign: "center", color: "var(--text-mute)", fontSize: 12 }}>No payslips yet.</div>}
          {payslips.map((p, i) => (
            <div key={p.id} style={{ display: "flex", alignItems: "center", gap: 12, padding: "10px 0", borderTop: i ? "0.5px solid var(--hairline)" : "none" }}>
              <I.doc size={16}/>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 13, fontWeight: 500 }}>{p.period} payslip</div>
                <div style={{ fontSize: 11, color: "var(--text-mute)", marginTop: 1 }} className="mono">
                  Net DZD {p.net.toLocaleString()} · {p.status}
                </div>
              </div>
              <Pill tone={p.status === "paid" ? "good" : "warn"}>{p.status}</Pill>
            </div>
          ))}
        </Card>
      </div>

      <Card title="My leave history" action={<button className="btn" onClick={() => openModal("leave")}><I.plus size={14}/>Request leave</button>}>
        <table className="tbl">
          <thead><tr><th>Type</th><th>Dates</th><th>Reason</th><th>Reviewed by</th><th>Status</th></tr></thead>
          <tbody>
            {leaveRequests.length === 0 && (
              <tr><td colSpan={5} style={{ textAlign: "center", color: "var(--text-mute)", padding: 24 }}>No leave requests yet.</td></tr>
            )}
            {leaveRequests.map(l => (
              <tr key={l.id}>
                <td><Pill>{l.type}</Pill></td>
                <td className="mono" style={{ color: "var(--text-dim)" }}>{l.start_date} → {l.end_date}</td>
                <td style={{ color: "var(--text-dim)", fontSize: 12 }}>{l.reason || "—"}</td>
                <td style={{ color: "var(--text-dim)" }}>{l.reviewer_name || "—"}</td>
                <td><Pill tone={LEAVE_TONE[l.status]}>{l.status}</Pill></td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>

      {modal && (
        <SSModal title={{
          leave: "Request Leave", profile: "Personal Information",
          expense: "Expense Claim", referral: "Refer a Candidate"
        }[modal]} onClose={() => setModal(null)}>

          {modal === "leave" && (<>
            <FormField label="Leave type">
              <select className="input" style={{ width: "100%" }} value={leaveForm.type} onChange={e => setLeaveForm(f => ({ ...f, type: e.target.value }))}>
                <option value="annual">Annual leave</option>
                <option value="sick">Sick leave</option>
                <option value="personal">Personal leave</option>
                <option value="parental">Parental leave</option>
              </select>
            </FormField>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
              <FormField label="Start date">
                <input className="input" type="date" style={{ width: "100%" }} value={leaveForm.start_date} onChange={e => setLeaveForm(f => ({ ...f, start_date: e.target.value }))}/>
              </FormField>
              <FormField label="End date">
                <input className="input" type="date" style={{ width: "100%" }} value={leaveForm.end_date} onChange={e => setLeaveForm(f => ({ ...f, end_date: e.target.value }))}/>
              </FormField>
            </div>
            <FormField label="Reason (optional)">
              <textarea className="input" style={{ width: "100%", height: 80, resize: "none", padding: "8px 12px" }} value={leaveForm.reason} onChange={e => setLeaveForm(f => ({ ...f, reason: e.target.value }))} placeholder="Brief reason…"/>
            </FormField>
            <SSActions submitting={submitting} onCancel={() => setModal(null)}
              onSubmit={() => submit(
                () => selfServiceApi.submitLeave(leaveForm),
                r => setLeaveRequests(p => [r, ...p])
              )}
              disabled={!leaveForm.start_date || !leaveForm.end_date}/>
          </>)}

          {modal === "profile" && (<>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
              <FormField label="Phone"><input className="input" style={{ width: "100%" }} value={profileForm.phone} onChange={e => setProfileForm(f => ({ ...f, phone: e.target.value }))} placeholder="+213 …"/></FormField>
              <FormField label="Personal email"><input className="input" type="email" style={{ width: "100%" }} value={profileForm.personal_email} onChange={e => setProfileForm(f => ({ ...f, personal_email: e.target.value }))} placeholder="you@example.com"/></FormField>
            </div>
            <FormField label="Address">
              <textarea className="input" style={{ width: "100%", height: 64, resize: "none", padding: "8px 12px" }} value={profileForm.address} onChange={e => setProfileForm(f => ({ ...f, address: e.target.value }))} placeholder="Street, city, wilaya…"/>
            </FormField>
            <FormField label="IBAN (for payroll)"><input className="input" style={{ width: "100%" }} value={profileForm.iban} onChange={e => setProfileForm(f => ({ ...f, iban: e.target.value }))} placeholder="DZ…"/></FormField>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
              <FormField label="Emergency contact name"><input className="input" style={{ width: "100%" }} value={profileForm.emergency_name} onChange={e => setProfileForm(f => ({ ...f, emergency_name: e.target.value }))}/></FormField>
              <FormField label="Emergency contact phone"><input className="input" style={{ width: "100%" }} value={profileForm.emergency_phone} onChange={e => setProfileForm(f => ({ ...f, emergency_phone: e.target.value }))}/></FormField>
            </div>
            <SSActions submitting={submitting} onCancel={() => setModal(null)}
              onSubmit={() => submit(
                () => selfServiceApi.updateProfile(profileForm),
                r => setProfile(p => ({ ...p, profile: r }))
              )}/>
          </>)}

          {modal === "expense" && (<>
            <FormField label="Description"><input className="input" style={{ width: "100%" }} value={expenseForm.description} onChange={e => setExpenseForm(f => ({ ...f, description: e.target.value }))} placeholder="e.g. Taxi to client meeting"/></FormField>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 12 }}>
              <FormField label="Amount"><input className="input" type="number" style={{ width: "100%" }} value={expenseForm.amount} onChange={e => setExpenseForm(f => ({ ...f, amount: e.target.value }))}/></FormField>
              <FormField label="Currency">
                <select className="input" style={{ width: "100%" }} value={expenseForm.currency} onChange={e => setExpenseForm(f => ({ ...f, currency: e.target.value }))}>
                  <option>DZD</option><option>EUR</option><option>USD</option>
                </select>
              </FormField>
              <FormField label="Category">
                <select className="input" style={{ width: "100%" }} value={expenseForm.category} onChange={e => setExpenseForm(f => ({ ...f, category: e.target.value }))}>
                  {["Transport","Meals","Accommodation","Equipment","Software","Other"].map(c => <option key={c}>{c}</option>)}
                </select>
              </FormField>
            </div>
            <SSActions submitting={submitting} onCancel={() => setModal(null)}
              onSubmit={() => submit(
                () => selfServiceApi.submitExpense({ ...expenseForm, amount: parseFloat(expenseForm.amount) }),
                r => setExpenses(p => [r, ...p])
              )}
              disabled={!expenseForm.description || !expenseForm.amount}/>
          </>)}

          {modal === "referral" && (<>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
              <FormField label="Candidate name"><input className="input" style={{ width: "100%" }} value={referralForm.candidate_name} onChange={e => setReferralForm(f => ({ ...f, candidate_name: e.target.value }))}/></FormField>
              <FormField label="Candidate email"><input className="input" type="email" style={{ width: "100%" }} value={referralForm.candidate_email} onChange={e => setReferralForm(f => ({ ...f, candidate_email: e.target.value }))}/></FormField>
            </div>
            <FormField label="Role they're applying for"><input className="input" style={{ width: "100%" }} value={referralForm.role_applied} onChange={e => setReferralForm(f => ({ ...f, role_applied: e.target.value }))} placeholder="e.g. Senior Backend Engineer"/></FormField>
            <FormField label="Notes (optional)">
              <textarea className="input" style={{ width: "100%", height: 80, resize: "none", padding: "8px 12px" }} value={referralForm.notes} onChange={e => setReferralForm(f => ({ ...f, notes: e.target.value }))} placeholder="Why do you recommend them?"/>
            </FormField>
            <SSActions submitting={submitting} onCancel={() => setModal(null)}
              onSubmit={() => submit(
                () => selfServiceApi.submitReferral(referralForm),
                r => setReferrals(p => [r, ...p])
              )}
              disabled={!referralForm.candidate_name || !referralForm.candidate_email || !referralForm.role_applied}/>
          </>)}
        </SSModal>
      )}
    </div>
  );
}

function SSModal({ title, onClose, children }) {
  return (
    <div onClick={onClose} style={{ position: "fixed", inset: 0, background: "rgba(8,10,14,0.55)", zIndex: 200, WebkitBackdropFilter: "blur(8px)", backdropFilter: "blur(8px)", display: "flex", alignItems: "center", justifyContent: "center" }} className="fadein">
      <Card onClick={e => e.stopPropagation()} style={{ width: 520, padding: 24 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 18 }}>
          <h3 style={{ margin: 0 }}>{title}</h3>
          <button className="btn ghost icon" onClick={onClose}><I.x size={15}/></button>
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>{children}</div>
      </Card>
    </div>
  );
}

function SSActions({ onSubmit, onCancel, submitting, disabled }) {
  return (
    <div style={{ display: "flex", gap: 8, marginTop: 4 }}>
      <button className="btn primary" style={{ flex: 1 }} onClick={onSubmit} disabled={submitting || disabled}>
        <I.send size={14}/>{submitting ? "Submitting…" : "Submit"}
      </button>
      <button className="btn" onClick={onCancel}>Cancel</button>
    </div>
  );
}

export { MailPage, AnnouncementsPage, HelpdeskPage, SelfServicePage, FilesPage, DeptDocumentsPage };
