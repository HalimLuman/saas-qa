'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { Save, Trash2, AlertTriangle } from 'lucide-react'

interface Project {
  id: string
  name: string
  description: string | null
}

export default function ProjectSettingsForm({ project }: { project: Project }) {
  const router = useRouter()
  const [name, setName] = useState(project.name)
  const [description, setDescription] = useState(project.description ?? '')
  const [saving, setSaving] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [confirmDelete, setConfirmDelete] = useState(false)

  async function handleSave(e: React.FormEvent) {
    e.preventDefault()
    if (!name.trim()) return
    setSaving(true)
    try {
      const res = await fetch(`/api/projects/${project.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: name.trim(), description: description.trim() }),
      })
      if (!res.ok) throw new Error()
      toast.success('Project updated')
      router.refresh()
    } catch {
      toast.error('Could not save changes')
    } finally {
      setSaving(false)
    }
  }

  async function handleDelete() {
    if (!confirmDelete) { setConfirmDelete(true); return }
    setDeleting(true)
    try {
      const res = await fetch(`/api/projects/${project.id}`, { method: 'DELETE' })
      if (!res.ok) throw new Error()
      toast.success('Project deleted')
      router.push('/dashboard')
    } catch {
      toast.error('Could not delete project')
      setDeleting(false)
    }
  }

  const fieldStyle = {
    background: 'var(--surface-1)',
    border: '1px solid var(--border)',
    color: 'var(--text-primary)',
    borderRadius: '0.75rem',
    padding: '0.625rem 0.875rem',
    fontSize: '0.875rem',
    width: '100%',
    outline: 'none',
    transition: 'border-color 150ms',
  } as const

  return (
    <div className="space-y-4">
      {/* General settings */}
      <form
        onSubmit={handleSave}
        className="rounded-2xl overflow-hidden"
        style={{ background: 'var(--surface-0)', border: '1px solid var(--border)' }}
      >
        <div
          className="px-6 py-4"
          style={{ borderBottom: '1px solid var(--border)' }}
        >
          <h2 className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>General</h2>
        </div>

        <div className="px-6 py-5 space-y-4">
          <div>
            <label className="block text-[12px] font-semibold mb-1.5 uppercase tracking-wider" style={{ color: 'var(--text-tertiary)' }}>
              Project Name
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              maxLength={100}
              required
              style={fieldStyle}
              onFocus={(e) => (e.currentTarget.style.borderColor = 'rgba(59,130,246,0.5)')}
              onBlur={(e) => (e.currentTarget.style.borderColor = 'var(--border)')}
            />
          </div>

          <div>
            <label className="block text-[12px] font-semibold mb-1.5 uppercase tracking-wider" style={{ color: 'var(--text-tertiary)' }}>
              Description
              <span className="normal-case tracking-normal font-normal ml-1" style={{ color: 'var(--text-tertiary)' }}>(optional)</span>
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              maxLength={500}
              rows={3}
              style={{ ...fieldStyle, resize: 'vertical' }}
              placeholder="A short description of what this project covers…"
              onFocus={(e) => (e.currentTarget.style.borderColor = 'rgba(59,130,246,0.5)')}
              onBlur={(e) => (e.currentTarget.style.borderColor = 'var(--border)')}
            />
            <p className="text-[11px] mt-1 text-right tabular-nums" style={{ color: 'var(--text-tertiary)' }}>
              {description.length}/500
            </p>
          </div>
        </div>

        <div
          className="px-6 py-4 flex justify-end"
          style={{ borderTop: '1px solid var(--border)', background: 'var(--surface-1)' }}
        >
          <button
            type="submit"
            disabled={saving || !name.trim()}
            className="inline-flex items-center gap-2 text-sm font-semibold px-5 py-2 rounded-xl transition-all active:scale-[0.97] disabled:opacity-50"
            style={{
              background: 'linear-gradient(135deg, #2563eb, #1d4ed8)',
              color: 'white',
              boxShadow: '0 4px 14px rgba(37,99,235,0.3)',
            }}
          >
            <Save className="h-4 w-4" />
            {saving ? 'Saving…' : 'Save Changes'}
          </button>
        </div>
      </form>

      {/* Danger zone */}
      <div
        className="rounded-2xl overflow-hidden"
        style={{ background: 'var(--surface-0)', border: '1px solid rgba(239,68,68,0.2)' }}
      >
        <div
          className="px-6 py-4"
          style={{ borderBottom: '1px solid rgba(239,68,68,0.15)', background: 'rgba(239,68,68,0.03)' }}
        >
          <h2 className="text-sm font-semibold text-red-600 dark:text-red-400 flex items-center gap-2">
            <AlertTriangle className="h-4 w-4" />
            Danger Zone
          </h2>
        </div>

        <div className="px-6 py-5 flex items-center justify-between gap-4">
          <div>
            <p className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>Delete this project</p>
            <p className="text-[12px] mt-0.5" style={{ color: 'var(--text-secondary)' }}>
              Permanently removes all test cases, bugs, suites, and activity. This cannot be undone.
            </p>
          </div>
          <button
            type="button"
            onClick={handleDelete}
            disabled={deleting}
            className="shrink-0 inline-flex items-center gap-2 text-sm font-semibold px-4 py-2 rounded-xl border transition-all active:scale-[0.97] disabled:opacity-50"
            style={
              confirmDelete
                ? { background: 'rgba(239,68,68,0.12)', borderColor: 'rgba(239,68,68,0.4)', color: '#dc2626' }
                : { background: 'var(--surface-1)', borderColor: 'rgba(239,68,68,0.3)', color: '#ef4444' }
            }
          >
            <Trash2 className="h-4 w-4" />
            {deleting ? 'Deleting…' : confirmDelete ? 'Confirm Delete' : 'Delete Project'}
          </button>
        </div>

        {confirmDelete && (
          <div
            className="px-6 pb-4"
          >
            <p className="text-[12px] font-medium text-red-500">
              Click "Confirm Delete" again to permanently delete this project and all its data.
              <button
                className="ml-2 underline"
                onClick={() => setConfirmDelete(false)}
                style={{ color: 'var(--text-tertiary)' }}
              >
                Cancel
              </button>
            </p>
          </div>
        )}
      </div>
    </div>
  )
}
