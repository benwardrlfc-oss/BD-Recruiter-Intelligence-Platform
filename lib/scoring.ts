/**
 * Scoring engine — applies market-profile-aware weights to compute
 * opportunityScore and momentumScore for a company based on its signals.
 *
 * This runs in the frontend (for mock data) and is also called from API routes
 * (for real data). The scoring weights come from market-config.ts.
 */

import type { ScoringWeights } from './market-config'

interface Signal {
  id: string
  signalType: string
  relevanceScore: number
  publishedAt: Date | string
  impactedFunctions?: string[]
}

interface Company {
  id: string
  stage?: string | null
}

export interface ScoredResult {
  opportunityScore: number  // 0–100 BD signal strength
  momentumScore: number     // 0–100 velocity / recency score
  timingWindow: string      // 'Act Now' | '30 days' | '60 days' | '90 days'
  topSignalTypes: string[]  // Signal types driving the score
}

const NOW_MS = () => Date.now()
const DAY_MS = 86_400_000

/**
 * Compute opportunity and momentum scores for a company given its signals
 * and the active market profile's scoring weights.
 */
export function scoreCompany(
  company: Company,
  signals: Signal[],
  weights: ScoringWeights,
): ScoredResult {
  if (signals.length === 0) {
    return { opportunityScore: 0, momentumScore: 0, timingWindow: '90 days', topSignalTypes: [] }
  }

  const now = NOW_MS()
  const stageMultiplier = weights.stageMultiplier[company.stage ?? ''] ?? 1.0

  // Compute weighted score for each signal
  const scored = signals.map((s) => {
    const signalWeight = weights.signalWeights[s.signalType] ?? 1.0
    const rawScore = (s.relevanceScore ?? 50) / 100 // normalise to 0–1
    const weighted = rawScore * signalWeight * stageMultiplier

    const publishedMs = new Date(s.publishedAt).getTime()
    const ageInDays = (now - publishedMs) / DAY_MS
    // Recency decay: full weight within 7 days, 50% at 30 days, 20% at 90 days
    const recencyFactor = ageInDays < 7 ? 1.0 : ageInDays < 30 ? 0.7 : ageInDays < 90 ? 0.4 : 0.15

    return { signal: s, weighted, recencyFactor, ageInDays }
  })

  // Sort by weighted score descending
  scored.sort((a, b) => b.weighted - a.weighted)

  // Opportunity score: sum of top 5 signals × recency, normalised
  const topN = scored.slice(0, 5)
  const rawOpportunity = topN.reduce((sum, { weighted, recencyFactor }) => sum + weighted * recencyFactor, 0)
  // Max possible: 5 signals × 3.0 weight × 1.8 stage × 1.0 relevance × 1.0 recency = 27
  const opportunityScore = Math.min(100, Math.round((rawOpportunity / 12) * 100))

  // Momentum score: number of signals in last 30 days × recency-weighted sum
  const recentSignals = scored.filter((s) => s.ageInDays < 30)
  const velocityBonus = Math.min(30, recentSignals.length * 5) // +5 per recent signal, cap 30
  const recencySum = recentSignals.reduce((sum, { weighted, recencyFactor }) => sum + weighted * recencyFactor, 0)
  const momentumScore = Math.min(100, Math.round((recencySum / 8) * 100 + velocityBonus))

  // Timing window: based on most recent signal age
  const mostRecentAge = scored[0]?.ageInDays ?? 999
  const timingWindow =
    mostRecentAge < 7 ? 'Act Now' :
    mostRecentAge < 30 ? '30 days' :
    mostRecentAge < 60 ? '60 days' : '90 days'

  // Top signal types (deduped)
  const topSignalTypes = [...new Set(topN.slice(0, 3).map((s) => s.signal.signalType))]

  return { opportunityScore, momentumScore, timingWindow, topSignalTypes }
}

/**
 * Rank companies by opportunity score and return the sorted list
 * with scores applied.
 */
export function rankCompanies<T extends Company>(
  companies: T[],
  signalsByCompany: Record<string, Signal[]>,
  weights: ScoringWeights,
): Array<T & ScoredResult> {
  return companies
    .map((company) => {
      const signals = signalsByCompany[company.id] ?? []
      const scored = scoreCompany(company, signals, weights)
      return { ...company, ...scored }
    })
    .sort((a, b) => b.opportunityScore - a.opportunityScore)
}
