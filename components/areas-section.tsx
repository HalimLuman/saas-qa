'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Plus, FlaskConical, Bug, Pencil, X } from 'lucide-react'
import CreateAreaDialog from './create-area-dialog'
import { toast } from 'sonner'

interface Area {
  id: string
  name: string
  description?: string | null
  color: string
  _count: { testCases: number; bugReports: number }
}

interface Props {
  projectId: string
  areas: Area[]
}

export default function AreasSection({ projectId, areas: initialAreas }: Props) {
  const router = useRouter()
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editArea, setEditArea] = useState<Area | undefined>()
  const [deletingId, setDeletingId] = useState<string | null>(null)

  function openCreate() {
    setEditArea(undefined)
    setDialogOpen(true)
  }

  function openEdit(area: Area, e: React.MouseEvent) {
    e.preventDefault()
    e.stopPropagation()
    setEditArea(area)
    setDialogOpen(true)
  }

  async function handleDelete(area: Area, e: React.MouseEvent) {
    e.preventDefault()
    e.stopPropagation()
    if (!confirm(`Delete area "${area.name}"? Tests and bugs in this area will become uncategorised.`)) return
    setDeletingId(area.id)
    try {
      const res = await fetch(`/api/areas/${area.id}`, { method: 'DELETE' })
      if (!res.ok) throw new Error('Failed to delete')
      toast.success(`Area "${area.name}" deleted`)
      router.refresh()
    } catch {
      toast.error('Could not delete area')
    } finally {
      setDeletingId(null)
    }
  }

  return (
    <div>
      {/* ── Section header ── */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <span
            className="text-[10px] font-bold uppercase tracking-widest"
            style={{ color: 'var(--text-tertiary)' }}
          >
            Areas
          </span>
          {initialAreas.length > 0 && (
            <span
              className="text-[11px] font-semibold h-[18px] min-w-[18px] inline-flex items-center justify-center px-1 rounded-full tabular-nums"
              style={{ background: 'var(--surface-2)', color: 'var(--text-tertiary)' }}
            >
              {initialAreas.length}
            </span>
          )}
        </div>

        <button
          onClick={openCreate}
          className="inline-flex items-center gap-1 text-[11px] font-medium px-2.5 py-1 rounded-lg transition-colors"
          style={{
            background: 'var(--surface-0)',
            border: '1px solid var(--border)',
            color: 'var(--text-secondary)',
          }}
        >
          <Plus className="h-3 w-3" />
          Add Area
        </button>
      </div>

      {/* ── Empty state ── */}
      {initialAreas.length === 0 ? (
        <button
          onClick={openCreate}
          className="w-full flex items-center justify-center gap-2 py-5 rounded-xl text-sm transition-colors"
          style={{
            border: '1.5px dashed var(--border)',
            color: 'var(--text-tertiary)',
          }}
        >
          <Plus className="h-4 w-4" />
          Create your first area to organise tests &amp; bugs
        </button>
      ) : (
        /* ── Area cards ── */
        <div className="flex flex-wrap gap-2">
          {initialAreas.map((area) => (
            <Link
              key={area.id}
              href={`/project/${projectId}/area/${area.id}`}
              className="group relative flex items-center overflow-hidden rounded-xl transition-all hover:shadow-md"
              style={{
                background: 'var(--surface-0)',
                border: `1px solid ${area.color}30`,
                minWidth: '160px',
              }}
            >
              {/* Left color bar */}
              <div
                className="absolute left-0 inset-y-0 w-[3px]"
                style={{ background: area.color }}
              />

              {/* Content */}
              <div className="pl-4 pr-3 py-2.5 flex-1 min-w-0">
                <div className="flex items-center gap-1.5">
                  <span
                    className="h-2 w-2 rounded-full shrink-0"
                    style={{ background: area.color }}
                  />
                  <span
                    className="text-sm font-semibold truncate"
                    style={{ color: 'var(--text-primary)' }}
                  >
                    {area.name}
                  </span>
                </div>

                <div className="flex items-center gap-2.5 mt-1">
                  <span
                    className="flex items-center gap-1 text-[11px]"
                    style={{ color: 'var(--text-secondary)' }}
                  >
                    <FlaskConical className="h-3 w-3 text-emerald-500" />
                    {area._count.testCases} test{area._count.testCases !== 1 ? 's' : ''}
                  </span>
                  {area._count.bugReports > 0 && (
                    <span
                      className="flex items-center gap-1 text-[11px]"
                      style={{ color: '#ef4444' }}
                    >
                      <Bug className="h-3 w-3" />
                      {area._count.bugReports}
                    </span>
                  )}
                </div>
              </div>

              {/* Hover: edit / delete */}
              <div className="hidden group-hover:flex items-center gap-0.5 pr-2.5 shrink-0">
                <button
                  onClick={(e) => openEdit(area, e)}
                  className="h-6 w-6 rounded-md flex items-center justify-center transition-colors hover:bg-black/10"
                  style={{ color: 'var(--text-tertiary)' }}
                  aria-label="Edit area"
                >
                  <Pencil className="h-3 w-3" />
                </button>
                <button
                  onClick={(e) => handleDelete(area, e)}
                  disabled={deletingId === area.id}
                  className="h-6 w-6 rounded-md flex items-center justify-center transition-colors hover:bg-red-100 dark:hover:bg-red-950/40 hover:text-red-600"
                  style={{ color: 'var(--text-tertiary)' }}
                  aria-label="Delete area"
                >
                  <X className="h-3 w-3" />
                </button>
              </div>
            </Link>
          ))}
        </div>
      )}

      <CreateAreaDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        projectId={projectId}
        editArea={editArea}
      />
    </div>
  )
}
