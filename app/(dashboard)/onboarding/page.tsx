'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { FlaskConical, ArrowRight, Check, Plus, X } from 'lucide-react'
import { toast } from 'sonner'

const AREA_PRESETS = [
  { name: 'Authentication', color: '#6366f1' },
  { name: 'Dashboard', color: '#10b981' },
  { name: 'User Settings', color: '#3b82f6' },
  { name: 'API', color: '#f59e0b' },
  { name: 'Checkout', color: '#8b5cf6' },
  { name: 'Search', color: '#06b6d4' },
  { name: 'Notifications', color: '#f97316' },
  { name: 'Admin Panel', color: '#ef4444' },
  { name: 'Mobile', color: '#ec4899' },
]

export default function OnboardingPage() {
  const router = useRouter()
  const [step, setStep] = useState<1 | 2>(1)
  const [projectName, setProjectName] = useState('')
  const [description, setDescription] = useState('')
  const [selectedAreas, setSelectedAreas] = useState<Set<string>>(new Set())
  const [customArea, setCustomArea] = useState('')
  const [customAreas, setCustomAreas] = useState<string[]>([])
  const [submitting, setSubmitting] = useState(false)

  function togglePreset(name: string) {
    setSelectedAreas((prev) => {
      const next = new Set(prev)
      if (next.has(name)) next.delete(name)
      else next.add(name)
      return next
    })
  }

  function addCustomArea() {
    const name = customArea.trim()
    if (!name || customAreas.includes(name) || selectedAreas.has(name)) return
    setCustomAreas((prev) => [...prev, name])
    setCustomArea('')
  }

  function removeCustomArea(name: string) {
    setCustomAreas((prev) => prev.filter((a) => a !== name))
  }

  async function handleSubmit() {
    if (!projectName.trim()) return
    setSubmitting(true)
    try {
      const projRes = await fetch('/api/projects', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: projectName.trim(),
          description: description.trim() || undefined,
        }),
      })
      const projData = await projRes.json()
      if (!projRes.ok) throw new Error(projData.error ?? 'Failed to create project')
      const projectId = projData.project.id

      const areasToCreate = [
        ...AREA_PRESETS.filter((p) => selectedAreas.has(p.name)),
        ...customAreas.map((name) => ({ name, color: '#64748b' })),
      ]

      if (areasToCreate.length > 0) {
        await Promise.all(
          areasToCreate.map((area) =>
            fetch(`/api/projects/${projectId}/areas`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify(area),
            })
          )
        )
      }

      router.push(`/project/${projectId}`)
    } catch (err: unknown) {
      toast.error(String(err))
      setSubmitting(false)
    }
  }

  const totalAreas = selectedAreas.size + customAreas.length

  return (
    <div className="min-h-[80vh] flex items-center justify-center">
      <div className="max-w-lg w-full mx-auto space-y-6">

        {/* Header */}
        <div className="text-center space-y-2">
          <div
            className="inline-flex items-center justify-center h-14 w-14 rounded-2xl mb-2"
            style={{
              background: 'linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)',
              boxShadow: '0 10px 28px rgba(59,130,246,0.4)',
            }}
          >
            <FlaskConical className="h-7 w-7 text-white" />
          </div>
          <h1 className="text-2xl font-bold tracking-tight" style={{ color: 'var(--text-primary)' }}>
            Welcome to softAssert
          </h1>
          <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
            {step === 1
              ? 'Manage test cases, track bugs, and run regression suites — all in one place.'
              : 'Add the areas of your product you want to test. You can always add more later.'}
          </p>
        </div>

        {/* Progress indicator */}
        <div className="flex items-center justify-center gap-2">
          {([1, 2] as const).map((n) => (
            <div
              key={n}
              className="h-1.5 rounded-full transition-all duration-300"
              style={{
                width: step === n ? 32 : 16,
                background: step >= n ? '#3b82f6' : 'var(--border)',
              }}
            />
          ))}
        </div>

        {/* Step 1: Project details */}
        {step === 1 && (
          <div className="glass-card rounded-2xl p-6 space-y-5">
            <div className="space-y-1.5">
              <label
                htmlFor="project-name"
                className="text-sm font-semibold"
                style={{ color: 'var(--text-primary)' }}
              >
                Project name <span style={{ color: '#ef4444' }}>*</span>
              </label>
              <p className="text-xs" style={{ color: 'var(--text-tertiary)' }}>
                e.g. &quot;Mobile App&quot;, &quot;API Backend&quot;, &quot;E-commerce Site&quot;
              </p>
              <input
                id="project-name"
                type="text"
                value={projectName}
                onChange={(e) => setProjectName(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && projectName.trim() && setStep(2)}
                placeholder="My Project"
                maxLength={100}
                autoFocus
                className="w-full px-3 py-2.5 rounded-xl text-sm outline-none transition-all"
                style={{
                  background: 'var(--surface-2)',
                  border: '1px solid var(--border)',
                  color: 'var(--text-primary)',
                }}
              />
            </div>

            <div className="space-y-1.5">
              <label
                htmlFor="project-description"
                className="text-sm font-semibold"
                style={{ color: 'var(--text-primary)' }}
              >
                Description{' '}
                <span className="font-normal text-xs" style={{ color: 'var(--text-tertiary)' }}>
                  (optional)
                </span>
              </label>
              <p className="text-xs" style={{ color: 'var(--text-tertiary)' }}>
                A short summary of what this project covers
              </p>
              <textarea
                id="project-description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="e.g. Core user-facing web app — covers auth, billing, and the main product flow."
                maxLength={500}
                rows={3}
                className="w-full px-3 py-2.5 rounded-xl text-sm outline-none transition-all resize-none"
                style={{
                  background: 'var(--surface-2)',
                  border: '1px solid var(--border)',
                  color: 'var(--text-primary)',
                }}
              />
            </div>

            <button
              onClick={() => setStep(2)}
              disabled={!projectName.trim()}
              className="w-full flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-semibold text-white transition-all duration-150 disabled:opacity-50 hover:opacity-90 active:scale-[0.98]"
              style={{
                background: 'linear-gradient(135deg, #3b82f6 0%, #1d4ed8 60%, #1e3a8a 100%)',
                boxShadow: '0 4px 20px rgba(59,130,246,0.35)',
              }}
            >
              Next: Add test areas
              <ArrowRight className="h-4 w-4" />
            </button>
          </div>
        )}

        {/* Step 2: Test areas */}
        {step === 2 && (
          <div className="glass-card rounded-2xl p-6 space-y-5">

            {/* Preset chips */}
            <div className="space-y-3">
              <p className="text-xs font-semibold uppercase tracking-widest" style={{ color: 'var(--text-tertiary)' }}>
                Common areas — click to select
              </p>
              <div className="flex flex-wrap gap-2">
                {AREA_PRESETS.map((preset) => {
                  const active = selectedAreas.has(preset.name)
                  return (
                    <button
                      key={preset.name}
                      onClick={() => togglePreset(preset.name)}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all duration-150"
                      style={{
                        background: active ? `${preset.color}20` : 'var(--surface-2)',
                        border: `1px solid ${active ? preset.color : 'var(--border)'}`,
                        color: active ? preset.color : 'var(--text-secondary)',
                      }}
                    >
                      {active && <Check className="h-3 w-3" />}
                      {preset.name}
                    </button>
                  )
                })}
              </div>
            </div>

            {/* Custom area input */}
            <div className="space-y-2">
              <p className="text-xs font-semibold uppercase tracking-widest" style={{ color: 'var(--text-tertiary)' }}>
                Add a custom area
              </p>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={customArea}
                  onChange={(e) => setCustomArea(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && addCustomArea()}
                  placeholder="e.g. Onboarding, Reports, Integrations…"
                  maxLength={100}
                  className="flex-1 px-3 py-2 rounded-xl text-sm outline-none transition-all"
                  style={{
                    background: 'var(--surface-2)',
                    border: '1px solid var(--border)',
                    color: 'var(--text-primary)',
                  }}
                />
                <button
                  onClick={addCustomArea}
                  disabled={!customArea.trim()}
                  className="px-3 py-2 rounded-xl transition-all disabled:opacity-40 hover:opacity-80"
                  style={{ background: 'var(--surface-2)', border: '1px solid var(--border)', color: 'var(--text-secondary)' }}
                >
                  <Plus className="h-4 w-4" />
                </button>
              </div>

              {customAreas.length > 0 && (
                <div className="flex flex-wrap gap-2 pt-1">
                  {customAreas.map((name) => (
                    <span
                      key={name}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium"
                      style={{
                        background: 'rgba(100,116,139,0.12)',
                        border: '1px solid rgba(100,116,139,0.25)',
                        color: 'var(--text-secondary)',
                      }}
                    >
                      {name}
                      <button
                        onClick={() => removeCustomArea(name)}
                        className="opacity-60 hover:opacity-100 transition-opacity"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </span>
                  ))}
                </div>
              )}
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => setStep(1)}
                className="px-4 py-3 rounded-xl text-sm font-semibold transition-all hover:opacity-80"
                style={{ background: 'var(--surface-2)', border: '1px solid var(--border)', color: 'var(--text-secondary)' }}
              >
                Back
              </button>
              <button
                onClick={handleSubmit}
                disabled={submitting}
                className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-semibold text-white transition-all duration-150 disabled:opacity-50 hover:opacity-90 active:scale-[0.98]"
                style={{
                  background: 'linear-gradient(135deg, #3b82f6 0%, #1d4ed8 60%, #1e3a8a 100%)',
                  boxShadow: '0 4px 20px rgba(59,130,246,0.35)',
                }}
              >
                {submitting
                  ? 'Creating…'
                  : totalAreas > 0
                  ? `Create project with ${totalAreas} area${totalAreas !== 1 ? 's' : ''}`
                  : 'Create project'}
                {!submitting && <ArrowRight className="h-4 w-4" />}
              </button>
            </div>
          </div>
        )}

        <p
          className="text-center text-xs cursor-pointer hover:underline"
          style={{ color: 'var(--text-tertiary)' }}
          onClick={() => router.push('/dashboard')}
        >
          Skip onboarding → go to dashboard
        </p>
      </div>
    </div>
  )
}
