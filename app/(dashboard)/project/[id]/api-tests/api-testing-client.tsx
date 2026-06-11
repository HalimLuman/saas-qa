'use client'

import { useState, useCallback, useEffect } from 'react'
import {
  Plus, Trash2, ChevronDown, ChevronRight, Folder, Globe,
  Send, Check, X, AlertCircle, Clock, Loader2, Search,
  Copy, Pencil,
} from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { toast } from 'sonner'
import { useTopbarActions } from '@/components/topbar-actions-provider'

// ── Types ──────────────────────────────────────────────────────────────
interface KV { key: string; value: string }

interface Assertion {
  id: string
  type: string
  target: string
  operator: string
  value: string | null
  sortOrder: number
}

interface ApiRequest {
  id: string
  collectionId: string
  name: string
  method: string
  url: string
  headers: string | null
  queryParams: string | null
  body: string | null
  bodyType: string | null
  auth: string | null
  sortOrder: number
  assertions: Assertion[]
}

interface ApiCollection {
  id: string
  name: string
  description: string | null
  requests: ApiRequest[]
}

interface ApiEnvironment {
  id: string
  name: string
  variables: Record<string, string>
  isDefault: boolean
}

interface AssertionResult {
  id: string
  type: string
  target: string
  operator: string
  value: string | null
  passed: boolean
  actual: string | null
}

interface RunResult {
  statusCode: number
  responseHeaders: Record<string, string>
  responseBody: string
  durationMs: number
  passed: boolean
  assertionResults: AssertionResult[]
}

interface Props {
  projectId: string
  initialCollections: ApiCollection[]
  initialEnvironments: ApiEnvironment[]
}

// ── Constants ──────────────────────────────────────────────────────────
const METHODS = ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'HEAD', 'OPTIONS'] as const
const ASSERTION_TYPES = ['status', 'jsonpath', 'header', 'response_time', 'regex'] as const
const OPERATORS: Record<string, string[]> = {
  status:        ['eq', 'ne', 'lt', 'gt'],
  jsonpath:      ['eq', 'ne', 'contains', 'exists', 'matches'],
  header:        ['eq', 'contains', 'exists'],
  response_time: ['lt', 'gt'],
  regex:         ['matches'],
}

const METHOD_STYLE: Record<string, { background: string; color: string; borderColor: string }> = {
  GET:     { background: '#f0fdf4', color: '#15803d', borderColor: '#bbf7d0' },
  POST:    { background: '#fff7ed', color: '#c2410c', borderColor: '#fed7aa' },
  PUT:     { background: '#eff6ff', color: '#1d4ed8', borderColor: '#bfdbfe' },
  PATCH:   { background: '#f0fdfa', color: '#0f766e', borderColor: '#99f6e4' },
  DELETE:  { background: '#fef2f2', color: '#b91c1c', borderColor: '#fecaca' },
  HEAD:    { background: '#faf5ff', color: '#7c3aed', borderColor: '#e9d5ff' },
  OPTIONS: { background: '#eef2ff', color: '#4338ca', borderColor: '#c7d2fe' },
}

const STATUS_TEXT: Record<number, string> = {
  200: 'OK', 201: 'Created', 204: 'No Content', 301: 'Moved', 302: 'Found',
  304: 'Not Modified', 400: 'Bad Request', 401: 'Unauthorized', 403: 'Forbidden',
  404: 'Not Found', 405: 'Method Not Allowed', 408: 'Timeout', 409: 'Conflict',
  422: 'Unprocessable', 429: 'Too Many Requests', 500: 'Internal Error',
  502: 'Bad Gateway', 503: 'Unavailable', 504: 'Gateway Timeout',
}

const OP_LABEL: Record<string, string> = {
  eq: 'equals', ne: 'not equals', lt: '<', gt: '>',
  contains: 'contains', exists: 'exists', matches: 'matches',
}

// ── Helpers ───────────────────────────────────────────────────────────
function parseKV(json: string | null): KV[] {
  if (!json) return []
  try { return JSON.parse(json) as KV[] } catch { return [] }
}

function parseAuth(json: string | null): Record<string, string> {
  if (!json) return { type: 'none' }
  try { return JSON.parse(json) as Record<string, string> } catch { return { type: 'none' } }
}

function getStatusStyle(code: number): { background: string; color: string } {
  if (code >= 200 && code < 300) return { background: '#dcfce7', color: '#15803d' }
  if (code >= 300 && code < 400) return { background: '#fef9c3', color: '#92400e' }
  if (code >= 400) return { background: '#fee2e2', color: '#b91c1c' }
  return { background: '#f1f5f9', color: '#475569' }
}

function getStatusText(code: number): string {
  return STATUS_TEXT[code] ?? String(code)
}

function prettyJSON(str: string): string {
  try { return JSON.stringify(JSON.parse(str), null, 2) } catch { return str }
}

function shortMethod(m: string): string {
  if (m === 'DELETE') return 'DEL'
  if (m === 'OPTIONS') return 'OPT'
  return m
}

function formatBytes(n: number): string {
  if (n < 1024) return `${n} B`
  if (n < 1024 * 1024) return `${(n / 1024).toFixed(1)} KB`
  return `${(n / 1024 / 1024).toFixed(1)} MB`
}

