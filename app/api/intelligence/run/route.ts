import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { runMarketIntelligenceAgent } from '@/lib/agents/market-intelligence-agent'
import { prisma } from '@/lib/db'
import { scoreCompany } from '@/lib/scoring'
import { getMarketConfig } from '@/lib/market-config'

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    const body = await request.json().catch(() => ({}))
    const { marketProfileId } = body as { marketProfileId?: string }

    // ── Resolve market profile ────────────────────────────────────────────────
    const defaultProfile = {
      geography: ['US', 'EU'],
      sector: 'Biotech',
      companyStages: ['Series A', 'Series B', 'Series C'],
      functionFocus: ['Clinical Operations', 'Regulatory Affairs', 'Commercial'],
    }

    let marketProfile = defaultProfile

    try {
      if (marketProfileId && prisma) {
        const profile = await prisma.marketProfile.findUnique({ where: { id: marketProfileId } })
        if (profile) {
          marketProfile = {
            geography: profile.geography,
            sector: profile.sector,
            companyStages: profile.companyStages,
            functionFocus: profile.functionFocus,
          }
        }
      }
    } catch {}

    // ── Create job record ─────────────────────────────────────────────────────
    let jobId = 'demo-job-' + Date.now()
    try {
      if (prisma) {
        const job = await prisma.intelligenceJob.create({
          data: { status: 'running', startedAt: new Date(), marketProfileId },
        })
        jobId = job.id
      }
    } catch {}

    // ── Run the intelligence agent ────────────────────────────────────────────
    const result = await runMarketIntelligenceAgent(marketProfile)

    // ── Persist signals + create/update opportunities ─────────────────────────
    let signalsPersisted = 0
    let opportunitiesCreated = 0
    let opportunitiesUpdated = 0

    try {
      if (prisma && result.signals.length > 0) {
        const marketConfig = getMarketConfig(marketProfile.sector, [])

        for (const sig of result.signals) {
          // Find or create a company record for the signal's company name
          let company = await prisma.company.findFirst({
            where: { name: { equals: sig.companyName, mode: 'insensitive' } },
          }).catch(() => null)

          if (!company && sig.companyName) {
            company = await prisma.company.create({
              data: {
                name: sig.companyName,
                sector: sig.sector || marketProfile.sector,
                geography: sig.geography || null,
              },
            }).catch(() => null)
          }

          // Store the signal
          const signal = await prisma.marketSignal.create({
            data: {
              signalType: sig.signalType,
              title: sig.title,
              summary: sig.summary,
              whyItMatters: sig.summary, // populated by agent as part of summary
              bdAngle: sig.bdAngle || null,
              companyId: company?.id || null,
              sourceUrl: sig.sourceUrl || null,
              sourceName: sig.sourceName || null,
              publishedAt: new Date(sig.publishedAt),
              relevanceScore: sig.relevanceScore,
              impactedFunctions: sig.impactedFunctions || [],
              geography: sig.geography || null,
              sector: sig.sector || marketProfile.sector,
            },
          }).catch(() => null)

          if (signal) signalsPersisted++

          // Create or update opportunity for the company
          if (company && session?.user?.id) {
            // Gather all signals for this company to score
            const allCompanySignals = await prisma.marketSignal.findMany({
              where: { companyId: company.id },
              orderBy: { publishedAt: 'desc' },
              take: 20,
            }).catch(() => [])

            const scored = scoreCompany(
              { id: company.id, stage: company.stage },
              allCompanySignals.map((s) => ({
                id: s.id,
                signalType: s.signalType,
                relevanceScore: s.relevanceScore,
                publishedAt: s.publishedAt,
                impactedFunctions: s.impactedFunctions,
              })),
              marketConfig.scoringWeights,
            )

            const existingOpp = await prisma.opportunity.findFirst({
              where: { companyId: company.id, userId: session.user.id, isArchived: false },
            }).catch(() => null)

            if (existingOpp) {
              await prisma.opportunity.update({
                where: { id: existingOpp.id },
                data: {
                  opportunityScore: scored.opportunityScore,
                  momentumScore: scored.momentumScore,
                  timingWindow: scored.timingWindow,
                  linkedSignals: allCompanySignals.map((s) => s.id),
                },
              }).catch(() => {})
              opportunitiesUpdated++
            } else {
              await prisma.opportunity.create({
                data: {
                  companyId: company.id,
                  userId: session.user.id,
                  opportunityScore: scored.opportunityScore,
                  momentumScore: scored.momentumScore,
                  timingWindow: scored.timingWindow,
                  linkedSignals: allCompanySignals.map((s) => s.id),
                },
              }).catch(() => {})
              opportunitiesCreated++
            }
          }
        }

        // Update job status with counts
        await prisma.intelligenceJob.update({
          where: { id: jobId },
          data: {
            status: 'completed',
            completedAt: new Date(),
            signalsFound: signalsPersisted,
          },
        }).catch(() => {})
      }
    } catch (err) {
      console.error('[intelligence/run] persist error', err)
    }

    return NextResponse.json({
      jobId,
      status: 'completed',
      signalsFound: signalsPersisted || result.signals.length,
      opportunitiesCreated,
      opportunitiesUpdated,
      signals: result.signals,
    })
  } catch (error) {
    console.error('Intelligence run error:', error)
    return NextResponse.json({ error: 'Failed to run intelligence' }, { status: 500 })
  }
}
