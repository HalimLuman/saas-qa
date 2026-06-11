export default function ProjectLoading() {
  return (
    <div className="animate-fade-in">

      {/* Back link skeleton */}
      <div className="h-4 w-24 rounded skeleton mb-5" />

      {/* Hero card skeleton */}
      <div
        className="relative overflow-hidden rounded-2xl mb-5"
        style={{ background: 'var(--surface-0)', border: '1px solid var(--border)' }}
      >
        {/* Accent stripe */}
        <div className="h-[3px] rounded-t-2xl skeleton" />

        <div className="px-6 pt-7 pb-5">
          {/* Identity row */}
          <div className="flex items-center gap-4 mb-5">
            <div className="h-12 w-12 rounded-xl skeleton shrink-0" />
            <div className="flex-1 min-w-0">
              <div className="h-6 w-48 rounded-lg skeleton mb-2" />
              <div className="h-4 w-72 rounded skeleton" />
            </div>
          </div>

          {/* Stat tiles skeleton */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
            {[0, 1, 2, 3].map((i) => (
              <div
                key={i}
                className="rounded-xl px-4 py-3 flex items-center gap-3"
                style={{ background: 'var(--surface-1)', border: '1px solid var(--border)' }}
              >
                <div className="h-8 w-8 rounded-lg skeleton shrink-0" />
                <div>
                  <div className="h-5 w-8 rounded skeleton mb-1.5" />
                  <div className="h-3 w-16 rounded skeleton" />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Areas skeleton */}
      <div className="flex items-center gap-2 mb-5 flex-wrap">
        <div className="h-4 w-10 rounded skeleton" />
        {[60, 80, 72].map((w, i) => (
          <div key={i} className="h-7 rounded-full skeleton" style={{ width: `${w}px` }} />
        ))}
      </div>

      {/* Tabs card skeleton */}
      <div
        className="rounded-2xl overflow-hidden"
        style={{ background: 'var(--surface-0)', border: '1px solid var(--border)' }}
      >
        {/* Tab bar */}
        <div
          className="flex items-center gap-1 h-11 px-4"
          style={{ borderBottom: '1px solid var(--border)' }}
        >
          {[64, 52, 48, 36].map((w, i) => (
            <div key={i} className="h-4 rounded skeleton mx-2" style={{ width: `${w}px` }} />
          ))}
        </div>

        {/* Content rows */}
        <div className="p-5 space-y-3">
          {[0, 1, 2, 3, 4, 5].map((i) => (
            <div
              key={i}
              className="rounded-xl h-12 skeleton"
              style={{ opacity: 1 - i * 0.1 }}
            />
          ))}
        </div>
      </div>

    </div>
  )
}
