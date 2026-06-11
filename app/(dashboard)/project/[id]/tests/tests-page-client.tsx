'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { Play, Sparkles } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useTopbarActions } from '@/components/topbar-actions-provider'
import TestCaseList from '@/components/test-case-list'

interface TestCase {
  id: string
  displayNum: number
  title: string
  module: string | null
  areaId: string | null
  areaName: string | null
  areaColor: string | null
  preconditions: string | null
  steps: string
  expectedResult: string
  priority: string
  category: string
  status: string
  updatedAt: string
  createdAt: string
}

interface Area { id: string; name: string; color: string }
interface Suite { id: string; name: string }

interface Props {
  projectId: string
  projectName: string
  testCases: TestCase[]
  areas: Area[]
  suites: Suite[]
  ownerInitials: string
  ownerName: string
}

export default function TestsPageClient({
  projectId,
  projectName,
  testCases,
  areas,
  suites,
  ownerInitials,
  ownerName,
}: Props) {
  const { setActions } = useTopbarActions()
  const [execMode, setExecMode] = useState(false)

  useEffect(() => {
    setActions(
      <div className="flex items-center gap-2">
        <Link href={`/project/${projectId}/suites`}>
          <Button variant="outline" size="sm" className="gap-1.5">
            <Play className="h-3.5 w-3.5" />
            Run suite
          </Button>
        </Link>
        <Link href={`/project/${projectId}/generate`}>
          <Button size="sm" className="gap-1.5">
            <Sparkles className="h-3.5 w-3.5" />
            Generate tests
          </Button>
        </Link>
      </div>
    )
    return () => setActions(null)
  }, [projectId, setActions])

  return (
    <div className="animate-fade-up space-y-5">
      {/* Page header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <p
            className="text-[11px] font-bold uppercase tracking-widest mb-1"
            style={{ color: 'var(--text-tertiary)' }}
          >
            {projectName}
          </p>
          <h1
            className="text-[22px] font-bold leading-tight"
            style={{ color: 'var(--text-primary)', letterSpacing: '-0.025em' }}
          >
            Test cases
            <span className="font-normal ml-2 text-lg" style={{ color: 'var(--text-tertiary)' }}>
              · {testCases.length}
            </span>
          </h1>
          <p className="text-sm mt-1" style={{ color: 'var(--text-secondary)' }}>
            Curated suite of regression cases. Toggle execution mode to record pass/fail inline.
          </p>
        </div>

        {!execMode && (
          <button
            onClick={() => setExecMode(true)}
            className="flex items-center gap-1.5 h-9 px-4 rounded-lg text-sm font-semibold text-white shrink-0 transition-all"
            style={{
              background: 'linear-gradient(135deg, #2563eb, #1d4ed8)',
              boxShadow: '0 2px 8px rgba(37,99,235,0.28)',
            }}
          >
            <Play className="h-3.5 w-3.5" />
            Execution mode
          </button>
        )}
      </div>

      <TestCaseList
        testCases={testCases}
        projectId={projectId}
        areas={areas}
        suites={suites}
        ownerInitials={ownerInitials}
        ownerName={ownerName}
        execMode={execMode}
        onEndExec={() => setExecMode(false)}
      />
    </div>
  )
}
