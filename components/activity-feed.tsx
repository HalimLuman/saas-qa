import { FlaskConical, Bug, Sparkles, Clock } from 'lucide-react'
import { formatDate } from '@/lib/utils'

interface ActivityEvent {
  id: string
  action: string
  targetType: string
  metadata: Record<string, unknown>
  createdAt: Date
  user: { name: string | null; email: string }
}

const ACTION_CONFIG: Record<string, { label: (m: Record<string, unknown>) => string; icon: React.ReactNode; color: string }> = {
  'test_case.batch_created': {
    label: (m) => `Saved ${m.count ?? ''} test case${Number(m.count) !== 1 ? 's' : ''}`,
    icon: <FlaskConical className="h-3.5 w-3.5" />,
    color: '#10b981',
  },
  'bug.created': {
    label: (m) => `Reported bug: ${m.title ?? ''}`,
    icon: <Bug className="h-3.5 w-3.5" />,
    color: '#ef4444',
  },
  'ai.generated': {
    label: (m) => `Generated ${m.count ?? ''} test cases`,
    icon: <Sparkles className="h-3.5 w-3.5" />,
    color: '#f59e0b',
  },
}

function getConfig(action: string) {
  return ACTION_CONFIG[action] ?? {
    label: () => action.replace(/_/g, ' ').replace('.', ' — '),
    icon: <Clock className="h-3.5 w-3.5" />,
    color: '#94a3b8',
  }
}

export default function ActivityFeed({ events }: { events: ActivityEvent[] }) {
  return (
    <div
      className="rounded-2xl overflow-hidden"
      style={{
        background: 'var(--surface-0)',
        border: '1px solid var(--border)',
        boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
      }}
    >
      {/* Card header */}
      <div
        className="flex items-center gap-3 px-5 py-3.5"
        style={{ borderBottom: '1px solid var(--border)' }}
      >
        <div
          className="h-7 w-7 rounded-lg flex items-center justify-center shrink-0"
          style={{ background: 'var(--surface-2)' }}
        >
          <Clock className="h-3.5 w-3.5" style={{ color: 'var(--text-secondary)' }} />
        </div>
        <h2 className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>
          Recent Activity
        </h2>
        <span
          className="text-[11px] font-semibold px-1.5 py-0.5 rounded-full tabular-nums"
          style={{ background: 'var(--surface-2)', color: 'var(--text-tertiary)' }}
        >
          {events.length}
        </span>
      </div>

      {/* Timeline */}
      <div className="px-5 py-4">
        <div className="relative">
          {/* Vertical connector line */}
          <div
            className="absolute top-3.5 bottom-3.5 w-px"
            style={{ left: '13px', background: 'var(--border)' }}
          />

          <div className="space-y-0.5">
            {events.map((e) => {
              const cfg = getConfig(e.action)
              const displayName = e.user.name || e.user.email.split('@')[0]

              return (
                <div key={e.id} className="group flex items-start gap-4 py-2.5">
                  {/* Icon bubble (sits on the timeline line) */}
                  <div
                    className="relative z-10 h-7 w-7 rounded-full flex items-center justify-center shrink-0 transition-all duration-150 group-hover:scale-110"
                    style={{
                      background: `${cfg.color}18`,
                      color: cfg.color,
                      border: `1.5px solid ${cfg.color}30`,
                    }}
                  >
                    {cfg.icon}
                  </div>

                  {/* Event content */}
                  <div
                    className="flex-1 min-w-0 rounded-xl px-3 py-2.5 transition-colors hover:bg-slate-50 dark:hover:bg-zinc-800/50"
                  >
                    <p className="text-sm leading-snug font-medium" style={{ color: 'var(--text-primary)' }}>
                      {cfg.label(e.metadata)}
                    </p>
                    <div className="flex items-center gap-1.5 mt-1">
                      <span className="text-[11px]" style={{ color: 'var(--text-tertiary)' }}>
                        {displayName}
                      </span>
                      <span className="text-[11px]" style={{ color: 'var(--border)' }}>·</span>
                      <span className="text-[11px]" style={{ color: 'var(--text-tertiary)' }}>
                        {formatDate(e.createdAt)}
                      </span>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      </div>
    </div>
  )
}
