'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Plus, Trash2, History } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { toast } from 'sonner'
import TestCaseVersionDialog from './test-case-version-dialog'

export interface TestCaseData {
  id?: string
  title: string
  module: string
  preconditions: string
  steps: string[]
  expectedResult: string
  priority: 'P0' | 'P1' | 'P2' | 'P3'
  category: 'FUNCTIONAL' | 'NEGATIVE' | 'BOUNDARY' | 'SECURITY' | 'PERFORMANCE' | 'ACCESSIBILITY'
}

interface Props {
  open: boolean
  onOpenChange: (open: boolean) => void
  mode: 'create' | 'edit'
  projectId: string
  areaId?: string
  areas?: { id: string; name: string; color: string }[]
  initial?: Partial<TestCaseData>
  onSuccess?: () => void
}

const EMPTY: TestCaseData = {
  title: '',
  module: '',
  preconditions: '',
  steps: [''],
  expectedResult: '',
  priority: 'P2',
  category: 'FUNCTIONAL',
}

export default function TestCaseFormDialog({ open, onOpenChange, mode, projectId, areaId, areas, initial, onSuccess }: Props) {
  const router = useRouter()
  const [form, setForm] = useState<TestCaseData>({ ...EMPTY, ...initial })
  const [selectedAreaId, setSelectedAreaId] = useState(areaId ?? '__none__')
  const [saving, setSaving] = useState(false)
  const [showVersions, setShowVersions] = useState(false)

  useEffect(() => {
    if (open) {
      setForm({ ...EMPTY, ...initial })
      setSelectedAreaId(areaId ?? '__none__')
    }
  }, [open, initial, areaId])

  function setField<K extends keyof TestCaseData>(key: K, value: TestCaseData[K]) {
    setForm((f) => ({ ...f, [key]: value }))
  }

  function setStep(index: number, value: string) {
    setForm((f) => {
      const steps = [...f.steps]
      steps[index] = value
      return { ...f, steps }
    })
  }

  function addStep() {
    setForm((f) => ({ ...f, steps: [...f.steps, ''] }))
  }

  function removeStep(index: number) {
    setForm((f) => ({ ...f, steps: f.steps.filter((_, i) => i !== index) }))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!form.title.trim()) return
    const cleanSteps = form.steps.filter((s) => s.trim())
    if (cleanSteps.length === 0) return

    setSaving(true)
    try {
      if (mode === 'edit' && form.id) {
        const res = await fetch(`/api/tests/${form.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            title: form.title.trim(),
            module: form.module.trim() || undefined,
            preconditions: form.preconditions.trim() || undefined,
            steps: cleanSteps,
            expectedResult: form.expectedResult.trim(),
            priority: form.priority,
            category: form.category,
          }),
        })
        if (!res.ok) throw new Error('Failed to update')
        toast.success('Test case updated')
      } else {
        const res = await fetch(`/api/projects/${projectId}/tests/save`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            sourceType: 'MANUAL',
            areaId: selectedAreaId !== '__none__' ? selectedAreaId : undefined,
            testCases: [{
              title: form.title.trim(),
              module: form.module.trim() || undefined,
              preconditions: form.preconditions.trim() || undefined,
              steps: cleanSteps,
              expectedResult: form.expectedResult.trim(),
              priority: form.priority,
              category: form.category,
            }],
          }),
        })
        if (!res.ok) throw new Error('Failed to save')
        toast.success('Test case created')
      }
      onOpenChange(false)
      onSuccess?.()
      router.refresh()
    } catch {
      toast.error('Could not save test case')
    } finally {
      setSaving(false)
    }
  }

  return (
    <>
    {mode === 'edit' && form.id && (
      <TestCaseVersionDialog
        open={showVersions}
        onOpenChange={setShowVersions}
        testCaseId={form.id}
        currentTitle={form.title}
      />
    )}
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <DialogTitle>{mode === 'edit' ? 'Edit Test Case' : 'Add Manual Test Case'}</DialogTitle>
            {mode === 'edit' && form.id && (
              <Button type="button" variant="ghost" size="sm" className="gap-1.5 text-slate-500 hover:text-slate-700" onClick={() => setShowVersions(true)}>
                <History className="h-3.5 w-3.5" />
                History
              </Button>
            )}
          </div>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="tc-title">Title <span className="text-red-500">*</span></Label>
            <Input
              id="tc-title"
              value={form.title}
              onChange={(e) => setField('title', e.target.value)}
              placeholder="e.g. Verify login rejects invalid credentials"
              required
            />
          </div>

          {mode === 'create' && areas && areas.length > 0 && (
            <div className="space-y-1.5">
              <Label>Area</Label>
              <Select value={selectedAreaId} onValueChange={setSelectedAreaId}>
                <SelectTrigger>
                  <SelectValue placeholder="No area (unassigned)" />
                </SelectTrigger>
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

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label htmlFor="tc-module">Module / Feature Area</Label>
              <Input
                id="tc-module"
                value={form.module}
                onChange={(e) => setField('module', e.target.value)}
                placeholder="e.g. Authentication"
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>Priority</Label>
                <Select value={form.priority} onValueChange={(v) => setField('priority', v as TestCaseData['priority'])}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {(['P0', 'P1', 'P2', 'P3'] as const).map((p) => (
                      <SelectItem key={p} value={p}>{p}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label>Category</Label>
                <Select value={form.category} onValueChange={(v) => setField('category', v as TestCaseData['category'])}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {(['FUNCTIONAL', 'NEGATIVE', 'BOUNDARY', 'SECURITY', 'PERFORMANCE', 'ACCESSIBILITY'] as const).map((c) => (
                      <SelectItem key={c} value={c}>{c}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="tc-preconditions">Preconditions</Label>
            <Textarea
              id="tc-preconditions"
              value={form.preconditions}
              onChange={(e) => setField('preconditions', e.target.value)}
              placeholder="What must be true before executing this test?"
              rows={2}
            />
          </div>

          <div className="space-y-1.5">
            <Label>Steps <span className="text-red-500">*</span></Label>
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
                    <Button type="button" variant="ghost" size="icon" className="h-8 w-8 shrink-0 text-slate-400 hover:text-red-500" onClick={() => removeStep(i)}>
                      <Trash2 className="h-3.5 w-3.5" />
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

          <div className="space-y-1.5">
            <Label htmlFor="tc-expected">Expected Result <span className="text-red-500">*</span></Label>
            <Textarea
              id="tc-expected"
              value={form.expectedResult}
              onChange={(e) => setField('expectedResult', e.target.value)}
              placeholder="Describe exactly what the user should see or experience"
              rows={2}
              required
            />
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
            <Button type="submit" disabled={saving}>
              {saving ? 'Saving...' : mode === 'edit' ? 'Save Changes' : 'Create Test Case'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
    </>
  )
}
