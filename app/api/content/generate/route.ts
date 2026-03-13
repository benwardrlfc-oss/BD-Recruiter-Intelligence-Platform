import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { generateContent } from '@/lib/agents/content-agent'
import { mockSignals } from '@/lib/mock-data'
import { checkAiUsage, recordAiUsage } from '@/lib/ai-usage'
import { prisma } from '@/lib/db'

export async function POST(request: NextRequest) {
  const session = await getServerSession(authOptions)

  // Rate limit check
  if (session?.user) {
    const planId = (session.user as any).planId ?? 'trial'
    const check = await checkAiUsage(session.user.id, 'content_studio', planId)
    if (!check.allowed) {
      return NextResponse.json({ error: check.reason }, { status: 429 })
    }
  }

  try {
    const { contentType, signalIds, marketProfile, additionalContext } = await request.json()

    // Try DB signals first, fall back to mock
    let signals: Array<{ title: string; summary: string; signalType: string }> = []

    try {
      if (prisma && signalIds?.length > 0) {
        const dbSignals = await prisma.marketSignal.findMany({
          where: { id: { in: signalIds } },
        })
        if (dbSignals.length > 0) {
          signals = dbSignals.map((s) => ({
            title: s.title,
            summary: s.summary,
            signalType: s.signalType,
          }))
        }
      }
    } catch {}

    if (signals.length === 0) {
      const mockSigs = signalIds
        ? mockSignals.filter((s) => signalIds.includes(s.id))
        : mockSignals.slice(0, 3)
      signals = mockSigs.map((s) => ({
        title: s.title,
        summary: s.summary,
        signalType: s.signalType,
      }))
    }

    const result = await generateContent({
      contentType: contentType || 'linkedin_post',
      signals,
      marketProfile,
      additionalContext,
    })

    // Record usage
    if (session?.user) {
      const planId = (session.user as any).planId ?? 'trial'
      const orgId = (session.user as any).orgId
      recordAiUsage(session.user.id, 'content_studio', planId, { model: 'claude-sonnet-4-6' }, orgId)
    }

    return NextResponse.json(result)
  } catch (error) {
    return NextResponse.json({ error: 'Failed to generate content' }, { status: 500 })
  }
}
