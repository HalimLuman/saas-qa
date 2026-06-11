'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { Plus, Sparkles, Video } from 'lucide-react'
import { Button } from '@/components/ui/button'
import TestCaseFormDialog, { type TestCaseData } from './test-case-form-dialog'
import VideoCaptureDialog from './video-capture-dialog'

interface Props {
  projectId: string
  areaId?: string
}

export default function TestsTabActions({ projectId, areaId }: Props) {
  const [manualOpen, setManualOpen] = useState(false)
  const [videoOpen, setVideoOpen] = useState(false)
  const [fromRecording, setFromRecording] = useState<Partial<TestCaseData> | null>(null)
  const [areas, setAreas] = useState<{ id: string; name: string; color: string }[]>([])

  useEffect(() => {
    fetch(`/api/projects/${projectId}/areas`)
      .then((r) => r.ok ? r.json() : { areas: [] })
      .then((d) => setAreas(d.areas ?? []))
  }, [projectId])

  function handleRecordingResult(testCase: Partial<TestCaseData>) {
    setFromRecording(testCase)
    setManualOpen(true)
  }

  return (
    <>
      <div className="flex items-center gap-2">
        <Button
          variant="outline"
          size="sm"
          className="gap-1.5"
          onClick={() => setVideoOpen(true)}
        >
          <Video className="h-3.5 w-3.5" />
          Record
        </Button>
        <Button
          variant="outline"
          size="sm"
          className="gap-1.5"
          onClick={() => { setFromRecording(null); setManualOpen(true) }}
        >
          <Plus className="h-3.5 w-3.5" />
          Manual
        </Button>
        <Link href={`/project/${projectId}/generate`}>
          <Button size="sm" className="gap-1.5">
            <Sparkles className="h-3.5 w-3.5" />
            Generate
          </Button>
        </Link>
      </div>

      <TestCaseFormDialog
        open={manualOpen}
        onOpenChange={setManualOpen}
        mode="create"
        projectId={projectId}
        areaId={areaId}
        areas={areas}
        initial={fromRecording ?? undefined}
      />

      <VideoCaptureDialog
        open={videoOpen}
        onOpenChange={setVideoOpen}
        projectId={projectId}
        onResult={handleRecordingResult}
      />
    </>
  )
}
