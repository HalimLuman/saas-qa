import { db } from '@/lib/db'

export async function GET() {
  const start = Date.now()
  const checks: Record<string, 'ok' | 'error'> = {}

  // Database connectivity
  try {
    await db.$queryRaw`SELECT 1`
    checks.db = 'ok'
  } catch {
    checks.db = 'error'
  }

  // AI reachability — just verify the API key is configured
  checks.ai = process.env.ANTHROPIC_API_KEY ? 'ok' : 'error'

  const allOk = Object.values(checks).every((v) => v === 'ok')

  return Response.json(
    {
      status: allOk ? 'ok' : 'degraded',
      durationMs: Date.now() - start,
      checks,
    },
    { status: allOk ? 200 : 503 }
  )
}
