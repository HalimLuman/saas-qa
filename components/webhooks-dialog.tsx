'use client'

import { useState, useEffect, useCallback } from 'react'
import { Plus, Trash2, Pencil, Webhook, Check, X, ToggleLeft, ToggleRight } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Badge } from '@/components/ui/badge'
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

const EMPTY_FORM = { name: '', url: '', platform: 'CUSTOM', events: ['run.completed', 'run.failed'], secret: '' }

interface Props {
  open: boolean
  onOpenChange: (open: boolean) => void
  projectId: string
}

export default function WebhooksDialog({ open, onOpenChange, projectId }: Props) {
  const [webhooks, setWebhooks] = useState<Webhook[]>([])
  const [loading, setLoading] = useState(false)
  const [formOpen, setFormOpen] = useState(false)
  const [editId, setEditId] = useState<string | null>(null)
  const [form, setForm] = useState(EMPTY_FORM)
  const [saving, setSaving] = useState(false)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch(`/api/projects/${projectId}/webhooks`)
      if (!res.ok) throw new Error()
      const data = await res.json()
      setWebhooks(data.webhooks)
    } catch {
      toast.error('Could not load webhooks')
    } finally {
      setLoading(false)
    }
  }, [projectId])

  useEffect(() => { if (open) load() }, [open, load])

  function openCreate() {
    setEditId(null)
    setForm(EMPTY_FORM)
    setFormOpen(true)
  }

  function openEdit(wh: Webhook) {
    setEditId(wh.id)
    setForm({
      name: wh.name,
      url: wh.url,
      platform: wh.platform,
      events: (() => { try { return JSON.parse(wh.events) } catch { return [] } })(),
      secret: '',
    })
    setFormOpen(true)
  }

  async function handleSave() {
    if (!form.name.trim() || !form.url.trim()) return
    setSaving(true)
    try {
      const body = { name: form.name.trim(), url: form.url.trim(), platform: form.platform, events: form.events, secret: form.secret || undefined }
      const res = editId
        ? await fetch(`/api/projects/${projectId}/webhooks/${editId}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) })
        : await fetch(`/api/projects/${projectId}/webhooks`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) })
      if (!res.ok) throw new Error()
      toast.success(editId ? 'Webhook updated' : 'Webhook created')
      setFormOpen(false)
      load()
    } catch {
      toast.error('Could not save webhook')
    } finally {
      setSaving(false)
    }
  }

  async function handleDelete(id: string) {
    try {
      await fetch(`/api/projects/${projectId}/webhooks/${id}`, { method: 'DELETE' })
      toast.success('Webhook deleted')
      setWebhooks((prev) => prev.filter((w) => w.id !== id))
    } catch {
      toast.error('Could not delete webhook')
    }
  }

  async function toggleActive(wh: Webhook) {
    try {
      await fetch(`/api/projects/${projectId}/webhooks/${wh.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isActive: !wh.isActive }),
      })
      setWebhooks((prev) => prev.map((w) => w.id === wh.id ? { ...w, isActive: !w.isActive } : w))
    } catch {
      toast.error('Could not update webhook')
    }
  }

  function toggleEvent(event: string) {
    setForm((f) => ({
      ...f,
      events: f.events.includes(event) ? f.events.filter((e) => e !== event) : [...f.events, event],
    }))
  }

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-2xl max-h-[80vh] flex flex-col">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Webhook className="h-4 w-4" />
              Webhook Integrations
            </DialogTitle>
          </DialogHeader>

          <div className="flex-1 overflow-y-auto space-y-2 pr-1">
            {loading && <p className="text-sm text-slate-500 py-4 text-center">Loading…</p>}
            {!loading && webhooks.length === 0 && (
              <div className="text-center py-8 text-sm text-slate-500">
                No webhooks configured. Add one to get notified when runs complete or bugs are filed.
              </div>
            )}
            {webhooks.map((wh) => {
              const events: string[] = (() => { try { return JSON.parse(wh.events) } catch { return [] } })()
              return (
                <div key={wh.id} className="flex items-start justify-between gap-3 border rounded-lg px-4 py-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-medium">{wh.name}</p>
                      <Badge variant="outline" className="text-[10px] px-1.5 py-0">{wh.platform}</Badge>
                      {!wh.isActive && <Badge variant="outline" className="text-[10px] px-1.5 py-0 text-slate-400">Inactive</Badge>}
                    </div>
                    <p className="text-xs text-slate-400 truncate mt-0.5">{wh.url}</p>
                    <div className="flex flex-wrap gap-1 mt-1.5">
                      {events.map((e) => (
                        <span key={e} className="text-[10px] px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">{e}</span>
                      ))}
                    </div>
                  </div>
                  <div className="flex items-center gap-1 shrink-0">
                    <button onClick={() => toggleActive(wh)} title={wh.isActive ? 'Disable' : 'Enable'} className="text-slate-400 hover:text-slate-600 p-1">
                      {wh.isActive ? <ToggleRight className="h-4 w-4 text-emerald-500" /> : <ToggleLeft className="h-4 w-4" />}
                    </button>
                    <button onClick={() => openEdit(wh)} className="text-slate-400 hover:text-slate-600 p-1">
                      <Pencil className="h-3.5 w-3.5" />
                    </button>
                    <button onClick={() => handleDelete(wh.id)} className="text-slate-400 hover:text-red-500 p-1">
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>
              )
            })}
          </div>

          <div className="pt-3 border-t">
            <Button onClick={openCreate} size="sm" className="gap-1.5">
              <Plus className="h-3.5 w-3.5" /> Add Webhook
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Create / Edit form dialog */}
      <Dialog open={formOpen} onOpenChange={setFormOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{editId ? 'Edit Webhook' : 'New Webhook'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-1.5">
              <Label>Name</Label>
              <Input value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} placeholder="e.g. Slack #qa-alerts" />
            </div>
            <div className="space-y-1.5">
              <Label>Webhook URL</Label>
              <Input value={form.url} onChange={(e) => setForm((f) => ({ ...f, url: e.target.value }))} placeholder="https://hooks.slack.com/services/…" type="url" />
            </div>
            <div className="space-y-1.5">
              <Label>Platform</Label>
              <Select value={form.platform} onValueChange={(v) => setForm((f) => ({ ...f, platform: v }))}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="SLACK">Slack</SelectItem>
                  <SelectItem value="DISCORD">Discord</SelectItem>
                  <SelectItem value="CUSTOM">Custom HTTP</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Events</Label>
              <div className="flex flex-wrap gap-2">
                {ALL_EVENTS.map((e) => (
                  <button
                    key={e}
                    type="button"
                    onClick={() => toggleEvent(e)}
                    className="text-xs px-2.5 py-1 rounded-lg border transition-colors"
                    style={form.events.includes(e)
                      ? { background: 'rgba(100,116,139,0.1)', color: '#475569', borderColor: 'rgba(100,116,139,0.3)' }
                      : { background: 'transparent', color: 'var(--text-secondary)', borderColor: 'var(--border)' }}
                  >
                    {form.events.includes(e) && <Check className="h-3 w-3 inline mr-0.5" />}
                    {e}
                  </button>
                ))}
              </div>
            </div>
            {form.platform === 'CUSTOM' && (
              <div className="space-y-1.5">
                <Label>Signing Secret (optional)</Label>
                <Input value={form.secret} onChange={(e) => setForm((f) => ({ ...f, secret: e.target.value }))} placeholder="Used for HMAC signature verification" type="password" />
              </div>
            )}
            <div className="flex justify-end gap-2 pt-2">
              <Button variant="outline" onClick={() => setFormOpen(false)}>Cancel</Button>
              <Button onClick={handleSave} disabled={saving || !form.name.trim() || !form.url.trim() || form.events.length === 0}>
                {saving ? 'Saving…' : editId ? 'Update' : 'Create'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
}
