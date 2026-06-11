import { SkeletonStatCard } from '@/components/ui/skeleton'

export default function DashboardLoading() {
  return (
    <div className="space-y-8">
      <div>
        <div className="h-8 w-48 rounded-lg bg-white/60 animate-pulse mb-1" />
        <div className="h-4 w-64 rounded bg-white/40 animate-pulse" />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {[0, 1, 2].map((i) => (
          <SkeletonStatCard key={i} />
        ))}
      </div>

      <div>
        <div className="h-6 w-32 rounded bg-white/50 animate-pulse mb-4" />
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {[0, 1, 2, 3].map((i) => (
            <div key={i} className="rounded-xl border border-white/30 bg-white/40 p-5 space-y-3 animate-pulse">
              <div className="h-5 w-3/4 rounded bg-white/60" />
              <div className="h-3 w-1/2 rounded bg-white/40" />
              <div className="flex gap-2 pt-2">
                <div className="h-6 w-16 rounded-full bg-white/50" />
                <div className="h-6 w-20 rounded-full bg-white/50" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
