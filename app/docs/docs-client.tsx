'use client'

import { useState, useEffect, useRef } from 'react'
import Link from 'next/link'
import {
  FlaskConical, Menu, X, BookOpen, Sparkles, Bug, PlayCircle,
  Code2, Plug, Globe, CreditCard, FolderOpen, Layers, Settings,
  Zap, Check, ChevronRight, GitBranch, Bell, Database, Shield,
  AlertTriangle, Info, ExternalLink, Copy,
} from 'lucide-react'

// ── Sidebar nav structure ──────────────────────────────────────────────────────

const SIDEBAR = [
  {
    group: 'Getting Started',
    icon: BookOpen,
    items: [
      { id: 'introduction', label: 'Introduction' },
      { id: 'quick-start', label: 'Quick Start' },
      { id: 'plans', label: 'Plans & Limits' },
    ],
  },
  {
    group: 'Projects',
    icon: FolderOpen,
    items: [
      { id: 'projects', label: 'Managing Projects' },
      { id: 'project-settings', label: 'Project Settings' },
      { id: 'areas', label: 'Areas & Modules' },
    ],
  },
  {
    group: 'Test Cases',
    icon: Layers,
    items: [
      { id: 'test-cases', label: 'Creating Test Cases' },
      { id: 'test-properties', label: 'Properties Reference' },
      { id: 'test-versions', label: 'Version History' },
      { id: 'test-bulk', label: 'Bulk Operations' },
      { id: 'test-import', label: 'Importing Tests' },
    ],
  },
  {
    group: 'AI Generation',
    icon: Sparkles,
    items: [
      { id: 'ai-generation', label: 'How It Works' },
      { id: 'ai-options', label: 'Generation Options' },
      { id: 'ai-sessions', label: 'Generation History' },
    ],
  },
  {
    group: 'Bug Tracking',
    icon: Bug,
    items: [
      { id: 'bugs', label: 'Creating Bugs' },
      { id: 'bug-properties', label: 'Properties Reference' },
      { id: 'bug-ai', label: 'AI Bug Features' },
      { id: 'bug-push', label: 'Pushing Bugs' },
    ],
  },
  {
    group: 'Regression Suites',
    icon: PlayCircle,
    items: [
      { id: 'suites', label: 'Creating Suites' },
      { id: 'suite-runs', label: 'Running Suites' },
      { id: 'suite-results', label: 'Viewing Results' },
      { id: 'suite-export', label: 'Exporting Results' },
    ],
  },
  {
    group: 'API Testing',
    icon: Code2,
    items: [
      { id: 'api-testing', label: 'Collections & Requests' },
      { id: 'api-assertions', label: 'Assertions' },
      { id: 'api-environments', label: 'Environments' },
    ],
  },
  {
    group: 'Integrations',
    icon: Plug,
    items: [
      { id: 'integrations', label: 'Overview' },
      { id: 'integration-jira', label: 'Jira' },
      { id: 'integration-github', label: 'GitHub Issues' },
      { id: 'integration-linear', label: 'Linear' },
      { id: 'integration-azure', label: 'Azure DevOps' },
    ],
  },
  {
    group: 'Webhooks',
    icon: Bell,
    items: [
      { id: 'webhooks', label: 'Setting Up Webhooks' },
      { id: 'webhook-events', label: 'Event Types' },
      { id: 'webhook-security', label: 'Signature Verification' },
    ],
  },
  {
    group: 'Billing',
    icon: CreditCard,
    items: [
      { id: 'billing', label: 'Plans Overview' },
      { id: 'billing-upgrade', label: 'Upgrading' },
      { id: 'billing-portal', label: 'Customer Portal' },
    ],
  },
]

// ── Helpers ────────────────────────────────────────────────────────────────────

function scrollToId(id: string) {
  const el = document.getElementById(id)
  if (el) {
    const y = el.getBoundingClientRect().top + window.scrollY - 80
    window.scrollTo({ top: y, behavior: 'smooth' })
  }
}

// ── Small content components ───────────────────────────────────────────────────

function SectionHeading({ id, children }: { id: string; children: React.ReactNode }) {
  return (
    <h2
      id={id}
      className="text-2xl font-bold mt-14 mb-5 scroll-mt-24 flex items-center gap-2"
      style={{ color: '#0f172a' }}
    >
      {children}
    </h2>
  )
}

function SubHeading({ id, children }: { id: string; children: React.ReactNode }) {
  return (
    <h3
      id={id}
      className="text-lg font-semibold mt-10 mb-3 scroll-mt-24"
      style={{ color: '#0f172a' }}
    >
      {children}
    </h3>
  )
}

function Prose({ children }: { children: React.ReactNode }) {
  return (
    <p className="text-[15px] leading-relaxed mb-4" style={{ color: '#475569' }}>
      {children}
    </p>
  )
}

function Note({ type = 'info', children }: { type?: 'info' | 'warn' | 'tip'; children: React.ReactNode }) {
  const map = {
    info: { icon: Info, color: '#2563eb', bg: 'rgba(37,99,235,0.06)', border: 'rgba(37,99,235,0.2)' },
    warn: { icon: AlertTriangle, color: '#d97706', bg: 'rgba(217,119,6,0.06)', border: 'rgba(217,119,6,0.2)' },
    tip: { icon: Zap, color: '#059669', bg: 'rgba(5,150,105,0.06)', border: 'rgba(5,150,105,0.2)' },
  }
  const { icon: Icon, color, bg, border } = map[type]
  return (
    <div
      className="flex gap-3 rounded-xl p-4 my-5 text-[14px]"
      style={{ background: bg, border: `1px solid ${border}` }}
    >
      <Icon className="h-4 w-4 shrink-0 mt-0.5" style={{ color }} />
      <span style={{ color: '#475569' }}>{children}</span>
    </div>
  )
}

function CodeBlock({ children }: { children: string }) {
  return (
    <pre
      className="rounded-xl p-4 my-4 text-[13px] overflow-x-auto font-mono leading-relaxed"
      style={{ background: '#0f172a', border: '1px solid rgba(99,120,200,0.14)', color: '#93c5fd' }}
    >
      <code>{children}</code>
    </pre>
  )
}

