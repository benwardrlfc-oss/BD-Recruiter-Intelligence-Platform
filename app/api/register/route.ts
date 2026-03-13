import { NextRequest, NextResponse } from 'next/server'
import bcrypt from 'bcryptjs'
import { prisma } from '@/lib/db'

export async function POST(request: NextRequest) {
  try {
    const { name, email, password, orgName, signupType = 'individual' } = await request.json()

    if (!email || !password) {
      return NextResponse.json({ error: 'Email and password are required.' }, { status: 400 })
    }
    if (password.length < 8) {
      return NextResponse.json({ error: 'Password must be at least 8 characters.' }, { status: 400 })
    }
    if (signupType === 'org' && !orgName) {
      return NextResponse.json({ error: 'Organisation name is required.' }, { status: 400 })
    }

    if (!prisma) {
      return NextResponse.json({ error: 'Database unavailable.' }, { status: 503 })
    }

    const existing = await prisma.user.findUnique({ where: { email } })
    if (existing) {
      return NextResponse.json({ error: 'An account with this email already exists.' }, { status: 409 })
    }

    const hash = await bcrypt.hash(password, 12)

    if (signupType === 'org') {
      // Create org + user + membership in a transaction
      const slug = orgName.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '')
      const suffix = Math.random().toString(36).slice(2, 8)

      const { user } = await prisma.$transaction(async (tx) => {
        const org = await tx.organisation.create({
          data: {
            name: orgName,
            slug: `${slug}-${suffix}`,
            billingStatus: 'trialing',
            planId: 'trial',
            seatCount: 5,
            seatsUsed: 1,
            trialStartedAt: new Date(),
            trialEndsAt: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000),
          },
        })

        const user = await tx.user.create({
          data: {
            name: name || email.split('@')[0],
            email,
            password: hash,
            hasCompletedOnboarding: false,
          },
        })

        await tx.orgMembership.create({
          data: { userId: user.id, orgId: org.id, role: 'org_admin', seatAssigned: true },
        })

        return { user, org }
      })

      return NextResponse.json({ id: user.id, email: user.email, name: user.name })
    } else {
      // Individual: create user only, org assigned at onboarding or by invite
      const user = await prisma.user.create({
        data: {
          name: name || email.split('@')[0],
          email,
          password: hash,
          hasCompletedOnboarding: false,
        },
      })
      return NextResponse.json({ id: user.id, email: user.email, name: user.name })
    }
  } catch (error) {
    console.error('[register]', error)
    return NextResponse.json({ error: 'Internal server error.' }, { status: 500 })
  }
}
