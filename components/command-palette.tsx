'use client'

import { useEffect, useState, useRef, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { Search, FlaskConical, Bug, Layers, X } from 'lucide-react'

interface SearchResult {
  id: string
  title: string
  subtitle: string
  href: string
  type: 'test' | 'bug' | 'suite'
}

interface SearchResults {
  testCases: SearchResult[]
  bugs: SearchResult[]
  suites: SearchResult[]
}

const TYPE_ICONS = {
  test: <FlaskConical className="h-3.5 w-3.5 text-zinc-700" />,
  bug: <Bug className="h-3.5 w-3.5 text-rose-500" />,
  suite: <Layers className="h-3.5 w-3.5 text-blue-500" />,
}

const TYPE_LABELS = { test: 'Test Cases', bug: 'Bug Reports', suite: 'Suites' }

export default function CommandPalette() {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<SearchResults | null>(null)
  const [loading, setLoading] = useState(false)
  const [activeIdx, setActiveIdx] = useState(0)
  const inputRef = useRef<HTMLInputElement>(null)
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  // Open on ⌘K / Ctrl+K
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault()
        setOpen((o) => !o)
      }
      if (e.key === 'Escape') setOpen(false)
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [])

  useEffect(() => {
    if (open) setTimeout(() => inputRef.current?.focus(), 50)
    else { setQuery(''); setResults(null) }
  }, [open])

  const search = useCallback(async (q: string) => {
    if (q.length < 2) { setResults(null); return }
    setLoading(true)
    try {
      const res = await fetch(`/api/search?q=${encodeURIComponent(q)}`)
      const data = await res.json()
      setResults(data.results)
      setActiveIdx(0)
    } finally {
      setLoading(false)
    }
  }, [])

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    const q = e.target.value
    setQuery(q)
    if (debounceRef.current) clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(() => search(q), 220)
  }

  const flatResults: SearchResult[] = results
    ? [...results.testCases, ...results.bugs, ...results.suites]
    : []

  function navigate(href: string) {
    router.push(href)
    setOpen(false)
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === 'ArrowDown') { e.preventDefault(); setActiveIdx((i) => Math.min(i + 1, flatResults.length - 1)) }
    if (e.key === 'ArrowUp') { e.preventDefault(); setActiveIdx((i) => Math.max(i - 1, 0)) }
    if (e.key === 'Enter' && flatResults[activeIdx]) navigate(flatResults[activeIdx].href)
  }

  if (!open) return null

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center pt-[12vh]"
      style={{ background: 'rgba(0,0,0,0.45)', backdropFilter: 'blur(4px)' }}
      onClick={(e) => { if (e.target === e.currentTarget) setOpen(false) }}
    >
      <div
        className="w-full max-w-xl rounded-2xl overflow-hidden shadow-2xl"
        style={{ background: '#fff', border: '1px solid #e2e8f0' }}
      >
        {/* Input */}
        <div className="flex items-center gap-3 px-4 py-3.5 border-b border-slate-100">
          <Search className="h-4 w-4 text-slate-400 shrink-0" />
          <input
            ref={inputRef}
            value={query}
            onChange={handleChange}
            onKeyDown={handleKeyDown}
            placeholder="Search test cases, bugs, suites…"
            className="flex-1 text-sm text-slate-800 placeholder-slate-400 outline-none bg-transparent"
          />
          {loading && <div className="h-4 w-4 border-2 border-zinc-400 border-t-transparent rounded-full animate-spin shrink-0" />}
          <button onClick={() => setOpen(false)} className="text-slate-400 hover:text-slate-600">
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Results */}
        <div className="max-h-[420px] overflow-y-auto">
          {!results && !loading && (
            <p className="text-center text-sm text-slate-400 py-10">Type to search across all your projects</p>
          )}
          {results && flatResults.length === 0 && (
            <p className="text-center text-sm text-slate-400 py-10">No results for &ldquo;{query}&rdquo;</p>
          )}
          {results && (['testCases', 'bugs', 'suites'] as const).map((key) => {
            const group = results[key]
            if (!group.length) return null
            return (
              <div key={key} className="px-2 pt-2 pb-1">
                <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wide px-2 mb-1">
                  {TYPE_LABELS[key === 'testCases' ? 'test' : key === 'bugs' ? 'bug' : 'suite']}
                </p>
                {group.map((item) => {
                  const globalIdx = flatResults.indexOf(item)
                  return (
                    <button
                      key={item.id}
                      onClick={() => navigate(item.href)}
                      onMouseEnter={() => setActiveIdx(globalIdx)}
                      className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-left transition-colors ${globalIdx === activeIdx ? 'bg-zinc-50' : 'hover:bg-slate-50'}`}
                    >
                      <span className="shrink-0">{TYPE_ICONS[item.type]}</span>
                      <span className="flex-1 min-w-0">
                        <span className="block text-sm font-medium text-slate-800 truncate">{item.title}</span>
                        <span className="block text-xs text-slate-400 truncate">{item.subtitle}</span>
                      </span>
                    </button>
                  )
                })}
              </div>
            )
          })}
        </div>

        <div className="px-4 py-2.5 border-t border-slate-100 flex items-center gap-4 text-[11px] text-slate-400">
          <span><kbd className="bg-slate-100 px-1 rounded">↑↓</kbd> navigate</span>
          <span><kbd className="bg-slate-100 px-1 rounded">↵</kbd> open</span>
          <span><kbd className="bg-slate-100 px-1 rounded">Esc</kbd> close</span>
        </div>
      </div>
    </div>
  )
}
