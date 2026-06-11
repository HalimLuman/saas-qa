import { notFound, redirect } from 'next/navigation'
import { auth } from '@/lib/auth'
import { db } from '@/lib/db'
import ApiTestingClient from './api-testing-client'

export default async function ApiTestsPage({ params }: { params: Promise<{ id: string }> }) {
  const session = await auth()
  if (!session?.user?.id) redirect('/login')

  const { id } = await params
  const project = await db.project.findFirst({
    where: { id, userId: session.user.id },
    select: { id: true, name: true },
  })
  if (!project) notFound()

  const [collections, environments] = await Promise.all([
    db.apiCollection.findMany({
      where: { projectId: id },
      orderBy: [{ sortOrder: 'asc' }, { createdAt: 'asc' }],
      include: {
        requests: {
          orderBy: [{ sortOrder: 'asc' }, { createdAt: 'asc' }],
          include: { assertions: { orderBy: { sortOrder: 'asc' } } },
        },
      },
    }),
    db.apiEnvironment.findMany({
      where: { projectId: id },
      orderBy: [{ isDefault: 'desc' }, { createdAt: 'asc' }],
    }),
  ])

  return (
    <div
      className="-mx-6 -my-6 lg:-mx-8 lg:-my-8 flex flex-col overflow-hidden"
      style={{ height: 'calc(100vh - 56px)' }}
    >
      <ApiTestingClient
        projectId={id}
        initialCollections={collections.map((c) => ({
          ...c,
          requests: c.requests.map((r) => ({
            ...r,
            headers: r.headers ?? null,
            queryParams: r.queryParams ?? null,
            body: r.body ?? null,
            bodyType: r.bodyType ?? null,
            auth: r.auth ?? null,
          })),
        }))}
        initialEnvironments={environments.map((e) => ({
          ...e,
          variables: (() => {
            try { return JSON.parse(e.variables) as Record<string, string> }
            catch { return {} }
          })(),
        }))}
      />
    </div>
  )
}
