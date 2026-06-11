import { NextRequest } from 'next/server'
import { z } from 'zod'
import { auth } from '@/lib/auth'
import { db } from '@/lib/db'

const kvSchema = z.array(z.object({ key: z.string(), value: z.string() }))

const runSchema = z.object({
  variables: z.record(z.string(), z.string()).optional(),
  // optional overrides so the UI can send without saving first
  url: z.string().optional(),
  method: z.string().optional(),
  headers: kvSchema.optional(),
  queryParams: kvSchema.optional(),
  body: z.string().nullable().optional(),
  bodyType: z.string().nullable().optional(),
  auth: z.record(z.string(), z.unknown()).nullable().optional(),
})

function interpolate(str: string, vars: Record<string, string>): string {
  return str.replace(/\{\{(\w+)\}\}/g, (_, k) => vars[k] ?? `{{${k}}}`)
}

function getByPath(obj: unknown, path: string): unknown {
  // very simple JSONPath: $.a.b.c or a.b.c
  const parts = path.replace(/^\$\./, '').split('.')
  let cur: unknown = obj
  for (const p of parts) {
    if (cur == null || typeof cur !== 'object') return undefined
    cur = (cur as Record<string, unknown>)[p]
  }
  return cur
}

function evaluate(
  type: string, target: string, operator: string, expected: string | null,
  responseStatus: number, responseHeaders: Record<string, string>,
  parsedBody: unknown, durationMs: number
): { passed: boolean; actual: string | null } {
  try {
    if (type === 'status') {
      const v = responseStatus
      const passed = operator === 'eq' ? v === Number(expected)
        : operator === 'ne' ? v !== Number(expected)
        : operator === 'lt' ? v < Number(expected)
        : operator === 'gt' ? v > Number(expected) : false
      return { passed, actual: String(v) }
    }
    if (type === 'response_time') {
      const passed = operator === 'lt' ? durationMs < Number(expected)
        : operator === 'gt' ? durationMs > Number(expected) : false
      return { passed, actual: String(durationMs) }
    }
    if (type === 'header') {
      const v = responseHeaders[target.toLowerCase()] ?? ''
      const passed = operator === 'eq' ? v === expected
        : operator === 'contains' ? v.includes(expected ?? '')
        : operator === 'exists' ? !!v : false
      return { passed, actual: v || null }
    }
    if (type === 'jsonpath') {
      const raw = getByPath(parsedBody, target)
      const str = raw == null ? 'null' : String(raw)
      const passed = operator === 'eq' ? str === expected
        : operator === 'ne' ? str !== expected
        : operator === 'contains' ? str.includes(expected ?? '')
        : operator === 'exists' ? raw !== undefined
        : operator === 'matches' ? new RegExp(expected ?? '').test(str) : false
      return { passed, actual: raw === undefined ? 'undefined' : String(raw) }
    }
    if (type === 'regex') {
      const bodyStr = typeof parsedBody === 'string' ? parsedBody : JSON.stringify(parsedBody)
      const passed = operator === 'matches' ? new RegExp(target).test(bodyStr) : false
      return { passed, actual: null }
    }
  } catch { /* fall through */ }
  return { passed: false, actual: null }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ requestId: string }> }
) {
  const session = await auth()
  if (!session?.user?.id) return Response.json({ error: 'Unauthorized' }, { status: 401 })

  const { requestId } = await params
  const apiReq = await db.apiRequest.findFirst({
    where: { id: requestId, collection: { project: { userId: session.user.id } } },
    include: { assertions: { orderBy: { sortOrder: 'asc' } } },
  })
  if (!apiReq) return Response.json({ error: 'Not found' }, { status: 404 })

  let variables: Record<string, string> = {}
  let parsed: ReturnType<typeof runSchema.parse> | null = null
  try {
    const body = await request.json()
    parsed = runSchema.parse(body)
    variables = parsed.variables ?? {}
  } catch { /* no body is fine */ }

  // merge any in-flight overrides sent by the client (draft values before save)
  const effectiveUrl    = parsed?.url      ?? apiReq.url
  const effectiveMethod = parsed?.method   ?? apiReq.method
  const effectiveBody   = parsed?.body     !== undefined ? parsed.body   : apiReq.body
  const effectiveBodyType = parsed?.bodyType !== undefined ? parsed.bodyType : apiReq.bodyType
  const effectiveHeaders    = parsed?.headers     ?? (apiReq.headers    ? (JSON.parse(apiReq.headers)    as { key: string; value: string }[]) : [])
  const effectiveQueryParams = parsed?.queryParams ?? (apiReq.queryParams ? (JSON.parse(apiReq.queryParams) as { key: string; value: string }[]) : [])
  const effectiveAuth = parsed?.auth !== undefined ? parsed.auth : (apiReq.auth ? JSON.parse(apiReq.auth) as Record<string, string> : null)

  const url = interpolate(effectiveUrl, variables)
  if (!url) return Response.json({ error: 'Request URL is empty' }, { status: 400 })

  const headers: Record<string, string> = { 'User-Agent': 'softAssert/1.0' }
  for (const { key, value } of effectiveHeaders) {
    if (key.trim()) headers[key.trim()] = interpolate(value, variables)
  }

  // query params
  let finalUrl = url
  if (effectiveQueryParams.length > 0) {
    try {
      const u = new URL(finalUrl)
      for (const { key, value } of effectiveQueryParams) {
        if (key.trim()) u.searchParams.set(key.trim(), interpolate(value, variables))
      }
      finalUrl = u.toString()
    } catch { /* relative URL or malformed — skip */ }
  }

  // auth
  if (effectiveAuth) {
    const a = effectiveAuth as Record<string, string>
    if (a.type === 'bearer' && a.token) {
      headers['Authorization'] = `Bearer ${interpolate(a.token, variables)}`
    } else if (a.type === 'basic' && a.username) {
      headers['Authorization'] = `Basic ${Buffer.from(`${interpolate(a.username, variables)}:${interpolate(a.password ?? '', variables)}`).toString('base64')}`
    } else if (a.type === 'apikey' && a.key) {
      headers[a.headerName ?? 'X-API-Key'] = interpolate(a.key, variables)
    }
  }

  const fetchOptions: RequestInit = { method: effectiveMethod, headers }
  if (!['GET', 'HEAD', 'OPTIONS'].includes(effectiveMethod) && effectiveBody) {
    fetchOptions.body = interpolate(effectiveBody, variables)
    if (!headers['Content-Type'] && effectiveBodyType === 'json') {
      headers['Content-Type'] = 'application/json'
    }
  }

  const start = Date.now()
  let responseStatus = 0
  let responseBody = ''
  let responseHeaders: Record<string, string> = {}
  let fetchError: string | null = null

  try {
    const res = await fetch(finalUrl, fetchOptions)
    responseStatus = res.status
    res.headers.forEach((v, k) => { responseHeaders[k] = v })
    responseBody = await res.text()
  } catch (err) {
    fetchError = err instanceof Error ? err.message : 'Network error'
  }

  const durationMs = Date.now() - start

  if (fetchError) {
    return Response.json({ error: fetchError, durationMs }, { status: 502 })
  }

  let parsedBody: unknown = responseBody
  try { parsedBody = JSON.parse(responseBody) } catch { /* keep as string */ }

  const assertionResults = apiReq.assertions.map((a) => {
    const { passed, actual } = evaluate(a.type, a.target, a.operator, a.value, responseStatus, responseHeaders, parsedBody, durationMs)
    return { id: a.id, type: a.type, target: a.target, operator: a.operator, value: a.value, passed, actual }
  })

  const allPassed = assertionResults.every((r) => r.passed)

  await db.apiRequestRun.create({
    data: {
      requestId,
      statusCode: responseStatus,
      responseHeaders: JSON.stringify(responseHeaders),
      responseBody: responseBody.slice(0, 100_000), // cap at 100KB
      durationMs,
      passed: allPassed,
      assertionResults: JSON.stringify(assertionResults),
    },
  })

  return Response.json({
    statusCode: responseStatus,
    responseHeaders,
    responseBody,
    durationMs,
    passed: allPassed,
    assertionResults,
  })
}
