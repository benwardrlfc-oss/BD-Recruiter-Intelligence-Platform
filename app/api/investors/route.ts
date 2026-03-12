import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { mockInvestors } from '@/lib/mock-data'

export async function GET(request: NextRequest) {
  try {
    try {
      const investors = await prisma.investor.findMany({
        include: {
          companies: { include: { company: true } },
        },
        orderBy: { name: 'asc' },
      })

      if (investors.length > 0) {
        return NextResponse.json(investors)
      }
    } catch (dbError) {
      // DB not available
    }

    return NextResponse.json(mockInvestors)
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch investors' }, { status: 500 })
  }
}
