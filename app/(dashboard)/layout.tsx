import { redirect } from 'next/navigation'
import { auth } from '@/lib/auth'
import { db } from '@/lib/db'
import AppSidebar from '@/components/app-sidebar'
import CommandPalette from '@/components/command-palette'
import Topbar from '@/components/topbar'
import { TopbarActionsProvider } from '@/components/topbar-actions-provider'

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const session = await auth()
  if (!session?.user?.id) redirect('/login')

  const [dbUser, projects, openBugsCount] = await Promise.all([
    db.user.findUnique({
      where: { id: session.user.id },
      select: { plan: true, aiCallsToday: true, email: true, name: true },
    }),
    db.project.findMany({
      where: { userId: session.user.id },
      select: { id: true, name: true },
      orderBy: { name: 'asc' },
    }),
    db.bugReport.count({
      where: { project: { userId: session.user.id }, status: { in: ['OPEN', 'IN_PROGRESS'] } },
    }),
  ])

  const displayName = dbUser?.name ?? session.user.name ?? dbUser?.email?.split('@')[0] ?? 'User'
  const userInitials = displayName.slice(0, 2).toUpperCase()

  const user = {
    name: dbUser?.name ?? session.user.name ?? null,
    email: dbUser?.email ?? session.user.email ?? null,
    plan: dbUser?.plan ?? 'FREE',
    aiCallsToday: dbUser?.aiCallsToday ?? 0,
  }

  return (
    <TopbarActionsProvider>
      <div className="flex h-screen overflow-hidden" style={{ background: 'var(--page-bg)' }}>
        <AppSidebar user={user} projects={projects} openBugsCount={openBugsCount} />
        <div className="flex-1 flex flex-col min-h-0 overflow-hidden">
          <Topbar userInitials={userInitials} userName={displayName} workspaceName={displayName} projects={projects} />
          <main className="flex-1 overflow-y-auto overflow-x-hidden">
            <div className="p-6 lg:p-8 max-w-7xl mx-auto">
              {children}
            </div>
          </main>
        </div>
        <CommandPalette />
      </div>
    </TopbarActionsProvider>
  )
}
