import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { runMarketIntelligenceAgent } from '@/lib/agents/market-intelligence-agent'
import { prisma } from '@/lib/db'

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    const { marketProfileId } = await request.json()

    // Default market profile for demo
    const defaultProfile = {
      geography: ['US', 'EU'],
      sector: 'Biotech',
      companyStages: ['Series A', 'Series B', 'Series C'],
      functionFocus: ['Clinical Operations', 'Regulatory Affairs', 'Commercial'],
    }

    let marketProfile = defaultProfile

    try {
      if (marketProfileId) {
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
    } catch (dbError) {
      // Use default
    }

    // Create intelligence job record
    let jobId = 'demo-job-' + Date.now()
    try {
      const job = await prisma.intelligenceJob.create({
        data: {
          status: 'running',
          startedAt: new Date(),
          marketProfileId,
        },
      })
      jobId = job.id
    } catch (dbError) {
      // DB not available
    }

    // Run the agent
    const result = await runMarketIntelligenceAgent(marketProfile)

    // Update job status
    try {
      await prisma.intelligenceJob.update({
        where: { id: jobId },
        data: {
          status: 'completed',
          completedAt: new Date(),
          signalsFound: result.signals.length,
        },
      })
    } catch (dbError) {
      // DB not available
    }

    return NextResponse.json({
      jobId,
      status: 'completed',
      signalsFound: result.signals.length,
      signals: result.signals,
    })
  } catch (error) {
    console.error('Intelligence run error:', error)
    return NextResponse.json({ error: 'Failed to run intelligence' }, { status: 500 })
  }
}
