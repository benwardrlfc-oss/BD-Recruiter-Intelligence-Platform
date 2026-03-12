import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { mockSignals } from '@/lib/mock-data'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const signalType = searchParams.get('signalType')
    const sector = searchParams.get('sector')
    const geography = searchParams.get('geography')
    const limit = parseInt(searchParams.get('limit') || '50')
    const offset = parseInt(searchParams.get('offset') || '0')

    try {
      const where: any = {}
      if (signalType) where.signalType = signalType
      if (sector) where.sector = sector
      if (geography) where.geography = { contains: geography, mode: 'insensitive' }

      const signals = await prisma.marketSignal.findMany({
        where,
        include: { company: true, investor: true },
        orderBy: { publishedAt: 'desc' },
        take: limit,
        skip: offset,
      })

      if (signals.length > 0) {
        return NextResponse.json(signals)
      }
    } catch (dbError) {
      // DB not available
    }

    // Return filtered mock data
    let filtered = [...mockSignals]
    if (signalType) filtered = filtered.filter((s) => s.signalType === signalType)
    if (sector) filtered = filtered.filter((s) => s.sector === sector)

    return NextResponse.json(filtered.slice(offset, offset + limit))
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch signals' }, { status: 500 })
  }
}
