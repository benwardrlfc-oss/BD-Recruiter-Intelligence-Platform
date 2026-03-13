import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { prisma } from '@/lib/db'
import { authOptions } from '@/lib/auth'

// ── GET /api/org/stats ─────────────────────────────────────────────────────────
// Returns org stats for the admin dashboard.
// Requires an active session with an orgId.

export async function GET(_req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorised.' }, { status: 401 })
  }

  if (!session.user.orgId) {
    return NextResponse.json({ error: 'No organisation found for this account.' }, { status: 403 })
  }

  if (!prisma) {
    return NextResponse.json({ error: 'Database unavailable.' }, { status: 503 })
  }

  try {
    const org = await prisma.organisation.findUnique({
      where: { id: session.user.orgId },
      include: {
        _count: { select: { members: true } },
      },
    })

    if (!org) {
      return NextResponse.json({ error: 'Organisation not found.' }, { status: 404 })
    }

    return NextResponse.json({
      orgName: org.name,
      planId: org.planId,
      billingStatus: org.billingStatus,
      seatCount: org.seatCount,
      seatsUsed: org.seatsUsed,
      trialEndsAt: org.trialEndsAt ? org.trialEndsAt.toISOString() : null,
      memberCount: org._count.members,
    })
  } catch (err) {
    console.error('[org/stats GET]', err)
    return NextResponse.json({ error: 'Failed to retrieve org stats.' }, { status: 500 })
  }
}
