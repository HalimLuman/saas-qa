export interface LinearConfig {
  apiKey: string
  teamId: string   // Linear team ID (not key)
}

interface BugInput {
  sequenceNum: number
  title: string
  description: string
  stepsToReproduce: string[]
  expectedBehavior?: string
  actualBehavior?: string
  severity: string
}

function linearPriority(severity: string): number {
  return { CRITICAL: 1, HIGH: 2, MEDIUM: 3, LOW: 4 }[severity] ?? 3
}

function buildDescription(bug: BugInput): string {
  const lines: string[] = [bug.description]

  if (bug.stepsToReproduce.length > 0) {
    lines.push(`\n**Steps to Reproduce**\n${bug.stepsToReproduce.map((s, i) => `${i + 1}. ${s}`).join('\n')}`)
  }
  if (bug.expectedBehavior) lines.push(`\n**Expected:** ${bug.expectedBehavior}`)
  if (bug.actualBehavior) lines.push(`\n**Actual:** ${bug.actualBehavior}`)
  lines.push(`\n---\n*Severity: ${bug.severity} | softAssert BUG-${String(bug.sequenceNum).padStart(4, '0')}*`)

  return lines.join('\n')
}

export async function createIssue(
  config: LinearConfig,
  bug: BugInput,
): Promise<{ id: string; url: string }> {
  const query = `
    mutation IssueCreate($input: IssueCreateInput!) {
      issueCreate(input: $input) {
        success
        issue { id url }
      }
    }
  `

  const res = await fetch('https://api.linear.app/graphql', {
    method: 'POST',
    headers: {
      Authorization: config.apiKey,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      query,
      variables: {
        input: {
          title: `[BUG-${String(bug.sequenceNum).padStart(4, '0')}] ${bug.title}`,
          description: buildDescription(bug),
          teamId: config.teamId,
          priority: linearPriority(bug.severity),
        },
      },
    }),
  })

  const text = await res.text()
  if (!res.ok) {
    throw new Error(`Linear API error ${res.status}: ${text.slice(0, 300)}`)
  }

  let data: { errors?: { message: string }[]; data?: { issueCreate?: { issue?: { id: string; url: string } } } }
  try {
    data = JSON.parse(text)
  } catch {
    throw new Error(`Linear returned unexpected response — check API key: ${text.slice(0, 150)}`)
  }
  if (data.errors) throw new Error(data.errors[0]?.message ?? 'Linear mutation failed')

  const issue = data.data?.issueCreate?.issue
  if (!issue) throw new Error('Linear did not return an issue — check team ID')
  return { id: issue.id, url: issue.url }
}

export async function testConnection(config: LinearConfig): Promise<void> {
  const res = await fetch('https://api.linear.app/graphql', {
    method: 'POST',
    headers: {
      Authorization: config.apiKey,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ query: '{ viewer { id } }' }),
  })
  const testText = await res.text()
  if (!res.ok) throw new Error(`Connection failed (${res.status}) — check API key`)
  let testData: { errors?: unknown[] }
  try { testData = JSON.parse(testText) } catch { throw new Error('Linear returned non-JSON — check API key') }
  if (testData.errors) throw new Error('Invalid API key')
}
