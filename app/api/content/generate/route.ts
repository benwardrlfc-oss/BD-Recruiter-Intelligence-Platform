import { NextRequest, NextResponse } from 'next/server'
import { generateContent } from '@/lib/agents/content-agent'
import { mockSignals } from '@/lib/mock-data'

export async function POST(request: NextRequest) {
  try {
    const { contentType, signalIds, marketProfile, additionalContext } = await request.json()

    const signals = signalIds
      ? mockSignals.filter((s) => signalIds.includes(s.id))
      : mockSignals.slice(0, 3)

    const result = await generateContent({
      contentType: contentType || 'linkedin_post',
      signals: signals.map((s) => ({
        title: s.title,
        summary: s.summary,
        signalType: s.signalType,
      })),
      marketProfile,
      additionalContext,
    })

    return NextResponse.json(result)
  } catch (error) {
    return NextResponse.json({ error: 'Failed to generate content' }, { status: 500 })
  }
}
