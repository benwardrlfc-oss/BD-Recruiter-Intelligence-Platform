import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/db'

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json([])
    }

    const profiles = await prisma.marketProfile.findMany({
      where: { userId: session.user.id },
      orderBy: { isDefault: 'desc' },
    })

    return NextResponse.json(profiles)
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch profiles' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const data = await request.json()

    // If this is default, unset others
    if (data.isDefault) {
      await prisma.marketProfile.updateMany({
        where: { userId: session.user.id },
        data: { isDefault: false },
      })
    }

    const profile = await prisma.marketProfile.create({
      data: {
        ...data,
        userId: session.user.id,
      },
    })

    return NextResponse.json(profile)
  } catch (error) {
    return NextResponse.json({ error: 'Failed to create profile' }, { status: 500 })
  }
}
