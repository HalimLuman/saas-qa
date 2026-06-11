'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Bug, Layers, Webhook } from 'lucide-react'
import { Button } from '@/components/ui/button'
import WebhooksDialog from './webhooks-dialog'

interface Props {
  projectId: string
  approvedTests: number
}

export default function ProjectQuickActions({ projectId, approvedTests }: Props) {
  const [webhooksOpen, setWebhooksOpen] = useState(false)

  return (
    <>
      <WebhooksDialog open={webhooksOpen} onOpenChange={setWebhooksOpen} projectId={projectId} />

      <div className="flex items-center gap-2 flex-wrap shrink-0">
        <Link href={`/project/${projectId}/bugs/new`}>
          <Button
            variant="outline"
            size="sm"
            className="gap-1.5 h-8 text-xs text-red-600 border-red-200 hover:bg-red-50 hover:border-red-300 dark:border-red-900 dark:hover:bg-red-950/30"
          >
            <Bug className="h-3.5 w-3.5" />
            Report Bug
          </Button>
        </Link>

        <Link href={`/project/${projectId}/suites/new`}>
          <Button
            variant="outline"
            size="sm"
            className="gap-1.5 h-8 text-xs text-indigo-600 border-indigo-200 hover:bg-indigo-50 hover:border-indigo-300 dark:border-indigo-900 dark:hover:bg-indigo-950/30"
          >
            <Layers className="h-3.5 w-3.5" />
            New Suite
          </Button>
        </Link>

        <Button
          variant="outline"
          size="sm"
          className="gap-1.5 h-8 text-xs text-teal-600 border-teal-200 hover:bg-teal-50 hover:border-teal-300 dark:border-teal-900 dark:hover:bg-teal-950/30"
          onClick={() => setWebhooksOpen(true)}
        >
          <Webhook className="h-3.5 w-3.5" />
          Webhooks
        </Button>

        {approvedTests > 0 && (
          <span
            className="text-[11px] font-medium px-2 py-1 rounded-md"
            style={{
              background: 'rgba(34,197,94,0.08)',
              color: '#16a34a',
              border: '1px solid rgba(34,197,94,0.15)',
            }}
          >
            {approvedTests} approved
          </span>
        )}
      </div>
    </>
  )
}
