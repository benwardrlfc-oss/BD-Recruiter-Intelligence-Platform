import { useSettings } from './settings-context'

export type CommercialModel = 'vc' | 'pe' | 'revenue' | 'mixed'

// ── Scoring model ─────────────────────────────────────────────────────────────

export interface ScoringWeights {
  // Signal type → weight multiplier (1.0 = baseline)
  signalWeights: Record<string, number>
  // Seniority → multiplier applied on top of signal weight
  seniorityMultiplier: Record<string, number>
  // Stage → multiplier
  stageMultiplier: Record<string, number>
}

export interface MarketConfig {
  commercialModel: CommercialModel
  // Navigation / tab labels
  capitalTabLabel: string          // "Venture Intelligence" | "Capital Intelligence" | "Investor Intelligence"
  capitalEntityLabel: string       // "venture firm" | "PE firm" | "investor"
  capitalEntityPluralLabel: string // "venture firms" | "PE firms" | "investors"
  capitalPageDescription: string
  // Signal types prioritised for this market (ordered)
  prioritySignalTypes: string[]
  signalTypeLabels: Record<string, string>
  // Dashboard / card labels
  fundingCardLabel: string         // "Recent Funding Signals" | "Capital Activity" | "Growth Signals"
  investmentLabel: string          // "Funding round" | "PE acquisition" | "Growth event"
  hiringTriggerLabel: string       // What causes hiring in this market
  opportunityContext: string       // One-line insight shown in BD views
  // Dynamic scoring — signal + seniority + stage weights for this market
  scoringWeights: ScoringWeights
}

// ── Industry → commercial model ──────────────────────────────────────────────

const VC_INDUSTRIES = new Set(['Life Sciences', 'Technology', 'Financial Services'])
const PE_INDUSTRIES = new Set([
  'Consulting & Professional Services',
  'Healthcare',
  'Manufacturing & Engineering',
  'Logistics & Supply Chain',
  'Real Estate & Construction',
  'Energy & Infrastructure',
])
const REVENUE_INDUSTRIES = new Set([
  'Legal',
  'Retail & Consumer',
  'Education',
  'Government & Public Sector',
  'Media & Creative',
])

function detectCommercialModel(industry: string, companyTypes: string[]): CommercialModel {
  const types = companyTypes.map((t) => t.toLowerCase())
  const hasVC = types.some((t) => t.includes('vc') || t.includes('venture'))
  const hasPE = types.some((t) => t.includes('pe') || t.includes('private equity'))
  if (hasVC && hasPE) return 'mixed'
  if (hasVC) return 'vc'
  if (hasPE) return 'pe'
  if (VC_INDUSTRIES.has(industry)) return 'vc'
  if (PE_INDUSTRIES.has(industry)) return 'pe'
  if (REVENUE_INDUSTRIES.has(industry)) return 'revenue'
  return 'mixed'
}

// ── Industry → relevant signal types (ordered by priority) ───────────────────

const SIGNAL_PRIORITIES: Record<string, string[]> = {
  'Life Sciences': ['funding', 'clinical', 'regulatory', 'hiring', 'leadership', 'partnership', 'expansion'],
  'Technology': ['funding', 'hiring', 'leadership', 'partnership', 'expansion'],
  'Legal': ['leadership', 'expansion', 'partnership', 'hiring'],
  'Financial Services': ['funding', 'leadership', 'expansion', 'hiring', 'partnership'],
  'Healthcare': ['funding', 'leadership', 'regulatory', 'hiring', 'expansion'],
  'Manufacturing & Engineering': ['expansion', 'hiring', 'leadership', 'partnership'],
  'Consulting & Professional Services': ['expansion', 'leadership', 'hiring', 'partnership'],
  'Energy & Infrastructure': ['expansion', 'partnership', 'hiring', 'leadership', 'regulatory'],
  'Logistics & Supply Chain': ['expansion', 'hiring', 'leadership', 'partnership'],
  'Real Estate & Construction': ['expansion', 'hiring', 'leadership'],
  'Education': ['leadership', 'hiring', 'expansion'],
  'Government & Public Sector': ['leadership', 'expansion', 'hiring'],
  'Media & Creative': ['leadership', 'hiring', 'expansion', 'partnership'],
  'Retail & Consumer': ['expansion', 'hiring', 'leadership', 'partnership'],
}

