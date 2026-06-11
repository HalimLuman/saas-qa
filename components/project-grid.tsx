'use client'

import Link from 'next/link'
import { Bug, FlaskConical, Layers, Plus, Sparkles } from 'lucide-react'
import CreateProjectDialog from './create-project-dialog'

const ACCENT_SETS = [
  { bar: '#3b82f6', glow: 'rgba(59,130,246,0.35)',  monoBg: 'rgba(59,130,246,0.15)',  monoText: '#93c5fd', badgeText: '#2563eb' },
  { bar: '#6366f1', glow: 'rgba(99,102,241,0.35)',  monoBg: 'rgba(99,102,241,0.15)',  monoText: '#818cf8', badgeText: '#4f46e5' },
  { bar: '#0ea5e9', glow: 'rgba(14,165,233,0.35)',  monoBg: 'rgba(14,165,233,0.15)',  monoText: '#38bdf8', badgeText: '#0284c7' },
  { bar: '#10b981', glow: 'rgba(16,185,129,0.35)',  monoBg: 'rgba(16,185,129,0.15)',  monoText: '#34d399', badgeText: '#059669' },
  { bar: '#f59e0b', glow: 'rgba(245,158,11,0.35)',  monoBg: 'rgba(245,158,11,0.15)',  monoText: '#fbbf24', badgeText: '#d97706' },
  { bar: '#ef4444', glow: 'rgba(239,68,68,0.35)',   monoBg: 'rgba(239,68,68,0.15)',   monoText: '#f87171', badgeText: '#dc2626' },
]

interface Project {
  id: string
  name: string
  description: string | null
  updatedAt: Date
  _count: { testCases: number; bugReports: number; regressionSuites: number }
}

function timeAgo(date: Date): string {
  const seconds = Math.floor((Date.now() - new Date(date).getTime()) / 1000)
  if (seconds < 60) return 'just now'
  const minutes = Math.floor(seconds / 60)
  if (minutes < 60) return `${minutes}m ago`
  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `${hours}h ago`
  const days = Math.floor(hours / 24)
  if (days < 30) return `${days}d ago`
  return new Date(date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}

export default function ProjectGrid({ projects }: { projects: Project[] }) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
      {projects.map((project, i) => {
        const accent = ACCENT_SETS[i % ACCENT_SETS.length]
        const hasAI = project._count.testCases > 0
        const monogram = project.name.charAt(0).toUpperCase()

        return (
          <Link key={project.id} href={`/project/${project.id}`} className="group block focus-visible:outline-none">
            <div
              className="h-full flex flex-col rounded-xl overflow-hidden card-hover"
              style={{
                background: 'var(--surface-0)',
                border: '1px solid var(--border)',
                boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
              }}
            >
              {/* Accent top bar */}
              <div
                className="h-1.5 w-full shrink-0"
                style={{
                  background: `linear-gradient(90deg, ${accent.bar}, ${accent.bar}88)`,
                  boxShadow: `0 0 8px ${accent.glow}`,
                }}
              />

              <div className="flex flex-col flex-1 p-5">
                <div className="flex items-start gap-3 flex-1">
                  {/* Monogram avatar */}
                  <div
                    className="h-9 w-9 rounded-lg flex items-center justify-center shrink-0 text-[13px] font-bold"
                    style={{
                      background: accent.monoBg,
                      color: accent.monoText,
                      border: `1px solid ${accent.bar}30`,
                    }}
                  >
                    {monogram}
                  </div>

                  <div className="flex-1 min-w-0">
                    <h3
                      className="font-semibold text-[15px] leading-snug truncate transition-colors group-hover:text-zinc-700 dark:group-hover:text-zinc-300"
                      style={{ color: 'var(--text-primary)' }}
                    >
                      {project.name}
                    </h3>
                    {project.description ? (
                      <p
                        className="text-[13px] mt-1 line-clamp-2 leading-relaxed"
                        style={{ color: 'var(--text-secondary)' }}
                      >
                        {project.description}
                      </p>
                    ) : (
                      <p className="text-[12px] mt-1 italic" style={{ color: 'var(--text-tertiary)' }}>
                        No description
                      </p>
                    )}
                  </div>
                </div>

                {/* Stats row */}
                <div
                  className="mt-4 pt-3.5 flex items-center justify-between"
                  style={{ borderTop: '1px solid var(--border)' }}
                >
                  <div className="flex items-center gap-3">
                    <span className="flex flex-col items-center gap-0.5">
                      <span className="flex items-center gap-1 text-[12px] font-semibold" style={{ color: 'var(--text-primary)' }}>
                        <FlaskConical className="h-3 w-3 text-emerald-500 dark:text-emerald-400" />
                        {project._count.testCases}
                      </span>
                      <span className="text-[10px]" style={{ color: 'var(--text-tertiary)' }}>Tests</span>
                    </span>
                    <span className="flex flex-col items-center gap-0.5">
                      <span className="flex items-center gap-1 text-[12px] font-semibold" style={{ color: 'var(--text-primary)' }}>
                        <Bug className="h-3 w-3 text-rose-400" />
                        {project._count.bugReports}
                      </span>
                      <span className="text-[10px]" style={{ color: 'var(--text-tertiary)' }}>Bugs</span>
                    </span>
                    <span className="flex flex-col items-center gap-0.5">
                      <span className="flex items-center gap-1 text-[12px] font-semibold" style={{ color: 'var(--text-primary)' }}>
                        <Layers className="h-3 w-3 text-zinc-400" />
                        {project._count.regressionSuites}
                      </span>
                      <span className="text-[10px]" style={{ color: 'var(--text-tertiary)' }}>Suites</span>
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    {hasAI && (
                      <span
                        className="flex items-center gap-1 text-[10px] font-semibold px-1.5 py-0.5 rounded-md"
                        style={{
                          background: accent.monoBg,
                          color: accent.monoText,
                          border: `1px solid ${accent.bar}30`,
                        }}
                      >
                        <Sparkles className="h-2.5 w-2.5" />
                        AI
                      </span>
                    )}
                    <span className="text-[11px]" style={{ color: 'var(--text-tertiary)' }}>
                      {timeAgo(project.updatedAt)}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </Link>
        )
      })}

      {/* Add new project tile */}
      <CreateProjectDialog trigger={
        <button
          className="group rounded-xl flex flex-col items-center justify-center gap-3 min-h-[155px] transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-900"
          style={{
            border: '2px dashed var(--border)',
            background: 'transparent',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.borderColor = 'rgba(59,130,246,0.4)'
            e.currentTarget.style.background = 'rgba(59,130,246,0.04)'
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.borderColor = 'var(--border)'
            e.currentTarget.style.background = 'transparent'
          }}
        >
          <div
            className="h-10 w-10 rounded-xl flex items-center justify-center transition-transform group-hover:scale-110"
            style={{ background: 'rgba(59,130,246,0.1)', border: '1px solid rgba(59,130,246,0.2)' }}
          >
            <Plus className="h-5 w-5" style={{ color: '#60a5fa' }} />
          </div>
          <div className="text-center">
            <span className="block text-sm font-semibold" style={{ color: '#60a5fa' }}>
              New project
            </span>
            <span className="block text-[11px] mt-0.5" style={{ color: 'var(--text-tertiary)' }}>
              Click to create
            </span>
          </div>
        </button>
      } />
    </div>
  )
}