function extractPath(url: string, fallback: string): string {
  if (!url) return fallback
  try { return new URL(url).pathname || fallback }
  catch {
    const m = url.match(/(?:https?:\/\/[^/]+)?(\/[^?#]*)/)
    return m?.[1]?.split('?')[0] ?? fallback
  }
}

function assertionSubject(a: Assertion): string {
  if (a.type === 'status') return 'status'
  if (a.type === 'jsonpath') return 'body.' + a.target.replace(/^\$\./, '')
  if (a.type === 'header') return `response.headers["${a.target}"]`
  if (a.type === 'response_time') return 'response.time'
  return a.target
}

function formatAssertionLabel(a: Assertion): string {
  const op = OP_LABEL[a.operator] ?? a.operator
  const subj = assertionSubject(a)
  if (a.operator === 'exists') return `${subj} ${op}`
  return `${subj} ${op} ${a.value ?? ''}`
}

function AssertionLabel({ a }: { a: Assertion }) {
  const op = OP_LABEL[a.operator] ?? a.operator
  const subj = assertionSubject(a)
  return (
    <code className="text-xs font-mono leading-relaxed">
      <span style={{ color: '#ea580c' }}>{subj}</span>
      <span className="mx-1.5" style={{ color: 'var(--text-tertiary)' }}>{op}</span>
      {a.operator !== 'exists' && a.value != null && (
        <span style={{ color: 'var(--text-primary)' }}>{a.value}</span>
      )}
    </code>
  )
}

// ── KV Table Editor ───────────────────────────────────────────────────
function KVEditor({ value, onChange, placeholder = 'Value' }: {
  value: KV[]
  onChange: (v: KV[]) => void
  placeholder?: string
}) {
  return (
    <div>
      <div className="rounded-lg overflow-hidden" style={{ border: '1px solid var(--border)' }}>
        <div className="grid grid-cols-[1fr_1fr_36px]" style={{ background: 'var(--surface-1)', borderBottom: '1px solid var(--border)' }}>
          <div className="px-3 py-2 text-[10px] font-bold uppercase tracking-wider" style={{ color: 'var(--text-tertiary)', borderRight: '1px solid var(--border)' }}>Key</div>
          <div className="px-3 py-2 text-[10px] font-bold uppercase tracking-wider" style={{ color: 'var(--text-tertiary)', borderRight: '1px solid var(--border)' }}>Value</div>
          <div />
        </div>
        {value.length === 0 && (
          <div className="px-3 py-4 text-xs text-center italic" style={{ color: 'var(--text-tertiary)' }}>No entries — click Add Row to start</div>
        )}
        {value.map((kv, i) => (
          <div key={i} className="grid grid-cols-[1fr_1fr_36px]" style={{ borderBottom: i < value.length - 1 ? '1px solid var(--border-subtle)' : 'none' }}>
            <input
              className="px-3 py-2 text-xs font-mono bg-transparent focus:outline-none"
              style={{ color: 'var(--text-primary)', borderRight: '1px solid var(--border)' }}
              placeholder="key" value={kv.key}
              onChange={(e) => { const n = [...value]; n[i] = { ...n[i], key: e.target.value }; onChange(n) }}
            />
            <input
              className="px-3 py-2 text-xs font-mono bg-transparent focus:outline-none"
              style={{ color: 'var(--text-primary)', borderRight: '1px solid var(--border)' }}
              placeholder={placeholder} value={kv.value}
              onChange={(e) => { const n = [...value]; n[i] = { ...n[i], value: e.target.value }; onChange(n) }}
            />
            <button
              onClick={() => onChange(value.filter((_, j) => j !== i))}
              className="flex items-center justify-center transition-colors"
              style={{ color: 'var(--text-tertiary)' }}
              onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.color = '#ef4444'; (e.currentTarget as HTMLButtonElement).style.background = '#fef2f2' }}
              onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.color = 'var(--text-tertiary)'; (e.currentTarget as HTMLButtonElement).style.background = '' }}
            >
              <X className="h-3.5 w-3.5" />
            </button>
          </div>
        ))}
      </div>
      <button onClick={() => onChange([...value, { key: '', value: '' }])} className="mt-2 flex items-center gap-1 text-[11px] transition-colors hover:text-orange-500" style={{ color: 'var(--text-tertiary)' }}>
        <Plus className="h-3 w-3" /> Add Row
      </button>
    </div>
  )
}

// ── Tab trigger class ─────────────────────────────────────────────────
const TAB_CLS = 'text-xs rounded-none border-b-2 border-transparent data-[state=active]:border-orange-500 data-[state=active]:text-orange-600 data-[state=active]:bg-transparent px-4 h-10 font-normal hover:text-slate-700 dark:hover:text-slate-300'

