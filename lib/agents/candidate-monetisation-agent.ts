import Anthropic from '@anthropic-ai/sdk'

const client = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY || '',
})

export interface CandidateMatchResult {
  parsedProfile: {
    name?: string
    currentRole: string
    seniority: string
    expertise: string[]
    yearsExperience?: number
    therapeuticAreas: string[]
    marketRelevance: string
  }
  matches: Array<{
    companyId: string
    companyName: string
    matchScore: number
    reasonForFit: string
    stakeholderToTarget: string
    outreachDraft: string
  }>
}

export async function matchCandidateToCompanies(
  candidateText: string,
  companies: Array<{ id: string; name: string; sector: string; stage?: string; summary?: string }>
): Promise<CandidateMatchResult> {
  if (!process.env.ANTHROPIC_API_KEY) {
    return getMockMatchResult(candidateText, companies)
  }

  const companiesContext = companies
    .map((c) => `- ${c.name} (${c.sector}, ${c.stage || 'N/A'}): ${c.summary || 'Life sciences company'}`)
    .join('\n')

  const prompt = `You are an expert life sciences executive recruiter.

  Analyze this candidate profile and match them to the most relevant companies.

  CANDIDATE PROFILE:
  ${candidateText}

  AVAILABLE COMPANIES:
  ${companiesContext}

  Provide:
  1. A parsed profile extracting key attributes
  2. The top 3-5 company matches with match scores and outreach drafts

  Return as JSON:
  {
    "parsedProfile": {
      "name": "...",
      "currentRole": "...",
      "seniority": "C-Suite|VP|Director|Senior Manager|Manager",
      "expertise": ["Clinical Operations", "Regulatory"],
      "yearsExperience": 15,
      "therapeuticAreas": ["Oncology", "Rare Disease"],
      "marketRelevance": "Strong fit for Series B-D clinical-stage biotechs..."
    },
    "matches": [
      {
        "companyId": "...",
        "companyName": "...",
        "matchScore": 85,
        "reasonForFit": "...",
        "stakeholderToTarget": "CEO / Co-founder",
        "outreachDraft": "Subject: Exceptional [Role] Candidate for [Company]\\n\\n..."
      }
    ]
  }`

  try {
    const response = await client.messages.create({
      model: 'claude-opus-4-5',
      max_tokens: 3000,
      messages: [{ role: 'user', content: prompt }],
    })

    const text = response.content[0].type === 'text' ? response.content[0].text : ''
    const jsonMatch = text.match(/\{[\s\S]*\}/)
    if (jsonMatch) {
      return JSON.parse(jsonMatch[0])
    }
  } catch (error) {
    console.error('Candidate matching agent error:', error)
  }

  return getMockMatchResult(candidateText, companies)
}

function getMockMatchResult(
  candidateText: string,
  companies: Array<{ id: string; name: string; sector: string; stage?: string; summary?: string }>
): CandidateMatchResult {
  const topCompanies = companies.slice(0, 3)
  return {
    parsedProfile: {
      name: 'Candidate',
      currentRole: 'VP Clinical Operations',
      seniority: 'VP',
      expertise: ['Clinical Operations', 'Regulatory Affairs', 'Clinical Development'],
      yearsExperience: 15,
      therapeuticAreas: ['Oncology', 'Rare Disease'],
      marketRelevance: 'Strong fit for clinical-stage biotechs building out their Phase 2/3 infrastructure. Particularly valuable for companies with recent funding needing to scale operations quickly.',
    },
    matches: topCompanies.map((company, index) => ({
      companyId: company.id,
      companyName: company.name,
      matchScore: 90 - index * 8,
      reasonForFit: `Strong alignment with ${company.name}'s ${company.stage || 'growth'} stage needs. Candidate's clinical operations expertise maps directly to current hiring priorities.`,
      stakeholderToTarget: 'Chief Medical Officer',
      outreachDraft: `Subject: Exceptional VP Clinical Ops Candidate for ${company.name}\n\nHi,\n\nI'm reaching out because I have a rare candidate who I believe would be exceptional for ${company.name} at this stage.\n\nShe is a VP Clinical Operations with 15 years in ${company.sector}, specifically in Phase 2/3 oncology trials. She has scaled clinical teams from 5 to 50+ people and has deep CRO management experience.\n\nGiven your recent milestones, I believe the timing is perfect.\n\nWould you have 15 minutes for a brief call?\n\nBest regards`,
    })),
  }
}