function PropTable({ rows }: { rows: { prop: string; type: string; desc: string }[] }) {
  return (
    <div
      className="rounded-xl overflow-hidden my-5 text-[13px]"
      style={{ border: '1px solid rgba(99,120,200,0.14)' }}
    >
      <div
        className="grid grid-cols-[180px_130px_1fr] gap-0"
        style={{ background: '#f8faff', borderBottom: '1px solid rgba(99,120,200,0.14)' }}
      >
        {['Property', 'Type / Values', 'Description'].map((h) => (
          <div key={h} className="px-4 py-2.5 text-xs font-semibold uppercase tracking-wider" style={{ color: '#94a3b8' }}>{h}</div>
        ))}
      </div>
      {rows.map((r, i) => (
        <div
          key={r.prop}
          className="grid grid-cols-[180px_130px_1fr]"
          style={{ borderBottom: i < rows.length - 1 ? '1px solid rgba(99,120,200,0.08)' : 'none' }}
        >
          <div className="px-4 py-3 font-mono text-[12px]" style={{ color: '#2563eb' }}>{r.prop}</div>
          <div className="px-4 py-3" style={{ color: '#059669' }}>{r.type}</div>
          <div className="px-4 py-3" style={{ color: '#475569' }}>{r.desc}</div>
        </div>
      ))}
    </div>
  )
}

function StepList({ steps }: { steps: string[] }) {
  return (
    <ol className="space-y-2 my-4 pl-1">
      {steps.map((step, i) => (
        <li key={i} className="flex items-start gap-3 text-[14px]" style={{ color: '#475569' }}>
          <span
            className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-[11px] font-bold mt-0.5"
            style={{ background: 'rgba(37,99,235,0.1)', border: '1px solid rgba(37,99,235,0.22)', color: '#2563eb' }}
          >
            {i + 1}
          </span>
          <span>{step}</span>
        </li>
      ))}
    </ol>
  )
}

function BulletList({ items }: { items: string[] }) {
  return (
    <ul className="space-y-1.5 my-4 pl-1">
      {items.map((item, i) => (
        <li key={i} className="flex items-start gap-2.5 text-[14px]" style={{ color: '#475569' }}>
          <Check className="h-3.5 w-3.5 shrink-0 mt-1" style={{ color: '#2563eb' }} />
          <span>{item}</span>
        </li>
      ))}
    </ul>
  )
}

function PlanTable() {
  const plans = [
    { name: 'Free', price: '$0', projects: '2', ai: '5 / day', tests: '50 / project', bugs: '10 / project' },
    { name: 'Pro', price: '$15/mo', projects: '15', ai: '75 / day', tests: '5,000 / project', bugs: '1,000 / project' },
    { name: 'Team', price: '$29/user/mo', projects: 'Unlimited', ai: '150 / user / day', tests: 'Unlimited', bugs: 'Unlimited' },
  ]
  const cols = ['Plan', 'Price', 'Projects', 'AI Generations', 'Test Cases', 'Bug Reports']
  return (
    <div className="rounded-xl overflow-hidden my-5 text-[13px]" style={{ border: '1px solid rgba(99,120,200,0.14)' }}>
      <div
        className="grid gap-0"
        style={{ gridTemplateColumns: 'repeat(6,1fr)', background: '#f8faff', borderBottom: '1px solid rgba(99,120,200,0.14)' }}
      >
        {cols.map((c) => (
          <div key={c} className="px-4 py-2.5 text-xs font-semibold uppercase tracking-wider" style={{ color: '#94a3b8' }}>{c}</div>
        ))}
      </div>
      {plans.map((p, i) => (
        <div
          key={p.name}
          className="grid"
          style={{ gridTemplateColumns: 'repeat(6,1fr)', borderBottom: i < plans.length - 1 ? '1px solid rgba(99,120,200,0.08)' : 'none', background: p.name === 'Pro' ? 'rgba(37,99,235,0.03)' : 'transparent' }}
        >
          <div className="px-4 py-3 font-semibold" style={{ color: '#0f172a' }}>{p.name}</div>
          <div className="px-4 py-3" style={{ color: '#2563eb' }}>{p.price}</div>
          <div className="px-4 py-3" style={{ color: '#475569' }}>{p.projects}</div>
          <div className="px-4 py-3" style={{ color: '#475569' }}>{p.ai}</div>
          <div className="px-4 py-3" style={{ color: '#475569' }}>{p.tests}</div>
          <div className="px-4 py-3" style={{ color: '#475569' }}>{p.bugs}</div>
        </div>
      ))}
    </div>
  )
}

// ── Main component ─────────────────────────────────────────────────────────────

