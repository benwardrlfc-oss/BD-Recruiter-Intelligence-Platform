import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { prisma } from '@/lib/db'
import { authOptions } from '@/lib/auth'

// ── GET /api/org/invites ───────────────────────────────────────────────────────
// Returns all pending (not accepted, not expired) invites for the org.
// Requires org_admin.

export async function GET(_req: NextRequest) {
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
    const invites = await prisma.orgInvite.findMany({
      where: {
        orgId: session.user.orgId,
        accepted: false,
        expiresAt: { gt: new Date() },
      },
      orderBy: { createdAt: 'desc' },
    })

    const result = invites.map((inv) => ({
      id: inv.id,
      email: inv.email,
      role: inv.role,
      expiresAt: inv.expiresAt,
      invitedBy: inv.invitedBy,
    }))

    return NextResponse.json({ invites: result })
  } catch (err) {
    console.error('[org/invites GET]', err)
    return NextResponse.json({ error: 'Failed to retrieve invites.' }, { status: 500 })
  }
}

// ── DELETE /api/org/invites ────────────────────────────────────────────────────
// Revokes (deletes) a pending invite.
// Body: { inviteId: string }
// Requires org_admin.

export async function DELETE(req: NextRequest) {
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
    const { inviteId } = await req.json() as { inviteId: string }

    if (!inviteId) {
      return NextResponse.json({ error: 'inviteId is required.' }, { status: 400 })
    }

    // Verify the invite belongs to this org before deleting
    const invite = await prisma.orgInvite.findFirst({
      where: { id: inviteId, orgId: session.user.orgId },
    })

    if (!invite) {
      return NextResponse.json({ error: 'Invite not found.' }, { status: 404 })
    }

    await prisma.orgInvite.delete({ where: { id: inviteId } })

    return NextResponse.json({ ok: true })
  } catch (err) {
    console.error('[org/invites DELETE]', err)
    return NextResponse.json({ error: 'Failed to revoke invite.' }, { status: 500 })
  }
}
