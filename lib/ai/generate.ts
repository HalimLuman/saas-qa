import Anthropic from '@anthropic-ai/sdk'

const client = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
})

export interface GeneratedTestCase {
  title: string
  preconditions: string
  steps: string[]
  expected_result: string
  priority: 'P0' | 'P1' | 'P2' | 'P3'
  category: 'FUNCTIONAL' | 'NEGATIVE' | 'BOUNDARY' | 'SECURITY' | 'PERFORMANCE' | 'ACCESSIBILITY'
  why: string
}

// Layer 1 & 2: Persona + output schema (static)
const SYSTEM_PROMPT = `You are a senior QA engineer with 10+ years of experience writing production-grade test cases for SaaS products. Your test cases are specific, executable, and follow industry standards.

For each test case, return a JSON object with exactly these fields:
- title: concise, action-oriented name (e.g., "Verify password reset rejects previously used password")
- preconditions: what must be true before executing the test (be specific)
- steps: array of atomic, numbered step strings — each step is a single user action
- expected_result: the verifiable outcome (what exactly should the user see/experience)
- priority: P0 (critical path / data loss risk), P1 (important feature), P2 (edge case), P3 (nice-to-have)
- category: one of [FUNCTIONAL, NEGATIVE, BOUNDARY, SECURITY, PERFORMANCE, ACCESSIBILITY]
- why: one sentence explaining why this test case matters — the specific risk it mitigates or scenario it covers (e.g., "Prevents double-charge on network timeout" or "Validates ISO 4217 edge case for JPY zero-decimal currency")

Layer 5 — Quality constraints (enforce strictly):
1. Every title must be unique. No two test cases may have the same or near-identical title.
2. Each step must be a single, atomic action. Never combine two actions in one step.
3. Expected results must be verifiable — describe exactly what the user sees, not "it works correctly."
4. Steps must not be vague. "verify the page works" is not acceptable.
5. Include at least one positive path (happy path) test case.
6. Include boundary tests for any numeric/length/date constraints mentioned.
7. Include one unauthorized access test if the feature involves authentication or permissions.
8. Do not generate more than 25 test cases unless a specific count is requested.
9. Return ONLY a JSON array — no markdown fences, no commentary, no explanation.

Here are two gold-standard examples to match in quality:

[
  {
    "title": "Verify password reset rejects previously used password",
    "preconditions": "User has an active account. User has successfully changed their password at least once before.",
    "steps": [
      "Navigate to /forgot-password",
      "Enter the registered email address in the email field",
      "Click the 'Send Reset Link' button",
      "Open the password reset email and click the reset link",
      "Enter the user's previous password in the 'New Password' field",
      "Enter the same previous password in the 'Confirm Password' field",
      "Click the 'Set New Password' button"
    ],
    "expected_result": "System displays an inline error: 'Cannot reuse a previous password. Please choose a different password.' The password is not changed and the user remains on the reset page.",
    "priority": "P1",
    "category": "SECURITY",
    "why": "Prevents credential cycling attacks where users rotate back to a compromised password"
  },
  {
    "title": "Verify login form rejects email with missing @ symbol",
    "preconditions": "User is on the login page and is not authenticated.",
    "steps": [
      "Navigate to /login",
      "Enter 'invalidemail.com' in the email field",
      "Enter any value in the password field",
      "Click the 'Log In' button"
    ],
    "expected_result": "The form displays an inline validation error below the email field: 'Please enter a valid email address.' No network request is made. Focus returns to the email field.",
    "priority": "P2",
    "category": "NEGATIVE",
    "why": "Ensures client-side validation catches malformed emails before making unnecessary API calls"
  }
]`

export interface GenerateOptions {
  modules?: string[]
  testTypeFilter?: string
  categories?: string[]
  count?: number
  priorityFloor?: string
  existingTitles?: string[]
  existingModules?: string[]
  customRules?: string
}