export default function DocsClient() {
  const [activeId, setActiveId] = useState('introduction')
  const [sidebarOpen, setSidebarOpen] = useState(false)

  useEffect(() => {
    const allIds = SIDEBAR.flatMap((g) => g.items.map((i) => i.id))
    const observers: IntersectionObserver[] = []

    allIds.forEach((id) => {
      const el = document.getElementById(id)
      if (!el) return
      const obs = new IntersectionObserver(
        ([entry]) => { if (entry.isIntersecting) setActiveId(id) },
        { rootMargin: '-20% 0px -70% 0px', threshold: 0 }
      )
      obs.observe(el)
      observers.push(obs)
    })

    return () => observers.forEach((o) => o.disconnect())
  }, [])

  return (
    <div className="min-h-screen" style={{ background: '#ffffff' }}>

      {/* ── Top bar ── */}
      <header
        className="sticky top-0 z-50 flex items-center justify-between px-5 h-14"
        style={{ background: 'rgba(255,255,255,0.95)', backdropFilter: 'blur(18px)', borderBottom: '1px solid rgba(99,120,200,0.12)' }}
      >
        <div className="flex items-center gap-4">
          {/* mobile hamburger */}
          <button
            className="lg:hidden p-1.5 rounded-lg"
            style={{ color: '#64748b' }}
            onClick={() => setSidebarOpen(!sidebarOpen)}
            aria-label="Toggle sidebar"
          >
            {sidebarOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
          <Link href="/" className="flex items-center gap-2 shrink-0">
            <div
              className="h-7 w-7 rounded-lg flex items-center justify-center"
              style={{ background: 'linear-gradient(135deg, #1d4ed8 0%, #1e3a8a 100%)' }}
            >
              <FlaskConical className="h-3.5 w-3.5 text-white" />
            </div>
            <span className="font-bold text-[15px] tracking-tight" style={{ color: '#0f172a' }}>softAssert</span>
            <span
              className="text-xs px-2 py-0.5 rounded-full font-medium ml-0.5"
              style={{ background: 'rgba(37,99,235,0.08)', border: '1px solid rgba(37,99,235,0.2)', color: '#1d4ed8' }}
            >
              Docs
            </span>
          </Link>
        </div>
        <div className="flex items-center gap-3">
          <Link
            href="/login"
            className="text-[13px] font-medium px-3 py-1.5 rounded-lg transition-colors"
            style={{ color: '#64748b' }}
          >
            Log in
          </Link>
          <Link
            href="/register"
            className="flex items-center gap-1 text-[13px] font-semibold px-3 py-1.5 rounded-lg text-white"
            style={{ background: 'linear-gradient(135deg, #1d4ed8 0%, #1e3a8a 100%)', boxShadow: '0 2px 8px rgba(37,99,235,0.25)' }}
          >
            Get started <ChevronRight className="h-3 w-3" />
          </Link>
        </div>
      </header>

      <div className="flex relative">

        {/* ── Sidebar ── */}
        <>
          {/* Mobile overlay */}
          {sidebarOpen && (
            <div
              className="fixed inset-0 z-30 lg:hidden"
              style={{ background: 'rgba(0,0,0,0.5)' }}
              onClick={() => setSidebarOpen(false)}
            />
          )}

          <aside
            className={`fixed top-14 left-0 h-[calc(100vh-56px)] z-40 w-64 overflow-y-auto transition-transform duration-200
              lg:sticky lg:translate-x-0 lg:shrink-0
              ${sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}`}
            style={{ background: '#f9fafb', borderRight: '1px solid rgba(99,120,200,0.1)' }}
          >
            <nav className="p-4 pb-16">
              {SIDEBAR.map((group) => {
                const Icon = group.icon
                return (
                  <div key={group.group} className="mb-6">
                    <div
                      className="flex items-center gap-2 px-2 mb-1.5 text-[11px] font-semibold uppercase tracking-wider"
                      style={{ color: '#94a3b8' }}
                    >
                      <Icon className="h-3 w-3" />
                      {group.group}
                    </div>
                    {group.items.map((item) => {
                      const isActive = activeId === item.id
                      return (
                        <button
                          key={item.id}
                          onClick={() => { scrollToId(item.id); setSidebarOpen(false) }}
                          className="w-full text-left px-3 py-1.5 rounded-lg text-[13px] mb-0.5 transition-all"
                          style={{
                            background: isActive ? 'rgba(37,99,235,0.08)' : 'transparent',
                            color: isActive ? '#1d4ed8' : '#64748b',
                            borderLeft: isActive ? '2px solid #2563eb' : '2px solid transparent',
                            fontWeight: isActive ? 500 : 400,
                          }}
                        >
                          {item.label}
                        </button>
                      )
                    })}
                  </div>
                )
              })}
            </nav>
          </aside>
        </>

        {/* ── Main content ── */}
        <main className="flex-1 min-w-0 px-6 lg:px-12 xl:px-16 py-10 max-w-4xl">

          {/* ════════════════════════════════════════════════ GETTING STARTED */}

          <div id="introduction" className="scroll-mt-24">
            <div
              className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-semibold mb-6"
              style={{ background: 'rgba(37,99,235,0.08)', border: '1px solid rgba(37,99,235,0.2)', color: '#1d4ed8' }}
            >
              <BookOpen className="h-3 w-3" /> Getting Started
            </div>
            <h1 className="text-4xl font-extrabold mb-4 leading-tight" style={{ color: '#0f172a' }}>softAssert Documentation</h1>
            <Prose>
              softAssert is an AI-powered QA platform that brings together test case management, bug tracking,
              regression suites, and API testing in one place. It is built for individual QA engineers and teams
              who want to move fast without losing confidence.
            </Prose>
            <Prose>
              This guide covers every feature in softAssert — from creating your first project to setting up
              webhooks that fire into your CI/CD pipeline.
            </Prose>
          </div>

          <SectionHeading id="quick-start">Quick Start</SectionHeading>
          <Prose>Get from zero to your first generated test suite in under five minutes.</Prose>
          <StepList steps={[
            'Go to /register and create a free account — no credit card required.',
            'From the dashboard, click "New Project" and give it a name.',
            'Open your project and navigate to the Generate tab.',
            'Describe a feature in plain English (e.g. "User login with email and password, including forgot password flow") and click Generate.',
            'Review the generated test cases, accept the ones you want, and they are saved to your project.',
            'Head to the Bugs tab to log any issues you find while testing.',
            'Build a Regression Suite from your tests and run it to track pass/fail.',
          ]} />
          <Note type="tip">
            Your Free plan includes 5 AI generations per day and up to 50 test cases per project.
            Upgrade to Pro for 75 generations/day and 5,000 test cases per project.
          </Note>

          <SectionHeading id="plans">Plans & Limits</SectionHeading>
          <Prose>
            softAssert enforces per-plan limits on projects, AI generations, test cases, and bug reports.
            Limits reset at midnight UTC for AI generation counts.
          </Prose>
          <PlanTable />
          <BulletList items={[
            'AI generation count resets every 24 hours at midnight UTC.',
            'Test case and bug limits are per project, not per account.',
            'Upgrading takes effect immediately. Downgrading takes effect at the end of your billing cycle.',
            'Exports (CSV, Excel) are available on all plans. JSON export requires Pro or Team.',
          ]} />

          {/* ════════════════════════════════════════════════ PROJECTS */}

          <SectionHeading id="projects">
            <FolderOpen className="h-6 w-6" style={{ color: '#3b82f6' }} /> Managing Projects
          </SectionHeading>
          <Prose>
            A project is the top-level workspace in softAssert. Everything — test cases, bugs, suites, API collections,
            and integrations — lives inside a project.
          </Prose>
          <SubHeading id="projects-create">Creating a Project</SubHeading>
          <StepList steps={[
            'From the dashboard, click "New Project".',
            'Enter a project name (required) and optional description.',
            'Click "Create". You are taken to the project overview page.',
          ]} />
          <Prose>
            Free accounts can have up to 2 projects. Pro accounts support 15. Team has no limit.
          </Prose>
          <SubHeading id="projects-overview">Project Overview</SubHeading>
          <Prose>The project overview shows:</Prose>
          <BulletList items={[
            'Total test cases and breakdown by status (Draft, Approved, Deprecated).',
            'Open and resolved bug counts.',
            'Recent activity from the project activity log.',
            'Quick actions: Generate Tests, New Bug, New Suite.',
          ]} />

          <SectionHeading id="project-settings">
            <Settings className="h-6 w-6" style={{ color: '#3b82f6' }} /> Project Settings
          </SectionHeading>
          <Prose>Access project settings from the Settings tab inside any project.</Prose>
          <PropTable rows={[
            { prop: 'Custom Rules', type: 'text', desc: 'Free-form instructions the AI follows when generating test cases for this project (e.g., "always include accessibility checks", "test on mobile viewport").' },
            { prop: 'Default Priority', type: 'P0–P3', desc: 'Priority pre-selected when creating a new test case manually.' },
            { prop: 'Modules List', type: 'comma list', desc: 'A set of module/area names that appear as quick suggestions when assigning an area to a test or bug.' },
            { prop: 'Bug Copy Format', type: 'template', desc: 'A template string controlling how bug details are formatted when using the "Copy" button on a bug. Supports placeholders like {{title}}, {{steps}}, {{severity}}.' },
          ]} />

          <SectionHeading id="areas">
            <Layers className="h-6 w-6" style={{ color: '#3b82f6' }} /> Areas & Modules
          </SectionHeading>
          <Prose>
            Areas are named sections of your product (e.g., "Authentication", "Checkout", "Notifications").
            They let you group test cases and bugs by functional area and filter/report on them independently.
          </Prose>
          <SubHeading id="areas-create">Creating Areas</SubHeading>
          <StepList steps={[
            'Open your project and go to the Areas tab.',
            'Click "New Area".',
            'Enter a name, choose a color, and optionally set a sort order.',
            'Click "Create".',
          ]} />
          <Prose>
            You can then assign any test case or bug to an area using the Area field on the create/edit form.
            Areas can be edited, reordered, or deleted at any time. Deleting an area does not delete the tests
            or bugs inside it — they simply become unassigned.
          </Prose>

          {/* ════════════════════════════════════════════════ TEST CASES */}

          <SectionHeading id="test-cases">
            <Layers className="h-6 w-6" style={{ color: '#3b82f6' }} /> Creating Test Cases
          </SectionHeading>
          <Prose>
            Test cases are the core unit of work in softAssert. Each describes a specific scenario to validate,
            with structured steps and a clear expected result.
          </Prose>
          <StepList steps={[
            'Open your project and go to the Tests tab.',
            'Click "New Test Case".',
            'Fill in the Title, Preconditions, Steps, and Expected Result.',
            'Set Priority, Category, and optionally assign an Area.',
            'Click "Save". The test is saved as DRAFT by default.',
          ]} />
          <Note type="info">
            Test cases created via AI generation have source type <strong>AI_GENERATED</strong> and are saved
            directly from the Generate page. Screen-recording-derived bugs can also produce test cases with
            source type <strong>FROM_RECORDING</strong>.
          </Note>

          <SubHeading id="tests-filter">Filtering & Searching</SubHeading>
          <Prose>Use the filter bar on the Tests tab to narrow down the test case list:</Prose>
          <BulletList items={[
            'Filter by Priority: P0, P1, P2, P3 (multiple can be selected).',
            'Filter by Category: Functional, Negative, Boundary, Security, Performance, Accessibility.',
            'Filter by Status: Draft, Approved, Deprecated.',
            'Filter by Area: any area defined in the project.',
            'Toggle "Show Archived" to include or exclude archived tests.',
            'Search by keyword — matches against the test case title.',
          ]} />

          <SectionHeading id="test-properties">Properties Reference</SectionHeading>
          <PropTable rows={[
            { prop: 'title', type: 'string', desc: 'Short description of what the test is verifying.' },
            { prop: 'preconditions', type: 'text', desc: 'State that must be true before the test can be executed (e.g., "User must be logged in").' },
            { prop: 'steps', type: 'text', desc: 'Numbered step-by-step instructions to execute the test.' },
            { prop: 'expectedResult', type: 'text', desc: 'The observable outcome if the feature is working correctly.' },
            { prop: 'priority', type: 'P0–P3', desc: 'P0 = blocker, P1 = high, P2 = medium, P3 = low.' },
            { prop: 'category', type: 'enum', desc: 'FUNCTIONAL | NEGATIVE | BOUNDARY | SECURITY | PERFORMANCE | ACCESSIBILITY' },
            { prop: 'status', type: 'enum', desc: 'DRAFT (default) | APPROVED | DEPRECATED' },
            { prop: 'area', type: 'Area ref', desc: 'Optional — the functional area this test belongs to.' },
            { prop: 'sourceType', type: 'enum', desc: 'MANUAL | AI_GENERATED | FROM_RECORDING — set automatically.' },
          ]} />

          <SectionHeading id="test-versions">Version History</SectionHeading>
          <Prose>
            Every save to a test case creates a new version automatically. This gives you a full audit trail
            of how tests evolve over time.
          </Prose>
          <BulletList items={[
            'Click the history icon on any test case to open the version drawer.',
            'Each version shows a timestamp and a diff of what changed.',
            'Click "Restore" on any version to roll the test case back to that state.',
            'Restoring creates a new version rather than deleting intermediate ones.',
          ]} />

          <SectionHeading id="test-bulk">Bulk Operations</SectionHeading>
          <Prose>
            Use checkboxes in the test case list to select multiple tests at once, then use the bulk action
            toolbar that appears.
          </Prose>
          <BulletList items={[
            'Archive selected — moves tests to the archived state (hidden from the default view).',
            'Unarchive selected — restores archived tests to the active list.',
            'Delete selected — permanently deletes the selected test cases.',
            'Change status — set DRAFT, APPROVED, or DEPRECATED on all selected tests.',
          ]} />
          <Note type="warn">
            Deleting test cases is permanent and cannot be undone. Prefer archiving if you may need
            the test cases later.
          </Note>

          <SectionHeading id="test-import">Importing Test Cases</SectionHeading>
          <Prose>
            You can import test cases in bulk into a project using the Import option on the Tests tab.
            The imported file should contain the test case fields (title, steps, expected result, priority,
            category) in a structured format. After upload, the system parses the file and creates the test
            cases as MANUAL source with DRAFT status.
          </Prose>

          {/* ════════════════════════════════════════════════ AI GENERATION */}

          <SectionHeading id="ai-generation">
            <Sparkles className="h-6 w-6" style={{ color: '#8b5cf6' }} /> How AI Generation Works
          </SectionHeading>
          <Prose>
            softAssert uses Claude (Anthropic) to generate structured test cases from a feature description.
            The AI takes on the persona of a senior QA engineer and produces cases with preconditions,
            numbered steps, expected results, priority, and category — ready to be saved directly to
            your project.
          </Prose>
          <StepList steps={[
            'Open your project and go to the Generate tab (or use the global AI Studio from the sidebar).',
            'Choose an input mode: Free Text, User Story, or API Spec.',
            'Write or paste your feature description (10–5,000 characters).',
            'Configure output options: count, priority floor, and which categories to include.',
            'Click "Generate". Results appear in seconds.',
            'Review each generated test case. Accept the ones you want added to the project.',
            'Optionally leave thumbs up/down feedback to help improve future results.',
          ]} />

          <SubHeading id="ai-input-modes">Input Modes</SubHeading>
          <PropTable rows={[
            { prop: 'Free Text', type: 'mode', desc: 'Describe the feature or flow in plain English. Best for early-stage or loosely-defined features.' },
            { prop: 'User Story', type: 'mode', desc: 'Paste a formal user story ("As a [role], I want [goal], so that [benefit]"). The AI extracts acceptance criteria to structure the tests.' },
            { prop: 'API Spec', type: 'mode', desc: 'Paste an OpenAPI snippet or endpoint description. The AI generates functional, negative, boundary, and security test cases for the endpoints.' },
          ]} />
          <Note type="info">
            Any <strong>Custom Rules</strong> set in Project Settings are automatically injected into the
            AI prompt for every generation in that project.
          </Note>

          <SectionHeading id="ai-options">Generation Options</SectionHeading>
          <PropTable rows={[
            { prop: 'count', type: '1–25', desc: 'Number of test cases to generate per session.' },
            { prop: 'priorityFloor', type: 'P0–P3', desc: 'Minimum priority level. The AI will not generate tests below this priority.' },
            { prop: 'categories', type: 'multi-select', desc: 'Which test categories to include: Functional, Negative, Boundary, Security, Performance, Accessibility.' },
          ]} />
          <Prose>
            Daily AI generation limits are enforced per account, not per project.
            Reaching the limit returns an error; the counter resets every 24 hours at midnight UTC.
          </Prose>

          <SectionHeading id="ai-sessions">Generation History</SectionHeading>
          <Prose>
            Every generation run is saved as a session. Navigate to <strong>Generate → History</strong> inside
            a project (or the AI Studio history view) to see all past sessions.
          </Prose>
          <BulletList items={[
            'Each session shows the input text, timestamp, token usage, and how many tests were generated.',
            'You can re-open a session to review which tests were accepted.',
            'Feedback ratings (thumbs up/down) are stored per session.',
          ]} />

          {/* ════════════════════════════════════════════════ BUG TRACKING */}

          <SectionHeading id="bugs">
            <Bug className="h-6 w-6" style={{ color: '#f43f5e' }} /> Creating Bugs
          </SectionHeading>
          <Prose>
            Bug reports in softAssert capture the full context of a defect — steps to reproduce, expected vs.
            actual behavior, severity, and environment. Each bug gets an auto-incrementing sequence number
            per project (e.g., <code className="text-[12px] font-mono" style={{ color: '#93c5fd' }}>BUG-001</code>).
          </Prose>
          <StepList steps={[
            'Open your project and go to the Bugs tab.',
            'Click "New Bug".',
            'Fill in the Title, Description, Steps to Reproduce, Expected Behavior, and Actual Behavior.',
            'Set the Severity and assign an Area if applicable.',
            'Add the Environment (browser, OS, device).',
            'Click "Submit Bug".',
          ]} />

          <SectionHeading id="bug-properties">Bug Properties Reference</SectionHeading>
          <PropTable rows={[
            { prop: 'title', type: 'string', desc: 'One-line summary of the defect.' },
            { prop: 'description', type: 'text', desc: 'Full detail of what is broken and any relevant context.' },
            { prop: 'stepsToReproduce', type: 'text', desc: 'Numbered steps that reliably trigger the bug.' },
            { prop: 'expectedBehavior', type: 'text', desc: 'What the feature should do according to spec.' },
            { prop: 'actualBehavior', type: 'text', desc: 'What the feature does instead.' },
            { prop: 'severity', type: 'enum', desc: 'CRITICAL | HIGH | MEDIUM | LOW' },
            { prop: 'status', type: 'enum', desc: 'OPEN | IN_PROGRESS | RESOLVED | CLOSED | WONT_FIX' },
            { prop: 'environment', type: 'string', desc: 'Browser version, OS, device, screen size — any context useful for reproduction.' },
            { prop: 'area', type: 'Area ref', desc: 'Optional — the functional area where the bug was found.' },
          ]} />

          <SubHeading id="bug-status">Status Workflow</SubHeading>
          <Prose>Bugs follow a linear status progression, though any status can be set directly:</Prose>
          <CodeBlock>{`OPEN  ──►  IN_PROGRESS  ──►  RESOLVED
                              └──►  CLOSED
                              └──►  WONT_FIX`}</CodeBlock>

          <SectionHeading id="bug-ai">AI Bug Features</SectionHeading>

          <SubHeading id="bug-ai-duplicates">Duplicate Detection</SubHeading>
          <Prose>
            Before you submit a bug, softAssert scans your existing open bugs using AI to find semantically
            similar reports. If duplicates are found, they are listed so you can decide whether to merge,
            link, or proceed with a new report.
          </Prose>

          <SubHeading id="bug-ai-severity">Severity Suggestion</SubHeading>
          <Prose>
            Based on the bug title, description, and steps, the AI suggests a severity level (CRITICAL,
            HIGH, MEDIUM, or LOW). You can accept the suggestion or override it before saving.
          </Prose>

          <SubHeading id="bug-ai-recording">Recording Analysis</SubHeading>
          <Prose>
            Upload a screen recording of the bug in the "New Bug" form. The AI watches the video and
            automatically fills in the title, steps to reproduce, expected behavior, and actual behavior.
            You can edit any of the auto-filled fields before saving.
          </Prose>

          <SectionHeading id="bug-push">Pushing Bugs to External Systems</SectionHeading>
          <Prose>
            Once a project integration is configured (see Integrations), a <strong>Push</strong> button
            appears on every bug detail page. Click it to create the bug as an issue in the connected platform.
          </Prose>
          <BulletList items={[
            'Severity maps to the external platform\'s priority field (CRITICAL → Highest, HIGH → High, etc.).',
            'The bug title, description, steps, expected/actual behavior, and environment are all included.',
            'Pushing is one-directional — status changes in the external tool are not automatically synced back.',
          ]} />

          {/* ════════════════════════════════════════════════ SUITES */}

          <SectionHeading id="suites">
            <PlayCircle className="h-6 w-6" style={{ color: '#10b981' }} /> Creating Regression Suites
          </SectionHeading>
          <Prose>
            A regression suite is a named collection of test cases that can be executed together on a
            schedule or on demand. Suites are the backbone of structured testing cycles — smoke tests
            before releases, nightly regression runs, and PR gates.
          </Prose>
          <StepList steps={[
            'Open your project and go to the Suites tab.',
            'Click "New Suite".',
            'Enter a name, description, and choose a cadence.',
            'Set a fail threshold (percentage of tests that must pass for the run to be considered passing).',
            'Use filters to define which test cases belong to this suite (by area, priority, category).',
            'Click "Create Suite".',
          ]} />
          <PropTable rows={[
            { prop: 'name', type: 'string', desc: 'Display name for the suite.' },
            { prop: 'description', type: 'text', desc: 'What this suite covers and when it should run.' },
            { prop: 'cadence', type: 'enum', desc: 'EVERY_PR | NIGHTLY | WEEKLY | MANUAL — informational label for CI integration.' },
            { prop: 'failThreshold', type: 'number %', desc: 'Minimum pass rate required for a run to be marked as passed. Default is 100%.' },
            { prop: 'filters', type: 'object', desc: 'Area, priority, category filters that define which tests are included in the suite.' },
          ]} />

          <SectionHeading id="suite-runs">Running Suites</SectionHeading>
          <StepList steps={[
            'Open the suite and click "Start Run".',
            'A new run record is created with status IN_PROGRESS.',
            'Work through each test case in the run view.',
            'For each test, mark the result: PASSED, FAILED, BLOCKED, or SKIPPED.',
            'Optionally add a note to any test result.',
            'When all tests have a result, click "Complete Run" or mark it as Aborted to stop early.',
          ]} />
          <PropTable rows={[
            { prop: 'NOT_RUN', type: 'result', desc: 'Default state — test has not been executed in this run yet.' },
            { prop: 'PASSED', type: 'result', desc: 'Test executed and the feature behaved as expected.' },
            { prop: 'FAILED', type: 'result', desc: 'Test executed and the feature did not behave as expected.' },
            { prop: 'BLOCKED', type: 'result', desc: 'Test could not be executed due to a dependency or environment issue.' },
            { prop: 'SKIPPED', type: 'result', desc: 'Test was intentionally not run in this cycle.' },
          ]} />

          <SectionHeading id="suite-results">Viewing Results</SectionHeading>
          <Prose>
            After a run is completed, the results page shows:
          </Prose>
          <BulletList items={[
            'Pass rate for the run (passed tests ÷ total run tests × 100).',
            'Breakdown by result status (passed, failed, blocked, skipped).',
            'Which tests failed, with any notes added during execution.',
            'Duration from start to completion.',
            'Whether the run met the suite\'s fail threshold.',
          ]} />
          <Prose>
            The suite overview page lists all historical runs and lets you track pass rate trends over time.
          </Prose>

          <SectionHeading id="suite-export">Exporting Results</SectionHeading>
          <Prose>
            Export a suite or run to share results with stakeholders outside softAssert.
          </Prose>
          <BulletList items={[
            'CSV — plain comma-separated export, compatible with any spreadsheet tool.',
            'Excel (.xlsx) — formatted workbook with separate tabs for suite summary and per-test results.',
            'Export includes: test title, preconditions, steps, expected result, priority, area, result, and any notes.',
          ]} />

          {/* ════════════════════════════════════════════════ API TESTING */}

          <SectionHeading id="api-testing">
            <Code2 className="h-6 w-6" style={{ color: '#f59e0b' }} /> Collections & Requests
          </SectionHeading>
          <Prose>
            softAssert has a built-in API testing module. You can define collections of HTTP requests,
            add assertions, use environment variables, and run requests directly from the browser.
          </Prose>

          <SubHeading id="api-collections">Collections</SubHeading>
          <Prose>
            A collection is a named group of related API requests (e.g., "Auth Endpoints", "Order API").
          </Prose>
          <StepList steps={[
            'Open your project and go to the API Tests tab.',
            'Click "New Collection" and enter a name.',
            'Inside the collection, click "Add Request".',
          ]} />

          <SubHeading id="api-request-config">Request Configuration</SubHeading>
          <PropTable rows={[
            { prop: 'method', type: 'enum', desc: 'GET | POST | PUT | PATCH | DELETE' },
            { prop: 'url', type: 'string', desc: 'Full URL or path. Supports environment variable interpolation: {{base_url}}/users.' },
            { prop: 'headers', type: 'key/value', desc: 'HTTP headers to send with the request. Environment variables are supported.' },
            { prop: 'queryParams', type: 'key/value', desc: 'Query string parameters appended to the URL.' },
            { prop: 'body', type: 'string', desc: 'Request body — JSON, form data, or plain text. Environment variables are supported.' },
          ]} />

          <SectionHeading id="api-assertions">Assertions</SectionHeading>
          <Prose>
            Assertions are checks that run against the response after a request is executed.
            Add assertions to a request to validate that the API is behaving correctly.
          </Prose>
          <PropTable rows={[
            { prop: 'type', type: 'enum', desc: 'status_code | body | header | response_time' },
            { prop: 'target', type: 'string', desc: 'For body: a JSON path (e.g., $.user.id). For header: the header name. For response_time: leave blank.' },
            { prop: 'operator', type: 'enum', desc: 'equals | contains | greater_than | less_than | not_equals | matches_regex' },
            { prop: 'value', type: 'string', desc: 'Expected value to compare against.' },
          ]} />
          <Prose>Example assertions:</Prose>
          <CodeBlock>{`status_code  | (no target)       | equals       | 200
body         | $.user.email      | equals       | test@example.com
header       | content-type      | contains     | application/json
response_time| (no target)       | less_than    | 500`}</CodeBlock>

          <SectionHeading id="api-environments">Environments</SectionHeading>
          <Prose>
            Environments allow you to swap out variable values without editing every request.
            Create separate environments for Production, Staging, and Local development.
          </Prose>
          <StepList steps={[
            'In the API Tests tab, click "Environments".',
            'Click "New Environment" and give it a name (e.g., "Staging").',
            'Add key/value variables (e.g., base_url = https://staging.api.example.com).',
            'Set this environment as the default for the project, or select it per-run.',
          ]} />
          <Prose>
            Use variables in requests with double-brace syntax: <code className="font-mono text-[12px]" style={{ color: '#93c5fd' }}>{'{{base_url}}'}</code>,{' '}
            <code className="font-mono text-[12px]" style={{ color: '#93c5fd' }}>{'{{api_token}}'}</code>.
            Variables are resolved at run time using the active environment.
          </Prose>

          {/* ════════════════════════════════════════════════ INTEGRATIONS */}

          <SectionHeading id="integrations">
            <Plug className="h-6 w-6" style={{ color: '#06b6d4' }} /> Integrations Overview
          </SectionHeading>
          <Prose>
            softAssert can push bugs (and test cases) into external platforms. Each integration is
            configured per project and can be enabled or disabled independently.
          </Prose>
          <StepList steps={[
            'Open your project and go to Settings → Integrations.',
            'Click "Add Integration" and choose a platform.',
            'Fill in the required credentials (see platform sections below).',
            'Click "Save". The integration becomes active.',
            'On any bug detail page, click "Push" to send the bug to the connected platform.',
          ]} />
          <Note type="warn">
            Credentials are encrypted at rest. Tokens are masked on the settings page after saving —
            you must re-enter the token to update it.
          </Note>

          <SectionHeading id="integration-jira">Jira</SectionHeading>
          <PropTable rows={[
            { prop: 'baseUrl', type: 'string', desc: 'Your Jira instance URL, e.g. https://yourcompany.atlassian.net' },
            { prop: 'projectKey', type: 'string', desc: 'Jira project key (visible in the URL, e.g. QA, ENG).' },
            { prop: 'email', type: 'string', desc: 'Your Atlassian account email address.' },
            { prop: 'apiToken', type: 'string', desc: 'Jira API token — generate from id.atlassian.com → Security → API Tokens.' },
          ]} />
          <Prose>Severity maps to Jira priority: CRITICAL → Highest, HIGH → High, MEDIUM → Medium, LOW → Low.</Prose>

          <SectionHeading id="integration-github">GitHub Issues</SectionHeading>
          <PropTable rows={[
            { prop: 'owner', type: 'string', desc: 'GitHub username or org name (the first part of the repo URL).' },
            { prop: 'repo', type: 'string', desc: 'Repository name.' },
            { prop: 'token', type: 'string', desc: 'Personal access token with repo scope — generate from GitHub → Settings → Developer Settings.' },
          ]} />
          <Prose>Bugs are created as GitHub Issues. Severity is added as an issue label.</Prose>

          <SectionHeading id="integration-linear">Linear</SectionHeading>
          <PropTable rows={[
            { prop: 'apiKey', type: 'string', desc: 'Linear personal API key — generate from Linear → Settings → API.' },
            { prop: 'teamId', type: 'string', desc: 'The Linear team ID to create issues in (visible in Linear URL or API).' },
          ]} />
          <Prose>Bugs are created as Linear issues. Priority is mapped from softAssert severity.</Prose>

          <SectionHeading id="integration-azure">Azure DevOps</SectionHeading>
          <PropTable rows={[
            { prop: 'organizationUrl', type: 'string', desc: 'Your Azure DevOps org URL, e.g. https://dev.azure.com/yourorg' },
            { prop: 'project', type: 'string', desc: 'Azure DevOps project name.' },
            { prop: 'token', type: 'string', desc: 'Personal access token with Work Items read+write scope.' },
          ]} />
          <Prose>Azure DevOps supports pushing both bugs and test cases. Bugs become work items of type Bug.</Prose>

          {/* ════════════════════════════════════════════════ WEBHOOKS */}

          <SectionHeading id="webhooks">
            <Bell className="h-6 w-6" style={{ color: '#a78bfa' }} /> Setting Up Webhooks
          </SectionHeading>
          <Prose>
            Webhooks send an HTTP POST to a URL of your choice when events occur in softAssert.
            Use them to trigger CI/CD pipelines, post Slack notifications, or sync with other tools.
          </Prose>
          <StepList steps={[
            'Open your project and go to Settings → Webhooks.',
            'Click "New Webhook".',
            'Enter the destination URL.',
            'Select which events should trigger this webhook.',
            'Optionally enter a secret for HMAC signature verification.',
            'Choose a platform: Custom, Slack, or Discord.',
            'Click "Create". The webhook is immediately active.',
          ]} />
          <PropTable rows={[
            { prop: 'url', type: 'string', desc: 'The HTTPS endpoint that will receive POST requests from softAssert.' },
            { prop: 'events', type: 'string[]', desc: 'Which events trigger this webhook (see Event Types below).' },
            { prop: 'secret', type: 'string', desc: 'Optional. Used to compute an HMAC-SHA256 signature sent in the X-softAssert-Signature header.' },
            { prop: 'platform', type: 'enum', desc: 'CUSTOM | SLACK | DISCORD. Slack and Discord receive pre-formatted message payloads.' },
            { prop: 'enabled', type: 'boolean', desc: 'Toggle the webhook on or off without deleting it.' },
          ]} />

          <SectionHeading id="webhook-events">Event Types</SectionHeading>
          <PropTable rows={[
            { prop: 'run.completed', type: 'event', desc: 'Fires when a regression suite run is marked as COMPLETED. Payload includes run summary, pass rate, and suite info.' },
            { prop: 'run.failed', type: 'event', desc: 'Fires when a run completes and the pass rate is below the suite\'s fail threshold.' },
            { prop: 'bug.created', type: 'event', desc: 'Fires when a new bug report is submitted. Payload includes bug title, severity, area, and project.' },
            { prop: 'bug.status_changed', type: 'event', desc: 'Fires when a bug\'s status is updated. Payload includes old and new status.' },
          ]} />

          <SectionHeading id="webhook-security">Signature Verification</SectionHeading>
          <Prose>
            When a secret is set, every webhook request includes an <code className="font-mono text-[12px]" style={{ color: '#93c5fd' }}>X-softAssert-Signature</code> header.
            This is an HMAC-SHA256 hex digest of the raw request body, signed with your secret.
            Verify it in your endpoint to confirm the request came from softAssert.
          </Prose>
          <CodeBlock>{`// Node.js example
import crypto from 'crypto'

function verifyWebhook(rawBody: string, secret: string, signature: string) {
  const expected = crypto
    .createHmac('sha256', secret)
    .update(rawBody)
    .digest('hex')
  return crypto.timingSafeEqual(
    Buffer.from(signature),
    Buffer.from(expected)
  )
}`}</CodeBlock>
          <Note type="warn">
            Always use a timing-safe comparison (e.g., <code className="font-mono text-[12px]">crypto.timingSafeEqual</code>)
            rather than a plain string equality check to prevent timing attacks.
          </Note>

          {/* ════════════════════════════════════════════════ BILLING */}

          <SectionHeading id="billing">
            <CreditCard className="h-6 w-6" style={{ color: '#3b82f6' }} /> Plans Overview
          </SectionHeading>
          <Prose>
            softAssert uses Stripe for all payment processing. Your card details are never stored on softAssert
            servers — they are handled entirely by Stripe.
          </Prose>
          <PlanTable />
          <BulletList items={[
            'All plans include CSV export, suite execution, version history, and AI duplicate detection.',
            'Pro adds Excel export, custom project rules, screenshot annotation, and priority email support.',
            'Team adds Jira/Linear/GitHub push integrations, audit log, and Slack priority support.',
          ]} />

          <SectionHeading id="billing-upgrade">Upgrading</SectionHeading>
          <StepList steps={[
            'Go to Settings → Billing from the sidebar.',
            'Click "Upgrade to Pro" or "Upgrade to Team".',
            'You are redirected to Stripe Checkout to complete payment.',
            'After payment, your plan upgrades immediately — no need to log out and back in.',
          ]} />
          <Note type="tip">
            Pro plans come with a <strong>14-day money-back guarantee</strong>. If you are not satisfied
            in the first 14 days, email us for a full refund — no questions asked.
          </Note>

          <SectionHeading id="billing-portal">Customer Portal</SectionHeading>
          <Prose>
            The Stripe customer portal lets you manage every aspect of your subscription without
            contacting support.
          </Prose>
          <BulletList items={[
            'Update your payment method or add a backup card.',
            'View and download past invoices.',
            'Cancel your subscription (downgrade takes effect at end of billing cycle).',
            'Switch between monthly and annual billing (contact us for annual).',
          ]} />
          <StepList steps={[
            'Go to Settings → Billing.',
            'Click "Manage Subscription".',
            'You are redirected to the Stripe portal. Changes take effect immediately (or at cycle end for downgrades).',
          ]} />

          {/* ── Footer spacer ── */}
          <div className="h-20" />
        </main>

        {/* ── Right on-page TOC (large screens only) ── */}
        <aside className="hidden xl:block w-56 shrink-0 sticky top-14 h-[calc(100vh-56px)] overflow-y-auto py-10 pr-6">
          <div className="text-[11px] font-semibold uppercase tracking-wider mb-3" style={{ color: '#94a3b8' }}>
            On this page
          </div>
          <nav className="space-y-0.5">
            {SIDEBAR.map((group) =>
              group.items.map((item) => (
                <button
                  key={item.id}
                  onClick={() => scrollToId(item.id)}
                  className="w-full text-left text-[12px] py-1 px-2 rounded transition-colors block"
                  style={{
                    color: activeId === item.id ? '#1d4ed8' : '#94a3b8',
                    fontWeight: activeId === item.id ? 500 : 400,
                  }}
                >
                  {item.label}
                </button>
              ))
            )}
          </nav>
        </aside>
      </div>
    </div>
  )
}