// ── Main component ─────────────────────────────────────────────────────
export default function ApiTestingClient({ projectId, initialCollections, initialEnvironments }: Props) {
  const [collections, setCollections] = useState<ApiCollection[]>(initialCollections)
  const [environments] = useState<ApiEnvironment[]>(initialEnvironments)
  const [selectedEnvId, setSelectedEnvId] = useState<string>(
    initialEnvironments.find((e) => e.isDefault)?.id ?? initialEnvironments[0]?.id ?? ''
  )
  const [activeRequestId, setActiveRequestId] = useState<string | null>(null)
  const [expandedCollections, setExpandedCollections] = useState<Set<string>>(
    new Set(initialCollections.map((c) => c.id))
  )
  const [reqDrafts, setReqDrafts] = useState<Record<string, Partial<ApiRequest>>>({})
  const [runResults, setRunResults] = useState<Record<string, RunResult>>({})
  const [running, setRunning] = useState<string | null>(null)
  const [runningCollection, setRunningCollection] = useState(false)
  const [newCollectionName, setNewCollectionName] = useState('')
  const [addingCollection, setAddingCollection] = useState(false)
  const [sidebarSearch, setSidebarSearch] = useState('')
  const [editingAssertionId, setEditingAssertionId] = useState<string | null>(null)
  const [copiedResponse, setCopiedResponse] = useState(false)

  const { setActions } = useTopbarActions()

  const activeCollection = collections.find((c) => c.requests.some((r) => r.id === activeRequestId))
  const activeRequest = activeCollection?.requests.find((r) => r.id === activeRequestId)
  const draft = activeRequestId ? reqDrafts[activeRequestId] : undefined
  const effectiveRequest: ApiRequest | undefined = activeRequest ? { ...activeRequest, ...draft } : undefined
  const req = effectiveRequest
  const result = req ? runResults[req.id] : undefined
  const kvHeaders = req ? parseKV(req.headers) : []
  const kvQuery   = req ? parseKV(req.queryParams) : []
  const authObj   = req ? parseAuth(req.auth) : { type: 'none' }

  function getDraft(id: string): Partial<ApiRequest> { return reqDrafts[id] ?? {} }
  function setDraft(id: string, patch: Partial<ApiRequest>) {
    setReqDrafts((prev) => ({ ...prev, [id]: { ...prev[id], ...patch } }))
  }
  function getVariables(): Record<string, string> {
    return environments.find((e) => e.id === selectedEnvId)?.variables ?? {}
  }

  // ── Collection CRUD ──────────────────────────────────────────────────
  async function createCollection() {
    if (!newCollectionName.trim()) return
    try {
      const res = await fetch(`/api/projects/${projectId}/api-collections`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: newCollectionName.trim() }),
      })
      if (!res.ok) throw new Error()
      const { collection } = await res.json()
      setCollections((prev) => [...prev, collection])
      setExpandedCollections((prev) => new Set(prev).add(collection.id))
      setNewCollectionName(''); setAddingCollection(false)
      toast.success('Collection created')
    } catch { toast.error('Could not create collection') }
  }

  async function deleteCollection(collectionId: string) {
    try {
      await fetch(`/api/projects/${projectId}/api-collections/${collectionId}`, { method: 'DELETE' })
      setCollections((prev) => prev.filter((c) => c.id !== collectionId))
      if (activeCollection?.id === collectionId) setActiveRequestId(null)
      toast.success('Collection deleted')
    } catch { toast.error('Could not delete collection') }
  }

  // ── Request CRUD ─────────────────────────────────────────────────────
  async function createRequest(collectionId: string) {
    try {
      const res = await fetch(`/api/projects/${projectId}/api-collections/${collectionId}/requests`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: 'New Request', method: 'GET', url: '' }),
      })
      if (!res.ok) throw new Error()
      const { request } = await res.json()
      setCollections((prev) => prev.map((c) =>
        c.id === collectionId ? { ...c, requests: [...c.requests, request] } : c
      ))
      setActiveRequestId(request.id)
    } catch { toast.error('Could not create request') }
  }

  async function saveRequest(id: string) {
    const d = getDraft(id)
    if (!d || Object.keys(d).length === 0) return
    try {
      const body: Record<string, unknown> = {}
      if (d.name        !== undefined) body.name        = d.name
      if (d.method      !== undefined) body.method      = d.method
      if (d.url         !== undefined) body.url         = d.url
      if (d.headers     !== undefined) body.headers     = d.headers ? parseKV(d.headers) : null
      if (d.queryParams !== undefined) body.queryParams = d.queryParams ? parseKV(d.queryParams) : null
      if (d.body        !== undefined) body.body        = d.body
      if (d.bodyType    !== undefined) body.bodyType    = d.bodyType
      if (d.auth        !== undefined) body.auth        = d.auth

      const res = await fetch(`/api/api-requests/${id}`, {
        method: 'PUT', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })
      if (!res.ok) throw new Error()
      const { request: updated } = await res.json()
      setCollections((prev) => prev.map((c) => ({
        ...c, requests: c.requests.map((r) => r.id === id ? { ...r, ...updated } : r),
      })))
      setReqDrafts((prev) => { const n = { ...prev }; delete n[id]; return n })
    } catch { toast.error('Could not save request') }
  }

  async function deleteRequest(requestId: string, collectionId: string) {
    try {
      await fetch(`/api/api-requests/${requestId}`, { method: 'DELETE' })
      setCollections((prev) => prev.map((c) =>
        c.id === collectionId ? { ...c, requests: c.requests.filter((r) => r.id !== requestId) } : c
      ))
      if (activeRequestId === requestId) setActiveRequestId(null)
      toast.success('Request deleted')
    } catch { toast.error('Could not delete request') }
  }

  // ── Assertion CRUD ───────────────────────────────────────────────────
  async function addAssertion(requestId: string) {
    try {
      const res = await fetch(`/api/api-requests/${requestId}/assertions`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type: 'status', target: 'status', operator: 'eq', value: '200' }),
      })
      if (!res.ok) throw new Error()
      const { assertion } = await res.json()
      setCollections((prev) => prev.map((c) => ({
        ...c, requests: c.requests.map((r) =>
          r.id === requestId ? { ...r, assertions: [...r.assertions, assertion] } : r
        ),
      })))
      setEditingAssertionId(assertion.id)
    } catch { toast.error('Could not add assertion') }
  }

  async function updateAssertion(requestId: string, assertionId: string, patch: Partial<Assertion>) {
    try {
      await fetch(`/api/api-requests/${requestId}/assertions/${assertionId}`, {
        method: 'PUT', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(patch),
      })
      setCollections((prev) => prev.map((c) => ({
        ...c, requests: c.requests.map((r) =>
          r.id === requestId
            ? { ...r, assertions: r.assertions.map((a) => a.id === assertionId ? { ...a, ...patch } : a) }
            : r
        ),
      })))
    } catch { toast.error('Could not update assertion') }
  }

  async function deleteAssertion(requestId: string, assertionId: string) {
    try {
      await fetch(`/api/api-requests/${requestId}/assertions/${assertionId}`, { method: 'DELETE' })
      setCollections((prev) => prev.map((c) => ({
        ...c, requests: c.requests.map((r) =>
          r.id === requestId ? { ...r, assertions: r.assertions.filter((a) => a.id !== assertionId) } : r
        ),
      })))
      if (editingAssertionId === assertionId) setEditingAssertionId(null)
    } catch { toast.error('Could not delete assertion') }
  }

  // ── Run ───────────────────────────────────────────────────────────────
  const runRequest = useCallback(async (requestId: string) => {
    const col = collections.find((c) => c.requests.some((r) => r.id === requestId))
    const base = col?.requests.find((r) => r.id === requestId)
    if (!base) return
    const effective = { ...base, ...(reqDrafts[requestId] ?? {}) }

    setRunning(requestId)
    try {
      const payload: Record<string, unknown> = {
        variables: environments.find((e) => e.id === selectedEnvId)?.variables ?? {},
        url: effective.url, method: effective.method,
      }
      if (effective.headers)      payload.headers     = parseKV(effective.headers)
      if (effective.queryParams)  payload.queryParams = parseKV(effective.queryParams)
      if (effective.body != null) payload.body        = effective.body
      if (effective.bodyType)     payload.bodyType    = effective.bodyType

      const res = await fetch(`/api/api-requests/${requestId}/run`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
      const data = await res.json()
      if (!res.ok) { toast.error(data.error ?? 'Request failed'); return }
      setRunResults((prev) => ({ ...prev, [requestId]: data }))
    } catch { toast.error('Could not send request') }
    finally { setRunning(null) }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedEnvId, environments, collections, reqDrafts])

  // ── Run Collection ────────────────────────────────────────────────────
  const runCollection = useCallback(async (collectionId: string) => {
    const col = collections.find((c) => c.id === collectionId)
    if (!col || col.requests.length === 0) { toast.error('No requests in collection'); return }
    setRunningCollection(true)
    for (const r of col.requests) {
      await runRequest(r.id)
    }
    setRunningCollection(false)
    toast.success(`Ran ${col.requests.length} request${col.requests.length === 1 ? '' : 's'}`)
  }, [collections, runRequest])

  // ── Topbar actions ────────────────────────────────────────────────────
  useEffect(() => {
    const targetCollection = activeCollection ?? collections[0]
    setActions(
      <div className="flex items-center gap-2">
        <button
          onClick={() => targetCollection && createRequest(targetCollection.id)}
          disabled={!targetCollection}
          className="flex items-center gap-1.5 h-8 px-3 rounded-lg text-xs font-medium transition-colors disabled:opacity-40"
          style={{ background: 'var(--surface-2)', border: '1px solid var(--border)', color: 'var(--text-primary)' }}
          onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.background = 'var(--surface-3)' }}
          onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.background = 'var(--surface-2)' }}
        >
          <Plus className="h-3.5 w-3.5" /> New request
        </button>
        <button
          onClick={() => targetCollection && runCollection(targetCollection.id)}
          disabled={running !== null || runningCollection || !targetCollection}
          className="flex items-center gap-1.5 h-8 px-3 rounded-lg text-xs font-medium text-white transition-colors disabled:opacity-40"
          style={{ background: '#2563eb' }}
          onMouseEnter={(e) => { if (!(e.currentTarget as HTMLButtonElement).disabled) (e.currentTarget as HTMLButtonElement).style.background = '#1d4ed8' }}
          onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.background = '#2563eb' }}
        >
          {runningCollection
            ? <><Loader2 className="h-3.5 w-3.5 animate-spin" /> Running…</>
            : <><Send className="h-3.5 w-3.5" /> Run collection</>
          }
        </button>
      </div>
    )
    return () => setActions(null)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeCollection, collections, running, runningCollection])

  // ── Copy response ─────────────────────────────────────────────────────
  function copyResponse() {
    if (!result) return
    navigator.clipboard.writeText(prettyJSON(result.responseBody)).then(() => {
      setCopiedResponse(true)
      setTimeout(() => setCopiedResponse(false), 1500)
    })
  }

  // ── Filtered collections for sidebar ─────────────────────────────────
  const filteredCollections = sidebarSearch.trim()
    ? collections.map((c) => ({
        ...c,
        requests: c.requests.filter((r) =>
          r.name.toLowerCase().includes(sidebarSearch.toLowerCase()) ||
          r.url.toLowerCase().includes(sidebarSearch.toLowerCase())
        ),
      })).filter((c) => c.requests.length > 0)
    : collections

  // ── First failed assertion for summary ────────────────────────────────
  const firstFailed = result?.assertionResults.find((ar) => !ar.passed)

  // ── Render ────────────────────────────────────────────────────────────
  return (
    <div className="flex-1 min-h-0 flex overflow-hidden">

      {/* ── SIDEBAR ──────────────────────────────────────────────────── */}
      <div className="w-[240px] shrink-0 flex flex-col" style={{ borderRight: '1px solid var(--border)', background: 'var(--surface-1)' }}>

        {/* Search */}
        <div className="px-3 py-2 shrink-0" style={{ borderBottom: '1px solid var(--border)' }}>
          <div className="flex items-center gap-2 h-8 px-2.5 rounded-lg" style={{ background: 'var(--surface-0)', border: '1px solid var(--border)' }}>
            <Search className="h-3 w-3 shrink-0" style={{ color: 'var(--text-tertiary)' }} />
            <input
              className="flex-1 text-xs bg-transparent focus:outline-none"
              style={{ color: 'var(--text-primary)' }}
              placeholder="Search requests…"
              value={sidebarSearch}
              onChange={(e) => setSidebarSearch(e.target.value)}
            />
            {sidebarSearch && (
              <button onClick={() => setSidebarSearch('')} style={{ color: 'var(--text-tertiary)' }}>
                <X className="h-3 w-3" />
              </button>
            )}
          </div>
        </div>

        {/* Environment selector at top */}
        {environments.length > 0 && (
          <div className="px-3 py-2 shrink-0" style={{ borderBottom: '1px solid var(--border)' }}>
            <Select value={selectedEnvId} onValueChange={setSelectedEnvId}>
              <SelectTrigger className="h-7 text-xs border-0 bg-transparent p-0 gap-1.5 hover:bg-transparent focus:ring-0 [&>svg]:hidden" style={{ color: 'var(--text-secondary)' }}>
                <span className="h-2 w-2 rounded-full bg-emerald-400 shrink-0" />
                <SelectValue placeholder="No environment" />
              </SelectTrigger>
              <SelectContent>
                {environments.map((e) => (
                  <SelectItem key={e.id} value={e.id}>{e.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}

        {/* New collection input */}
        {addingCollection && (
          <div className="px-3 py-2 shrink-0 flex gap-1.5" style={{ borderBottom: '1px solid var(--border)' }}>
            <Input
              className="h-7 text-xs flex-1" placeholder="Collection name…"
              value={newCollectionName} onChange={(e) => setNewCollectionName(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter') createCollection(); if (e.key === 'Escape') setAddingCollection(false) }}
              autoFocus
            />
            <button onClick={createCollection} className="text-emerald-500 hover:text-emerald-600 px-1 transition-colors"><Check className="h-3.5 w-3.5" /></button>
            <button onClick={() => setAddingCollection(false)} className="px-1 transition-colors hover:text-slate-600" style={{ color: 'var(--text-tertiary)' }}><X className="h-3.5 w-3.5" /></button>
          </div>
        )}

        {/* Collections list */}
        <div className="flex-1 overflow-y-auto py-1">
          {filteredCollections.length === 0 && (
            <div className="py-10 px-4 text-center">
              {sidebarSearch ? (
                <>
                  <p className="text-xs font-medium" style={{ color: 'var(--text-secondary)' }}>No matches</p>
                  <p className="text-[11px] mt-0.5" style={{ color: 'var(--text-tertiary)' }}>Try a different search</p>
                </>
              ) : (
                <>
                  <Folder className="h-8 w-8 mx-auto mb-2" style={{ color: 'var(--border-strong)' }} />
                  <p className="text-xs font-medium" style={{ color: 'var(--text-secondary)' }}>No collections yet</p>
                  <button
                    className="text-[11px] mt-1 text-orange-500 hover:text-orange-600 transition-colors"
                    onClick={() => setAddingCollection(true)}
                  >
                    Create one to start
                  </button>
                </>
              )}
            </div>
          )}

          {filteredCollections.map((col) => {
            const isExpanded = expandedCollections.has(col.id)
            return (
              <div key={col.id}>
                {/* Collection header */}
                <div
                  className="flex items-center gap-1 px-3 py-1.5 cursor-pointer group transition-colors"
                  onMouseEnter={(e) => (e.currentTarget.style.background = 'var(--surface-2)')}
                  onMouseLeave={(e) => (e.currentTarget.style.background = '')}
                  onClick={() => setExpandedCollections((prev) => {
                    const n = new Set(prev); n.has(col.id) ? n.delete(col.id) : n.add(col.id); return n
                  })}
                >
                  {isExpanded
                    ? <ChevronDown className="h-3 w-3 shrink-0" style={{ color: 'var(--text-tertiary)' }} />
                    : <ChevronRight className="h-3 w-3 shrink-0" style={{ color: 'var(--text-tertiary)' }} />
                  }
                  <span className="text-[11px] font-semibold uppercase tracking-wider flex-1 truncate ml-0.5" style={{ color: 'var(--text-secondary)' }}>
                    {col.name}
                  </span>
                  <span className="text-[10px] shrink-0 mr-1" style={{ color: 'var(--text-tertiary)' }}>
                    {col.requests.length}
                  </span>
                  <div className="hidden group-hover:flex items-center gap-0.5">
                    <button
                      onClick={(e) => { e.stopPropagation(); createRequest(col.id) }}
                      className="p-0.5 rounded transition-colors hover:text-orange-500"
                      style={{ color: 'var(--text-tertiary)' }}
                    ><Plus className="h-3.5 w-3.5" /></button>
                    <button
                      onClick={(e) => { e.stopPropagation(); deleteCollection(col.id) }}
                      className="p-0.5 rounded transition-colors hover:text-red-500"
                      style={{ color: 'var(--text-tertiary)' }}
                    ><Trash2 className="h-3.5 w-3.5" /></button>
                  </div>
                </div>

                {/* Request rows */}
                {isExpanded && col.requests.map((r) => {
                  const isActive  = r.id === activeRequestId
                  const reqResult = runResults[r.id]
                  const method    = (reqDrafts[r.id]?.method as string | undefined) ?? r.method
                  const url       = (reqDrafts[r.id]?.url    as string | undefined) ?? r.url
                  const mStyle    = METHOD_STYLE[method] ?? METHOD_STYLE.GET
                  const hasDot    = reqResult !== undefined
                  const dotColor  = hasDot ? (reqResult.passed ? '#22c55e' : '#ef4444') : undefined
                  const displayPath = extractPath(url, r.name)
                  return (
                    <div
                      key={r.id}
                      className="flex items-center gap-2 pl-6 pr-3 py-1.5 cursor-pointer group transition-all border-l-2"
                      style={{
                        background: isActive ? 'var(--surface-2)' : undefined,
                        borderLeftColor: isActive ? '#ea580c' : 'transparent',
                      }}
                      onMouseEnter={(e) => { if (!isActive) (e.currentTarget as HTMLDivElement).style.background = 'var(--surface-2)' }}
                      onMouseLeave={(e) => { if (!isActive) (e.currentTarget as HTMLDivElement).style.background = '' }}
                      onClick={() => setActiveRequestId(r.id)}
                    >
                      <span
                        className="text-[10px] font-bold shrink-0 w-[38px] text-center py-0.5 rounded"
                        style={{ background: mStyle.background, color: mStyle.color }}
                      >
                        {shortMethod(method)}
                      </span>
                      <span
                        className="text-[11px] flex-1 truncate font-mono"
                        style={{
                          color: isActive ? '#ea580c' : 'var(--text-secondary)',
                          fontWeight: isActive ? 500 : 400,
                        }}
                      >
                        {displayPath}
                      </span>
                      {hasDot && (
                        <span className="shrink-0 h-1.5 w-1.5 rounded-full" style={{ background: dotColor }} />
                      )}
                      <button
                        onClick={(e) => { e.stopPropagation(); deleteRequest(r.id, col.id) }}
                        className="hidden group-hover:flex items-center shrink-0 p-0.5 rounded transition-colors hover:text-red-500"
                        style={{ color: 'var(--text-tertiary)' }}
                      ><X className="h-3 w-3" /></button>
                    </div>
                  )
                })}
              </div>
            )
          })}
        </div>

        {/* New collection button */}
        <div className="shrink-0 px-3 py-2.5" style={{ borderTop: '1px solid var(--border)' }}>
          <button
            onClick={() => setAddingCollection(true)}
            className="w-full flex items-center justify-center gap-1.5 h-7 rounded-lg text-[11px] font-medium transition-colors hover:text-orange-500"
            style={{ color: 'var(--text-tertiary)', border: '1px dashed var(--border)' }}
          >
            <Plus className="h-3 w-3" /> New collection
          </button>
        </div>
      </div>

      {/* ── MAIN PANEL ───────────────────────────────────────────────── */}
      {req ? (
        <div className="flex-1 flex flex-col min-h-0 overflow-hidden" style={{ background: 'var(--surface-0)' }}>

          {/* URL bar */}
          <div
            className="px-4 py-2.5 shrink-0 flex items-center gap-2"
            style={{ borderBottom: '1px solid var(--border)', background: 'var(--surface-0)' }}
          >
            <Select value={req.method} onValueChange={(v) => setDraft(req.id, { method: v })}>
              <SelectTrigger className="w-[105px] h-9 text-xs font-bold border shrink-0" style={METHOD_STYLE[req.method] ?? {}}>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {METHODS.map((m) => (
                  <SelectItem key={m} value={m}>
                    <span style={{ color: METHOD_STYLE[m]?.color ?? '#64748b' }} className="font-semibold">{m}</span>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <input
              className="flex-1 h-9 px-3 font-mono text-sm focus:outline-none rounded-lg"
              style={{ background: 'var(--surface-0)', border: '1px solid var(--border)', color: 'var(--text-primary)' }}
              placeholder="https://api.example.com/endpoint"
              value={req.url}
              onChange={(e) => setDraft(req.id, { url: e.target.value })}
            />

            <button
              className="h-9 px-4 gap-2 shrink-0 font-semibold text-sm text-white rounded-lg flex items-center disabled:opacity-50 transition-colors"
              style={{ background: '#2563eb' }}
              onClick={() => { saveRequest(req.id); runRequest(req.id) }}
              disabled={running === req.id || !req.url}
              onMouseEnter={(e) => { if (!(e.currentTarget as HTMLButtonElement).disabled) (e.currentTarget as HTMLButtonElement).style.background = '#1d4ed8' }}
              onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.background = '#2563eb' }}
            >
              {running === req.id
                ? <><Loader2 className="h-3.5 w-3.5 animate-spin" /> Sending</>
                : <><Send className="h-3.5 w-3.5" /> Send</>
              }
            </button>
          </div>

          {/* Horizontal split: request tabs (left) + response (right) */}
          <div className="flex-1 flex min-h-0 overflow-hidden">

            {/* ── REQUEST TABS ──────────────────────────────────────── */}
            <div className="flex-1 flex flex-col min-h-0 overflow-hidden" style={{ borderRight: '1px solid var(--border)' }}>
              <Tabs defaultValue="params" className="flex-1 flex flex-col min-h-0">
                <TabsList
                  className="px-4 shrink-0 rounded-none justify-start h-10 gap-0 p-0"
                  style={{ background: 'var(--surface-1)', borderBottom: '1px solid var(--border)' }}
                >
                  <TabsTrigger value="params" className={TAB_CLS}>
                    Params
                    {kvQuery.filter((k) => k.key).length > 0 && (
                      <span className="ml-1.5 bg-orange-100 text-orange-600 text-[9px] px-1.5 py-0.5 rounded-full font-bold leading-none">
                        {kvQuery.filter((k) => k.key).length}
                      </span>
                    )}
                  </TabsTrigger>
                  <TabsTrigger value="headers" className={TAB_CLS}>
                    Headers
                    {kvHeaders.filter((k) => k.key).length > 0 && (
                      <span className="ml-1.5 bg-orange-100 text-orange-600 text-[9px] px-1.5 py-0.5 rounded-full font-bold leading-none">
                        {kvHeaders.filter((k) => k.key).length}
                      </span>
                    )}
                  </TabsTrigger>
                  <TabsTrigger value="body" className={TAB_CLS}>Body</TabsTrigger>
                  <TabsTrigger value="auth" className={TAB_CLS}>Auth</TabsTrigger>
                  <TabsTrigger value="assertions" className={TAB_CLS}>
                    Assertions
                    {req.assertions.length > 0 && (
                      <span className="ml-1.5 bg-orange-100 text-orange-600 text-[9px] px-1.5 py-0.5 rounded-full font-bold leading-none">
                        {req.assertions.length}
                      </span>
                    )}
                  </TabsTrigger>
                </TabsList>

                <div className="flex-1 overflow-y-auto" style={{ background: 'var(--surface-0)' }}>
                  {/* Params */}
                  <TabsContent value="params" className="mt-0 p-4">
                    <KVEditor value={kvQuery} onChange={(v) => setDraft(req.id, { queryParams: JSON.stringify(v) })} placeholder="{{env_var}} or value" />
                  </TabsContent>

                  {/* Headers */}
                  <TabsContent value="headers" className="mt-0 p-4">
                    <KVEditor value={kvHeaders} onChange={(v) => setDraft(req.id, { headers: JSON.stringify(v) })} />
                  </TabsContent>

                  {/* Body */}
                  <TabsContent value="body" className="mt-0 p-4 space-y-3">
                    <div className="flex items-center gap-3">
                      <span className="text-xs font-medium shrink-0" style={{ color: 'var(--text-secondary)' }}>Body Type</span>
                      <div className="flex gap-1.5">
                        {(['none', 'json', 'form-data'] as const).map((type) => (
                          <button
                            key={type}
                            className={`text-xs px-3 py-1 rounded-full border font-medium transition-colors ${(req.bodyType ?? 'none') === type ? 'bg-orange-500 text-white border-orange-500' : 'hover:border-orange-300 hover:text-orange-600'}`}
                            style={(req.bodyType ?? 'none') === type ? {} : { color: 'var(--text-secondary)', borderColor: 'var(--border)' }}
                            onClick={() => setDraft(req.id, { bodyType: type === 'none' ? null : type })}
                          >
                            {type === 'none' ? 'None' : type === 'json' ? 'JSON' : 'Form Data'}
                          </button>
                        ))}
                      </div>
                    </div>
                    {req.bodyType && req.bodyType !== 'none' && (
                      <Textarea
                        className="font-mono text-xs min-h-[140px] resize-none"
                        style={{ background: '#0d1117', color: '#e2e8f0', borderColor: '#374151' }}
                        placeholder={req.bodyType === 'json' ? '{\n  "key": "value"\n}' : 'key=value&other=123'}
                        value={req.body ?? ''}
                        onChange={(e) => setDraft(req.id, { body: e.target.value })}
                      />
                    )}
                  </TabsContent>

                  {/* Auth */}
                  <TabsContent value="auth" className="mt-0 p-4 space-y-4">
                    <div className="flex items-center gap-3">
                      <span className="text-xs font-medium shrink-0" style={{ color: 'var(--text-secondary)' }}>Auth Type</span>
                      <div className="flex gap-1.5">
                        {(['none', 'bearer', 'basic', 'apikey'] as const).map((type) => (
                          <button
                            key={type}
                            className={`text-xs px-3 py-1 rounded-full border font-medium transition-colors capitalize ${(authObj.type ?? 'none') === type ? 'bg-orange-500 text-white border-orange-500' : 'hover:border-orange-300 hover:text-orange-600'}`}
                            style={(authObj.type ?? 'none') === type ? {} : { color: 'var(--text-secondary)', borderColor: 'var(--border)' }}
                            onClick={() => setDraft(req.id, { auth: JSON.stringify({ ...authObj, type }) })}
                          >
                            {type === 'none' ? 'None' : type === 'bearer' ? 'Bearer' : type === 'basic' ? 'Basic' : 'API Key'}
                          </button>
                        ))}
                      </div>
                    </div>

                    {authObj.type === 'bearer' && (
                      <div>
                        <label className="text-[11px] font-medium mb-1 block" style={{ color: 'var(--text-tertiary)' }}>Token</label>
                        <Input
                          className="font-mono text-xs h-8"
                          placeholder="Bearer token"
                          value={authObj.token ?? ''}
                          onChange={(e) => setDraft(req.id, { auth: JSON.stringify({ ...authObj, token: e.target.value }) })}
                        />
                      </div>
                    )}

                    {authObj.type === 'basic' && (
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="text-[11px] font-medium mb-1 block" style={{ color: 'var(--text-tertiary)' }}>Username</label>
                          <Input className="text-xs h-8" placeholder="username" value={authObj.username ?? ''} onChange={(e) => setDraft(req.id, { auth: JSON.stringify({ ...authObj, username: e.target.value }) })} />
                        </div>
                        <div>
                          <label className="text-[11px] font-medium mb-1 block" style={{ color: 'var(--text-tertiary)' }}>Password</label>
                          <Input type="password" className="text-xs h-8" placeholder="password" value={authObj.password ?? ''} onChange={(e) => setDraft(req.id, { auth: JSON.stringify({ ...authObj, password: e.target.value }) })} />
                        </div>
                      </div>
                    )}

                    {authObj.type === 'apikey' && (
                      <div className="space-y-3">
                        <div>
                          <label className="text-[11px] font-medium mb-1 block" style={{ color: 'var(--text-tertiary)' }}>Header Name</label>
                          <Input className="text-xs h-8 font-mono" placeholder="X-API-Key" value={authObj.headerName ?? ''} onChange={(e) => setDraft(req.id, { auth: JSON.stringify({ ...authObj, headerName: e.target.value }) })} />
                        </div>
                        <div>
                          <label className="text-[11px] font-medium mb-1 block" style={{ color: 'var(--text-tertiary)' }}>Key</label>
                          <Input className="text-xs h-8 font-mono" placeholder="your-api-key" value={authObj.key ?? ''} onChange={(e) => setDraft(req.id, { auth: JSON.stringify({ ...authObj, key: e.target.value }) })} />
                        </div>
                      </div>
                    )}
                  </TabsContent>

                  {/* Assertions */}
                  <TabsContent value="assertions" className="mt-0 p-4">
                    <div className="flex items-center justify-between mb-3">
                      <span className="text-[10px] font-bold uppercase tracking-widest" style={{ color: 'var(--text-tertiary)' }}>
                        Assertions{req.assertions.length > 0 ? ` · ${req.assertions.length}` : ''}
                      </span>
                    </div>

                    <div className="space-y-2">
                      {req.assertions.length === 0 && (
                        <p className="text-xs italic py-2" style={{ color: 'var(--text-tertiary)' }}>No assertions yet. Add one to validate the response.</p>
                      )}

                      {req.assertions.map((a) => {
                        const ar = result?.assertionResults.find((r) => r.id === a.id)
                        const isEditing = editingAssertionId === a.id
                        return (
                          <div
                            key={a.id}
                            className="rounded-lg border overflow-hidden"
                            style={{
                              borderColor: ar ? (ar.passed ? '#bbf7d0' : '#fecaca') : 'var(--border)',
                              background: ar ? (ar.passed ? '#f0fdf4' : '#fef2f2') : 'var(--surface-1)',
                            }}
                          >
                            {/* Display row */}
                            <div className="flex items-start gap-2.5 px-3 py-2.5">
                              {/* Pass/fail icon */}
                              <div className="shrink-0 mt-0.5">
                                {ar ? (
                                  ar.passed
                                    ? <div className="h-4 w-4 rounded-full bg-emerald-500 flex items-center justify-center"><Check className="h-2.5 w-2.5 text-white" /></div>
                                    : <div className="h-4 w-4 rounded-full bg-red-500 flex items-center justify-center"><X className="h-2.5 w-2.5 text-white" /></div>
                                ) : (
                                  <div className="h-4 w-4 rounded-full" style={{ background: 'var(--border-strong)' }} />
                                )}
                              </div>

                              {/* Label + got */}
                              <div className="flex-1 min-w-0">
                                <AssertionLabel a={a} />
                                {ar && !ar.passed && ar.actual !== null && (
                                  <p className="text-[11px] mt-0.5 font-mono font-medium" style={{ color: '#dc2626' }}>
                                    got {ar.actual}
                                  </p>
                                )}
                              </div>

                              {/* Actions */}
                              <div className="flex items-center gap-1 shrink-0">
                                <button
                                  onClick={() => setEditingAssertionId(isEditing ? null : a.id)}
                                  className="p-1 rounded transition-colors"
                                  style={{ color: isEditing ? '#ea580c' : 'var(--text-tertiary)' }}
                                  onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.color = '#ea580c' }}
                                  onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.color = isEditing ? '#ea580c' : 'var(--text-tertiary)' }}
                                ><Pencil className="h-3 w-3" /></button>
                                <button
                                  onClick={() => deleteAssertion(req.id, a.id)}
                                  className="p-1 rounded transition-colors"
                                  style={{ color: 'var(--text-tertiary)' }}
                                  onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.color = '#ef4444' }}
                                  onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.color = 'var(--text-tertiary)' }}
                                ><X className="h-3 w-3" /></button>
                              </div>
                            </div>

                            {/* Inline edit form */}
                            {isEditing && (
                              <div
                                className="px-3 pb-3 pt-0 flex flex-wrap gap-2"
                                style={{ borderTop: '1px solid var(--border)' }}
                              >
                                <Select value={a.type} onValueChange={(v) => updateAssertion(req.id, a.id, { type: v, operator: (OPERATORS[v] ?? ['eq'])[0] })}>
                                  <SelectTrigger className="h-7 text-xs w-[115px]"><SelectValue /></SelectTrigger>
                                  <SelectContent>{ASSERTION_TYPES.map((t) => <SelectItem key={t} value={t}>{t}</SelectItem>)}</SelectContent>
                                </Select>

                                <Input
                                  className="h-7 text-xs w-36 font-mono"
                                  placeholder={a.type === 'jsonpath' ? '$.user.id' : a.type === 'header' ? 'Content-Type' : 'target'}
                                  value={a.target}
                                  onChange={(e) => updateAssertion(req.id, a.id, { target: e.target.value })}
                                />

                                <Select value={a.operator} onValueChange={(v) => updateAssertion(req.id, a.id, { operator: v })}>
                                  <SelectTrigger className="h-7 text-xs w-24"><SelectValue /></SelectTrigger>
                                  <SelectContent>{(OPERATORS[a.type] ?? ['eq']).map((op) => <SelectItem key={op} value={op}>{op}</SelectItem>)}</SelectContent>
                                </Select>

                                {a.operator !== 'exists' && (
                                  <Input
                                    className="h-7 text-xs font-mono flex-1 min-w-[100px]"
                                    placeholder="expected value"
                                    value={a.value ?? ''}
                                    onChange={(e) => updateAssertion(req.id, a.id, { value: e.target.value })}
                                  />
                                )}
                              </div>
                            )}
                          </div>
                        )
                      })}
                    </div>

                    <button
                      onClick={() => addAssertion(req.id)}
                      className="mt-3 w-full flex items-center justify-center gap-1.5 h-8 rounded-lg text-xs font-medium transition-colors hover:text-orange-500 hover:border-orange-300"
                      style={{ color: 'var(--text-tertiary)', border: '1px dashed var(--border)' }}
                    >
                      <Plus className="h-3.5 w-3.5" /> Add assertion
                    </button>
                  </TabsContent>
                </div>
              </Tabs>
            </div>

            {/* ── RESPONSE PANEL (right column) ───────────────────── */}
            <div className="w-[360px] shrink-0 flex flex-col min-h-0" style={{ background: 'var(--surface-0)' }}>
              {result ? (
                <>
                  {/* Status bar */}
                  <div
                    className="px-4 py-2.5 shrink-0 flex items-center gap-3"
                    style={{ borderBottom: '1px solid var(--border)', background: 'var(--surface-1)' }}
                  >
                    <span
                      className="text-xs font-bold px-2.5 py-1 rounded-md"
                      style={getStatusStyle(result.statusCode)}
                    >
                      {result.statusCode} {getStatusText(result.statusCode)}
                    </span>
                    <span className="text-xs flex items-center gap-1" style={{ color: 'var(--text-tertiary)' }}>
                      <Clock className="h-3 w-3" /> {result.durationMs}ms
                    </span>
                    <span className="text-xs" style={{ color: 'var(--text-tertiary)' }}>
                      {formatBytes(new Blob([result.responseBody]).size)}
                    </span>
                    <button
                      onClick={copyResponse}
                      className="ml-auto flex items-center gap-1 text-[11px] transition-colors px-2 py-1 rounded"
                      style={{ color: 'var(--text-tertiary)', background: 'var(--surface-2)' }}
                      onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.background = 'var(--surface-3)' }}
                      onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.background = 'var(--surface-2)' }}
                    >
                      {copiedResponse ? <Check className="h-3 w-3 text-emerald-500" /> : <Copy className="h-3 w-3" />}
                      {copiedResponse ? 'Copied' : 'Copy'}
                    </button>
                  </div>

                  {/* Response body */}
                  <div className="flex-1 overflow-y-auto min-h-0">
                    <pre
                      className="p-4 text-xs font-mono whitespace-pre-wrap break-all min-h-full"
                      style={{ background: '#0d1117', color: '#e2e8f0' }}
                    >
                      {prettyJSON(result.responseBody)}
                    </pre>
                  </div>

                  {/* Assertion failure summary */}
                  {firstFailed && (
                    <div className="shrink-0 px-4 py-3" style={{ borderTop: '1px solid #fecaca', background: '#fff5f5' }}>
                      <p className="text-[11px] font-semibold text-red-600 mb-0.5">Assertion failure</p>
                      <p className="text-[11px] text-red-500 font-mono">
                        Expected {firstFailed.type === 'status' ? 'status' : firstFailed.target} = {firstFailed.value} but got {firstFailed.actual ?? 'unknown'}.
                      </p>
                    </div>
                  )}
                </>
              ) : (
                <div className="flex-1 flex items-center justify-center">
                  <div className="text-center px-6">
                    <div
                      className="h-12 w-12 rounded-xl flex items-center justify-center mx-auto mb-3"
                      style={{ background: 'var(--surface-2)' }}
                    >
                      <Send className="h-5 w-5" style={{ color: 'var(--text-tertiary)' }} />
                    </div>
                    <p className="text-xs font-medium" style={{ color: 'var(--text-secondary)' }}>No response yet</p>
                    <p className="text-[11px] mt-0.5" style={{ color: 'var(--text-tertiary)' }}>Press Send to see the response</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      ) : (
        /* Empty state */
        <div className="flex-1 flex items-center justify-center" style={{ background: 'var(--surface-1)' }}>
          <div className="text-center">
            <div className="h-16 w-16 rounded-2xl flex items-center justify-center mx-auto mb-4" style={{ background: 'var(--surface-2)' }}>
              <Globe className="h-8 w-8" style={{ color: 'var(--text-tertiary)' }} />
            </div>
            <p className="text-sm font-semibold" style={{ color: 'var(--text-secondary)' }}>Select a request to get started</p>
            <p className="text-xs mt-1" style={{ color: 'var(--text-tertiary)' }}>Or create a new one from a collection</p>
          </div>
        </div>
      )}
    </div>
  )
}
