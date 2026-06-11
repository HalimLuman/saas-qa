'use client'

import { useState, useEffect, useCallback } from 'react'
import { toast } from 'sonner'
import { Plus, Trash2, Plug, CheckCircle, XCircle, ChevronDown, ChevronUp, ToggleLeft, ToggleRight } from 'lucide-react'

type Provider = 'AZURE_DEVOPS' | 'JIRA' | 'GITHUB' | 'LINEAR'

interface Integration {
  id: string
  provider: Provider
  name: string
  config: Record<string, string>
  isActive: boolean
  createdAt: string
}

interface ProviderMeta {
  label: string
  icon: string
  color: string
  fields: { key: string; label: string; placeholder: string; secret?: boolean; optional?: boolean }[]
  description: string
}

const PROVIDERS: Record<Provider, ProviderMeta> = {
  AZURE_DEVOPS: {
    label: 'Azure DevOps',
    icon: '⚙️',
    color: '#0078d4',
    description: 'Push test cases to Test Plans, create Bug work items',
    fields: [
      { key: 'orgUrl', label: 'Organization URL', placeholder: 'https://dev.azure.com/yourorg' },
      { key: 'project', label: 'Project Name', placeholder: 'MyProject' },
      { key: 'pat', label: 'Personal Access Token', placeholder: 'PAT with Work Items (Read/Write) scope', secret: true },
      { key: 'testPlanId', label: 'Default Test Plan ID', placeholder: '42 (optional)', optional: true },
      { key: 'testSuiteId', label: 'Default Test Suite ID', placeholder: '99 (optional)', optional: true },
    ],
  },
  JIRA: {
    label: 'Jira',
    icon: '🔵',
    color: '#0052cc',
    description: 'Create Bug issues in your Jira project',
    fields: [
      { key: 'baseUrl', label: 'Jira Base URL', placeholder: 'https://yourcompany.atlassian.net' },
      { key: 'email', label: 'Email', placeholder: 'you@company.com' },
      { key: 'apiToken', label: 'API Token', placeholder: 'Generate at id.atlassian.com/manage-profile/security', secret: true },
      { key: 'projectKey', label: 'Project Key', placeholder: 'PROJ' },
    ],
  },
  GITHUB: {
    label: 'GitHub Issues',
    icon: '🐙',
    color: '#24292f',
    description: 'Create Issues in a GitHub repository',
    fields: [
      { key: 'owner', label: 'Owner (org or user)', placeholder: 'myorg' },
      { key: 'repo', label: 'Repository', placeholder: 'myrepo' },
      { key: 'token', label: 'Personal Access Token', placeholder: 'github_pat_…', secret: true },
      { key: 'labels', label: 'Labels', placeholder: 'bug,qa (comma-separated, optional)', optional: true },
    ],
  },
  LINEAR: {
    label: 'Linear',
    icon: '🔷',
    color: '#5e6ad2',
    description: 'Create Issues in your Linear team',
    fields: [
      { key: 'apiKey', label: 'API Key', placeholder: 'lin_api_…', secret: true },
      { key: 'teamId', label: 'Team ID', placeholder: 'Team UUID from Linear settings' },
    ],
  },
}

interface Props { projectId: string }

