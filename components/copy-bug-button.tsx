'use client'

import { useState } from 'react'
import { Copy, Check, ChevronDown } from 'lucide-react'
import { Button } from '@/components/ui/button'

type Format = 'markdown' | 'jira' | 'linear' | 'github'

interface BugData {
  sequenceNum: number
  title: string
  description: string
  severity: string
  status: string
  steps: string[]
  expectedBehavior?: string | null
  actualBehavior?: string | null
}

function formatBug(bug: BugData, fmt: Format): string {
  const id = `BUG-${String(bug.sequenceNum).padStart(4, '0')}`
  const stepsText = bug.steps.map((s, i) => `${i + 1}. ${s}`).join('\n')

  if (fmt === 'jira') {
    return [
      `h2. ${bug.title}`,
      `*ID:* ${id}  |  *Severity:* ${bug.severity}  |  *Status:* ${bug.status}`,
      '',
      `*Description:*`,
      bug.description,
      '',
      `*Steps to Reproduce:*`,
      bug.steps.map((s, i) => `${i + 1}. ${s}`).join('\n'),
      '',
      bug.expectedBehavior ? `*Expected:* ${bug.expectedBehavior}` : '',
      bug.actualBehavior ? `*Actual:* {color:red}${bug.actualBehavior}{color}` : '',
    ].filter(l => l !== undefined).join('\n').trim()
  }

  if (fmt === 'linear') {
    return [
      `## ${bug.title}`,
      `**${id}** · Severity: ${bug.severity} · ${bug.status}`,
      '',
      bug.description,
      '',
      '**Steps to Reproduce**',
      stepsText,
      '',
      bug.expectedBehavior ? `**Expected:** ${bug.expectedBehavior}` : '',
      bug.actualBehavior ? `**Actual:** ${bug.actualBehavior}` : '',
    ].filter(l => l !== undefined).join('\n').trim()
  }

  if (fmt === 'github') {
    return [
      `## Bug Report: ${bug.title}`,
      '',
      `**${id}** | Severity: \`${bug.severity}\` | Status: \`${bug.status}\``,
      '',
      '### Description',
      bug.description,
      '',
      '### Steps to Reproduce',
      stepsText,
      '',
      bug.expectedBehavior ? `### Expected Behavior\n${bug.expectedBehavior}` : '',
      bug.actualBehavior ? `### Actual Behavior\n${bug.actualBehavior}` : '',
    ].filter(l => l !== undefined).join('\n').trim()
  }

  // markdown (default)
  return [
    `## ${bug.title}`,
    '',
    `**ID:** ${id}  `,
    `**Severity:** ${bug.severity}  `,
    `**Status:** ${bug.status}`,
    '',
    '**Description:**',
    bug.description,
    '',
    '**Steps to Reproduce:**',
    stepsText,
    '',
    bug.expectedBehavior ? `**Expected:** ${bug.expectedBehavior}` : '',
    bug.actualBehavior ? `**Actual:** ${bug.actualBehavior}` : '',
  ].filter(l => l !== undefined).join('\n').trim()
}

const FORMAT_LABELS: Record<Format, string> = {
  markdown: 'Markdown',
  jira: 'Jira',
  linear: 'Linear',
  github: 'GitHub',
}

export default function CopyBugButton({ bug }: { bug: BugData }) {
  const [copied, setCopied] = useState(false)
  const [fmt, setFmt] = useState<Format>('markdown')
  const [open, setOpen] = useState(false)

  function copy() {
    navigator.clipboard.writeText(formatBug(bug, fmt))
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className="flex items-center gap-0">
      <Button
        variant="outline"
        size="sm"
        onClick={copy}
        className="rounded-r-none border-r-0"
      >
        {copied ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
        {copied ? 'Copied!' : `Copy ${FORMAT_LABELS[fmt]}`}
      </Button>
      <div className="relative">
        <Button
          variant="outline"
          size="sm"
          onClick={() => setOpen((o) => !o)}
          className="rounded-l-none px-2"
          aria-label="Choose copy format"
        >
          <ChevronDown className="h-3.5 w-3.5" />
        </Button>
        {open && (
          <div
            className="absolute right-0 top-full mt-1 z-50 rounded-lg border bg-white shadow-lg py-1 min-w-[120px]"
            style={{ border: '1px solid #e2e8f0' }}
          >
            {(Object.keys(FORMAT_LABELS) as Format[]).map((f) => (
              <button
                key={f}
                onClick={() => { setFmt(f); setOpen(false) }}
                className={`w-full text-left px-3 py-1.5 text-sm hover:bg-slate-50 transition-colors ${fmt === f ? 'font-semibold text-zinc-800' : 'text-slate-700'}`}
              >
                {FORMAT_LABELS[f]}
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
