import { SkeletonCard } from '@/components/ui/skeleton'

export default function GenerateLoading() {
  return (
    <div className="space-y-6 max-w-3xl">
      <div>
        <div className="h-7 w-48 rounded-lg bg-white/60 animate-pulse mb-1" />
        <div className="h-4 w-72 rounded bg-white/40 animate-pulse" />
      </div>
      <div className="rounded-xl border border-white/30 bg-white/40 p-5 space-y-4 animate-pulse">
        <div className="h-4 w-36 rounded bg-white/50" />
        <div className="h-32 rounded-lg bg-white/50" />
        <div className="h-9 w-40 rounded-lg bg-white/50" />
      </div>
      <div className="grid gap-4">
        {[0, 1, 2].map((i) => <SkeletonCard key={i} />)}
      </div>
    </div>
  )
}
