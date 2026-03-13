import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { prisma } from '@/lib/db'
import { authOptions } from '@/lib/auth'

// ── PATCH /api/org/members/[userId] ───────────────────────────────────────────
// Updates a member's role. Requires org_admin.

export async function PATCH(
  req: NextRequest,
  { params }: { params: { userId: string } },
) {
  const session = await getServerSession(authOptions)
  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorised.' }, { status: 401 })
  }

  if (!session.user.orgId) {
    return NextResponse.json({ error: 'No organisation found for this account.' }, { status: 403 })
  }

  if (session.user.orgRole !== 'org_admin' && !session.user.isSuperAdmin) {
    return NextResponse.json({ error: 'Forbidden. org_admin role required.' }, { status: 403 })
  }

  if (!prisma) {
    return NextResponse.json({ error: 'Database unavailable.' }, { status: 503 })
  }

  try {
    const { role } = await req.json() as { role: string }

    if (!role) {
      return NextResponse.json({ error: 'role is required.' }, { status: 400 })
    }

    const validRoles = ['org_admin', 'team_manager', 'member', 'read_only']
    if (!validRoles.includes(role)) {
      return NextResponse.json({ error: `Invalid role. Must be one of: ${validRoles.join(', ')}.` }, { status: 400 })
    }

    const updated = await prisma.orgMembership.updateMany({
      where: { userId: params.userId, orgId: session.user.orgId },
      data: { role },
    })

    if (updated.count === 0) {
      return NextResponse.json({ error: 'Member not found in this organisation.' }, { status: 404 })
    }

    return NextResponse.json({ ok: true })
  } catch (err) {
    console.error('[org/members/[userId] PATCH]', err)
    return NextResponse.json({ error: 'Failed to update member role.' }, { status: 500 })
  }
}

// ── DELETE /api/org/members/[userId] ──────────────────────────────────────────
// Removes a member from the org and decrements seatsUsed. Requires org_admin.
// Cannot remove self.

export async function DELETE(
  _req: NextRequest,
  { params }: { params: { userId: string } },
) {
  const session = await getServerSession(authOptions)
  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorised.' }, { status: 401 })
  }

  if (!session.user.orgId) {
    return NextResponse.json({ error: 'No organisation found for this account.' }, { status: 403 })
  }

  if (session.user.orgRole !== 'org_admin' && !session.user.isSuperAdmin) {
    return NextResponse.json({ error: 'Forbidden. org_admin role required.' }, { status: 403 })
  }

  if (params.userId === session.user.id) {
    return NextResponse.json({ error: 'You cannot remove yourself from the organisation.' }, { status: 400 })
  }

  if (!prisma) {
    return NextResponse.json({ error: 'Database unavailable.' }, { status: 503 })
  }

  try {
    // Verify membership exists before deleting
    const membership = await prisma.orgMembership.findFirst({
      where: { userId: params.userId, orgId: session.user.orgId },
    })

    if (!membership) {
      return NextResponse.json({ error: 'Member not found in this organisation.' }, { status: 404 })
    }

    // Delete membership and decrement seatsUsed in a transaction
    await prisma.$transaction([
      prisma.orgMembership.delete({ where: { id: membership.id } }),
      ...(membership.seatAssigned
        ? [prisma.organisation.update({
            where: { id: session.user.orgId },
            data: { seatsUsed: { decrement: 1 } },
          })]
        : []),
    ])

    return NextResponse.json({ ok: true })
  } catch (err) {
    console.error('[org/members/[userId] DELETE]', err)
    return NextResponse.json({ error: 'Failed to remove member.' }, { status: 500 })
  }
}
