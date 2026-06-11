'use client'

import { useState, useEffect, useRef } from 'react'
import { toast } from 'sonner'
import { Upload, ChevronDown, Loader2, ExternalLink } from 'lucide-react'

interface Integration {
  id: string
  provider: string
  name: string
  isActive: boolean
  config: Record<string, string>
}

interface Props {
  projectId: string
  testCaseIds: string[]
  label?: string
}

export default function PushTestsButton({ projectId, testCaseIds, label }: Props) {
  const [integrations, setIntegrations] = useState<Integration[]>([])
  const [open, setOpen] = useState(false)
  const [pushing, setPushing] = useState(false)
  const [showPlanInput, setShowPlanInput] = useState(false)
  const [selectedIntegration, setSelectedIntegration] = useState<Integration | null>(null)
  const [testPlanId, setTestPlanId] = useState('')
  const [testSuiteId, setTestSuiteId] = useState('')
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    fetch(`/api/projects/${projectId}/integrations`)
      .then((r) => r.ok ? r.json() : { integrations: [] })
      .then((d) => setIntegrations(
        (d.integrations ?? []).filter((i: Integration) => i.isActive && i.provider === 'AZURE_DEVOPS')
      ))
  }, [projectId])

  useEffect(() => {
    function onClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false)
        setShowPlanInput(false)
      }
    }
    document.addEventListener('mousedown', onClickOutside)
    return () => document.removeEventListener('mousedown', onClickOutside)
  }, [])

  if (integrations.length === 0) return null

  function selectIntegration(integration: Integration) {
    setSelectedIntegration(integration)
    setOpen(false)
    setTestPlanId(integration.config.testPlanId ?? '')
    setTestSuiteId(integration.config.testSuiteId ?? '')
    setShowPlanInput(true)
  }

  async function handlePush() {
    if (!selectedIntegration) return
    setPushing(true)
    setShowPlanInput(false)
    try {
      const res = await fetch(
        `/api/projects/${projectId}/integrations/${selectedIntegration.id}/push-tests`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            testCaseIds,
            testPlanId: testPlanId || undefined,
            testSuiteId: testSuiteId || undefined,
          }),
        }
      )
      const data = await res.json()
      if (!res.ok) throw new Error(data.error ?? 'Push failed')

      const pushed = data.pushed ?? 0
      const errCount = data.errors?.length ?? 0
      if (errCount === 0) {
        toast.success(`${pushed} test case${pushed === 1 ? '' : 's'} pushed to Azure DevOps`)
      } else {
        toast.warning(`${pushed} pushed, ${errCount} failed`, {
          description: data.errors[0]?.error,
        })
      }
    } catch (err: unknown) {
      toast.error('Push failed', { description: String(err) })
    } finally {
      setPushing(false)
      setSelectedIntegration(null)
    }
  }

  return (
    <div ref={ref} className="relative">
      {/* Plan/suite input overlay */}
      {showPlanInput && selectedIntegration && (
        <div
          className="absolute right-0 top-full mt-1 z-50 p-4 rounded-xl space-y-3 min-w-[260px]"
          style={{ background: 'var(--surface-0)', border: '1px solid var(--border)', boxShadow: '0 8px 24px rgba(0,0,0,0.12)' }}
        >
          <p className="text-xs font-semibold" style={{ color: 'var(--text-primary)' }}>
            ⚙️ Push to {selectedIntegration.name}
          </p>
          <div>
            <label className="block text-[10px] font-semibold uppercase tracking-wider mb-1" style={{ color: 'var(--text-tertiary)' }}>
              Test Plan ID <span className="normal-case font-normal">(optional)</span>
            </label>
            <input
              type="text"
              value={testPlanId}
              onChange={(e) => setTestPlanId(e.target.value)}
              placeholder="e.g. 42"
              className="w-full text-xs rounded-lg px-2.5 py-1.5"
              style={{ background: 'var(--surface-1)', border: '1px solid var(--border)', color: 'var(--text-primary)', outline: 'none' }}
            />
          </div>
          <div>
            <label className="block text-[10px] font-semibold uppercase tracking-wider mb-1" style={{ color: 'var(--text-tertiary)' }}>
              Test Suite ID <span className="normal-case font-normal">(optional)</span>
            </label>
            <input
              type="text"
              value={testSuiteId}
              onChange={(e) => setTestSuiteId(e.target.value)}
              placeholder="e.g. 99"
              className="w-full text-xs rounded-lg px-2.5 py-1.5"
              style={{ background: 'var(--surface-1)', border: '1px solid var(--border)', color: 'var(--text-primary)', outline: 'none' }}
            />
          </div>
          <p className="text-[10px]" style={{ color: 'var(--text-tertiary)' }}>
            Leave blank to use defaults from integration config.
          </p>
          <div className="flex gap-2">
            <button
              onClick={handlePush}
              disabled={pushing}
              className="flex-1 flex items-center justify-center gap-1.5 text-xs font-semibold py-1.5 rounded-lg text-white transition-all"
              style={{ background: '#0078d4' }}
            >
              <ExternalLink className="h-3 w-3" />
              Push {testCaseIds.length} test{testCaseIds.length === 1 ? '' : 's'}
            </button>
            <button
              onClick={() => { setShowPlanInput(false); setSelectedIntegration(null) }}
              className="text-xs px-2.5 py-1.5 rounded-lg"
              style={{ color: 'var(--text-tertiary)', border: '1px solid var(--border)' }}
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {integrations.length === 1 ? (
        <button
          onClick={() => selectIntegration(integrations[0])}
          disabled={pushing || testCaseIds.length === 0}
          className="inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-lg transition-all disabled:opacity-50"
          style={{ background: 'var(--surface-1)', color: 'var(--text-secondary)', border: '1px solid var(--border)' }}
          onMouseEnter={(e) => (e.currentTarget.style.borderColor = 'rgba(0,120,212,0.5)')}
          onMouseLeave={(e) => (e.currentTarget.style.borderColor = 'var(--border)')}
        >
          {pushing ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Upload className="h-3.5 w-3.5" />}
          {pushing ? 'Pushing…' : (label ?? `Push to Azure DevOps`)}
        </button>
      ) : (
        <>
          <button
            onClick={() => setOpen((p) => !p)}
            disabled={pushing || testCaseIds.length === 0}
            className="inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-lg transition-all disabled:opacity-50"
            style={{ background: 'var(--surface-1)', color: 'var(--text-secondary)', border: '1px solid var(--border)' }}
            onMouseEnter={(e) => (e.currentTarget.style.borderColor = 'rgba(0,120,212,0.5)')}
            onMouseLeave={(e) => (e.currentTarget.style.borderColor = 'var(--border)')}
          >
            {pushing ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Upload className="h-3.5 w-3.5" />}
            {pushing ? 'Pushing…' : 'Push to Azure DevOps'}
            <ChevronDown className="h-3 w-3 opacity-50" />
          </button>

          {open && (
            <div
              className="absolute right-0 top-full mt-1 z-50 min-w-[200px] rounded-xl overflow-hidden"
              style={{ background: 'var(--surface-0)', border: '1px solid var(--border)', boxShadow: '0 8px 24px rgba(0,0,0,0.12)' }}
            >
              {integrations.map((i) => (
                <button
                  key={i.id}
                  onClick={() => selectIntegration(i)}
                  className="w-full flex items-center gap-2.5 px-4 py-2.5 text-sm text-left transition-colors"
                  style={{ color: 'var(--text-primary)' }}
                  onMouseEnter={(e) => (e.currentTarget.style.background = 'var(--surface-2)')}
                  onMouseLeave={(e) => (e.currentTarget.style.background = '')}
                >
                  ⚙️ {i.name}
                </button>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  )
}
