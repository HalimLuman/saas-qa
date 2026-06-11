'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Check, RotateCcw } from 'lucide-react'
import { toast } from 'sonner'

interface Props {
  projectId: string
  bugId: string
  currentStatus: string
}

export default function MarkResolvedButton({ projectId, bugId, currentStatus }: Props) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [status, setStatus]   = useState(currentStatus)

  const isDone = status === 'RESOLVED' || status === 'CLOSED' || status === 'WONT_FIX'

  async function toggle() {
    const next = isDone ? 'OPEN' : 'RESOLVED'
    setLoading(true)
    try {
      const res = await fetch(`/api/projects/${projectId}/bugs/${bugId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: next }),
      })
      if (!res.ok) throw new Error()
      setStatus(next)
      toast.success(isDone ? 'Bug reopened' : 'Bug marked as resolved')
      router.refresh()
    } catch {
      toast.error('Could not update status')
    } finally {
      setLoading(false)
    }
  }

  return (
    <button
      onClick={toggle}
      disabled={loading}
      className="inline-flex items-center gap-1.5 text-sm font-semibold px-4 py-2 rounded-xl transition-all active:scale-[0.97] disabled:opacity-60"
      style={isDone ? {
        background: 'var(--surface-0)',
        color: 'var(--text-secondary)',
        border: '1px solid var(--border)',
      } : {
        background: 'linear-gradient(135deg,#2563eb,#1d4ed8)',
        color: '#fff',
        border: 'none',
        boxShadow: '0 4px 14px rgba(37,99,235,0.35)',
      }}
    >
      {loading ? (
        <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-current border-t-transparent" />
      ) : isDone ? (
        <RotateCcw className="h-3.5 w-3.5" />
      ) : (
        <Check className="h-3.5 w-3.5" />
      )}
      {loading ? 'Updating…' : isDone ? 'Reopen' : 'Mark resolved'}
    </button>
  )
}
