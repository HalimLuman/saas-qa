import { db } from '@/lib/db'

export async function logActivity(opts: {
  projectId: string
  userId: string
  action: string
  targetType: string
  targetId: string
  metadata?: Record<string, unknown>
}) {
  try {
    await db.activityEvent.create({
      data: {
        projectId: opts.projectId,
        userId: opts.userId,
        action: opts.action,
        targetType: opts.targetType,
        targetId: opts.targetId,
        metadata: opts.metadata ? JSON.stringify(opts.metadata) : null,
      },
    })
  } catch {
    // Never let activity logging crash the caller
  }
}
