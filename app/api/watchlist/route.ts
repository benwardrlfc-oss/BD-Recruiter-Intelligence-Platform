import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/db'

// ── GET /api/watchlist ────────────────────────────────────────────────────────
// Returns watchlist stored in user.dashboardLayout under the 'watchlist' key

export async function GET(_req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorised.' }, { status: 401 })
  }

  if (!prisma) {
    return NextResponse.json({ error: 'Database unavailable.' }, { status: 503 })
  }

  try {
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { dashboardLayout: true },
    })

    const layout = (user?.dashboardLayout ?? {}) as Record<string, unknown>
    const watchlist = (layout.watchlist ?? { companies: [], vcs: [] }) as {
      companies: unknown[]
      vcs: unknown[]
    }

    return NextResponse.json(watchlist)
  } catch (err) {
    console.error('[watchlist GET]', err)
    return NextResponse.json({ error: 'Failed to retrieve watchlist.' }, { status: 500 })
  }
}

// ── PATCH /api/watchlist ──────────────────────────────────────────────────────
// Merges { watchedCompanies, watchedVCs } into user.dashboardLayout.watchlist

export async function PATCH(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorised.' }, { status: 401 })
  }

  if (!prisma) {
    return NextResponse.json({ error: 'Database unavailable.' }, { status: 503 })
  }

  try {
    const body = await req.json()
    const { watchedCompanies, watchedVCs } = body as {
      watchedCompanies: unknown[]
      watchedVCs: unknown[]
    }

    // Read existing layout so we don't overwrite other keys (e.g. settings)
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { dashboardLayout: true },
    })

    const existingLayout = (user?.dashboardLayout ?? {}) as Record<string, unknown>

    const updatedLayout = {
      ...existingLayout,
      watchlist: {
        companies: Array.isArray(watchedCompanies) ? watchedCompanies : [],
        vcs: Array.isArray(watchedVCs) ? watchedVCs : [],
      },
    }

    await prisma.user.update({
      where: { id: session.user.id },
      data: { dashboardLayout: updatedLayout },
    })

    return NextResponse.json({ ok: true })
  } catch (err) {
    console.error('[watchlist PATCH]', err)
    return NextResponse.json({ error: 'Failed to update watchlist.' }, { status: 500 })
  }
}
