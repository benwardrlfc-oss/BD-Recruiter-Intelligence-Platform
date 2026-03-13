import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { matchCandidateToCompanies } from '@/lib/agents/candidate-monetisation-agent'
import { mockCompanies } from '@/lib/mock-data'
import { checkAiUsage, recordAiUsage } from '@/lib/ai-usage'

export async function POST(request: NextRequest) {
  const session = await getServerSession(authOptions)

  // Rate limit check
  if (session?.user) {
    const planId = (session.user as any).planId ?? 'trial'
    const check = await checkAiUsage(session.user.id, 'candidate_matcher', planId)
    if (!check.allowed) {
      return NextResponse.json({ error: check.reason }, { status: 429 })
    }
  }

  try {
    const { rawText, fileName, recruiterNotes } = await request.json()

    if (!rawText) {
      return NextResponse.json({ error: 'Candidate text required' }, { status: 400 })
    }

    // Get companies for matching
    let companies = mockCompanies.map((c) => ({
      id: c.id,
      name: c.name,
      sector: c.sector,
      stage: c.stage || undefined,
      summary: c.summary || undefined,
    }))

    try {
      const dbCompanies = await prisma.company.findMany({ take: 20 })
      if (dbCompanies.length > 0) {
        companies = dbCompanies.map((c) => ({
          id: c.id,
          name: c.name,
          sector: c.sector,
          stage: c.stage || undefined,
          summary: c.summary || undefined,
        }))
      }
    } catch (dbError) {
      // Use mock
    }

    const matchResult = await matchCandidateToCompanies(rawText, companies, recruiterNotes)

    // Save to DB if possible
    try {
      if (session?.user?.id) {
        const upload = await prisma.candidateUpload.create({
          data: {
            userId: session.user.id,
            fileName: fileName || 'Pasted CV',
            rawText,
            parsedProfile: matchResult.parsedProfile as any,
            role: matchResult.parsedProfile.currentRole,
            seniority: matchResult.parsedProfile.seniority,
            expertise: matchResult.parsedProfile.expertise,
            marketRelevance: matchResult.parsedProfile.marketRelevance,
          },
        })

        // Save matches
        for (const match of matchResult.matches) {
          await prisma.candidateMatch.create({
            data: {
              candidateUploadId: upload.id,
              companyId: match.companyId,
              matchScore: match.matchScore,
              reasonForFit: match.reasonForFit,
              stakeholderToTarget: match.stakeholderToTarget,
              outreachDraft: match.outreachDraft,
            },
          })
        }
      }
    } catch (dbError) {
      // DB save failed, still return results
    }

    // Record usage
    if (session?.user) {
      const planId = (session.user as any).planId ?? 'trial'
      const orgId = (session.user as any).orgId
      recordAiUsage(session.user.id, 'candidate_matcher', planId, { model: 'claude-sonnet-4-6' }, orgId)
    }

    return NextResponse.json(matchResult)
  } catch (error) {
    return NextResponse.json({ error: 'Failed to process candidate' }, { status: 500 })
  }
}

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json([])
    }

    try {
      const uploads = await prisma.candidateUpload.findMany({
        where: { userId: session.user.id },
        include: { matches: { include: { company: true } } },
        orderBy: { createdAt: 'desc' },
      })
      return NextResponse.json(uploads)
    } catch (dbError) {
      return NextResponse.json([])
    }
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch candidates' }, { status: 500 })
  }
}
