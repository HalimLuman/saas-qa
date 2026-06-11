import { NextRequest } from 'next/server'
import { auth } from '@/lib/auth'
import { db } from '@/lib/db'
import { executeTestCase } from '@/lib/automation/executor'

// Run up to 3 test cases concurrently for speed
const CONCURRENCY = 3

function enc(obj: object) {
  return `data: ${JSON.stringify(obj)}\n\n`
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; runId: string }> }
) {
  const session = await auth()
  if (!session?.user?.id) return Response.json({ error: 'Unauthorized' }, { status: 401 })

  const { id: suiteId, runId } = await params
  const { targetUrl } = (await request.json()) as { targetUrl: string }

  if (!targetUrl?.trim()) {
    return Response.json({ error: 'targetUrl is required' }, { status: 400 })
  }

  const run = await db.suiteRun.findFirst({
    where: {
      id: runId,
      suite: { id: suiteId, project: { userId: session.user.id } },
    },
    include: {
      results: {
        where: { result: 'NOT_RUN' },
        include: {
          testCase: {
            select: { id: true, title: true, preconditions: true, steps: true, expectedResult: true },
          },
        },
        orderBy: { testCase: { title: 'asc' } },
      },
    },
  })

  if (!run) return Response.json({ error: 'Not found' }, { status: 404 })

  const stream = new ReadableStream({
    async start(controller) {
      const send = (obj: object) => controller.enqueue(new TextEncoder().encode(enc(obj)))

      let browser: import('playwright').Browser | null = null

      try {
        send({ type: 'start', total: run.results.length, targetUrl })

        if (run.results.length === 0) {
          send({ type: 'complete', passed: 0, failed: 0, message: 'No NOT_RUN cases to automate.' })
          controller.close()
          return
        }

        const { chromium } = await import('playwright')
        // headless: true is faster and uses less memory than visible browser
        browser = await chromium.launch({ headless: true })

        let passed = 0
        let failed = 0

        async function runTest(row: NonNullable<typeof run>['results'][number]) {
          const tc = row.testCase
          send({ type: 'test_begin', testCaseId: tc.id, title: tc.title })

          await db.suiteRunResult.update({
            where: { id: row.id },
            data: { autoStatus: 'RUNNING' },
          })

          const context = await browser!.newContext()
          const page = await context.newPage()

          try {
            const autoResult = await executeTestCase(
              page,
              tc,
              targetUrl,
              (step) => send({ type: 'step', testCaseId: tc.id, ...step })
            )

            const result = autoResult.passed ? 'PASSED' : 'FAILED'
            autoResult.passed ? passed++ : failed++

            await db.suiteRunResult.update({
              where: { id: row.id },
              data: {
                result,
                autoStatus: result,
                autoLog: JSON.stringify(autoResult.log),
                notes: autoResult.reason,
                screenshot: autoResult.screenshot ?? null,
              },
            })

            send({
              type: 'test_done',
              testCaseId: tc.id,
              result,
              reason: autoResult.reason,
              screenshot: autoResult.screenshot,
            })
          } catch (err) {
            const msg = err instanceof Error ? err.message : String(err)
            failed++
            let failScreenshot: string | undefined
            try {
              const buf = await page.screenshot({ type: 'jpeg', quality: 30 })
              failScreenshot = buf.toString('base64')
            } catch { /* ignore */ }
            await db.suiteRunResult.update({
              where: { id: row.id },
              data: { result: 'FAILED', autoStatus: 'ERROR', notes: msg, screenshot: failScreenshot ?? null },
            })
            send({ type: 'test_done', testCaseId: tc.id, result: 'FAILED', reason: `Error: ${msg}`, screenshot: failScreenshot })
          } finally {
            await context.close().catch(() => {})
          }
        }

        // Process tests in parallel batches of CONCURRENCY
        for (let i = 0; i < run.results.length; i += CONCURRENCY) {
          const batch = run.results.slice(i, i + CONCURRENCY)
          await Promise.all(batch.map(row => runTest(row)))
        }

        await browser.close()
        browser = null
        send({ type: 'complete', passed, failed })
      } catch (err) {
        const msg = err instanceof Error ? err.message : String(err)
        send({ type: 'error', message: msg })
        if (browser) await browser.close().catch(() => {})
      } finally {
        controller.close()
      }
    },
  })

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      Connection: 'keep-alive',
    },
  })
}
