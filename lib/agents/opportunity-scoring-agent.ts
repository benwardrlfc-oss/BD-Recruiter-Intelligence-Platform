import Anthropic from '@anthropic-ai/sdk'

const client = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY || '',
})

export interface ScoredOpportunity {
  opportunityScore: number
  momentumScore: number
  timingWindow: string
  recommendedStakeholder: string
  likelyHiringNeed: string
  outreachAngle: string
  lifecycleContext: string
}

export async function scoreOpportunity(params: {
  company: { name: string; sector: string; stage?: string; summary?: string }
  signals: Array<{ title: string; signalType: string; summary: string; whyItMatters: string }>
}): Promise<ScoredOpportunity> {
  if (!process.env.ANTHROPIC_API_KEY) {
    return getMockScore(params)
  }

  const signalsText = params.signals
    .map((s) => `${s.signalType.toUpperCase()}: ${s.title}\n${s.summary}`)
    .join('\n\n')

  const prompt = `You are a senior BD strategist for a life sciences executive search firm.

  Score this BD opportunity based on company context and recent market signals.

  COMPANY: ${params.company.name} (${params.company.sector}, ${params.company.stage || 'N/A'})
  ${params.company.summary || ''}

  SIGNALS:
  ${signalsText}

  Provide:
  1. Opportunity Score (0-100): Overall BD potential
  2. Momentum Score (0-100): How fast things are moving
  3. Timing Window: When to act (Act Now/30 days/60 days/90 days)
  4. Recommended Stakeholder: Who to approach first
  5. Likely Hiring Need: What roles they need
  6. Outreach Angle: How to position the approach
  7. Lifecycle Context: Why now is the right time

  Return as JSON:
  {
    "opportunityScore": 85,
    "momentumScore": 80,
    "timingWindow": "Act Now (30 days)",
    "recommendedStakeholder": "CEO / Co-founder",
    "likelyHiringNeed": "VP Clinical Operations, Head of Regulatory Affairs...",
    "outreachAngle": "...",
    "lifecycleContext": "..."
  }`

  try {
    const response = await client.messages.create({
      model: 'claude-opus-4-5',
      max_tokens: 1500,
      messages: [{ role: 'user', content: prompt }],
    })

    const text = response.content[0].type === 'text' ? response.content[0].text : ''
    const jsonMatch = text.match(/\{[\s\S]*\}/)
    if (jsonMatch) {
      return JSON.parse(jsonMatch[0])
    }
  } catch (error) {
    console.error('Opportunity scoring agent error:', error)
  }

  return getMockScore(params)
}

function getMockScore(params: any): ScoredOpportunity {
  return {
    opportunityScore: 78,
    momentumScore: 72,
    timingWindow: 'Next 60 Days',
    recommendedStakeholder: 'CEO / Co-founder',
    likelyHiringNeed: 'VP Clinical Development, Director Regulatory Affairs, Senior Clinical Project Manager',
    outreachAngle: `Reference ${params.company.name}'s recent growth trajectory and position as specialist talent partner for ${params.company.sector} companies at this stage.`,
    lifecycleContext: `${params.company.name} is at an inflection point with recent activity signaling significant organizational build-out ahead.`,
  }
}
