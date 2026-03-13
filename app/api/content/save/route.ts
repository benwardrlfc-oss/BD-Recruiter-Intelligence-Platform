import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/db'

// ── GET /api/content/save ─────────────────────────────────────────────────────
// Returns the last 20 saved content items for the current user

export async function GET(_req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorised.' }, { status: 401 })
  }

  if (!prisma) {
    return NextResponse.json({ error: 'Database unavailable.' }, { status: 503 })
  }

  try {
    const items = await prisma.contentItem.findMany({
      where: { userId: session.user.id },
      orderBy: { createdAt: 'desc' },
      take: 20,
    })
    return NextResponse.json(items)
  } catch (err) {
    console.error('[content/save GET]', err)
    return NextResponse.json({ error: 'Failed to retrieve content items.' }, { status: 500 })
  }
}

// ── POST /api/content/save ────────────────────────────────────────────────────
// Saves a ContentItem to the database

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorised.' }, { status: 401 })
  }

  if (!prisma) {
    return NextResponse.json({ error: 'Database unavailable.' }, { status: 503 })
  }

  try {
    const body = await req.json()
    const { contentType, draftText, linkedSignals } = body as {
      contentType: string
      draftText: string
      linkedSignals: string[]
    }

    if (!contentType || !draftText) {
      return NextResponse.json({ error: 'contentType and draftText are required.' }, { status: 400 })
    }

    const item = await prisma.contentItem.create({
      data: {
        userId: session.user.id,
        contentType,
        draftText,
        linkedSignals: Array.isArray(linkedSignals) ? linkedSignals : [],
        status: 'saved',
      },
    })

    return NextResponse.json({ ok: true, id: item.id })
  } catch (err) {
    console.error('[content/save POST]', err)
    return NextResponse.json({ error: 'Failed to save content item.' }, { status: 500 })
  }
}
