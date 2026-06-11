import { cn } from '@/lib/utils'

function Skeleton({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn('skeleton', className)}
      {...props}
    />
  )
}

function SkeletonCard({ className }: { className?: string }) {
  return (
    <div
      className={cn('rounded-2xl p-5 space-y-3', className)}
      style={{
        background: 'rgba(255,255,255,0.65)',
        border: '1px solid rgba(100,116,139,0.12)',
      }}
    >
      <div className="flex items-center gap-3">
        <Skeleton className="h-9 w-9 rounded-xl" />
        <div className="flex-1 space-y-1.5">
          <Skeleton className="h-4 w-2/3 rounded-md" />
          <Skeleton className="h-3 w-1/3 rounded-md" />
        </div>
        <Skeleton className="h-5 w-12 rounded-full" />
      </div>
      <Skeleton className="h-3 w-full rounded-md" />
      <Skeleton className="h-3 w-4/5 rounded-md" />
    </div>
  )
}

function SkeletonRow({ className }: { className?: string }) {
  return (
    <div className={cn('flex items-center gap-3 px-4 py-3', className)}>
      <Skeleton className="h-4 w-4 rounded" />
      <Skeleton className="h-4 flex-1 rounded-md" />
      <Skeleton className="h-5 w-16 rounded-full" />
      <Skeleton className="h-5 w-14 rounded-full" />
      <Skeleton className="h-4 w-20 rounded-md" />
    </div>
  )
}

function SkeletonTableBody({ rows = 5 }: { rows?: number }) {
  return (
    <div className="divide-y" style={{ borderColor: 'var(--border-subtle)' }}>
      {Array.from({ length: rows }).map((_, i) => (
        <SkeletonRow key={i} />
      ))}
    </div>
  )
}

function SkeletonStatCard() {
  return (
    <div
      className="rounded-2xl p-5 flex items-center gap-4"
      style={{
        background: 'rgba(255,255,255,0.6)',
        border: '1px solid rgba(100,116,139,0.12)',
      }}
    >
      <Skeleton className="h-12 w-12 rounded-2xl" />
      <div className="space-y-2">
        <Skeleton className="h-7 w-12 rounded-md" />
        <Skeleton className="h-3 w-20 rounded-md" />
      </div>
    </div>
  )
}

export { Skeleton, SkeletonCard, SkeletonRow, SkeletonTableBody, SkeletonStatCard }
