import Anthropic from '@anthropic-ai/sdk'

const client = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY || '',
})

export interface CandidateMatchResult {
  parsedProfile: {
    name?: string
    currentRole: string
    currentCompany?: string
    location?: string
    seniority: string
    expertise: string[]
    yearsExperience?: number
    therapeuticAreas: string[]
    titleHistory: Array<{ title: string; company: string }>
    specialty: string
    usp: string
    achievements: string[]
    marketRelevance: string
  }
  matches: Array<{
    companyId: string
    companyName: string
    matchScore: number
    reasonForFit: string
    whyTheyFit: string
    stakeholderToTarget: string
    outreachDraft: string
  }>
}

export async function matchCandidateToCompanies(
  candidateText: string,
  companies: Array<{ id: string; name: string; sector: string; stage?: string; summary?: string }>,
  recruiterNotes?: string
): Promise<CandidateMatchResult> {
  if (!process.env.ANTHROPIC_API_KEY) {
    return getMockMatchResult(candidateText, companies)
  }

  const companiesContext = companies
    .map((c) => `- ${c.name} (${c.sector}, ${c.stage || 'N/A'}): ${c.summary || 'Life sciences company'}`)
    .join('\n')

  const notesSection = recruiterNotes?.trim()
    ? `\n\nRECRUITER NOTES / INTERVIEW CONTEXT:\n${recruiterNotes}`
    : ''

  const prompt = `You are an expert life sciences executive recruiter with 20 years of experience.

Analyze this candidate profile and match them to the most relevant companies. Build a structured, commercially useful profile.

CANDIDATE CV / RESUME:
${candidateText}${notesSection}

AVAILABLE COMPANIES:
${companiesContext}

Return ONLY valid JSON matching this exact schema:
{
  "parsedProfile": {
    "name": "Full name or null",
    "currentRole": "Most recent job title",
    "currentCompany": "Most recent employer",
    "location": "City, State/Country if available",
    "seniority": "C-Suite|VP|Director|Senior Manager|Manager",
    "expertise": ["up to 6 specific expertise areas"],
    "yearsExperience": 15,
    "therapeuticAreas": ["Oncology", "Rare Disease"],
    "titleHistory": [
      { "title": "VP Clinical Development", "company": "BioNova Therapeutics" },
      { "title": "Director Regulatory Affairs", "company": "Genentech" }
    ],
    "specialty": "One concise sentence describing core specialty e.g. Oncology clinical operations leadership",
    "usp": "2-3 sentence unique selling proposition phrased for outbound marketing",
    "achievements": ["3-5 specific commercial achievements from CV"],
    "marketRelevance": "2-3 sentences on ideal company fit, stage, and timing"
  },
  "matches": [
    {
      "companyId": "exact id from companies list",
      "companyName": "exact name",
      "matchScore": 88,
      "reasonForFit": "1-2 sentences on why this company needs this candidate right now",
      "whyTheyFit": "3-4 sentences explaining fit in recruiter language — specific, commercial, tied to company stage and pipeline",
      "stakeholderToTarget": "e.g. CEO / Chief Medical Officer",
      "outreachDraft": "Subject line + email body"
    }
  ]
}`

  try {
    const response = await client.messages.create({
      model: 'claude-opus-4-6',
      max_tokens: 4000,
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
  const topCompanies = companies.slice(0, 5)
  return {
    parsedProfile: {
      name: 'Dr. Sarah Mitchell',
      currentRole: 'VP Clinical Operations',
      currentCompany: 'NovaBiotech',
      location: 'Boston, MA',
      seniority: 'VP',
      expertise: ['Clinical Operations', 'Phase 2/3 Trials', 'CRO Management', 'Regulatory Strategy', 'Team Building', 'Budget Management'],
      yearsExperience: 15,
      therapeuticAreas: ['Oncology', 'Rare Disease', 'Hematology'],
      titleHistory: [
        { title: 'VP Clinical Operations', company: 'NovaBiotech' },
        { title: 'Director Clinical Development', company: 'Genentech' },
        { title: 'Senior Clinical Project Manager', company: 'Covance' },
      ],
      specialty: 'Oncology clinical operations leadership from Phase 2 through NDA submission',
      usp: 'Rare combination of deep scientific credibility and operational scale-up expertise. Has built clinical teams from single digits to 45+ people during critical Phase 2/3 transitions. Proven ability to deliver Phase 3 programmes on time and within budget at major biotechs.',
      achievements: [
        'Delivered 3 Phase 3 oncology programmes to NDA submission at NovaBiotech',
        'Built clinical operations team from 8 to 45 people during Series B to commercial stage transition',
        'Managed $50M+ clinical budget across multiple concurrent trials',
        'Led successful NSCLC and breast cancer programmes at Genentech',
        'Established CRO management framework adopted across 12 global trial sites',
      ],
      marketRelevance: 'Strong fit for Series B–D clinical-stage biotechs building out their Phase 2/3 infrastructure. Particularly valuable for oncology-focused companies with recent funding needing to scale operations quickly. Timing is ideal for companies 12–24 months from key data readouts.',
    },
    matches: topCompanies.map((company, index) => ({
      companyId: company.id,
      companyName: company.name,
      matchScore: 92 - index * 5,
      reasonForFit: `${company.name} is at the precise stage where VP Clinical Operations expertise becomes critical. With their ${company.stage || 'growth'} status and active clinical programmes, this candidate's track record is directly relevant.`,
      whyTheyFit: `Sarah's Phase 2/3 oncology clinical operations background aligns directly with ${company.name}'s pipeline stage and therapeutic focus. Her experience scaling teams through Series B transitions maps precisely to the leadership build-out ${company.name} will need over the next 12–18 months. Having delivered three Phase 3 programmes to NDA, she brings the operational credibility that ${company.sector} boards and CMOs trust at this stage.`,
      stakeholderToTarget: 'Chief Medical Officer',
      outreachDraft: `Subject: Exceptional VP Clinical Ops Candidate — ${company.name} Timing\n\nHi [Name],\n\nI'm reaching out because I'm currently representing an exceptional VP Clinical Operations who I believe is a compelling fit for ${company.name} at this stage of your programme.\n\nShe brings 15 years of oncology clinical leadership, having delivered three Phase 3 programmes to NDA submission at NovaBiotech and led clinical development at Genentech. She's scaled clinical teams from 8 to 45 people and managed $50M+ budgets across complex multi-site trials.\n\nGiven your recent progress and the build-out typically required at this stage, I believe the timing is worth a conversation.\n\nWould you have 15 minutes in the next couple of weeks?\n\nBest regards`,
    })),
  }
}
