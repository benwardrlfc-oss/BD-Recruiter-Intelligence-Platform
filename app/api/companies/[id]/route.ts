import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { mockCompanies, mockSignals, mockOpportunities, mockInvestors } from '@/lib/mock-data'

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params

    try {
      const company = await prisma.company.findUnique({
        where: { id },
        include: {
          signals: { orderBy: { publishedAt: 'desc' } },
          opportunities: { orderBy: { opportunityScore: 'desc' } },
          investors: { include: { investor: true } },
        },
      })

      if (company) {
        return NextResponse.json(company)
      }
    } catch (dbError) {
      // DB not available
    }

    const company = mockCompanies.find((c) => c.id === id)
    if (!company) {
      return NextResponse.json({ error: 'Company not found' }, { status: 404 })
    }

    const signals = mockSignals.filter((s) => s.companyId === id)
    const opportunities = mockOpportunities.filter((o) => o.companyId === id)

    return NextResponse.json({
      ...company,
      signals,
      opportunities,
      investors: [],
    })
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch company' }, { status: 500 })
  }
}