// ── Industry → signal display labels ─────────────────────────────────────────

const SIGNAL_LABELS: Record<string, Record<string, string>> = {
  'Life Sciences': {
    funding: 'Funding Round', hiring: 'Hiring Signal', leadership: 'Leadership Change',
    partnership: 'Partnership / Licensing', expansion: 'Expansion',
    regulatory: 'Regulatory Milestone', clinical: 'Clinical Milestone',
  },
  'Technology': {
    funding: 'Funding Round', hiring: 'Hiring Signal', leadership: 'Executive Change',
    partnership: 'Partnership / Integration', expansion: 'Market Expansion', regulatory: 'Compliance Update',
  },
  'Legal': {
    hiring: 'Lateral Hire', leadership: 'Partner Move', expansion: 'Office / Practice Launch',
    partnership: 'Mandate Win', funding: 'Revenue Growth',
  },
  'Financial Services': {
    funding: 'Fund Close / Capital Raise', hiring: 'Hiring Signal', leadership: 'Executive Appointment',
    partnership: 'Deal Activity', expansion: 'Market Entry',
  },
  'Healthcare': {
    funding: 'Funding Round', hiring: 'Hiring Signal', leadership: 'Leadership Change',
    partnership: 'Partnership / Contract', expansion: 'Site Expansion', regulatory: 'Regulatory Approval',
  },
  'Consulting & Professional Services': {
    funding: 'Investment / PE Backing', hiring: 'Senior Hire', leadership: 'Partner / Director Appointment',
    partnership: 'Major Mandate', expansion: 'Practice Expansion',
  },
  'Manufacturing & Engineering': {
    funding: 'Capital Raise', hiring: 'Hiring Signal', leadership: 'Leadership Change',
    partnership: 'Contract Win', expansion: 'Site Expansion', regulatory: 'Certification / Approval',
  },
  'Real Estate & Construction': {
    funding: 'Investment', hiring: 'Hiring Signal', leadership: 'Leadership Change',
    partnership: 'Contract Award', expansion: 'Project Launch', regulatory: 'Planning Approval',
  },
  'Energy & Infrastructure': {
    funding: 'Capital Raise', hiring: 'Hiring Signal', leadership: 'Leadership Change',
    partnership: 'Project Award', expansion: 'Infrastructure Development', regulatory: 'Regulatory / Permit',
  },
  'Retail & Consumer': {
    funding: 'Investment Round', hiring: 'Hiring Signal', leadership: 'Leadership Change',
    partnership: 'Brand Partnership', expansion: 'Store / Market Expansion',
  },
}

const DEFAULT_SIGNAL_LABELS: Record<string, string> = {
  funding: 'Funding Round', hiring: 'Hiring Signal', leadership: 'Leadership Change',
  partnership: 'Partnership', expansion: 'Expansion', regulatory: 'Regulatory Event', clinical: 'Clinical Update',
}

// ── Dynamic scoring weights by industry ──────────────────────────────────────
// Signal weight: 0.5 = low relevance → 3.0 = highest relevance for this market

const SENIORITY_MULTIPLIERS: Record<string, number> = {
  Board: 2.0, 'C-Suite': 1.8, VP: 1.5, Director: 1.2, Manager: 1.0, 'Individual Contributor': 0.8,
}

const BASE_STAGE_MULTIPLIERS: Record<string, number> = {
  'Pre-seed': 0.8, Seed: 1.0, 'Series A': 1.3, 'Series B': 1.6,
  Growth: 1.8, 'Late stage': 1.5, Enterprise: 1.2, Public: 1.2,
}

