'use client'

import { useState, useEffect, useRef } from 'react'
import { toast } from 'sonner'
import { ExternalLink, ChevronDown, Loader2, Plug } from 'lucide-react'

interface Integration {
  id: string
  provider: string
  name: string
  isActive: boolean
}

const PROVIDER_ICONS: Record<string, string> = {
  AZURE_DEVOPS: '⚙️',
  JIRA: '🔵',
  GITHUB: '🐙',
  LINEAR: '🔷',
}

interface Props {
  projectId: string
  bugId: string
  settingsUrl?: string
}

export default function PushBugButton({ projectId, bugId, settingsUrl }: Props) {
  const [integrations, setIntegrations] = useState<Integration[]>([])
  const [loaded, setLoaded] = useState(false)
  const [open, setOpen] = useState(false)
  const [pushing, setPushing] = useState<string | null>(null)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    fetch(`/api/projects/${projectId}/integrations`)
      .then((r) => r.ok ? r.json() : { integrations: [] })
      .then((d) => {
        setIntegrations((d.integrations ?? []).filter((i: Integration) => i.isActive))
        setLoaded(true)
      })
  }, [projectId])

  useEffect(() => {
    function onClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', onClickOutside)
    return () => document.removeEventListener('mousedown', onClickOutside)
  }, [])

  if (!loaded) return null

  if (integrations.length === 0) {
    const href = settingsUrl ?? `/project/${projectId}/settings?tab=integrations`
    return (
      <a
        href={href}
        className="inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-lg transition-all"
        style={{ background: 'var(--surface-1)', color: 'var(--text-tertiary)', border: '1px solid var(--border)', textDecoration: 'none' }}
        onMouseEnter={(e) => (e.currentTarget.style.borderColor = 'rgba(59,130,246,0.4)')}
        onMouseLeave={(e) => (e.currentTarget.style.borderColor = 'var(--border)')}
        title="Connect an integration to export this bug"
      >
        <Plug className="h-3.5 w-3.5" />
        Export bug
      </a>
    )
  }

  async function push(integrationId: string, integrationName: string) {
    setPushing(integrationId)
    setOpen(false)
    try {
      const res = await fetch(`/api/projects/${projectId}/bugs/${bugId}/push`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ integrationId }),
      })
      const text = await res.text()
      let data: Record<string, string> = {}
      try { data = JSON.parse(text) } catch { throw new Error(`Server error (${res.status})`) }
      if (!res.ok) throw new Error(data.error ?? 'Push failed')
      toast.success(`Created in ${integrationName}`, {
        description: data.externalId,
        action: data.url ? { label: 'Open', onClick: () => window.open(data.url, '_blank') } : undefined,
      })
    } catch (err: unknown) {
      toast.error('Push failed', { description: err instanceof Error ? err.message : String(err) })
    } finally {
      setPushing(null)
    }
  }

  if (integrations.length === 1) {
    const i = integrations[0]
    return (
      <button
        onClick={() => push(i.id, i.name)}
        disabled={!!pushing}
        className="inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-lg transition-all disabled:opacity-50"
        style={{ background: 'var(--surface-1)', color: 'var(--text-secondary)', border: '1px solid var(--border)' }}
        onMouseEnter={(e) => (e.currentTarget.style.borderColor = 'rgba(59,130,246,0.4)')}
        onMouseLeave={(e) => (e.currentTarget.style.borderColor = 'var(--border)')}
      >
        {pushing === i.id
          ? <Loader2 className="h-3.5 w-3.5 animate-spin" />
          : <span>{PROVIDER_ICONS[i.provider]}</span>
        }
        {pushing === i.id ? 'Pushing…' : `Push to ${i.name}`}
        <ExternalLink className="h-3 w-3 opacity-50" />
      </button>
    )
  }

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen((p) => !p)}
        disabled={!!pushing}
        className="inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-lg transition-all disabled:opacity-50"
        style={{ background: 'var(--surface-1)', color: 'var(--text-secondary)', border: '1px solid var(--border)' }}
        onMouseEnter={(e) => (e.currentTarget.style.borderColor = 'rgba(59,130,246,0.4)')}
        onMouseLeave={(e) => (e.currentTarget.style.borderColor = 'var(--border)')}
      >
        {pushing
          ? <Loader2 className="h-3.5 w-3.5 animate-spin" />
          : <ExternalLink className="h-3.5 w-3.5" />
        }
        {pushing ? 'Pushing…' : 'Push to…'}
        <ChevronDown className="h-3 w-3 opacity-50" />
      </button>

      {open && (
        <div
          className="absolute right-0 top-full mt-1 z-50 min-w-[180px] rounded-xl overflow-hidden"
          style={{ background: 'var(--surface-0)', border: '1px solid var(--border)', boxShadow: '0 8px 24px rgba(0,0,0,0.12)' }}
        >
          {integrations.map((i) => (
            <button
              key={i.id}
              onClick={() => push(i.id, i.name)}
              className="w-full flex items-center gap-2.5 px-4 py-2.5 text-sm text-left transition-colors"
              style={{ color: 'var(--text-primary)' }}
              onMouseEnter={(e) => (e.currentTarget.style.background = 'var(--surface-2)')}
              onMouseLeave={(e) => (e.currentTarget.style.background = '')}
            >
              <span>{PROVIDER_ICONS[i.provider]}</span>
              {i.name}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
