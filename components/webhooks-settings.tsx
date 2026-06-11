'use client'

import { useState, useEffect, useCallback } from 'react'
import { Plus, Trash2, ToggleLeft, ToggleRight } from 'lucide-react'
import { toast } from 'sonner'

interface Webhook {
  id: string
  name: string
  url: string
  platform: string
  events: string
  isActive: boolean
  createdAt: string
}

const ALL_EVENTS = ['run.completed', 'run.failed', 'bug.created', 'bug.status_changed']

export default function WebhooksSettings({ projectId }: { projectId: string }) {
  const [webhooks, setWebhooks] = useState<Webhook[]>([])
  const [loading, setLoading] = useState(true)
  const [formOpen, setFormOpen] = useState(false)
  const [form, setForm] = useState({ name:'', url:'', platform:'CUSTOM', events: ['run.completed','run.failed'], secret:'' })
  const [saving, setSaving] = useState(false)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch(`/api/projects/${projectId}/webhooks`)
      if (res.ok) { const d = await res.json(); setWebhooks(d.webhooks) }
    } finally { setLoading(false) }
  }, [projectId])

  useEffect(() => { load() }, [load])

  async function save() {
    setSaving(true)
    try {
      const res = await fetch(`/api/projects/${projectId}/webhooks`, {
        method:'POST',
        headers:{'Content-Type':'application/json'},
        body: JSON.stringify({ name: form.name, url: form.url, platform: form.platform, events: form.events, secret: form.secret || undefined }),
      })
      if (!res.ok) throw new Error()
      toast.success('Webhook added')
      setFormOpen(false)
      setForm({ name:'', url:'', platform:'CUSTOM', events:['run.completed','run.failed'], secret:'' })
      load()
    } catch { toast.error('Could not save webhook') } finally { setSaving(false) }
  }

  async function remove(id: string) {
    if (!confirm('Delete this webhook?')) return
    try {
      await fetch(`/api/projects/${projectId}/webhooks/${id}`, { method:'DELETE' })
      toast.success('Webhook deleted')
      load()
    } catch { toast.error('Could not delete webhook') }
  }

  async function toggle(id: string, current: boolean) {
    const res = await fetch(`/api/projects/${projectId}/webhooks/${id}`, {
      method:'PUT',
      headers:{'Content-Type':'application/json'},
      body: JSON.stringify({ isActive: !current }),
    })
    if (res.ok) load()
  }

  return (
    <div className="card" style={{ padding:22 }}>
      <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', gap:16, marginBottom:14 }}>
        <div>
          <h3 style={{ fontSize:14, fontWeight:700, margin:0, color:'var(--text-primary)' }}>Webhooks</h3>
          <p style={{ fontSize:12.5, color:'var(--text-secondary)', margin:'2px 0 0' }}>
            Receive HTTP callbacks when softAssert events occur.
          </p>
        </div>
        <button
          onClick={() => setFormOpen((v) => !v)}
          className="inline-flex items-center gap-1.5"
          style={{
            height:32, padding:'0 12px', borderRadius:8,
            fontSize:12, fontWeight:600,
            background:'linear-gradient(135deg,#2563eb,#1d4ed8)', color:'#fff',
            border:'none', cursor:'pointer', boxShadow:'0 4px 14px rgba(37,99,235,0.3)',
          }}
        >
          <Plus size={12} /> Add webhook
        </button>
      </div>

      {formOpen && (
        <div style={{ padding:16, borderRadius:10, background:'var(--surface-1)', border:'1px solid var(--border)', marginBottom:14 }}>
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12, marginBottom:12 }}>
            {[
              { label:'Name', key:'name', placeholder:'My webhook' },
              { label:'URL',  key:'url',  placeholder:'https://example.com/hook' },
            ].map((f) => (
              <div key={f.key}>
                <label style={{ display:'block', fontSize:12, fontWeight:600, color:'var(--text-primary)', marginBottom:5 }}>{f.label}</label>
                <input
                  value={(form as Record<string, unknown>)[f.key] as string}
                  onChange={(e) => setForm((p) => ({ ...p, [f.key]: e.target.value }))}
                  placeholder={f.placeholder}
                  style={{
                    width:'100%', height:34, padding:'0 12px',
                    background:'var(--surface-0)', border:'1px solid var(--border)',
                    borderRadius:9, fontSize:13, color:'var(--text-primary)',
                    outline:'none', fontFamily:'inherit',
                  }}
                />
              </div>
            ))}
          </div>
          <div style={{ marginBottom:12 }}>
            <label style={{ display:'block', fontSize:12, fontWeight:600, color:'var(--text-primary)', marginBottom:6 }}>Events</label>
            <div style={{ display:'flex', gap:8, flexWrap:'wrap' }}>
              {ALL_EVENTS.map((ev) => {
                const on = form.events.includes(ev)
                return (
                  <button key={ev} onClick={() => setForm((p) => ({ ...p, events: on ? p.events.filter((e) => e !== ev) : [...p.events, ev] }))}
                    style={{
                      padding:'3px 10px', borderRadius:99, fontSize:11.5, fontWeight:600, cursor:'pointer',
                      background: on ? 'rgba(37,99,235,0.1)' : 'var(--surface-0)',
                      color: on ? '#2563eb' : 'var(--text-secondary)',
                      border: `1px solid ${on ? 'rgba(37,99,235,0.3)' : 'var(--border)'}`,
                    }}
                  >{ev}</button>
                )
              })}
            </div>
          </div>
          <div style={{ display:'flex', gap:8 }}>
            <button onClick={save} disabled={saving || !form.name || !form.url}
              style={{
                height:30, padding:'0 14px', borderRadius:8, fontSize:12, fontWeight:600, cursor:'pointer',
                background:'linear-gradient(135deg,#2563eb,#1d4ed8)', color:'#fff',
                border:'none', opacity: saving || !form.name || !form.url ? 0.6 : 1,
              }}
            >{saving ? 'Saving…' : 'Save webhook'}</button>
            <button onClick={() => setFormOpen(false)}
              style={{ height:30, padding:'0 14px', borderRadius:8, fontSize:12, fontWeight:500, cursor:'pointer', background:'var(--surface-0)', border:'1px solid var(--border)', color:'var(--text-secondary)' }}>
              Cancel
            </button>
          </div>
        </div>
      )}

      {loading ? (
        <div style={{ padding:'20px 0', textAlign:'center', fontSize:12, color:'var(--text-tertiary)' }}>Loading…</div>
      ) : webhooks.length === 0 ? (
        <div style={{ padding:'24px 0', textAlign:'center', fontSize:12.5, color:'var(--text-tertiary)' }}>
          No webhooks configured yet.
        </div>
      ) : (
        <div style={{ display:'flex', flexDirection:'column', gap:8 }}>
          {webhooks.map((wh) => {
            const events: string[] = (() => { try { return JSON.parse(wh.events) } catch { return wh.events.split(',').filter(Boolean) } })()
            return (
              <div key={wh.id} style={{ padding:'12px 14px', borderRadius:10, background:'var(--surface-1)', border:'1px solid var(--border)', display:'flex', alignItems:'center', gap:12 }}>
                <div style={{ flex:1, minWidth:0 }}>
                  <div style={{ fontSize:13, fontWeight:600, color:'var(--text-primary)' }}>{wh.name}</div>
                  <div style={{ fontSize:11.5, color:'var(--text-tertiary)', fontFamily:'var(--font-mono)', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap', maxWidth:300, marginTop:2 }}>{wh.url}</div>
                  <div style={{ display:'flex', gap:4, marginTop:5, flexWrap:'wrap' }}>
                    {events.map((ev) => (
                      <span key={ev} style={{ padding:'1px 6px', borderRadius:99, fontSize:10.5, fontWeight:600, background:'rgba(59,130,246,0.08)', color:'#2563eb', border:'1px solid rgba(59,130,246,0.2)' }}>{ev}</span>
                    ))}
                  </div>
                </div>
                <button onClick={() => toggle(wh.id, wh.isActive)} style={{ background:'none', border:'none', cursor:'pointer', color: wh.isActive ? '#16a34a' : 'var(--text-tertiary)' }}>
                  {wh.isActive ? <ToggleRight size={20} /> : <ToggleLeft size={20} />}
                </button>
                <button onClick={() => remove(wh.id)} style={{ background:'none', border:'none', cursor:'pointer', color:'#ef4444', opacity:0.7 }}>
                  <Trash2 size={14} />
                </button>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
