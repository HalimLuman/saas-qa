import { SkeletonTableBody } from '@/components/ui/skeleton'

export default function BugsLoading() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="h-7 w-40 rounded-lg bg-white/60 animate-pulse" />
        <div className="h-9 w-28 rounded-lg bg-white/50 animate-pulse" />
      </div>
      <div className="rounded-xl border border-white/30 bg-white/40 overflow-hidden">
        <div className="h-10 bg-white/30 animate-pulse border-b border-white/20" />
        <SkeletonTableBody rows={6} />
      </div>
    </div>
  )
}
