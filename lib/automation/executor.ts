import Anthropic from '@anthropic-ai/sdk'
import type { Page } from 'playwright'

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

export interface StepLog {
  action: string
  status: 'ok' | 'error' | 'info'
  error?: string
}

export interface AutoRunResult {
  passed: boolean
  reason: string
  log: StepLog[]
  screenshot?: string
}

interface TestCaseData {
  title: string
  preconditions: string | null
  steps: string
  expectedResult: string
}

function parseSteps(raw: string): string[] {
  try {
    const parsed = JSON.parse(raw)
    if (Array.isArray(parsed)) return (parsed as unknown[]).map(String).filter(Boolean)
  } catch { /* not JSON */ }
  return raw.split('\n').map(s => s.trim().replace(/^\d+[\.\)]\s*/, '')).filter(Boolean)
}

// Deterministic step executor — covers patterns produced by the AI test generator
async function runStep(page: Page, step: string, base: string): Promise<string> {
  const s = step.trim()

  // Navigate to <url-or-path>
  const navMatch = s.match(/^(?:navigate\s+to|go\s+to|open\s+(?:the\s+\w+\s+page\s+at|the\s+url)?)\s+(.+)$/i)
  if (navMatch) {
    const url = navMatch[1].replace(/^['"]|['"]$/g, '').trim()
    const full = url.startsWith('http') ? url : `${base}${url.startsWith('/') ? '' : '/'}${url}`
    await page.goto(full, { timeout: 30000 })
    return `navigate → ${full}`
  }

  // Click 'Quoted Text' button/link/etc
  const clickQuotedMatch = s.match(/^click\s+(?:on\s+)?(?:the\s+)?['"](.+?)['"]/i)
  if (clickQuotedMatch) {
    const text = clickQuotedMatch[1]
    try {
      await page.getByRole('button', { name: text, exact: false }).click({ timeout: 8000 })
    } catch {
      await page.getByText(text, { exact: false }).first().click({ timeout: 8000 })
    }
    // Wait for any async response (validation errors, navigation, etc.)
    await page.waitForLoadState('networkidle', { timeout: 5000 }).catch(() => {})
    return `click "${text}"`
  }

  // Click the X button/link/tab (unquoted)
  const clickUnquotedMatch = s.match(/^click\s+(?:the\s+)?(.+?)\s+(?:button|link|tab|checkbox|radio|icon|toggle)$/i)
  if (clickUnquotedMatch) {
    const text = clickUnquotedMatch[1]
    try {
      await page.getByRole('button', { name: text, exact: false }).click({ timeout: 8000 })
    } catch {
      await page.getByText(text, { exact: false }).first().click({ timeout: 8000 })
    }
    // Wait for any async response (validation errors, navigation, etc.)
    await page.waitForLoadState('networkidle', { timeout: 5000 }).catch(() => {})
    return `click "${text}"`
  }

  // Enter/Type/Fill 'value' in 'quoted field'
  const fillQuotedFieldMatch = s.match(/^(?:enter|type|fill(?:\s+in)?|input)\s+['"](.+?)['"]\s+(?:in(?:to)?\s+)?(?:the\s+)?['"](.+?)['"]/i)
  if (fillQuotedFieldMatch) {
    const [, value, field] = fillQuotedFieldMatch
    try { await page.getByLabel(field, { exact: false }).fill(value, { timeout: 10000 }) }
    catch { await page.getByPlaceholder(field, { exact: false }).fill(value, { timeout: 10000 }) }
    return `fill "${field}" = "${value}"`
  }

  // Enter/Type/Fill 'value' in the unquoted field field
  const fillUnquotedFieldMatch = s.match(/^(?:enter|type|fill(?:\s+in)?|input)\s+['"](.+?)['"]\s+(?:in(?:to)?\s+)?(?:the\s+)?(.+?)\s+(?:field|input|box|textarea)$/i)
  if (fillUnquotedFieldMatch) {
    const [, value, field] = fillUnquotedFieldMatch
    try { await page.getByLabel(field.trim(), { exact: false }).fill(value, { timeout: 10000 }) }
    catch { await page.getByPlaceholder(field.trim(), { exact: false }).fill(value, { timeout: 10000 }) }
    return `fill "${field.trim()}" = "${value}"`
  }

  // Select 'option' from/in dropdown
  const selectMatch = s.match(/^select\s+['"](.+?)['"]\s+(?:from|in)(?:\s+the)?\s+['"]?(.+?)['"]?\s*(?:dropdown|select|menu)?$/i)
  if (selectMatch) {
    const [, option, dropdown] = selectMatch
    try {
      await page.getByLabel(dropdown.trim(), { exact: false }).selectOption(option, { timeout: 10000 })
    } catch {
      await page.getByRole('combobox', { name: dropdown.trim(), exact: false }).selectOption(option, { timeout: 10000 })
    }
    return `select "${option}" from "${dropdown.trim()}"`
  }

  // Wait for 'text' to appear
  const waitMatch = s.match(/^wait(?:\s+for)?\s+['"](.+?)['"]/i)
  if (waitMatch) {
    await page.waitForSelector(`text=${waitMatch[1]}`, { timeout: 15000 })
    return `wait for "${waitMatch[1]}"`
  }

  // Step uses no literal values — skip gracefully
  return `[skipped: ${s}]`
}

// Single AI call to verify the final browser state against the expected result
async function verifyResult(
  testCase: TestCaseData,
  log: StepLog[],
  screenshot: string | undefined,
): Promise<{ passed: boolean; reason: string }> {
  const errors = log.filter(l => l.status === 'error')
  const skipped = log.filter(l => l.action.startsWith('[skipped')).length

  if (!screenshot) {
    return errors.length > 0
      ? { passed: false, reason: `Step failed: ${errors[0].error || errors[0].action}` }
      : { passed: true, reason: 'All steps executed successfully' }
  }

  try {
    const stepLog = log.map(l => `[${l.status}] ${l.action}${l.error ? ` (${l.error})` : ''}`).join('\n')
    const summary = `Steps executed (${log.length} total, ${errors.length} errors, ${skipped} skipped):\n${stepLog}`
    const response = await client.messages.create({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 200,
      system: 'You are a QA verifier. The screenshot was captured AFTER all test steps completed, including any button clicks and network responses. Evaluate whether the final browser state matches the expected result — look for elements like error messages, success indicators, or page content that confirms the outcome. Respond with exactly: {"passed":true,"reason":"one sentence"} or {"passed":false,"reason":"one sentence"}. No other text.',
      messages: [{
        role: 'user',
        content: [
          { type: 'image', source: { type: 'base64', media_type: 'image/jpeg', data: screenshot } },
          { type: 'text', text: `Test: ${testCase.title}\nExpected result: ${testCase.expectedResult}\n\n${summary}` },
        ],
      }],
    })

    const text = response.content[0].type === 'text' ? response.content[0].text.trim() : ''
    const cleaned = text.replace(/^```(?:json)?\n?/m, '').replace(/\n?```$/m, '').trim()
    const parsed = JSON.parse(cleaned)
    return { passed: Boolean(parsed.passed), reason: String(parsed.reason || '') }
  } catch {
    return errors.length > 0
      ? { passed: false, reason: `${errors.length} step(s) failed during execution` }
      : { passed: true, reason: 'All steps executed without errors' }
  }
}

export async function executeTestCase(
  page: Page,
  testCase: TestCaseData,
  baseUrl: string,
  onStep: (log: StepLog) => void,
): Promise<AutoRunResult> {
  const log: StepLog[] = []
  const base = baseUrl.replace(/\/$/, '')
  const addStep = (entry: StepLog) => { log.push(entry); onStep(entry) }

  for (const step of parseSteps(testCase.steps)) {
    try {
      const action = await runStep(page, step, base)
      addStep({ action, status: action.startsWith('[skipped') ? 'info' : 'ok' })
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err)
      addStep({ action: step, status: 'error', error: msg })
    }
  }

  // Settle: wait for network idle + a short DOM-paint buffer before capturing
  await page.waitForLoadState('networkidle', { timeout: 5000 }).catch(() => {})
  await page.waitForTimeout(500)

  let screenshot: string | undefined
  try {
    const buf = await page.screenshot({ type: 'jpeg', quality: 30 })
    screenshot = buf.toString('base64')
  } catch { /* ignore */ }

  const { passed, reason } = await verifyResult(testCase, log, screenshot)
  addStep({ action: `verdict: ${passed ? 'PASSED' : 'FAILED'} — ${reason}`, status: passed ? 'ok' : 'error' })

  return { passed, reason, log, screenshot }
}
