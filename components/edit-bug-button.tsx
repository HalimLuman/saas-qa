'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Pencil, Plus, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { toast } from 'sonner'

type Severity = 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW'

export interface BugEditData {
  id: string
  title: string
  description: string
  severity: Severity
  steps: string[]
  expectedBehavior: string
  actualBehavior: string
  areaId: string | null
}

interface Area {
  id: string
  name: string
  color: string
}

const SEV_OPTIONS: { value: Severity; label: string }[] = [
  { value: 'CRITICAL', label: 'Critical' },
  { value: 'HIGH',     label: 'High'     },
  { value: 'MEDIUM',   label: 'Medium'   },
  { value: 'LOW',      label: 'Low'      },
]

export default function EditBugButton({ bug, projectId }: { bug: BugEditData; projectId: string }) {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [areas, setAreas] = useState<Area[]>([])
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState<BugEditData>(bug)

  useEffect(() => {
    if (open) {
      setForm(bug)
      fetch(`/api/projects/${projectId}/areas`)
        .then((r) => (r.ok ? r.json() : { areas: [] }))
        .then((d) => setAreas(d.areas ?? []))
    }
  }, [open, bug, projectId])

  function setField<K extends keyof BugEditData>(key: K, value: BugEditData[K]) {
    setForm((f) => ({ ...f, [key]: value }))
  }

  function setStep(i: number, value: string) {
    setForm((f) => {
      const steps = [...f.steps]
      steps[i] = value
      return { ...f, steps }
    })
  }

  function addStep() {
    setForm((f) => ({ ...f, steps: [...f.steps, ''] }))
  }

  function removeStep(i: number) {
    setForm((f) => ({ ...f, steps: f.steps.filter((_, idx) => idx !== i) }))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!form.title.trim() || !form.description.trim()) return
    setSaving(true)
    try {
      const res = await fetch(`/api/projects/${projectId}/bugs/${bug.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title:            form.title.trim(),
          description:      form.description.trim(),
          severity:         form.severity,
          stepsToReproduce: form.steps.filter((s) => s.trim()),
          expectedBehavior: form.expectedBehavior.trim() || null,
          actualBehavior:   form.actualBehavior.trim()   || null,
          areaId:           form.areaId || null,
        }),
      })
      if (!res.ok) throw new Error()
      toast.success('Bug report updated')
      setOpen(false)
      router.refresh()
    } catch {
      toast.error('Could not update bug report')
    } finally {
      setSaving(false)
    }
  }

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="inline-flex items-center gap-1.5 text-sm font-semibold px-4 py-2 rounded-xl transition-all active:scale-[0.97]"
        style={{ background: 'var(--surface-0)', color: 'var(--text-secondary)', border: '1px solid var(--border)' }}
      >
        <Pencil className="h-3.5 w-3.5" />
        Edit
      </button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Bug Report</DialogTitle>
          </DialogHeader>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="bug-title">Title <span className="text-red-500">*</span></Label>
              <Input
                id="bug-title"
                value={form.title}
                onChange={(e) => setField('title', e.target.value)}
                required
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="bug-desc">Description <span className="text-red-500">*</span></Label>
              <Textarea
                id="bug-desc"
                value={form.description}
                onChange={(e) => setField('description', e.target.value)}
                rows={4}
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label>Severity</Label>
                <Select value={form.severity} onValueChange={(v) => setField('severity', v as Severity)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {SEV_OPTIONS.map((o) => (
                      <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {areas.length > 0 && (
                <div className="space-y-1.5">
                  <Label>Area</Label>
                  <Select
                    value={form.areaId ?? '__none__'}
                    onValueChange={(v) => setField('areaId', v === '__none__' ? null : v)}
                  >
                    <SelectTrigger><SelectValue placeholder="No area" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="__none__">No area</SelectItem>
                      {areas.map((a) => (
                        <SelectItem key={a.id} value={a.id}>
                          <span className="flex items-center gap-1.5">
                            <span className="h-2 w-2 rounded-full shrink-0 inline-block" style={{ background: a.color }} />
                            {a.name}
                          </span>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}
            </div>

            <div className="space-y-1.5">
              <Label>Steps to Reproduce</Label>
              <div className="space-y-2">
                {form.steps.map((step, i) => (
                  <div key={i} className="flex gap-2 items-center">
                    <span className="text-xs text-slate-400 w-5 shrink-0 text-right">{i + 1}.</span>
                    <Input
                      value={step}
                      onChange={(e) => setStep(i, e.target.value)}
                      placeholder={`Step ${i + 1}`}
                      className="flex-1"
                    />
                    {form.steps.length > 1 && (
                      <Button
                        type="button" variant="ghost" size="icon"
                        className="h-8 w-8 shrink-0 text-slate-400 hover:text-red-500"
                        onClick={() => removeStep(i)}
                      >
                        <X className="h-3.5 w-3.5" />
                      </Button>
                    )}
                  </div>
                ))}
                <Button type="button" variant="outline" size="sm" className="gap-1.5" onClick={addStep}>
                  <Plus className="h-3.5 w-3.5" />
                  Add Step
                </Button>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label htmlFor="bug-expected">Expected Behavior</Label>
                <Textarea
                  id="bug-expected"
                  value={form.expectedBehavior}
                  onChange={(e) => setField('expectedBehavior', e.target.value)}
                  placeholder="What should happen?"
                  rows={3}
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="bug-actual">Actual Behavior</Label>
                <Textarea
                  id="bug-actual"
                  value={form.actualBehavior}
                  onChange={(e) => setField('actualBehavior', e.target.value)}
                  placeholder="What actually happens?"
                  rows={3}
                />
              </div>
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
              <Button type="submit" disabled={saving}>
                {saving ? 'Saving…' : 'Save Changes'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </>
  )
}
