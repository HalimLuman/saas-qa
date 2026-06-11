export interface AzureDevOpsConfig {
  orgUrl: string       // e.g. https://dev.azure.com/myorg
  project: string      // e.g. MyProject
  pat: string          // Personal Access Token
  testPlanId?: string  // optional default test plan
  testSuiteId?: string // optional default test suite
}

interface TestCaseInput {
  title: string
  steps: string[]
  expectedResult: string
  preconditions?: string
  priority: string     // P0-P3
  module?: string
}

interface BugInput {
  sequenceNum: number
  title: string
  description: string
  stepsToReproduce: string[]
  expectedBehavior?: string
  actualBehavior?: string
  severity: string
  environment?: string
}

function authHeader(pat: string) {
  return 'Basic ' + Buffer.from(`:${pat}`).toString('base64')
}

function priorityNumber(p: string): number {
  return { P0: 1, P1: 2, P2: 3, P3: 4 }[p] ?? 2
}

function severityValue(s: string): string {
  return { CRITICAL: '1 - Critical', HIGH: '2 - High', MEDIUM: '3 - Medium', LOW: '4 - Low' }[s] ?? '3 - Medium'
}

function buildStepsXml(steps: string[], expectedResult: string): string {
  const lastIdx = steps.length
  const stepXml = steps.map((step, i) => {
    const isLast = i === lastIdx - 1
    const expected = isLast ? escapeXml(expectedResult) : ''
    return `<step id="${i + 2}" type="ActionStep"><parameterizedString isformatted="true">${escapeXml(step)}</parameterizedString><parameterizedString isformatted="true">${expected}</parameterizedString><description/></step>`
  }).join('')
  return `<steps id="0" last="${lastIdx + 1}">${stepXml}</steps>`
}

function escapeXml(s: string): string {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;')
}

function stepsToHtml(steps: string[]): string {
  return '<ol>' + steps.map((s) => `<li>${escapeXml(s)}</li>`).join('') + '</ol>'
}

async function adoFetch(url: string, pat: string, method: string, body: unknown) {
  const res = await fetch(url, {
    method,
    headers: {
      Authorization: authHeader(pat),
      'Content-Type': 'application/json-patch+json',
    },
    body: JSON.stringify(body),
  })
  const text = await res.text()
  if (!res.ok) {
    throw new Error(`Azure DevOps API error ${res.status}: ${text.slice(0, 300)}`)
  }
  try {
    return JSON.parse(text)
  } catch {
    throw new Error(`Azure DevOps returned unexpected response — check org URL and PAT: ${text.slice(0, 150)}`)
  }
}

export async function createTestCase(
  config: AzureDevOpsConfig,
  tc: TestCaseInput,
): Promise<{ id: number; url: string }> {
  const base = `${config.orgUrl.replace(/\/$/, '')}/${encodeURIComponent(config.project)}`
  const apiUrl = `${base}/_apis/wit/workitems/$Test%20Case?api-version=7.0`

  const ops = [
    { op: 'add', path: '/fields/System.Title', value: tc.title },
    { op: 'add', path: '/fields/Microsoft.VSTS.Common.Priority', value: priorityNumber(tc.priority) },
    { op: 'add', path: '/fields/Microsoft.VSTS.TCM.Steps', value: buildStepsXml(tc.steps, tc.expectedResult) },
  ]
  if (tc.preconditions) {
    ops.push({ op: 'add', path: '/fields/Microsoft.VSTS.TCM.LocalDataSource', value: tc.preconditions })
  }
  if (tc.module) {
    ops.push({ op: 'add', path: '/fields/System.AreaPath', value: tc.module })
  }

  const data = await adoFetch(apiUrl, config.pat, 'PATCH', ops)
  return {
    id: data.id,
    url: data._links?.html?.href ?? `${base}/_workitems/edit/${data.id}`,
  }
}

export async function addTestCaseToSuite(
  config: AzureDevOpsConfig,
  planId: string,
  suiteId: string,
  testCaseId: number,
): Promise<void> {
  const base = `${config.orgUrl.replace(/\/$/, '')}/${encodeURIComponent(config.project)}`
  const url = `${base}/_apis/test/Plans/${planId}/suites/${suiteId}/testcases/${testCaseId}?api-version=7.0`
  const res = await fetch(url, {
    method: 'POST',
    headers: { Authorization: authHeader(config.pat) },
  })
  if (!res.ok) {
    const text = await res.text()
    throw new Error(`Failed to add test case to suite: ${text.slice(0, 200)}`)
  }
}

export async function createBug(
  config: AzureDevOpsConfig,
  bug: BugInput,
): Promise<{ id: number; url: string }> {
  const base = `${config.orgUrl.replace(/\/$/, '')}/${encodeURIComponent(config.project)}`
  const apiUrl = `${base}/_apis/wit/workitems/$Bug?api-version=7.0`

  const stepsHtml = stepsToHtml(bug.stepsToReproduce)
  const descHtml = `<p>${escapeXml(bug.description)}</p>`
  const ops = [
    { op: 'add', path: '/fields/System.Title', value: `[BUG-${String(bug.sequenceNum).padStart(4, '0')}] ${bug.title}` },
    { op: 'add', path: '/fields/System.Description', value: descHtml },
    { op: 'add', path: '/fields/Microsoft.VSTS.TCM.ReproSteps', value: stepsHtml },
    { op: 'add', path: '/fields/Microsoft.VSTS.Common.Severity', value: severityValue(bug.severity) },
  ]
  if (bug.expectedBehavior) {
    ops.push({ op: 'add', path: '/fields/Microsoft.VSTS.CMMI.Symptom', value: escapeXml(bug.expectedBehavior) })
  }

  const data = await adoFetch(apiUrl, config.pat, 'PATCH', ops)
  return {
    id: data.id,
    url: data._links?.html?.href ?? `${base}/_workitems/edit/${data.id}`,
  }
}

export async function testConnection(config: AzureDevOpsConfig): Promise<void> {
  const base = `${config.orgUrl.replace(/\/$/, '')}/${encodeURIComponent(config.project)}`
  const url = `${base}/_apis/wit/fields?api-version=7.0&$top=1`
  const res = await fetch(url, {
    headers: { Authorization: authHeader(config.pat) },
  })
  if (!res.ok) throw new Error(`Connection failed (${res.status}) — check org URL and PAT`)
}
