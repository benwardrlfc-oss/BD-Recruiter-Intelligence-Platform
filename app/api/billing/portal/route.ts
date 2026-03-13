import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { createBillingPortalSession } from '@/lib/billing'
import { prisma } from '@/lib/db'

// ── POST /api/billing/portal ───────────────────────────────────────────────────
// Creates a Stripe billing portal session and redirects the org admin there.

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions)

  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorised.' }, { status: 401 })
  }

  if (session.user.orgRole !== 'org_admin' && !session.user.isSuperAdmin) {
    return NextResponse.json({ error: 'Only org admins can access billing.' }, { status: 403 })
  }

  if (!prisma) {
    return NextResponse.json({ error: 'Database unavailable.' }, { status: 503 })
  }

  try {
    const org = await prisma.organisation.findUnique({
      where: { id: session.user.orgId },
      select: { stripeCustomerId: true },
    })

    if (!org?.stripeCustomerId) {
      return NextResponse.json(
        { error: 'No billing account found. Please contact support.' },
        { status: 404 },
      )
    }

    const { returnUrl } = await req.json().catch(() => ({ returnUrl: undefined }))
    const portalUrl = await createBillingPortalSession(
      org.stripeCustomerId,
      returnUrl || `${process.env.NEXTAUTH_URL}/settings?tab=billing`,
    )

    return NextResponse.json({ url: portalUrl })
  } catch (err) {
    console.error('[billing portal]', err)
    return NextResponse.json({ error: 'Failed to open billing portal.' }, { status: 500 })
  }
}
