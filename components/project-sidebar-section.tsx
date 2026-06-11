'use client'

import { usePathname } from 'next/navigation'
import {
  LayoutDashboard,
  Map,
  FlaskConical,
  Layers,
  Bug,
  Globe,
  Sparkles,
  Clock,
  Settings,
  ChevronLeft,
} from 'lucide-react'
import SidebarNavLink from './sidebar-nav-link'
import Link from 'next/link'

interface Project {
  id: string
  name: string
}

export default function ProjectSidebarSection({ projects }: { projects: Project[] }) {
  const pathname = usePathname()

  const match = pathname.match(/^\/project\/([^/]+)/)
  if (!match) return null

  const projectId = match[1]
  const project = projects.find((p) => p.id === projectId)
  if (!project) return null

  const base = `/project/${projectId}`

  return (
    <div
      className="pt-2.5 mt-1"
      style={{ borderTop: '1px solid var(--sb-divider)' }}
    >
      {/* Project context header */}
      <div className="px-3 mb-2 flex items-center gap-1.5">
        <Link
          href="/dashboard"
          className="flex items-center gap-1 text-[10px] font-semibold uppercase tracking-widest transition-opacity hover:opacity-70"
          style={{ color: 'var(--sb-bc-back)' }}
        >
          <ChevronLeft className="h-2.5 w-2.5" />
          Projects
        </Link>
        <span style={{ color: 'var(--sb-bc-sep)' }}>/</span>
        <span
          className="text-[10px] font-bold uppercase tracking-widest truncate flex-1"
          style={{ color: 'var(--sb-bc-project)' }}
          title={project.name}
        >
          {project.name}
        </span>
      </div>

      {/* Project navigation */}
      <div className="space-y-0.5">
        <SidebarNavLink href={base} exact icon={<LayoutDashboard className="h-[14px] w-[14px]" />}>
          Overview
        </SidebarNavLink>
        <SidebarNavLink href={`${base}/tests`} icon={<FlaskConical className="h-[14px] w-[14px]" />}>
          Tests
        </SidebarNavLink>
        <SidebarNavLink href={`${base}/bugs`} icon={<Bug className="h-[14px] w-[14px]" />}>
          Bugs
        </SidebarNavLink>
        <SidebarNavLink href={`${base}/suites`} icon={<Layers className="h-[14px] w-[14px]" />}>
          Suites
        </SidebarNavLink>
        <SidebarNavLink href={`${base}/generate`} icon={<Sparkles className="h-[14px] w-[14px]" />}>
          AI Generate
        </SidebarNavLink>
        <SidebarNavLink href={`${base}/areas`} icon={<Map className="h-[14px] w-[14px]" />}>
          Areas
        </SidebarNavLink>
        <SidebarNavLink href={`${base}/activity`} icon={<Clock className="h-[14px] w-[14px]" />}>
          Activity
        </SidebarNavLink>
        <SidebarNavLink href={`${base}/api-tests`} icon={<Globe className="h-[14px] w-[14px]" />}>
          API tests
        </SidebarNavLink>
        <SidebarNavLink href={`${base}/settings`} icon={<Settings className="h-[14px] w-[14px]" />}>
          Settings
        </SidebarNavLink>
      </div>
    </div>
  )
}
