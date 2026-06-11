'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Plus, Pencil, X } from 'lucide-react'
import CreateAreaDialog from './create-area-dialog'
import { toast } from 'sonner'

interface Area {
  id: string
  name: string
  description?: string | null
  color: string
  updatedAt: string
  approvedCount: number
  _count: { testCases: number; bugReports: number }
}

interface Props {
  projectId: string
  projectName: string
  areas: Area[]
}

function timeAgo(dateStr: string): string {
  const diff = Math.floor((Date.now() - new Date(dateStr).getTime()) / 1000)
  if (diff < 60) return 'just now'
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`
  if (diff < 604800) return `${Math.floor(diff / 86400)}d ago`
  return `${Math.floor(diff / 604800)}w ago`
}

function CoverageBar({ total, approved }: { total: number; approved: number }) {
  const pct = total > 0 ? Math.round((approved / total) * 100) : 0
  const color = pct >= 75 ? '#10b981' : pct >= 40 ? '#f59e0b' : '#ef4444'

  return (
    <div>
      <p
        className="text-[10px] font-semibold uppercase tracking-wider mb-1.5"
        style={{ color: 'var(--text-tertiary)' }}
      >
        Coverage
      </p>
      <div className="flex items-center gap-2">
        <div
          className="flex-1 h-1.5 rounded-full overflow-hidden"
          style={{ background: 'var(--surface-2)' }}
        >
          <div
            className="h-full rounded-full transition-all duration-500"
            style={{ width: `${Math.max(pct, total === 0 ? 0 : 2)}%`, background: color }}
          />
        </div>
        <span
          className="text-[11px] font-bold tabular-nums w-8 text-right"
          style={{ color }}
        >
          {pct}%
        </span>
      </div>
    </div>
  )
}

export default function AreasPageContent({ projectId, projectName, areas: initialAreas }: Props) {
  const router = useRouter()
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editArea, setEditArea] = useState<Area | undefined>()
  const [deletingId, setDeletingId] = useState<string | null>(null)

  function openCreate() { setEditArea(undefined); setDialogOpen(true) }
  function openEdit(area: Area, e: React.MouseEvent) {
    e.preventDefault(); e.stopPropagation()
    setEditArea(area); setDialogOpen(true)
  }

  async function handleDelete(area: Area, e: React.MouseEvent) {
    e.preventDefault(); e.stopPropagation()
    if (!confirm(`Delete area "${area.name}"? Tests and bugs will become uncategorised.`)) return
    setDeletingId(area.id)
    try {
      const res = await fetch(`/api/areas/${area.id}`, { method: 'DELETE' })
      if (!res.ok) throw new Error()
      toast.success(`Area "${area.name}" deleted`)
      router.refresh()
    } catch {
      toast.error('Could not delete area')
    } finally {
      setDeletingId(null)
    }
  }

  const totalTests = initialAreas.reduce((s, a) => s + a._count.testCases, 0)
  const areasWithNoTests = initialAreas.filter((a) => a._count.testCases === 0)

  return (
    <>
      {/* Page header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <p
            className="text-[11px] font-semibold uppercase tracking-wider mb-1"
            style={{ color: 'var(--text-tertiary)' }}
          >
            {projectName}
          </p>
          <h1
            className="text-2xl font-bold"
            style={{ color: 'var(--text-primary)', letterSpacing: '-0.03em' }}
          >
            Areas
          </h1>
          <p className="text-sm mt-1" style={{ color: 'var(--text-secondary)' }}>
            {initialAreas.length === 0
              ? 'Define the parts of your product to organise tests and bugs'
              : `${initialAreas.length} surface${initialAreas.length !== 1 ? 's' : ''} of the product · ${totalTests} test${totalTests !== 1 ? 's' : ''} assigned${areasWithNoTests.length > 0 ? ` · ${areasWithNoTests.length} area${areasWithNoTests.length !== 1 ? 's need' : ' needs'} first tests.` : '.'}`}
          </p>
        </div>
        <button
          onClick={openCreate}
          className="inline-flex items-center gap-1.5 text-sm font-semibold px-4 py-2 rounded-xl transition-all active:scale-[0.97] shrink-0"
          style={{
            background: 'linear-gradient(135deg, #4f46e5, #4338ca)',
            color: 'white',
            boxShadow: '0 4px 14px rgba(79,70,229,0.35)',
          }}
        >
          <Plus className="h-4 w-4" />
          New area
        </button>
      </div>

      {/* Empty state */}
      {initialAreas.length === 0 ? (
        <div
          className="text-center py-20 rounded-2xl"
          style={{ background: 'var(--surface-0)', border: '2px dashed var(--border)' }}
        >
          <h3 className="text-[17px] font-bold mb-2" style={{ color: 'var(--text-primary)' }}>
            No areas yet
          </h3>
          <p
            className="text-sm mb-7 max-w-sm mx-auto leading-relaxed"
            style={{ color: 'var(--text-secondary)' }}
          >
            Areas represent sections of your product — like Authentication, Dashboard, or Checkout.
            Group tests and bugs by area to track coverage.
          </p>
          <button
            onClick={openCreate}
            className="inline-flex items-center gap-2 text-sm font-semibold px-5 py-2.5 rounded-xl transition-all active:scale-[0.97]"
            style={{
              background: 'linear-gradient(135deg, #4f46e5, #4338ca)',
              color: 'white',
              boxShadow: '0 4px 14px rgba(79,70,229,0.3)',
            }}
          >
            <Plus className="h-4 w-4" />
            Create first area
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {initialAreas.map((area) => {
            const hasNoTests = area._count.testCases === 0
            const bugColor = area._count.bugReports > 0 ? '#ef4444' : 'var(--text-primary)'

            return (
              <div key={area.id} className="group relative">
                <Link
                  href={`/project/${projectId}/area/${area.id}`}
                  className="rounded-xl overflow-hidden block transition-shadow duration-200 hover:shadow-md"
                  style={{ background: 'var(--surface-0)', border: '1px solid var(--border)' }}
                >
                  {/* Color accent bar */}
                  <div className="h-[3px]" style={{ background: area.color }} />

                  <div className="p-4">
                    {/* Header: icon + name + owner + badge/updated */}
                    <div className="flex items-start justify-between gap-2 mb-3">
                      <div className="flex items-center gap-2.5 min-w-0">
                        <div
                          className="h-8 w-8 rounded-lg flex items-center justify-center shrink-0 text-sm font-bold text-white"
                          style={{ background: area.color }}
                        >
                          {area.name.slice(0, 1).toUpperCase()}
                        </div>
                        <div className="min-w-0">
                          <p
                            className="font-semibold text-sm truncate"
                            style={{ color: 'var(--text-primary)' }}
                          >
                            {area.name}
                          </p>
                          {area.description && (
                            <p
                              className="text-[11px] truncate"
                              style={{ color: 'var(--text-tertiary)' }}
                            >
                              owner {area.description}
                            </p>
                          )}
                        </div>
                      </div>
                      {hasNoTests ? (
                        <span
                          className="shrink-0 text-[10px] font-semibold px-2 py-0.5 rounded-full"
                          style={{
                            background: 'rgba(251,146,60,0.15)',
                            color: '#f97316',
                            border: '1px solid rgba(251,146,60,0.3)',
                          }}
                        >
                          No tests
                        </span>
                      ) : null}
                    </div>

                    {/* Stats row */}
                    <div className="flex items-end justify-between gap-2 mb-3">
                      <div className="flex items-end gap-5">
                        <div>
                          <p
                            className="text-2xl font-bold leading-none"
                            style={{ color: 'var(--text-primary)' }}
                          >
                            {area._count.testCases}
                          </p>
                          <p
                            className="text-[10px] font-semibold uppercase tracking-wider mt-0.5"
                            style={{ color: 'var(--text-tertiary)' }}
                          >
                            Tests
                          </p>
                        </div>
                        <div>
                          <p
                            className="text-2xl font-bold leading-none"
                            style={{ color: bugColor }}
                          >
                            {area._count.bugReports}
                          </p>
                          <p
                            className="text-[10px] font-semibold uppercase tracking-wider mt-0.5"
                            style={{ color: 'var(--text-tertiary)' }}
                          >
                            Open Bugs
                          </p>
                        </div>
                      </div>
                      <span
                        className="text-[11px] pb-0.5"
                        style={{ color: 'var(--text-tertiary)' }}
                      >
                        Updated {timeAgo(area.updatedAt)}
                      </span>
                    </div>

                    {/* Coverage */}
                    <CoverageBar total={area._count.testCases} approved={area.approvedCount} />

                    {/* Action buttons */}
                    <div className="flex gap-2 mt-3">
                      <span
                        className="flex-1 text-center text-[12px] font-medium py-1.5 rounded-lg cursor-pointer"
                        style={{
                          border: '1px solid var(--border)',
                          color: 'var(--text-secondary)',
                          background: 'var(--surface-1)',
                        }}
                      >
                        View tests
                      </span>
                      <Link
                        href={`/project/${projectId}/generate`}
                        onClick={(e) => e.stopPropagation()}
                        className="flex-1 text-center text-[12px] font-medium py-1.5 rounded-lg"
                        style={{
                          border: '1px solid var(--border)',
                          color: 'var(--text-secondary)',
                          background: 'var(--surface-1)',
                        }}
                      >
                        Generate
                      </Link>
                    </div>
                  </div>
                </Link>

                {/* Edit / Delete on hover */}
                <div className="hidden group-hover:flex absolute top-5 right-2 items-center gap-0.5 z-10">
                  <button
                    onClick={(e) => openEdit(area, e)}
                    className="h-7 w-7 rounded-lg flex items-center justify-center transition-colors hover:bg-black/10"
                    style={{ color: 'var(--text-tertiary)' }}
                    aria-label="Edit area"
                  >
                    <Pencil className="h-3.5 w-3.5" />
                  </button>
                  <button
                    onClick={(e) => handleDelete(area, e)}
                    disabled={deletingId === area.id}
                    className="h-7 w-7 rounded-lg flex items-center justify-center transition-colors hover:bg-red-100 dark:hover:bg-red-950/40 hover:text-red-600"
                    style={{ color: 'var(--text-tertiary)' }}
                    aria-label="Delete area"
                  >
                    <X className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>
            )
          })}

          {/* New area tile */}
          <button
            onClick={openCreate}
            className="rounded-xl flex flex-col items-center justify-center gap-2 min-h-[200px] transition-all duration-200"
            style={{ border: '1.5px dashed var(--border)', background: 'transparent' }}
            onMouseEnter={(e) => {
              (e.currentTarget as HTMLElement).style.borderColor = 'rgba(99,102,241,0.4)'
              ;(e.currentTarget as HTMLElement).style.background = 'rgba(99,102,241,0.03)'
            }}
            onMouseLeave={(e) => {
              (e.currentTarget as HTMLElement).style.borderColor = 'var(--border)'
              ;(e.currentTarget as HTMLElement).style.background = 'transparent'
            }}
          >
            <div
              className="h-9 w-9 rounded-xl flex items-center justify-center"
              style={{ background: 'var(--surface-1)', border: '1px solid var(--border)' }}
            >
              <Plus className="h-5 w-5" style={{ color: 'var(--text-tertiary)' }} />
            </div>
            <span className="text-sm font-medium" style={{ color: 'var(--text-tertiary)' }}>
              New area
            </span>
          </button>
        </div>
      )}

      <CreateAreaDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        projectId={projectId}
        editArea={editArea}
      />
    </>
  )
}
