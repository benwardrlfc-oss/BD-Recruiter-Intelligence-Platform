import Anthropic from '@anthropic-ai/sdk'

const client = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY || '',
})

export interface MarketIntelligenceResult {
  signals: Array<{
    title: string
    summary: string
    signalType: string
    companyName: string
    relevanceScore: number
    impactedFunctions: string[]
    bdAngle: string
    geography: string
    sector: string
    sourceUrl: string
    sourceName: string
    publishedAt: string
  }>
}

export async function runMarketIntelligenceAgent(
  marketProfile: {
    geography: string[]
    sector: string
    subsector?: string
    companyStages: string[]
    functionFocus: string[]
  }
): Promise<MarketIntelligenceResult> {
  if (!process.env.ANTHROPIC_API_KEY) {
    return getMockIntelligenceResult(marketProfile)
  }

  const prompt = `You are a BD intelligence analyst for a life sciences recruiting firm.

  Your task is to identify market signals that represent BD opportunities for a recruiter focused on:
  - Geography: ${marketProfile.geography.join(', ')}
  - Sector: ${marketProfile.sector}
  - Company Stages: ${marketProfile.companyStages.join(', ')}
  - Functions: ${marketProfile.functionFocus.join(', ')}

  Generate 5-10 realistic, high-quality market signals from the past 30 days including:
  - Funding rounds (Series A-D)
  - Leadership changes
  - Expansion announcements
  - Clinical milestones
  - Partnership deals

  For each signal, provide a structured analysis including why it matters for BD and the outreach angle.

  Return as JSON with this structure:
  {
    "signals": [
      {
        "title": "...",
        "summary": "...",
        "signalType": "funding|leadership|expansion|clinical|partnership|hiring|regulatory",
        "companyName": "...",
        "relevanceScore": 0-100,
        "impactedFunctions": ["Clinical Operations", "Regulatory Affairs"],
        "bdAngle": "...",
        "geography": "...",
        "sector": "...",
        "sourceUrl": "...",
        "sourceName": "...",
        "publishedAt": "ISO date string"
      }
    ]
  }`

  try {
    const response = await client.messages.create({
      model: 'claude-opus-4-5',
      max_tokens: 4000,
      messages: [{ role: 'user', content: prompt }],
    })

    const text = response.content[0].type === 'text' ? response.content[0].text : ''
    const jsonMatch = text.match(/\{[\s\S]*\}/)
    if (jsonMatch) {
      return JSON.parse(jsonMatch[0])
    }
  } catch (error) {
    console.error('Market intelligence agent error:', error)
  }

  return getMockIntelligenceResult(marketProfile)
}

function getMockIntelligenceResult(marketProfile: any): MarketIntelligenceResult {
  return {
    signals: [
      {
        title: `New Series B Funding in ${marketProfile.sector}`,
        summary: 'Company raises $50M to accelerate clinical programs',
        signalType: 'funding',
        companyName: 'Example Bio',
        relevanceScore: 85,
        impactedFunctions: ['Clinical Operations', 'Regulatory Affairs'],
        bdAngle: 'Post-funding hiring surge expected across clinical and regulatory functions',
        geography: marketProfile.geography[0] || 'US',
        sector: marketProfile.sector,
        sourceUrl: 'https://example.com',
        sourceName: 'FierceBiotech',
        publishedAt: new Date().toISOString(),
      },
    ],
  }
}
