export interface GitHubConfig {
  owner: string   // org or username
  repo: string
  token: string   // Personal Access Token or fine-grained PAT
  labels?: string // comma-separated labels, e.g. "bug,qa"
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

function buildBody(bug: BugInput): string {
  const lines: string[] = [`## Description\n\n${bug.description}`]

  if (bug.stepsToReproduce.length > 0) {
    lines.push(`\n## Steps to Reproduce\n\n${bug.stepsToReproduce.map((s, i) => `${i + 1}. ${s}`).join('\n')}`)
  }
  if (bug.expectedBehavior) lines.push(`\n## Expected Behavior\n\n${bug.expectedBehavior}`)
  if (bug.actualBehavior) lines.push(`\n## Actual Behavior\n\n${bug.actualBehavior}`)
  lines.push(`\n---\n*Severity: ${bug.severity} | Reported via softAssert BUG-${String(bug.sequenceNum).padStart(4, '0')}*`)

  return lines.join('')
}

export async function createIssue(
  config: GitHubConfig,
  bug: BugInput,
): Promise<{ number: number; url: string }> {
  const url = `https://api.github.com/repos/${config.owner}/${config.repo}/issues`
  const labels = config.labels ? config.labels.split(',').map((l) => l.trim()).filter(Boolean) : ['bug']

  const res = await fetch(url, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${config.token}`,
      Accept: 'application/vnd.github+json',
      'X-GitHub-Api-Version': '2022-11-28',
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      title: `[BUG-${String(bug.sequenceNum).padStart(4, '0')}] ${bug.title}`,
      body: buildBody(bug),
      labels,
    }),
  })

  const text = await res.text()
  if (!res.ok) {
    throw new Error(`GitHub API error ${res.status}: ${text.slice(0, 300)}`)
  }

  let data: { number: number; html_url: string }
  try {
    data = JSON.parse(text)
  } catch {
    throw new Error(`GitHub returned unexpected response — check owner, repo, and token: ${text.slice(0, 150)}`)
  }
  return { number: data.number, url: data.html_url }
}

export async function testConnection(config: GitHubConfig): Promise<void> {
  const url = `https://api.github.com/repos/${config.owner}/${config.repo}`
  const res = await fetch(url, {
    headers: {
      Authorization: `Bearer ${config.token}`,
      Accept: 'application/vnd.github+json',
    },
  })
  if (!res.ok) throw new Error(`Connection failed (${res.status}) — check owner, repo, and token`)
}