const INDUSTRY_SIGNAL_WEIGHTS: Record<string, Record<string, number>> = {
  'Life Sciences': {
    clinical: 3.0, regulatory: 3.0, funding: 2.5, leadership: 2.0, hiring: 1.8, partnership: 1.5, expansion: 1.0,
  },
  Technology: {
    funding: 2.5, hiring: 2.5, leadership: 2.0, partnership: 1.5, expansion: 1.5, regulatory: 0.8, clinical: 0.3,
  },
  'Financial Services': {
    funding: 2.8, leadership: 2.5, partnership: 2.0, expansion: 1.5, hiring: 1.5, regulatory: 1.2, clinical: 0.2,
  },
  Healthcare: {
    regulatory: 2.8, leadership: 2.5, hiring: 2.0, funding: 2.0, expansion: 1.5, partnership: 1.5, clinical: 1.8,
  },
  Legal: {
    leadership: 3.0, expansion: 2.5, hiring: 2.0, partnership: 2.0, funding: 1.0, regulatory: 1.5, clinical: 0.2,
  },
  'Consulting & Professional Services': {
    leadership: 2.5, expansion: 2.5, partnership: 2.0, hiring: 2.0, funding: 1.5, regulatory: 0.8, clinical: 0.2,
  },
  'Manufacturing & Engineering': {
    expansion: 2.5, partnership: 2.5, hiring: 2.0, leadership: 1.8, funding: 1.5, regulatory: 1.5, clinical: 0.2,
  },
  'Energy & Infrastructure': {
    partnership: 2.8, expansion: 2.5, regulatory: 2.5, hiring: 2.0, leadership: 1.8, funding: 1.5, clinical: 0.2,
  },
  'Real Estate & Construction': {
    expansion: 3.0, partnership: 2.5, hiring: 2.0, leadership: 1.8, funding: 1.5, regulatory: 2.0, clinical: 0.2,
  },
  'Retail & Consumer': {
    expansion: 2.5, partnership: 2.0, hiring: 2.0, leadership: 1.8, funding: 1.5, regulatory: 0.8, clinical: 0.2,
  },
  'Logistics & Supply Chain': {
    expansion: 2.5, partnership: 2.0, hiring: 2.0, leadership: 1.8, funding: 1.5, regulatory: 1.0, clinical: 0.2,
  },
  Education: {
    leadership: 2.5, expansion: 2.0, hiring: 2.0, partnership: 1.5, funding: 1.5, regulatory: 1.0, clinical: 0.2,
  },
  'Government & Public Sector': {
    leadership: 2.5, expansion: 2.0, regulatory: 2.5, hiring: 1.8, partnership: 1.5, funding: 0.8, clinical: 0.2,
  },
  'Media & Creative': {
    leadership: 2.5, partnership: 2.0, expansion: 2.0, hiring: 2.0, funding: 1.5, regulatory: 0.6, clinical: 0.2,
  },
}

const DEFAULT_SIGNAL_WEIGHTS: Record<string, number> = {
  funding: 1.5, hiring: 1.5, leadership: 1.5, partnership: 1.2, expansion: 1.2, regulatory: 1.0, clinical: 1.0,
}

// Commercial model overlay — multiplied on top of industry base weights
const COMMERCIAL_MODEL_MODIFIERS: Record<CommercialModel, Record<string, number>> = {
  vc:      { funding: 1.5, clinical: 1.2, hiring: 1.1 },
  pe:      { leadership: 1.4, partnership: 1.3, expansion: 1.2 },
  revenue: { partnership: 1.3, expansion: 1.2, hiring: 1.2 },
  mixed:   {},
}

function buildScoringWeights(industry: string, commercialModel: CommercialModel): ScoringWeights {
  const base = INDUSTRY_SIGNAL_WEIGHTS[industry] || DEFAULT_SIGNAL_WEIGHTS
  const modifiers = COMMERCIAL_MODEL_MODIFIERS[commercialModel]
  const signalWeights: Record<string, number> = {}
  for (const [signal, weight] of Object.entries(base)) {
    signalWeights[signal] = weight * (modifiers[signal] ?? 1)
  }
  // Ensure all modifier signals are covered even if not in industry base
  for (const [signal, mod] of Object.entries(modifiers)) {
    if (!(signal in signalWeights)) {
      signalWeights[signal] = (DEFAULT_SIGNAL_WEIGHTS[signal] ?? 1.0) * mod
    }
  }
  return {
    signalWeights,
    seniorityMultiplier: SENIORITY_MULTIPLIERS,
    stageMultiplier: BASE_STAGE_MULTIPLIERS,
  }
}

// ── Main factory ──────────────────────────────────────────────────────────────

