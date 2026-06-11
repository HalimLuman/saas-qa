'use client'

import { useEffect } from 'react'
import Link from 'next/link'
import { Sparkles } from 'lucide-react'
import { useTopbarActions } from '@/components/topbar-actions-provider'

export default function ProjectOverviewActions({ projectId }: { projectId: string }) {
  const { setActions } = useTopbarActions()

  useEffect(() => {
    setActions(
      <Link
        href={`/project/${projectId}/generate`}
        className="inline-flex items-center gap-2 text-sm font-semibold px-4 py-2 rounded-xl transition-all active:scale-[0.97]"
        style={{
          background: 'linear-gradient(135deg, #1d4ed8, #1e3a8a)',
          color: 'white',
          boxShadow: '0 4px 14px rgba(29,78,216,0.3)',
        }}
      >
        <Sparkles className="h-3.5 w-3.5" />
        Generate tests
      </Link>
    )
    return () => setActions(null)
  }, [projectId, setActions])

  return null
}
