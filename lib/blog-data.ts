export type BlogPost = {
  slug: string
  title: string
  excerpt: string
  category: string
  readTime: string
  publishedAt: string
  author: { name: string; role: string; initials: string; gradient: string }
  content: string
  featured?: boolean
}

export const BLOG_POSTS: BlogPost[] = [
  {
    slug: 'ai-test-case-generation-guide',
    title: 'How AI Is Changing Test Case Generation (And What QA Engineers Should Know)',
    excerpt: "AI can generate test cases faster than any human — but knowing how to prompt it, what to review, and where to rely on your own expertise is what separates a 10× QA engineer from someone who just outsources their thinking.",
    category: 'AI & QA',
    readTime: '8 min read',
    publishedAt: 'May 12, 2025',
    featured: true,
    author: { name: 'Priya S.', role: 'SDET', initials: 'PS', gradient: 'linear-gradient(135deg, #3b82f6, #8b5cf6)' },
    content: `
## The shift happening right now

A year ago, AI-generated test cases were a novelty. Today, teams using tools like softAssert are generating complete test suites in under a minute — and the output is genuinely useful, not just a party trick.

But there is a real skill gap opening up. QA engineers who understand **how to use AI as a force multiplier** are becoming significantly more productive than those who don't. And engineers who blindly trust AI output without review are shipping test suites with gaps.

This guide covers both sides of that equation.

---

## What AI does exceptionally well

### 1. Generating the boring-but-necessary cases

Happy path tests. Basic negative tests. Boundary value analysis. These follow patterns that AI has seen millions of times. When you describe a login flow, AI will reliably produce:

- Valid email + valid password → success
- Invalid password → error message
- Empty fields → validation error
- Email with spaces or caps → normalization check
- Password at exactly 8 chars vs 7 chars → boundary test

Writing these manually takes 20–30 minutes. AI does it in 15 seconds.

### 2. Security and edge cases you might miss at 4pm on a Friday

AI has seen a lot of security test patterns. When you describe an input field, it will suggest:
- SQL injection variants
- XSS payloads
- Excessively long inputs
- Unicode and emoji edge cases
- Concurrent submission scenarios

Not all will be relevant to your app, but having them in front of you is valuable.

### 3. Consistent structure across the team

When every engineer writes test cases differently — some terse, some verbose, some missing expected results — review and maintenance become painful. AI output is consistent by design. You can enforce that consistency as a team standard.

---

## What AI does NOT do well

### 1. Understanding your specific application context

AI doesn't know that your checkout flow has a legacy coupon system that breaks when applied after a specific promo. It doesn't know your payment provider has a known bug with certain card BINs. **Domain knowledge is irreplaceable.**

### 2. Prioritizing correctly

AI will give you 40 test cases for a simple feature. Not all 40 are equally important. A junior QA might run all 40. A senior QA knows which 10 actually matter for this release. That judgment call is yours.

### 3. Exploratory testing

The best bugs are found by curiosity, not by a checklist. AI generates checklists well. Exploratory testing — where you poke at the system looking for unexpected behavior — remains deeply human.

---

## How to get the best output

### Be specific in your prompt

**Weak prompt:**
> "Test cases for user registration"

**Strong prompt:**
> "Test cases for a user registration form. Fields: full name (required, max 100 chars), email (required, must be unique), password (min 8 chars, must contain one number). After submission, user receives a verification email and is redirected to a 'check your email' page. The app is a B2B SaaS so business email validation is important — we block common free email providers (gmail, yahoo, hotmail) for paid plans."

The second prompt gets you relevant security cases, business-logic tests, and edge cases specific to your context.

### Always review and prune

Treat AI output like a first draft from a junior engineer: useful as a starting point, but requiring your expert review. Remove cases that don't apply. Add cases the AI missed. Adjust expected results for your specific app behavior.

### Use AI for the structure, not the judgment

Let AI generate the skeleton. You fill in the knowledge that matters: known bugs, business rules, risk areas, and anything that requires domain expertise.

---

## The QA engineer who wins

The engineers who will thrive in an AI-augmented QA world are those who use AI to eliminate the mechanical parts of the job and invest the saved time in higher-value work: exploratory testing, risk analysis, test architecture, and cross-team collaboration.

The goal was never to write test cases. The goal was always to ship quality software.

AI is just making the path shorter.
    `.trim(),
  },
  {
    slug: 'writing-better-bug-reports',
    title: '5 Things Every Bug Report Needs (And Why Most Are Missing Them)',
    excerpt: 'A bad bug report gets closed as "cannot reproduce." A great one gets fixed in the next sprint. The difference is rarely about the bug — it is about how you communicate it.',
    category: 'Bug Reporting',
    readTime: '6 min read',
    publishedAt: 'May 5, 2025',
    author: { name: 'Carlos T.', role: 'QA Lead', initials: 'CT', gradient: 'linear-gradient(135deg, #f59e0b, #ef4444)' },
    content: `
## Why bug reports fail

Most bug reports fail for one of three reasons:

1. The developer can't reproduce the issue
2. The severity is wrong (either under- or over-stated)
3. The expected behavior is ambiguous

A well-structured bug report solves all three before anyone has to ask.

---

## The 5 elements every bug report needs

### 1. A title that describes the *behavior*, not the component

**Bad:** "Login broken"
**Good:** "Login form submits but redirects to 404 instead of dashboard when email contains uppercase letters"

The first tells a developer almost nothing. The second tells them exactly where to look.

### 2. Steps to reproduce — numbered, specific, complete

Include every step, even the obvious ones. "Obvious" is subjective, and you want zero ambiguity.

\`\`\`
1. Navigate to /login
2. Enter email: Test@Example.com (note uppercase T and E)
3. Enter password: ValidPass1
4. Click "Sign in"
5. Observe: page redirects to /404 instead of /dashboard
\`\`\`

Include environment details: browser, OS, screen size, any cookies or local storage state, whether the user is logged in as a specific role.

### 3. Expected vs. actual behavior

These are two separate fields for a reason. Don't conflate them.

- **Expected:** Successful login redirects to /dashboard
- **Actual:** Page redirects to /404

If you only write "login doesn't work," the developer has to interview you to understand what "work" means.

### 4. Correct severity

This is where most bug reports go wrong. Severity describes impact; priority describes urgency. They are different.

| Severity | Meaning |
|----------|---------|
| Critical | Data loss, security breach, complete feature down for all users |
| High | Major feature broken for a significant portion of users |
| Medium | Feature works but with significant UX friction; workaround exists |
| Low | Cosmetic issue, minor UX problem, edge case |

Inflating severity to get bugs fixed faster erodes trust. If everything is critical, nothing is.

### 5. Evidence: screenshot, video, or network log

A screenshot removes all ambiguity about the visual state. A short screen recording showing the exact steps is even better. Network logs (from DevTools) are invaluable for API bugs.

Tools like softAssert let you annotate screenshots directly so you can circle the exact element that's broken.

---

## The AI shortcut for severity

Deciding severity is genuinely hard — it requires knowing the app's user base, the business impact, and the current risk tolerance of the team. softAssert's AI severity suggestion considers these factors based on your project context and suggests a starting point.

You still make the call. But having a justified starting point speeds up the triage conversation significantly.

---

## A template you can use right now

\`\`\`
**Title:** [Component/Feature] [Behavior description]

**Environment:**
- Browser: Chrome 124 / macOS Sonoma
- User role: Admin
- Account state: Logged in, payment plan: Pro

**Steps to reproduce:**
1. ...
2. ...
3. ...

**Expected:** ...

**Actual:** ...

**Severity:** High — [one-sentence justification]

**Evidence:** [screenshot / video / log attached]

**Workaround:** [if any]
\`\`\`

Copy it into your team's Jira or Linear template. Your future self (and every developer you work with) will thank you.
    `.trim(),
  },
  {
    slug: 'regression-suite-strategy',
    title: 'Building a Regression Suite That Actually Gets Run',
    excerpt: 'Most regression suites are written once and slowly abandoned. The problem is usually not the test cases — it is the process around running them. Here is how to build one your team will actually use.',
    category: 'Test Strategy',
    readTime: '7 min read',
    publishedAt: 'April 28, 2025',
    author: { name: 'Maya R.', role: 'Senior QA Engineer', initials: 'MR', gradient: 'linear-gradient(135deg, #10b981, #3b82f6)' },
    content: `
## The regression suite graveyard

Every QA team I've joined has a regression suite graveyard: a folder full of Excel spreadsheets or a Jira epic with 300 test cases labeled "regression" that nobody has run in 6 months.

Why does this happen?

1. The suite is too big to run before every release
2. Ownership is unclear — no one feels responsible for keeping it updated
3. Running it is manual, time-consuming, and depressing
4. When it fails, nobody knows if the failure is a real bug or a stale test case

Here's how to build one that avoids all four failure modes.

---

## Start small and focused

A regression suite should cover the **most important user journeys** — not every test case you've ever written.

The right question is: "If this breaks in production and nobody catches it before release, how bad is the damage?"

For most products, this is 20–40 test cases, not 300.

### Categories to include:

- **Authentication:** Login, logout, session expiry, password reset
- **Core user journey:** The 2–3 things users do every single day
- **Billing and payments:** Anything that touches money
- **Data integrity:** Creates, updates, and deletes that touch the database
- **Integration touchpoints:** Anything that relies on a third-party API

Everything else is a candidate for a separate, less-frequently-run suite.

---

## Assign ownership, not authorship

"The QA team owns regression testing" means no individual feels responsible. Assign each suite to a specific person who is accountable for:

1. Keeping test cases current when the feature changes
2. Triaging failures to determine bug vs. stale test
3. Running the suite before each release

Rotation works well: own the regression suite for one sprint, hand it to a colleague for the next.

---

## Define your run cadence

| Suite type | Run frequency |
|------------|--------------|
| Smoke (10–15 cases) | Before every deploy |
| Core regression (30–50 cases) | Every sprint, before release |
| Full regression (all cases) | Major releases, once per quarter |

Don't try to run everything before every deploy. The suite won't get run at all.

---

## Make failures actionable

When a test case fails, the runner needs to quickly determine:

**Is this a real bug?**
- Can I reproduce it manually?
- Does it happen in staging too?
- Was there a recent code change in this area?

**Or is this a stale test case?**
- Did the feature behavior intentionally change?
- Is the expected result still accurate?
- Does the test need to be updated?

Document the answer in the test run. A "fail" with no comment is useless to the next person who runs the suite.

---

## Using softAssert for regression suites

softAssert's suite execution tracks pass/fail history over time, so you can see trends: is this particular test case flaky? Did pass rate drop after a specific sprint?

You can also link bug reports to failing test cases, so when a bug is fixed, you can verify it in context and update the test case if needed.

The goal is a living document, not a frozen artifact.

---

## The minimal viable regression process

1. Identify your top 30 user journeys
2. Write or generate test cases for each
3. Group them into a suite with a clear owner
4. Run it before every release
5. Update it when features change
6. Review and prune it every quarter

That's it. No automation required. No complex tooling. Just a consistent process that actually happens.

Automation can come later — and it will be much easier to build when you have a solid manual suite as the foundation.
    `.trim(),
  },
  {
    slug: 'qa-engineer-productivity',
    title: 'The QA Engineer Productivity Stack in 2025',
    excerpt: 'The tools have changed dramatically over the past two years. Here is what a modern QA engineer actually uses day-to-day — and the gaps that AI is starting to fill.',
    category: 'Tools & Productivity',
    readTime: '5 min read',
    publishedAt: 'April 21, 2025',
    author: { name: 'Priya S.', role: 'SDET', initials: 'PS', gradient: 'linear-gradient(135deg, #3b82f6, #8b5cf6)' },
    content: `
## The modern QA stack

The tools available to QA engineers in 2025 are dramatically better than what existed five years ago — but also more fragmented. Here is what's actually being used and why.

---

## Test management

**Legacy:** Excel spreadsheets, TestRail, Zephyr

**Modern:** softAssert, Linear, Notion

The shift is toward tools that integrate with development workflows rather than sitting in a separate silo. When your test cases live in the same system as your tickets and bugs, context is preserved and hand-offs are faster.

---

## Bug tracking

**Legacy:** Email chains, Jira with 50 custom fields nobody fills in

**Modern:** Linear, GitHub Issues, Jira with AI-assisted field population

The best bug reporters I know write great bug reports because they have a system, not because they're naturally gifted writers. Templates + AI severity suggestions = consistent reports without the cognitive overhead.

---

## Test execution

**Automated:**
- Playwright — the clear leader for end-to-end tests in 2025
- Vitest / Jest for unit and integration
- k6 for load testing

**Manual:**
- softAssert for structured suite execution with pass/fail tracking
- Screen recording tools for capturing reproduction steps
- BrowserStack for cross-browser coverage

---

## AI tools actually being used

This is where things have changed the most in the last 12 months.

**For test case generation:** softAssert, GitHub Copilot (for automated test code)

**For bug description:** AI severity suggestions (softAssert), Grammarly for clarity

**For root cause analysis:** Claude or GPT-4 for analyzing stack traces and logs

**For test data:** AI-generated synthetic data that respects constraints

---

## The stack gap: between manual and automated

The biggest productivity gap in QA today is between manual testing and automated testing. Manual is flexible but slow. Automated is fast but brittle and expensive to maintain.

AI is starting to fill this gap:

- Generate Playwright test skeletons from manual test cases (softAssert export)
- Identify which test cases are worth automating based on run frequency and failure rate
- Suggest which areas of the codebase lack test coverage

The QA engineers who are most productive in 2025 aren't fully manual or fully automated — they're strategic about which tests live in each layer.

---

## What to cut

The tools that used to be standard but are worth reconsidering:

**TestRail:** Powerful but expensive for what you get. Most teams use 20% of the features.

**Selenium:** Playwright is strictly better in almost every scenario.

**Dedicated defect management systems:** When bugs live in Jira and test cases live in TestRail and the connection between them is manual, things fall through the cracks. Consolidate where possible.

---

## The 80/20 stack

If I had to recommend a starting point for a QA engineer joining a new team in 2025:

1. **softAssert** for test case generation, bug reporting, and suite management
2. **Linear or Jira** for issue tracking (whichever the dev team uses)
3. **Playwright** for automated regression tests on the top 10 user journeys
4. **BrowserStack** for cross-browser and cross-device coverage
5. **Loom or Kap** for recording reproduction steps

Everything else is optional. Start simple, add complexity only when you have a specific problem that demands it.
    `.trim(),
  },
]

export function getPostBySlug(slug: string): BlogPost | undefined {
  return BLOG_POSTS.find((p) => p.slug === slug)
}

export function getAllSlugs(): string[] {
  return BLOG_POSTS.map((p) => p.slug)
}
