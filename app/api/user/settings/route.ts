import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { prisma } from '@/lib/db'
import { authOptions } from '@/lib/auth'

// ── GET /api/user/settings ─────────────────────────────────────────────────────
// Returns the current user's settings (stored as JSON in dashboardLayout)

export async function GET(_req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorised.' }, { status: 401 })
  }

  if (!prisma) {
    return NextResponse.json({ error: 'Database unavailable.' }, { status: 503 })
  }

  try {
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { dashboardLayout: true },
    })

    const settings = user?.dashboardLayout ?? null

    return NextResponse.json({ settings })
  } catch (err) {
    console.error('[user/settings GET]', err)
    return NextResponse.json({ error: 'Failed to retrieve settings.' }, { status: 500 })
  }
}

// ── PATCH /api/user/settings ───────────────────────────────────────────────────
// Saves the full UserSettings object as JSON in user.dashboardLayout

export async function PATCH(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorised.' }, { status: 401 })
  }

  if (!prisma) {
    return NextResponse.json({ error: 'Database unavailable.' }, { status: 503 })
  }

  try {
    const body = await req.json()
    const { settings } = body as { settings: unknown }

    if (!settings || typeof settings !== 'object') {
      return NextResponse.json({ error: 'settings object is required.' }, { status: 400 })
    }

    await prisma.user.update({
      where: { id: session.user.id },
      data: { dashboardLayout: settings },
    })

    return NextResponse.json({ ok: true })
  } catch (err) {
    console.error('[user/settings PATCH]', err)
    return NextResponse.json({ error: 'Failed to update settings.' }, { status: 500 })
  }
}
