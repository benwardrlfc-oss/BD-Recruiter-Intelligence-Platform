import Anthropic from '@anthropic-ai/sdk'

const client = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY || '',
})

export interface ContentResult {
  draftText: string
  contentType: string
  platform: string
}

export async function generateContent(params: {
  contentType: 'linkedin_post' | 'newsletter' | 'market_commentary'
  signals: Array<{ title: string; summary: string; signalType: string; companyId?: string }>
  marketProfile?: { sector: string; geography: string[] }
  additionalContext?: string
}): Promise<ContentResult> {
  if (!process.env.ANTHROPIC_API_KEY) {
    return getMockContent(params)
  }

  const signalsContext = params.signals
    .map((s) => `- ${s.signalType.toUpperCase()}: ${s.title}\n  ${s.summary}`)
    .join('\n\n')

  const contentTypeInstructions = {
    linkedin_post: 'Write a professional LinkedIn post (250-400 words) that positions the author as a life sciences industry expert. Use insights from the signals to share market commentary. Include a question or call-to-action at the end. No hashtag spam - max 3 relevant hashtags.',
    newsletter: 'Write a newsletter section (400-600 words) titled "Market Intelligence Digest". Structure it with a brief market overview, key signals breakdown, and what it means for talent and BD in life sciences.',
    market_commentary: 'Write a market commentary piece (500-700 words) analyzing trends from the signals. Position this as thought leadership content for a life sciences recruiting firm website or blog.',
  }

  const prompt = `You are a content strategist for a top-tier life sciences executive search firm.

  Create ${params.contentType.replace(/_/g, ' ')} content based on these market signals:

  ${signalsContext}

  Instructions: ${contentTypeInstructions[params.contentType]}

  ${params.additionalContext ? `Additional context: ${params.additionalContext}` : ''}
  ${params.marketProfile ? `Market focus: ${params.marketProfile.sector} in ${params.marketProfile.geography.join(', ')}` : ''}

  The content should feel authentic, insightful, and demonstrate deep domain knowledge.
  Do NOT be salesy or mention recruiting explicitly in every paragraph.
  Write as a trusted industry voice.

  Return as JSON:
  {
    "draftText": "...",
    "contentType": "${params.contentType}",
    "platform": "${params.contentType === 'linkedin_post' ? 'LinkedIn' : 'Newsletter/Blog'}"
  }`

  try {
    const response = await client.messages.create({
      model: 'claude-opus-4-5',
      max_tokens: 2000,
      messages: [{ role: 'user', content: prompt }],
    })

    const text = response.content[0].type === 'text' ? response.content[0].text : ''
    const jsonMatch = text.match(/\{[\s\S]*\}/)
    if (jsonMatch) {
      return JSON.parse(jsonMatch[0])
    }
  } catch (error) {
    console.error('Content agent error:', error)
  }

  return getMockContent(params)
}

function getMockContent(params: any): ContentResult {
  const platform = params.contentType === 'linkedin_post' ? 'LinkedIn' : 'Newsletter/Blog'
  return {
    draftText: `The life sciences landscape is shifting rapidly. In the past 30 days alone, we've seen significant funding activity, leadership transitions, and clinical milestones that signal where the market is heading.

What I'm watching closely:

1. The acceleration of clinical-stage biotechs moving to Phase 3 following strong Phase 2 data. This creates predictable, high-volume talent needs 6-12 months out.

2. European expansion by US-based MedTech companies as they look to capture EU market share. Building EMEA teams from scratch is a complex but exciting challenge.

3. The commercial build-outs happening in diagnostics, particularly in liquid biopsy, as companies transition from product development to market capture.

For those of us working at the intersection of talent and market intelligence, these signals are invaluable. The companies growing fastest are those that recognize talent as a strategic priority, not an afterthought.

What signals are you tracking in your corner of life sciences?

#LifeSciences #ExecutiveSearch #Biotech`,
    contentType: params.contentType,
    platform,
  }
}