export default function IntegrationsSettings({ projectId }: Props) {
  const [integrations, setIntegrations] = useState<Integration[]>([])
  const [loading, setLoading] = useState(true)
  const [showAdd, setShowAdd] = useState(false)
  const [selectedProvider, setSelectedProvider] = useState<Provider | null>(null)
  const [formValues, setFormValues] = useState<Record<string, string>>({})
  const [integrationName, setIntegrationName] = useState('')
  const [saving, setSaving] = useState(false)
  const [expandedId, setExpandedId] = useState<string | null>(null)
  const [deleting, setDeleting] = useState<string | null>(null)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch(`/api/projects/${projectId}/integrations`)
      if (res.ok) {
        const data = await res.json()
        setIntegrations(data.integrations ?? [])
      }
    } finally {
      setLoading(false)
    }
  }, [projectId])

  useEffect(() => { load() }, [load])

  function startAdd(provider: Provider) {
    setSelectedProvider(provider)
    setFormValues({})
    setIntegrationName(PROVIDERS[provider].label)
  }

  function cancelAdd() {
    setShowAdd(false)
    setSelectedProvider(null)
    setFormValues({})
    setIntegrationName('')
  }

  async function handleSave() {
    if (!selectedProvider) return
    const meta = PROVIDERS[selectedProvider]
    const required = meta.fields.filter((f) => !f.optional)
    for (const f of required) {
      if (!formValues[f.key]?.trim()) {
        toast.error(`${f.label} is required`)
        return
      }
    }
    if (!integrationName.trim()) { toast.error('Name is required'); return }

    setSaving(true)
    try {
      const res = await fetch(`/api/projects/${projectId}/integrations`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          provider: selectedProvider,
          name: integrationName.trim(),
          config: formValues,
          testBeforeSave: true,
        }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error ?? 'Failed to save')
      toast.success(`${PROVIDERS[selectedProvider].label} connected`)
      cancelAdd()
      await load()
    } catch (err: unknown) {
      toast.error('Connection failed', { description: String(err) })
    } finally {
      setSaving(false)
    }
  }

  async function handleToggle(integration: Integration) {
    try {
      const res = await fetch(`/api/projects/${projectId}/integrations/${integration.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isActive: !integration.isActive }),
      })
      if (!res.ok) throw new Error()
      setIntegrations((prev) =>
        prev.map((i) => (i.id === integration.id ? { ...i, isActive: !i.isActive } : i))
      )
    } catch {
      toast.error('Could not update integration')
    }
  }

  async function handleDelete(id: string) {
    setDeleting(id)
    try {
      const res = await fetch(`/api/projects/${projectId}/integrations/${id}`, { method: 'DELETE' })
      if (!res.ok) throw new Error()
      toast.success('Integration removed')
      setIntegrations((prev) => prev.filter((i) => i.id !== id))
    } catch {
      toast.error('Could not remove integration')
    } finally {
      setDeleting(null)
    }
  }

  const fieldStyle = {
    background: 'var(--surface-1)',
    border: '1px solid var(--border)',
    color: 'var(--text-primary)',
    borderRadius: '0.75rem',
    padding: '0.5rem 0.75rem',
    fontSize: '0.875rem',
    width: '100%',
    outline: 'none',
  } as const

  return (
    <div
      className="rounded-2xl overflow-hidden"
      style={{ background: 'var(--surface-0)', border: '1px solid var(--border)' }}
    >
      {/* Header */}
      <div
        className="px-6 py-4 flex items-center justify-between"
        style={{ borderBottom: '1px solid var(--border)' }}
      >
        <div className="flex items-center gap-2.5">
          <Plug className="h-4 w-4" style={{ color: 'var(--text-secondary)' }} />
          <h2 className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>Integrations</h2>
        </div>
        {!showAdd && (
          <button
            onClick={() => setShowAdd(true)}
            className="inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-lg transition-all"
            style={{ background: 'var(--surface-2)', color: 'var(--text-primary)', border: '1px solid var(--border)' }}
            onMouseEnter={(e) => (e.currentTarget.style.borderColor = 'rgba(59,130,246,0.4)')}
            onMouseLeave={(e) => (e.currentTarget.style.borderColor = 'var(--border)')}
          >
            <Plus className="h-3.5 w-3.5" />
            Connect
          </button>
        )}
      </div>

      {/* Add integration flow */}
      {showAdd && !selectedProvider && (
        <div className="p-6 space-y-3">
          <p className="text-xs font-semibold uppercase tracking-wider" style={{ color: 'var(--text-tertiary)' }}>
            Choose a provider
          </p>
          <div className="grid grid-cols-2 gap-3">
            {(Object.entries(PROVIDERS) as [Provider, ProviderMeta][]).map(([key, meta]) => (
              <button
                key={key}
                onClick={() => startAdd(key)}
                className="text-left p-4 rounded-xl transition-all"
                style={{ background: 'var(--surface-1)', border: '1px solid var(--border)' }}
                onMouseEnter={(e) => { e.currentTarget.style.borderColor = meta.color; e.currentTarget.style.background = 'var(--surface-2)' }}
                onMouseLeave={(e) => { e.currentTarget.style.borderColor = 'var(--border)'; e.currentTarget.style.background = 'var(--surface-1)' }}
              >
                <div className="text-2xl mb-2">{meta.icon}</div>
                <p className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>{meta.label}</p>
                <p className="text-xs mt-0.5" style={{ color: 'var(--text-tertiary)' }}>{meta.description}</p>
              </button>
            ))}
          </div>
          <button
            onClick={cancelAdd}
            className="text-xs"
            style={{ color: 'var(--text-tertiary)' }}
          >
            Cancel
          </button>
        </div>
      )}

      {showAdd && selectedProvider && (
        <div className="p-6 space-y-4">
          <div className="flex items-center gap-2">
            <span className="text-xl">{PROVIDERS[selectedProvider].icon}</span>
            <h3 className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>
              Connect {PROVIDERS[selectedProvider].label}
            </h3>
          </div>

          <div>
            <label className="block text-[11px] font-semibold mb-1 uppercase tracking-wider" style={{ color: 'var(--text-tertiary)' }}>
              Display Name
            </label>
            <input
              type="text"
              value={integrationName}
              onChange={(e) => setIntegrationName(e.target.value)}
              style={fieldStyle}
              onFocus={(e) => (e.currentTarget.style.borderColor = 'rgba(59,130,246,0.5)')}
              onBlur={(e) => (e.currentTarget.style.borderColor = 'var(--border)')}
            />
          </div>

          {PROVIDERS[selectedProvider].fields.map((f) => (
            <div key={f.key}>
              <label className="block text-[11px] font-semibold mb-1 uppercase tracking-wider" style={{ color: 'var(--text-tertiary)' }}>
                {f.label}{' '}
                {f.optional && <span className="normal-case font-normal">(optional)</span>}
              </label>
              <input
                type={f.secret ? 'password' : 'text'}
                value={formValues[f.key] ?? ''}
                onChange={(e) => setFormValues((p) => ({ ...p, [f.key]: e.target.value }))}
                placeholder={f.placeholder}
                style={fieldStyle}
                onFocus={(e) => (e.currentTarget.style.borderColor = 'rgba(59,130,246,0.5)')}
                onBlur={(e) => (e.currentTarget.style.borderColor = 'var(--border)')}
              />
            </div>
          ))}

          <p className="text-xs" style={{ color: 'var(--text-tertiary)' }}>
            Connection will be tested before saving.
          </p>

          <div className="flex gap-2">
            <button
              onClick={handleSave}
              disabled={saving}
              className="inline-flex items-center gap-2 text-sm font-semibold px-4 py-2 rounded-xl text-white transition-all disabled:opacity-50"
              style={{ background: `linear-gradient(135deg, ${PROVIDERS[selectedProvider].color}, ${PROVIDERS[selectedProvider].color}cc)` }}
            >
              {saving ? 'Testing & saving…' : 'Connect'}
            </button>
            <button
              onClick={cancelAdd}
              className="text-sm px-4 py-2 rounded-xl"
              style={{ color: 'var(--text-secondary)', background: 'var(--surface-1)', border: '1px solid var(--border)' }}
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Existing integrations */}
      {!loading && integrations.length === 0 && !showAdd && (
        <div className="px-6 py-8 text-center">
          <Plug className="h-8 w-8 mx-auto mb-3" style={{ color: 'var(--text-tertiary)', opacity: 0.4 }} />
          <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>No integrations connected yet.</p>
          <p className="text-xs mt-1" style={{ color: 'var(--text-tertiary)' }}>
            Connect Azure DevOps, Jira, GitHub, or Linear to push bugs and test cases with one click.
          </p>
        </div>
      )}

      {integrations.length > 0 && (
        <div className="divide-y" style={{ borderColor: 'var(--border)' }}>
          {integrations.map((integration) => {
            const meta = PROVIDERS[integration.provider]
            const isExpanded = expandedId === integration.id
            return (
              <div key={integration.id} style={{ opacity: integration.isActive ? 1 : 0.6 }}>
                <div className="px-6 py-4 flex items-center gap-3">
                  <span className="text-xl shrink-0">{meta.icon}</span>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>{integration.name}</p>
                    <p className="text-xs" style={{ color: 'var(--text-tertiary)' }}>{meta.label}</p>
                  </div>
                  <div className="flex items-center gap-1.5">
                    {integration.isActive
                      ? <span className="flex items-center gap-1 text-xs text-green-600"><CheckCircle className="h-3 w-3" />Active</span>
                      : <span className="flex items-center gap-1 text-xs" style={{ color: 'var(--text-tertiary)' }}><XCircle className="h-3 w-3" />Disabled</span>
                    }
                    <button
                      onClick={() => handleToggle(integration)}
                      title={integration.isActive ? 'Disable' : 'Enable'}
                      className="h-7 w-7 flex items-center justify-center rounded-lg transition-colors"
                      style={{ color: 'var(--text-tertiary)' }}
                      onMouseEnter={(e) => (e.currentTarget.style.background = 'var(--surface-2)')}
                      onMouseLeave={(e) => (e.currentTarget.style.background = '')}
                    >
                      {integration.isActive
                        ? <ToggleRight className="h-4 w-4 text-green-500" />
                        : <ToggleLeft className="h-4 w-4" />
                      }
                    </button>
                    <button
                      onClick={() => handleDelete(integration.id)}
                      disabled={deleting === integration.id}
                      title="Remove"
                      className="h-7 w-7 flex items-center justify-center rounded-lg transition-colors"
                      style={{ color: 'var(--text-tertiary)' }}
                      onMouseEnter={(e) => { e.currentTarget.style.color = '#ef4444'; e.currentTarget.style.background = '#fef2f2' }}
                      onMouseLeave={(e) => { e.currentTarget.style.color = 'var(--text-tertiary)'; e.currentTarget.style.background = '' }}
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                    <button
                      onClick={() => setExpandedId(isExpanded ? null : integration.id)}
                      className="h-7 w-7 flex items-center justify-center rounded-lg transition-colors"
                      style={{ color: 'var(--text-tertiary)' }}
                      onMouseEnter={(e) => (e.currentTarget.style.background = 'var(--surface-2)')}
                      onMouseLeave={(e) => (e.currentTarget.style.background = '')}
                    >
                      {isExpanded ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
                    </button>
                  </div>
                </div>

                {isExpanded && (
                  <div
                    className="px-6 pb-4 space-y-1.5"
                    style={{ borderTop: '1px solid var(--border)', paddingTop: '0.75rem', background: 'var(--surface-1)' }}
                  >
                    {Object.entries(integration.config).map(([k, v]) => (
                      <div key={k} className="flex items-center gap-2 text-xs">
                        <span className="font-mono" style={{ color: 'var(--text-tertiary)', minWidth: 120 }}>{k}</span>
                        <span style={{ color: 'var(--text-secondary)' }}>{v}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
