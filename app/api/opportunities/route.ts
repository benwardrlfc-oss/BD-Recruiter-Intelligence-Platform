import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { mockOpportunities, mockCompanies } from '@/lib/mock-data'

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    const { searchParams } = new URL(request.url)
    const archived = searchParams.get('archived') === 'true'

    // Try DB first, fall back to mock data
    try {
      const opportunities = await prisma.opportunity.findMany({
        where: session ? { userId: session.user.id, isArchived: archived } : { isArchived: archived },
        include: { company: true },
        orderBy: { opportunityScore: 'desc' },
      })

      if (opportunities.length > 0) {
        return NextResponse.json(opportunities)
      }
    } catch (dbError) {
      // DB not available, use mock data
    }

    // Return mock data enriched with company info
    const enriched = mockOpportunities
      .filter((o) => o.isArchived === archived)
      .map((opp) => ({
        ...opp,
        company: mockCompanies.find((c) => c.id === opp.companyId),
      }))

    return NextResponse.json(enriched)
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch opportunities' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const data = await request.json()

    const opportunity = await prisma.opportunity.create({
      data: {
        ...data,
        userId: session.user.id,
      },
    })

    return NextResponse.json(opportunity)
  } catch (error) {
    return NextResponse.json({ error: 'Failed to create opportunity' }, { status: 500 })
  }
}
