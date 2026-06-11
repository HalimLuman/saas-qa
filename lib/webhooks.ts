import crypto from 'node:crypto'
import { db } from '@/lib/db'

export type WebhookEvent =
  | 'run.completed'
  | 'run.failed'
  | 'bug.created'
  | 'bug.status_changed'

export interface WebhookPayload {
  event: WebhookEvent
  projectId: string
  timestamp: string
  data: Record<string, unknown>
}

export async function dispatchWebhooks(projectId: string, event: WebhookEvent, data: Record<string, unknown>) {
  const webhooks = await db.webhookIntegration.findMany({
    where: { projectId, isActive: true },
  })

  const payload: WebhookPayload = {
    event,
    projectId,
    timestamp: new Date().toISOString(),
    data,
  }
  const body = JSON.stringify(payload)

  await Promise.allSettled(
    webhooks
      .filter((wh) => {
        try { return (JSON.parse(wh.events) as string[]).includes(event) }
        catch { return false }
      })
      .map(async (wh) => {
        const headers: Record<string, string> = { 'Content-Type': 'application/json' }

        if (wh.headers) {
          try { Object.assign(headers, JSON.parse(wh.headers)) } catch { /* ignore */ }
        }

        if (wh.secret) {
          const sig = crypto.createHmac('sha256', wh.secret).update(body).digest('hex')
          headers['X-softAssert-Signature'] = `sha256=${sig}`
        }

        // Slack / Discord use a different payload shape
        let sendBody = body
        if (wh.platform === 'SLACK' || wh.platform === 'DISCORD') {
          const summary = buildSlackMessage(event, data)
          sendBody = JSON.stringify(wh.platform === 'DISCORD' ? { content: summary } : { text: summary })
        }

        await fetch(wh.url, { method: 'POST', headers, body: sendBody })
      })
  )
}

function buildSlackMessage(event: WebhookEvent, data: Record<string, unknown>): string {
  switch (event) {
    case 'run.completed':
      return `softAssert run completed — ${data.passed ?? 0} passed, ${data.failed ?? 0} failed, ${data.blocked ?? 0} blocked (${data.suiteName ?? ''})`
    case 'run.failed':
      return `softAssert run FAILED — ${data.failed ?? 0} failures in suite "${data.suiteName ?? ''}"`
    case 'bug.created':
      return `New bug filed: [${data.severity ?? 'MEDIUM'}] ${data.title ?? ''}`
    case 'bug.status_changed':
      return `Bug "${data.title ?? ''}" changed from ${data.oldStatus} → ${data.newStatus}`
    default:
      return `softAssert event: ${event}`
  }
}
