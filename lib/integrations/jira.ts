export interface JiraConfig {
  baseUrl: string    // e.g. https://mycompany.atlassian.net
  email: string
  apiToken: string
  projectKey: string // e.g. PROJ
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

function authHeader(email: string, token: string) {
  return 'Basic ' + Buffer.from(`${email}:${token}`).toString('base64')
}

function jiraPriority(severity: string): string {
  return { CRITICAL: 'Highest', HIGH: 'High', MEDIUM: 'Medium', LOW: 'Low' }[severity] ?? 'Medium'
}

function buildDescription(bug: BugInput) {
  const content: unknown[] = [
    {
      type: 'paragraph',
      content: [{ type: 'text', text: bug.description }],
    },
  ]

  if (bug.stepsToReproduce.length > 0) {
    content.push({
      type: 'paragraph',
      content: [{ type: 'text', text: 'Steps to Reproduce:', marks: [{ type: 'strong' }] }],
    })
    content.push({
      type: 'orderedList',
      content: bug.stepsToReproduce.map((step) => ({
        type: 'listItem',
        content: [{ type: 'paragraph', content: [{ type: 'text', text: step }] }],
      })),
    })
  }

  if (bug.expectedBehavior) {
    content.push({
      type: 'paragraph',
      content: [
        { type: 'text', text: 'Expected: ', marks: [{ type: 'strong' }] },
        { type: 'text', text: bug.expectedBehavior },
      ],
    })
  }

  if (bug.actualBehavior) {
    content.push({
      type: 'paragraph',
      content: [
        { type: 'text', text: 'Actual: ', marks: [{ type: 'strong' }] },
        { type: 'text', text: bug.actualBehavior },
      ],
    })
  }

  return { type: 'doc', version: 1, content }
}

export async function createIssue(
  config: JiraConfig,
  bug: BugInput,
): Promise<{ key: string; url: string }> {
  const url = `${config.baseUrl.replace(/\/$/, '')}/rest/api/3/issue`
  const res = await fetch(url, {
    method: 'POST',
    headers: {
      Authorization: authHeader(config.email, config.apiToken),
      'Content-Type': 'application/json',
      Accept: 'application/json',
    },
    body: JSON.stringify({
      fields: {
        project: { key: config.projectKey },
        summary: `[BUG-${String(bug.sequenceNum).padStart(4, '0')}] ${bug.title}`,
        description: buildDescription(bug),
        issuetype: { name: 'Bug' },
        priority: { name: jiraPriority(bug.severity) },
      },
    }),
  })

  const text = await res.text()
  if (!res.ok) {
    throw new Error(`Jira API error ${res.status}: ${text.slice(0, 300)}`)
  }

  let data: { key: string }
  try {
    data = JSON.parse(text)
  } catch {
    throw new Error(`Jira returned unexpected response — check base URL, email, and API token: ${text.slice(0, 150)}`)
  }
  return {
    key: data.key,
    url: `${config.baseUrl.replace(/\/$/, '')}/browse/${data.key}`,
  }
}

export async function testConnection(config: JiraConfig): Promise<void> {
  const url = `${config.baseUrl.replace(/\/$/, '')}/rest/api/3/myself`
  const res = await fetch(url, {
    headers: {
      Authorization: authHeader(config.email, config.apiToken),
      Accept: 'application/json',
    },
  })
  const text = await res.text()
  if (!res.ok) throw new Error(`Connection failed (${res.status}) — check base URL, email, and API token`)
  try {
    const data = JSON.parse(text)
    if (!data.accountId) throw new Error('Unexpected response shape')
  } catch {
    throw new Error('Jira base URL appears wrong — got an HTML page instead of JSON. Expected format: https://yourcompany.atlassian.net')
  }
}
