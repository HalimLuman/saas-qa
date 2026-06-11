'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Play } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { toast } from 'sonner'

export default function StartRunButton({ suiteId, projectId }: { suiteId: string; projectId: string }) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)

  async function start() {
    setLoading(true)
    try {
      const res = await fetch(`/api/suites/${suiteId}/runs`, { method: 'POST' })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      toast.success('Run started')
      router.push(`/project/${projectId}/suites/${suiteId}/run/${data.run.id}`)
    } catch (err) {
      toast.error('Failed to start run', { description: String(err) })
      setLoading(false)
    }
  }

  return (
    <Button onClick={start} disabled={loading} size="sm">
      <Play className="h-3.5 w-3.5" />
      {loading ? 'Starting…' : 'Start Run'}
    </Button>
  )
}