export async function generateTestCases(
  featureDescription: string,
  options: GenerateOptions = {}
): Promise<GeneratedTestCase[]> {
  const {
    modules = [],
    testTypeFilter,
    categories,
    count,
    priorityFloor,
    existingTitles,
    existingModules,
    customRules,
  } = options

  // Layer 3: Dynamic project context
  const contextLines: string[] = []

  if (existingModules?.length) {
    contextLines.push(`Existing modules in this project (use these for categorization consistency): ${existingModules.join(', ')}`)
  }

  if (existingTitles?.length) {
    const sample = existingTitles.slice(0, 50)
    contextLines.push(`Existing test case titles (avoid duplicates or near-duplicates):\n${sample.map(t => `- ${t}`).join('\n')}`)
  }

  if (customRules) {
    contextLines.push(`Project-specific rules (always apply):\n${customRules}`)
  }

  if (modules.length > 0) {
    contextLines.push(`Module/feature area: ${modules.join(', ')}`)
  }

  // Layer 4: User input
  const directives: string[] = []
  if (count) directives.push(`Generate exactly ${count} test cases.`)
  if (priorityFloor && priorityFloor !== 'P3') {
    const floorMap: Record<string, string> = { P0: 'P0 only', P1: 'P0 and P1', P2: 'P0, P1, and P2' }
    directives.push(`Only generate test cases with priority: ${floorMap[priorityFloor] ?? priorityFloor}. Do not generate lower-priority (${priorityFloor === 'P0' ? 'P1, P2, P3' : priorityFloor === 'P1' ? 'P2, P3' : 'P3'}) test cases.`)
  }
  if (categories?.length) {
    directives.push(`Focus on these test categories: ${categories.join(', ')}.`)
  } else if (testTypeFilter) {
    directives.push(`Focus on generating ${testTypeFilter} test cases, but include a positive path test even if not of that type.`)
  }

  const userPrompt = [
    '<feature_description>',
    featureDescription,
    '</feature_description>',
    '',
    contextLines.length > 0 ? `<project_context>\n${contextLines.join('\n\n')}\n</project_context>` : '',
    '',
    directives.length > 0 ? directives.join('\n') : '',
    '',
    'Generate test cases based ONLY on the feature description above. Return a JSON array.',
  ].filter(Boolean).join('\n')

  let attempt = 0
  while (attempt < 2) {
    attempt++
    const suffix =
      attempt > 1
        ? '\n\nYour previous response was not valid JSON. Return ONLY a JSON array with no markdown fences.'
        : ''

    const message = await client.messages.create({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 4096,
      system: SYSTEM_PROMPT,
      messages: [{ role: 'user', content: userPrompt + suffix }],
    })

    const text = message.content[0].type === 'text' ? message.content[0].text : ''

    try {
      // Strip any accidental markdown fences before parsing
      const cleaned = text.replace(/^```(?:json)?\n?/m, '').replace(/\n?```$/m, '').trim()
      const parsed = JSON.parse(cleaned)
      if (Array.isArray(parsed)) return parsed.slice(0, 25)
    } catch {
      if (attempt >= 2) throw new Error('AI returned invalid JSON after retry')
    }
  }

  throw new Error('Failed to generate test cases')
}

const RECORDING_SYSTEM_PROMPT = `You are a senior QA engineer analyzing a screen recording. You are given a sequence of screenshots captured at regular intervals from a user session.

Your task: infer what the user was testing and produce a structured test case.

Return exactly this JSON (no other text, no markdown fences):
{
  "title": "concise action-oriented test case title",
  "preconditions": "what must be true before executing this test",
  "steps": ["step 1", "step 2", "..."],
  "expected_result": "verifiable outcome the user was checking",
  "priority": "P0"|"P1"|"P2"|"P3",
  "category": "FUNCTIONAL"|"NEGATIVE"|"BOUNDARY"|"SECURITY"|"PERFORMANCE"|"ACCESSIBILITY"
}

Rules:
- Each step must describe a single, atomic user action observable from the screenshots.
- Do not invent actions that are not visible in the frames.
- Steps should be written in imperative form ("Click...", "Enter...", "Navigate to...").
- If the recording is ambiguous, prefer a conservative interpretation.`

export async function analyzeRecordingFrames(
  frames: string[],
  context?: string
): Promise<GeneratedTestCase> {
  const imageContent = frames.slice(0, 20).map((b64) => ({
    type: 'image' as const,
    source: {
      type: 'base64' as const,
      media_type: 'image/jpeg' as const,
      data: b64,
    },
  }))

  const textContent = {
    type: 'text' as const,
    content: [
      context ? `<context>${context}</context>` : '',
      'These screenshots were captured in sequence from a screen recording. Analyze the user flow and generate one test case that describes what was being tested.',
    ].filter(Boolean).join('\n\n'),
  }

  let attempt = 0
  while (attempt < 2) {
    attempt++
    const suffix =
      attempt > 1
        ? '\n\nYour previous response was not valid JSON. Return ONLY the JSON object with no markdown fences.'
        : ''

    const message = await client.messages.create({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 2048,
      system: RECORDING_SYSTEM_PROMPT,
      messages: [
        {
          role: 'user',
          content: [
            ...imageContent,
            { type: 'text', text: textContent.content + suffix },
          ],
        },
      ],
    })

    const text = message.content[0].type === 'text' ? message.content[0].text : ''
    try {
      const cleaned = text.replace(/^```(?:json)?\n?/m, '').replace(/\n?```$/m, '').trim()
      return JSON.parse(cleaned)
    } catch {
      if (attempt >= 2) throw new Error('AI returned invalid JSON after retry')
    }
  }

  throw new Error('Failed to analyze recording')
}