export function getMarketConfig(
  industry: string,
  companyTypes: string[],
  storedCommercialModel?: string,
): MarketConfig {
  const commercialModel = (storedCommercialModel as CommercialModel | undefined) || detectCommercialModel(industry, companyTypes)

  let capitalTabLabel: string, capitalEntityLabel: string, capitalEntityPluralLabel: string, capitalPageDescription: string

  if (commercialModel === 'vc') {
    capitalTabLabel = 'Venture Intelligence'
    capitalEntityLabel = 'venture firm'
    capitalEntityPluralLabel = 'venture firms'
    capitalPageDescription = 'Venture firms ranked by capital activity and engagement strength'
  } else if (commercialModel === 'pe') {
    capitalTabLabel = 'Capital Intelligence'
    capitalEntityLabel = 'PE firm'
    capitalEntityPluralLabel = 'PE firms'
    capitalPageDescription = 'PE firms and investors ranked by deployment activity and portfolio growth'
  } else if (commercialModel === 'revenue') {
    capitalTabLabel = 'Investor Intelligence'
    capitalEntityLabel = 'investor'
    capitalEntityPluralLabel = 'investors'
    capitalPageDescription = 'Investors and backers ranked by portfolio activity and growth signals'
  } else {
    capitalTabLabel = 'Capital Intelligence'
    capitalEntityLabel = 'investor'
    capitalEntityPluralLabel = 'investors'
    capitalPageDescription = 'Capital firms ranked by investment activity and portfolio momentum'
  }

  const prioritySignalTypes = SIGNAL_PRIORITIES[industry] || ['funding', 'hiring', 'leadership', 'partnership', 'expansion']
  const signalTypeLabels = SIGNAL_LABELS[industry] || DEFAULT_SIGNAL_LABELS

  let fundingCardLabel: string, investmentLabel: string, hiringTriggerLabel: string, opportunityContext: string

  switch (commercialModel) {
    case 'vc':
      fundingCardLabel = 'Recent Funding Signals'
      investmentLabel = 'Funding round'
      hiringTriggerLabel = 'Funding events'
      opportunityContext = 'Post-funding hiring surges typically follow within 60–90 days'
      break
    case 'pe':
      fundingCardLabel = 'Capital Activity'
      investmentLabel = 'PE investment'
      hiringTriggerLabel = 'PE investment & acquisitions'
      opportunityContext = 'PE investment and platform acquisitions typically drive leadership changes within 90 days'
      break
    case 'revenue':
      fundingCardLabel = 'Growth Signals'
      investmentLabel = 'Growth event'
      hiringTriggerLabel = 'Revenue growth & contract wins'
      opportunityContext = 'Revenue growth and contract wins typically precede senior leadership expansion'
      break
    default:
      fundingCardLabel = 'Investment Activity'
      investmentLabel = 'Investment'
      hiringTriggerLabel = 'Capital events & growth signals'
      opportunityContext = 'Capital events and growth signals typically precede senior leadership hiring'
  }

  // Override with industry-specific nuances
  if (industry === 'Legal') {
    fundingCardLabel = 'Market Signals'
    opportunityContext = 'Partner moves and practice launches typically trigger team buildouts within 60 days'
  } else if (industry === 'Real Estate & Construction') {
    fundingCardLabel = 'Project & Contract Activity'
    opportunityContext = 'Contract awards and project launches typically drive senior commercial hiring'
  } else if (industry === 'Energy & Infrastructure') {
    fundingCardLabel = 'Project Activity'
    opportunityContext = 'Major project awards and infrastructure development signal leadership hiring needs'
  }

  return {
    commercialModel,
    capitalTabLabel,
    capitalEntityLabel,
    capitalEntityPluralLabel,
    capitalPageDescription,
    prioritySignalTypes,
    signalTypeLabels,
    fundingCardLabel,
    investmentLabel,
    hiringTriggerLabel,
    opportunityContext,
    scoringWeights: buildScoringWeights(industry, commercialModel),
  }
}

export function useMarketConfig(): MarketConfig {
  const { settings, activeProfile } = useSettings()
  const industry = activeProfile?.industry || settings.sector || 'Life Sciences'
  const companyTypes = activeProfile?.companyTypes || []
  const storedModel = activeProfile?.commercialModel
  return getMarketConfig(industry, companyTypes, storedModel)
}
