import Anthropic from '@anthropic-ai/sdk'

const client = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY || '',
})

export interface BDScriptResult {
  emailOpener: string
  linkedinOpener: string
  coldCallOpener: string
  followUpEmail: string
}

export async function generateBDScript(params: {
  companyName: string
  stakeholder: string
  outreachAngle: string
  likelyHiringNeed: string
  recentSignal: string
  recruiterName?: string
}): Promise<BDScriptResult> {
  if (!process.env.ANTHROPIC_API_KEY) {
    return getMockScripts(params)
  }

  const prompt = `You are an expert BD strategist for a life sciences executive search firm.

  Generate personalized outreach scripts for the following opportunity:

  Company: ${params.companyName}
  Stakeholder to Target: ${params.stakeholder}
  Recent Signal: ${params.recentSignal}
  Outreach Angle: ${params.outreachAngle}
  Likely Hiring Need: ${params.likelyHiringNeed}
  Recruiter Name: ${params.recruiterName || 'Alex'}

  Generate 4 outreach scripts:
  1. Email opener (150-200 words, subject line included)
  2. LinkedIn connection message (under 300 characters)
  3. Cold call opener script (30-45 seconds spoken)
  4. Follow-up email if no response after 7 days (100-150 words)

  Make them highly personalized, referencing the specific signal and company context.
  Avoid generic language. Be specific, direct, and value-focused.

  Return as JSON:
  {
    "emailOpener": "Subject: ...\\n\\n...",
    "linkedinOpener": "...",
    "coldCallOpener": "...",
    "followUpEmail": "Subject: ...\\n\\n..."
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
    console.error('BD script generator error:', error)
  }

  return getMockScripts(params)
}

function getMockScripts(params: any): BDScriptResult {
  return {
    emailOpener: `Subject: Congratulations on the recent developments at ${params.companyName}\n\nDear ${params.stakeholder},\n\nI noticed the exciting recent news from ${params.companyName} - congratulations on the milestone. Based on your growth trajectory, I imagine you're thinking carefully about the talent needed to execute your next phase.\n\nWe specialize in placing senior executives across life sciences companies at exactly this inflection point. We've recently placed C-suite leaders at companies like yours.\n\nWould you have 20 minutes this week for a brief call?\n\nBest regards,\n${params.recruiterName || 'Alex'}`,
    linkedinOpener: `Hi - saw the exciting news at ${params.companyName}. I work with life sciences executives on key hires at growth inflection points. Would love to connect briefly.`,
    coldCallOpener: `Hi, is this ${params.stakeholder}? Great - I'll be quick. My name is ${params.recruiterName || 'Alex'}, I'm a life sciences executive search specialist. I've been following ${params.companyName}'s progress - congratulations on the recent news. I have a very specific reason for calling - I believe we can help you build the team you need for your next growth phase. Do you have 2 minutes?`,
    followUpEmail: `Subject: Re: ${params.companyName} - Following Up\n\nHi,\n\nI sent you a note last week about executive talent for ${params.companyName}'s next phase. I know inboxes get full, so wanted to follow up briefly.\n\nGiven the ${params.recentSignal}, I believe the timing is particularly relevant right now. Happy to share specific case studies of similar searches we've completed.\n\nBest,\n${params.recruiterName || 'Alex'}`,
  }
}
