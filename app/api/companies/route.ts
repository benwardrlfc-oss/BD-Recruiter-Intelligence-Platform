import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { mockCompanies } from '@/lib/mock-data'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const search = searchParams.get('search')
    const sector = searchParams.get('sector')
    const stage = searchParams.get('stage')

    try {
      const where: any = {}
      if (search) {
        where.OR = [
          { name: { contains: search, mode: 'insensitive' } },
          { sector: { contains: search, mode: 'insensitive' } },
        ]
      }
      if (sector) where.sector = { contains: sector, mode: 'insensitive' }
      if (stage) where.stage = { contains: stage, mode: 'insensitive' }

      const companies = await prisma.company.findMany({
        where,
        include: {
          investors: { include: { investor: true } },
          _count: { select: { signals: true, opportunities: true } },
        },
        orderBy: { name: 'asc' },
      })

      if (companies.length > 0) {
        return NextResponse.json(companies)
      }
    } catch (dbError) {
      // DB not available
    }

    let filtered = [...mockCompanies]
    if (search) {
      filtered = filtered.filter(
        (c) =>
          c.name.toLowerCase().includes(search.toLowerCase()) ||
          c.sector.toLowerCase().includes(search.toLowerCase())
      )
    }
    if (sector) filtered = filtered.filter((c) => c.sector.toLowerCase().includes(sector.toLowerCase()))

    return NextResponse.json(filtered)
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch companies' }, { status: 500 })
  }
}
