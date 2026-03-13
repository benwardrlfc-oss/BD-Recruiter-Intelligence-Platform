import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { getRemainingUsage } from '@/lib/ai-usage'
import type { PlanId } from '@/lib/permissions'

export async function GET() {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) return NextResponse.json({})

    const planId: PlanId = ((session.user as any).planId ?? 'trial') as PlanId
    const usage = await getRemainingUsage(session.user.id, planId)
    return NextResponse.json(usage)
  } catch {
    return NextResponse.json({})
  }
}
