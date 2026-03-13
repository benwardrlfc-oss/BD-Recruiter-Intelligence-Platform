import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { prisma } from '@/lib/db'
import { authOptions } from '@/lib/auth'

// ── GET /api/org/members ───────────────────────────────────────────────────────
// Returns all members in the current user's org.
// Requires org_admin or team_manager role.

export async function GET(_req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorised.' }, { status: 401 })
  }

  if (!session.user.orgId) {
    return NextResponse.json({ error: 'No organisation found for this account.' }, { status: 403 })
  }

  if (session.user.orgRole !== 'org_admin' && session.user.orgRole !== 'team_manager' && !session.user.isSuperAdmin) {
    return NextResponse.json({ error: 'Forbidden. org_admin or team_manager role required.' }, { status: 403 })
  }

  if (!prisma) {
    return NextResponse.json({ error: 'Database unavailable.' }, { status: 503 })
  }

  try {
    const memberships = await prisma.orgMembership.findMany({
      where: { orgId: session.user.orgId },
      include: {
        user: { select: { id: true, name: true, email: true } },
      },
      orderBy: { createdAt: 'asc' },
    })

    const members = memberships.map((m) => ({
      id: m.id,
      userId: m.userId,
      name: m.user.name,
      email: m.user.email,
      role: m.role,
      seatAssigned: m.seatAssigned,
      joinedAt: m.createdAt,
    }))

    return NextResponse.json({ members })
  } catch (err) {
    console.error('[org/members GET]', err)
    return NextResponse.json({ error: 'Failed to retrieve members.' }, { status: 500 })
  }
}
