import { NextRequest } from 'next/server'
import { z } from 'zod'
import { auth } from '@/lib/auth'
import { db } from '@/lib/db'
import Anthropic from '@anthropic-ai/sdk'

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

const schema = z.object({
  title: z.string().min(1),
  description: z.string().optional(),
})

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth()
  if (!session?.user?.id) return Response.json({ error: 'Unauthorized' }, { status: 401 })

  const { id } = await params
  const project = await db.project.findFirst({ where: { id, userId: session.user.id } })
  if (!project) return Response.json({ error: 'Not found' }, { status: 404 })

  const body = await request.json()
  const parsed = schema.safeParse(body)
  if (!parsed.success) return Response.json({ error: 'Invalid input' }, { status: 400 })

  const { title, description } = parsed.data

  const openBugs = await db.bugReport.findMany({
    where: { projectId: id, status: { notIn: ['RESOLVED', 'CLOSED', 'WONT_FIX'] } },
    select: { id: true, title: true, description: true, sequenceNum: true },
    orderBy: { createdAt: 'desc' },
    take: 20,
  })

  if (openBugs.length === 0) return Response.json({ duplicate: null })

  try {
    const message = await client.messages.create({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 200,
      system: 'You are a duplicate bug detector. Respond only with valid JSON.',
      messages: [
        {
          role: 'user',
          content: `New bug:\nTitle: ${title}\nDescription: ${description ?? '(none)'}

Existing open bugs:
${openBugs.map((b, i) => `${i + 1}. [ID:${b.id}] ${b.title}`).join('\n')}

If any existing bug is semantically similar (same root cause or symptom), respond:
{"found":true,"bugId":"<id>","matchPercent":<50-99>}
Otherwise respond:
{"found":false}`,
        },
      ],
    })

    const text = message.content[0].type === 'text' ? message.content[0].text : '{}'
    const cleaned = text.replace(/^```(?:json)?\n?/m, '').replace(/\n?```$/m, '').trim()
    const result = JSON.parse(cleaned)

    if (result.found && result.bugId) {
      const bug = openBugs.find((b) => b.id === result.bugId)
      if (bug) {
        return Response.json({
          duplicate: {
            id: bug.id,
            title: bug.title,
            description: bug.description,
            sequenceNum: bug.sequenceNum,
            matchPercent: result.matchPercent ?? 80,
          },
        })
      }
    }
  } catch {
    // fall through
  }

  return Response.json({ duplicate: null })
}
