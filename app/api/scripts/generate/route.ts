import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { generateBDScript } from '@/lib/agents/bd-script-generator'
import { mockOpportunities, mockCompanies, mockSignals } from '@/lib/mock-data'
import { checkAiUsage, recordAiUsage } from '@/lib/ai-usage'
import { prisma } from '@/lib/db'

export async function POST(request: NextRequest) {
  const session = await getServerSession(authOptions)

  // Rate limit check — skip gracefully if session unavailable (demo mode)
  if (session?.user) {
    const planId = (session.user as any).planId ?? 'trial'
    const check = await checkAiUsage(session.user.id, 'bd_scripts', planId)
    if (!check.allowed) {
      return NextResponse.json({ error: check.reason }, { status: 429 })
    }
  }

  try {
    const { opportunityId, companyId, customParams } = await request.json()

    let params = customParams

    if (!params && opportunityId) {
      // Try DB first
      let opportunity = null
      let company = null
      let signal = null

      try {
        if (prisma) {
          opportunity = await prisma.opportunity.findUnique({
            where: { id: opportunityId },
            include: { company: true },
          })
          if (opportunity) {
            company = opportunity.company
            if (opportunity.linkedSignals.length > 0) {
              signal = await prisma.marketSignal.findUnique({
                where: { id: opportunity.linkedSignals[0] },
              })
            }
          }
        }
      } catch {}

      // Fall back to mock data
      if (!opportunity) {
        const mockOpp = mockOpportunities.find((o) => o.id === opportunityId)
        const mockCompany = mockOpp ? mockCompanies.find((c) => c.id === mockOpp.companyId) : null
        const mockSignal = mockOpp?.linkedSignals[0]
          ? mockSignals.find((s) => s.id === mockOpp.linkedSignals[0])
          : null

        if (mockOpp && mockCompany) {
          params = {
            companyName: mockCompany.name,
            stakeholder: mockOpp.recommendedStakeholder || 'CEO',
            outreachAngle: mockOpp.outreachAngle || '',
            likelyHiringNeed: mockOpp.likelyHiringNeed || '',
            recentSignal: mockSignal?.title || 'recent company news',
          }
        }
      } else if (company) {
        params = {
          companyName: (company as any).name,
          stakeholder: (opportunity as any).recommendedStakeholder || 'CEO',
          outreachAngle: (opportunity as any).outreachAngle || '',
          likelyHiringNeed: (opportunity as any).likelyHiringNeed || '',
          recentSignal: signal?.title || 'recent company news',
        }
      }
    }

    if (!params) {
      return NextResponse.json({ error: 'Invalid parameters' }, { status: 400 })
    }

    const scripts = await generateBDScript(params)

    // Record usage
    if (session?.user) {
      const planId = (session.user as any).planId ?? 'trial'
      const orgId = (session.user as any).orgId
      recordAiUsage(session.user.id, 'bd_scripts', planId, { model: 'claude-sonnet-4-6' }, orgId)
    }

    return NextResponse.json(scripts)
  } catch (error) {
    return NextResponse.json({ error: 'Failed to generate scripts' }, { status: 500 })
  }
}
