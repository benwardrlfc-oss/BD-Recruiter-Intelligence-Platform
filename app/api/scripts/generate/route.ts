import { NextRequest, NextResponse } from 'next/server'
import { generateBDScript } from '@/lib/agents/bd-script-generator'
import { mockOpportunities, mockCompanies, mockSignals } from '@/lib/mock-data'

export async function POST(request: NextRequest) {
  try {
    const { opportunityId, companyId, customParams } = await request.json()

    let params = customParams

    if (!params && opportunityId) {
      const opportunity = mockOpportunities.find((o) => o.id === opportunityId)
      const company = opportunity ? mockCompanies.find((c) => c.id === opportunity.companyId) : null
      const signal = opportunity?.linkedSignals[0]
        ? mockSignals.find((s) => s.id === opportunity.linkedSignals[0])
        : null

      if (opportunity && company) {
        params = {
          companyName: company.name,
          stakeholder: opportunity.recommendedStakeholder || 'CEO',
          outreachAngle: opportunity.outreachAngle || '',
          likelyHiringNeed: opportunity.likelyHiringNeed || '',
          recentSignal: signal?.title || 'recent company news',
        }
      }
    }

    if (!params) {
      return NextResponse.json({ error: 'Invalid parameters' }, { status: 400 })
    }

    const scripts = await generateBDScript(params)
    return NextResponse.json(scripts)
  } catch (error) {
    return NextResponse.json({ error: 'Failed to generate scripts' }, { status: 500 })
  }
}
