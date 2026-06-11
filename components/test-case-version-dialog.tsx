'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { History, RotateCcw, ChevronDown, ChevronUp } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Badge } from '@/components/ui/badge'
import { toast } from 'sonner'

interface Version {
  id: string
  versionNumber: number
  title: string
  module: string | null
  preconditions: string | null
  steps: string
  expectedResult: string
  priority: string
  category: string
  status: string
  createdAt: string
}

interface Props {
  open: boolean
  onOpenChange: (open: boolean) => void
  testCaseId: string
  currentTitle: string
}

function parseSteps(steps: string): string[] {
  try {
    const p = JSON.parse(steps)
    return Array.isArray(p) ? p : [steps]
  } catch { return [steps] }
}

export default function TestCaseVersionDialog({ open, onOpenChange, testCaseId, currentTitle }: Props) {
  const router = useRouter()
  const [versions, setVersions] = useState<Version[]>([])
  const [loading, setLoading] = useState(false)
  const [restoring, setRestoring] = useState<string | null>(null)
  const [expanded, setExpanded] = useState<Set<string>>(new Set())

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch(`/api/tests/${testCaseId}/versions`)
      if (!res.ok) throw new Error('Failed to load')
      const data = await res.json()
      setVersions(data.versions)
    } catch {
      toast.error('Could not load version history')
    } finally {
      setLoading(false)
    }
  }, [testCaseId])

  useEffect(() => {
    if (open) load()
  }, [open, load])

  async function handleRestore(versionId: string) {
    setRestoring(versionId)
    try {
      const res = await fetch(`/api/tests/${testCaseId}/versions/${versionId}/restore`, { method: 'POST' })
      if (!res.ok) throw new Error('Failed to restore')
      toast.success('Version restored')
      onOpenChange(false)
      router.refresh()
    } catch {
      toast.error('Could not restore version')
    } finally {
      setRestoring(null)
    }
  }

  function toggle(id: string) {
    setExpanded((prev) => {
      const next = new Set(prev)
      next.has(id) ? next.delete(id) : next.add(id)
      return next
    })
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[80vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <History className="h-4 w-4" />
            Version History — {currentTitle}
          </DialogTitle>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto space-y-2 pr-1">
          {loading && <p className="text-sm text-slate-500 py-4 text-center">Loading versions…</p>}
          {!loading && versions.length === 0 && (
            <p className="text-sm text-slate-500 py-4 text-center">No saved versions yet. Versions are created automatically when you edit a test case.</p>
          )}
          {versions.map((v) => (
            <div key={v.id} className="border rounded-lg overflow-hidden">
              <div
                className="flex items-center justify-between px-4 py-2.5 cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800/50"
                onClick={() => toggle(v.id)}
              >
                <div className="flex items-center gap-3">
                  <span className="text-xs font-mono text-slate-400">v{v.versionNumber}</span>
                  <span className="text-sm font-medium truncate max-w-xs">{v.title}</span>
                  <Badge variant={v.priority.toLowerCase() as 'p0' | 'p1' | 'p2' | 'p3'} className="text-[10px]">
                    {v.priority}
                  </Badge>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <span className="text-xs text-slate-400">
                    {new Date(v.createdAt).toLocaleString()}
                  </span>
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-6 text-xs gap-1"
                    disabled={restoring === v.id}
                    onClick={(e) => { e.stopPropagation(); handleRestore(v.id) }}
                  >
                    <RotateCcw className="h-3 w-3" />
                    {restoring === v.id ? 'Restoring…' : 'Restore'}
                  </Button>
                  {expanded.has(v.id) ? <ChevronUp className="h-3.5 w-3.5 text-slate-400" /> : <ChevronDown className="h-3.5 w-3.5 text-slate-400" />}
                </div>
              </div>
              {expanded.has(v.id) && (
                <div className="px-4 pb-3 pt-1 border-t text-sm space-y-2 bg-slate-50/50 dark:bg-slate-900/30">
                  {v.module && <p className="text-slate-500"><span className="font-medium">Module:</span> {v.module}</p>}
                  {v.preconditions && <p className="text-slate-500"><span className="font-medium">Preconditions:</span> {v.preconditions}</p>}
                  <div>
                    <p className="font-medium text-slate-600 dark:text-slate-300 mb-1">Steps:</p>
                    <ol className="list-decimal list-inside space-y-0.5">
                      {parseSteps(v.steps).map((s, i) => (
                        <li key={i} className="text-slate-600 dark:text-slate-300">{s}</li>
                      ))}
                    </ol>
                  </div>
                  <p><span className="font-medium text-slate-600 dark:text-slate-300">Expected:</span> {v.expectedResult}</p>
                </div>
              )}
            </div>
          ))}
        </div>
      </DialogContent>
    </Dialog>
  )
}
