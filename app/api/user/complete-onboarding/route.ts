import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { prisma } from '@/lib/db'
import { authOptions } from '@/lib/auth'

// ── POST /api/user/complete-onboarding ────────────────────────────────────────
// Marks the current user as having completed onboarding

export async function POST(_req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorised.' }, { status: 401 })
  }

  if (!prisma) {
    return NextResponse.json({ error: 'Database unavailable.' }, { status: 503 })
  }

  try {
    await prisma.user.update({
      where: { id: session.user.id },
      data: { hasCompletedOnboarding: true },
    })

    // Note: next-auth JWT is updated client-side via useSession().update()
    // The DB record is the source of truth; token refreshes on next sign-in.

    return NextResponse.json({ ok: true })
  } catch (err) {
    console.error('[user/complete-onboarding POST]', err)
    return NextResponse.json({ error: 'Failed to complete onboarding.' }, { status: 500 })
  }
}