const BUG_RECORDING_SYSTEM_PROMPT = `You are a QA engineer watching a screen recording of a bug being demonstrated.

Analyze the screenshots in sequence and extract structured reproduction information.

Return exactly this JSON (no other text, no markdown fences):
{
  "title": "concise bug title describing what is broken",
  "stepsToReproduce": ["step 1", "step 2", "..."],
  "actualBehavior": "what actually happened — the unexpected or broken behavior observed"
}

Rules:
- Each step must be a single, atomic action in imperative form ("Click...", "Enter...", "Navigate to...")
- Only include steps observable in the screenshots
- actualBehavior describes what went wrong or was unexpected
- title should be specific, e.g. "Payment button freezes after clicking Submit"
- If context is provided, use it to understand what feature is being demonstrated`

export async function analyzeBugRecording(
  frames: string[],
  context?: string
): Promise<{ title: string; stepsToReproduce: string[]; actualBehavior: string }> {
  const imageContent = frames.slice(0, 20).map((b64) => ({
    type: 'image' as const,
    source: {
      type: 'base64' as const,
      media_type: 'image/jpeg' as const,
      data: b64,
    },
  }))

  const promptText = [
    context ? `<context>${context}</context>` : '',
    'These screenshots were captured in sequence from a screen recording of a bug. Analyze the user actions and the unexpected behavior, then return the structured JSON.',
  ].filter(Boolean).join('\n\n')

  let attempt = 0
  while (attempt < 2) {
    attempt++
    const suffix =
      attempt > 1
        ? '\n\nYour previous response was not valid JSON. Return ONLY the JSON object with no markdown fences.'
        : ''

    const message = await client.messages.create({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 2048,
      system: BUG_RECORDING_SYSTEM_PROMPT,
      messages: [
        {
          role: 'user',
          content: [
            ...imageContent,
            { type: 'text', text: promptText + suffix },
          ],
        },
      ],
    })

    const text = message.content[0].type === 'text' ? message.content[0].text : ''
    try {
      const cleaned = text.replace(/^```(?:json)?\n?/m, '').replace(/\n?```$/m, '').trim()
      return JSON.parse(cleaned)
    } catch {
      if (attempt >= 2) throw new Error('AI returned invalid JSON after retry')
    }
  }

  throw new Error('Failed to analyze bug recording')
}

const SEVERITY_SYSTEM_PROMPT = `You are a QA triage expert. Given a bug title and description, suggest a severity level and provide a short title hint.

Severity definitions:
- CRITICAL: application crash, data loss, security breach, blocks the core user flow with no workaround
- HIGH: major feature is broken, workaround is difficult or non-obvious
- MEDIUM: feature is partially broken, a reasonable workaround exists
- LOW: cosmetic issue, minor UX friction, no functional impact

Return exactly this JSON (no other text):
{ "severity": "CRITICAL"|"HIGH"|"MEDIUM"|"LOW", "reasoning": "one sentence explaining the classification", "titleHint": "short affirming hint or improvement suggestion for the title (e.g. 'keep specific (cause + surface) — looks good' or 'try adding the affected component name')" }`

export async function suggestBugSeverity(
  title: string,
  description: string
): Promise<{ severity: string; reasoning: string; titleHint?: string }> {
  const message = await client.messages.create({
    model: 'claude-haiku-4-5-20251001',
    max_tokens: 300,
    system: SEVERITY_SYSTEM_PROMPT,
    messages: [
      {
        role: 'user',
        content: `<bug_title>${title}</bug_title>\n\n<bug_description>${description}</bug_description>`,
      },
    ],
  })

  const text = message.content[0].type === 'text' ? message.content[0].text : '{}'
  try {
    const cleaned = text.replace(/^```(?:json)?\n?/m, '').replace(/\n?```$/m, '').trim()
    return JSON.parse(cleaned)
  } catch {
    return { severity: 'MEDIUM', reasoning: 'Could not parse AI response' }
  }
}
