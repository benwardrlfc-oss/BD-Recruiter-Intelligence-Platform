import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/db'

interface CompanyRow {
  name: string
  sector: string
  subsector?: string
  stage?: string
  geography?: string
  website?: string
  summary?: string
  employeeCount?: number
  fundingTotal?: number
  modality?: string
}

// ── POST /api/companies/import ────────────────────────────────────────────────
// Accepts an array of company objects and upserts them into the database.
// Matches on name (case-insensitive) to avoid duplicates.

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorised.' }, { status: 401 })
  }

  if (!prisma) {
    return NextResponse.json({ error: 'Database unavailable.' }, { status: 503 })
  }

  try {
    const body = await req.json()
    const rows: CompanyRow[] = body.companies

    if (!Array.isArray(rows) || rows.length === 0) {
      return NextResponse.json({ error: 'No companies provided.' }, { status: 400 })
    }

    if (rows.length > 500) {
      return NextResponse.json({ error: 'Maximum 500 companies per import.' }, { status: 400 })
    }

    const results = { created: 0, updated: 0, skipped: 0, errors: [] as string[] }

    for (const row of rows) {
      if (!row.name?.trim() || !row.sector?.trim()) {
        results.skipped++
        continue
      }

      try {
        const existing = await prisma.company.findFirst({
          where: { name: { equals: row.name.trim(), mode: 'insensitive' } },
        })

        const data = {
          name: row.name.trim(),
          sector: row.sector.trim(),
          subsector: row.subsector?.trim() || null,
          stage: row.stage?.trim() || null,
          geography: row.geography?.trim() || null,
          website: row.website?.trim() || null,
          summary: row.summary?.trim() || null,
          employeeCount: row.employeeCount ? Math.floor(Number(row.employeeCount)) : null,
          fundingTotal: row.fundingTotal ? Number(row.fundingTotal) : null,
          modality: row.modality?.trim() || null,
        }

        if (existing) {
          await prisma.company.update({ where: { id: existing.id }, data })
          results.updated++
        } else {
          await prisma.company.create({ data })
          results.created++
        }
      } catch (err) {
        results.errors.push(String(row.name))
        results.skipped++
      }
    }

    return NextResponse.json({
      ok: true,
      created: results.created,
      updated: results.updated,
      skipped: results.skipped,
      errors: results.errors.slice(0, 10), // cap error list
    })
  } catch (err) {
    console.error('[companies/import POST]', err)
    return NextResponse.json({ error: 'Import failed.' }, { status: 500 })
  }
}
