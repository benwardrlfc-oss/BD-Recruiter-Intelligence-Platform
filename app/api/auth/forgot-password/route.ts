import { NextRequest, NextResponse } from 'next/server'
import crypto from 'crypto'
import { prisma } from '@/lib/db'

// ── POST /api/auth/forgot-password ────────────────────────────────────────────
// Requests a password reset link.
// Always returns { ok: true } regardless of whether the email exists
// to avoid leaking account existence.

export async function POST(req: NextRequest) {
  try {
    const { email } = await req.json() as { email: string }

    if (!email) {
      return NextResponse.json({ error: 'Email is required.' }, { status: 400 })
    }

    if (!prisma) {
      return NextResponse.json({ error: 'Database unavailable.' }, { status: 503 })
    }

    const user = await prisma.user.findUnique({ where: { email } })

    if (user) {
      const token = crypto.randomUUID()
      const expires = new Date(Date.now() + 3_600_000) // 1 hour

      // Store reset token in VerificationToken table
      await prisma.verificationToken.create({
        data: {
          identifier: email,
          token,
          expires,
        },
      })

      const resetUrl = `${process.env.NEXTAUTH_URL}/reset-password?token=${token}`

      // TODO: send via Resend in production
      // await sendPasswordResetEmail({ to: email, resetUrl })
      console.log(`[forgot-password] Reset URL for ${email}: ${resetUrl}`)
    }

    // Always return ok — don't reveal whether the account exists
    return NextResponse.json({ ok: true })
  } catch (err) {
    console.error('[auth/forgot-password POST]', err)
    return NextResponse.json({ error: 'Failed to process request.' }, { status: 500 })
  }
}
