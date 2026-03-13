'use client'

import { useState } from 'react'
import Link from 'next/link'
import {
  ChevronDown,
  ChevronRight,
  Building2,
  TrendingUp,
  Sparkles,
  MapPin,
  Activity,
  Brain,
  Lightbulb,
  X,
  Users,
} from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { mockOpportunities, mockCompanies, mockSignals } from '@/lib/mock-data'
import { getScoreColor, getSignalTypeColor, cn } from '@/lib/utils'
import { useSettings, companyMatchesSettings } from '@/lib/settings-context'

const bdActionsMap: Record<string, string[]> = {
  opp_1: [
    'Contact CEO or founder regarding leadership expansion',
    'Engage board members or venture investors on C-suite search',
    'Introduce relevant oncology leadership candidates',
    'Reach out regarding organisational buildout ahead of Phase 3',
  ],
  opp_2: [
    'Contact CEO regarding CCO and commercial leadership build',
    'Engage board members or venture investors on commercial strategy',
    'Introduce VP Sales and Market Access candidates',
    'Reach out regarding full commercial team buildout',
  ],
  opp_3: [
    'Contact new CEO Dr. Chen directly within first 30 days',
    'Engage investors about C-suite rebuild mandate',
    'Introduce CFO and Chief Business Officer candidates',
    'Reach out regarding organisational transformation support',
  ],
  opp_4: [
    'Contact COO regarding European leadership expansion',
    'Engage board members on EMEA VP and Country GM mandate',
    'Introduce pre-IPO commercial leadership candidates',
    'Reach out regarding multi-country organisational buildout',
  ],
  opp_5: [
    'Contact CEO regarding CMC and manufacturing leadership',
    'Engage HealthVentures for portfolio referral introduction',
    'Introduce gene therapy specialist candidates',
    'Reach out regarding IND-stage team buildout',
  ],
}

const signalExplanations: Record<string, { source: string; analysis: string; expectedHires: string[] }> = {
  opp_1: {
    source: 'Series C funding announcement + Positive Phase 2 clinical data',
    analysis:
      'Companies raising significant funding while achieving positive clinical milestones typically expand C-suite and VP-level leadership to support Phase 3 execution and regulatory strategy.',
    expectedHires: ['Chief Scientific Officer', 'VP Clinical Development', 'VP Regulatory Affairs', 'Chief Medical Officer'],
  },
  opp_2: {
    source: 'FDA Breakthrough Device Designation + 15+ job postings detected',
    analysis:
      'Diagnostic companies receiving Breakthrough Device Designation typically enter commercial build-out 12–18 months ahead of clearance, requiring rapid CCO, sales, and market access hiring.',
    expectedHires: ['Chief Commercial Officer', 'VP Sales', 'Director Market Access', 'Regional Sales Managers'],
  },
  opp_3: {
    source: 'New CEO appointment + $250M pharma partnership announced',
    analysis:
      'New CEO appointments combined with major contract wins create dual hiring catalysts. New leaders typically rebuild executive teams within 90–180 days while also scaling operationally.',
    expectedHires: ['CFO', 'Chief Business Officer', 'Chief People Officer', 'VP Clinical Operations'],
  },
  opp_4: {
    source: 'European headquarters expansion announcement (Pre-IPO)',
    analysis:
      'Pre-IPO companies opening European headquarters require building an entirely new regional leadership structure. 100+ hires expected across commercial, clinical, and operational functions.',
    expectedHires: ['VP EMEA', 'Country GM Germany', 'Medical Director EMEA', 'Regulatory Director EMEA'],
  },
  opp_5: {
    source: 'Series A funding + IND-enabling studies initiated',
    analysis:
      'Gene therapy companies initiating IND-enabling studies after Series A funding consistently require manufacturing, CMC, and regulatory leadership to advance toward clinical stage.',
    expectedHires: ['Head of Manufacturing', 'QA Director', 'Analytical Development Director', 'Regulatory Affairs Director'],
  },
}

export default function HiringSignalsPage() {
  const [expandedId, setExpandedId] = useState<string | null>(null)
  const [sortBy, setSortBy] = useState<'opportunityScore' | 'momentumScore'>('opportunityScore')
  const [marketIntelId, setMarketIntelId] = useState<string | null>(null)
  const { settings } = useSettings()

  const matching = mockOpportunities.filter((o) => {
    const company = mockCompanies.find((c) => c.id === o.companyId)
    return company ? companyMatchesSettings(company, settings) : false
  })
  const sorted = [...matching].sort((a, b) => b[sortBy] - a[sortBy])
  const totalCount = mockOpportunities.length

  const marketIntelOpp = marketIntelId ? sorted.find(o => o.id === marketIntelId) : null
  const marketIntelCompany = marketIntelOpp ? mockCompanies.find(c => c.id === marketIntelOpp.companyId) : null
  const marketIntelExplanation = marketIntelId ? signalExplanations[marketIntelId] : null
  const marketIntelSignals = marketIntelOpp ? mockSignals.filter(s => marketIntelOpp.linkedSignals.includes(s.id)) : []

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Hiring Signals</h1>
          <p className="text-sm text-slate-400 mt-1">
            {sorted.length} matching your profile · {totalCount} total
          </p>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-sm text-slate-400">Sort by:</span>
          <button
            onClick={() => setSortBy('opportunityScore')}
            className={cn(
              'px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors',
              sortBy === 'opportunityScore'
                ? 'bg-indigo-600 text-white border-indigo-500'
                : 'bg-slate-900 text-slate-400 border-slate-700'
            )}
          >
            Signal Strength
          </button>
          <button
            onClick={() => setSortBy('momentumScore')}
            className={cn(
              'px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors',
              sortBy === 'momentumScore'
                ? 'bg-indigo-600 text-white border-indigo-500'
                : 'bg-slate-900 text-slate-400 border-slate-700'
            )}
          >
            Momentum Score
          </button>
        </div>
      </div>

      {/* Empty state */}
      {sorted.length === 0 && (
        <div className="text-center py-20 text-slate-500">
          <Building2 className="h-10 w-10 mx-auto mb-3 text-slate-700" />
          <p className="text-lg font-medium">No matching opportunities</p>
          <p className="text-sm mt-1">
            Adjust your market profile in{' '}
            <a href="/settings" className="text-indigo-400 hover:text-indigo-300">Settings</a> to widen your search.
          </p>
        </div>
      )}

      {/* Hiring Signals List */}
      <div className="space-y-3">
        {sorted.map((opp) => {
          const company = mockCompanies.find((c) => c.id === opp.companyId)
          const linkedSignalData = mockSignals.filter((s) => opp.linkedSignals.includes(s.id))
          const isExpanded = expandedId === opp.id
          const actions = bdActionsMap[opp.id] || []
          const explanation = signalExplanations[opp.id]
          const primarySignal = linkedSignalData[0]

          return (
            <Card key={opp.id} className={cn('transition-all duration-200 card-hover', isExpanded && 'border-slate-700')}>
              {/* Main Row */}
              <div
                className="flex items-center justify-between p-4 cursor-pointer"
                onClick={() => setExpandedId(isExpanded ? null : opp.id)}
              >
                <div className="flex items-center gap-4 flex-1 min-w-0">
                  <div className="h-10 w-10 rounded-lg bg-slate-800 flex items-center justify-center flex-shrink-0">
                    <Building2 className="h-5 w-5 text-slate-400" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <Link href={`/companies/${opp.companyId}`}>
                        <p className="text-sm font-semibold text-white hover:text-indigo-400 transition-colors truncate max-w-[200px]">{company?.name}</p>
                      </Link>
                      <Badge variant="outline" className="text-xs">{company?.sector}</Badge>
                      <Badge variant="secondary" className="text-xs">{company?.stage}</Badge>
                    </div>
                    <div className="flex items-center gap-1 mt-0.5">
                      <MapPin className="h-3 w-3 text-slate-600" />
                      <span className="text-xs text-slate-500">{company?.geography}</span>
                    </div>
                    {primarySignal && (
                      <p className="text-xs text-slate-500 mt-0.5">
                        Signal detected: <span className="capitalize">{primarySignal.signalType}</span> · Likely hire: {opp.recommendedStakeholder}
                      </p>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-3 ml-4 flex-shrink-0">
                  <div className="text-center">
                    <div className={`text-lg font-bold px-3 py-1 rounded-lg ${getScoreColor(opp.opportunityScore)}`}>
                      {opp.opportunityScore}
                    </div>
                    <p className="text-xs text-slate-600 mt-0.5">Signal Strength</p>
                  </div>
                  <div className="text-center">
                    <div className="flex items-center gap-1 text-emerald-400">
                      <TrendingUp className="h-4 w-4" />
                      <span className="text-sm font-bold">{opp.momentumScore}</span>
                    </div>
                    <p className="text-xs text-slate-600">Momentum</p>
                  </div>
                  {isExpanded ? (
                    <ChevronDown className="h-4 w-4 text-slate-500" />
                  ) : (
                    <ChevronRight className="h-4 w-4 text-slate-500" />
                  )}
                </div>
              </div>

              {/* Expanded Detail */}
              {isExpanded && (
                <div className="border-t border-slate-800 px-4 pb-4">
                  <div className="grid grid-cols-3 gap-4 mt-4">
                    {/* Left: Signal Explanation + Context */}
                    <div className="col-span-2 space-y-4">
                      {/* Why this signal exists */}
                      {explanation && (
                        <div className="rounded-lg border border-indigo-700/30 bg-indigo-900/10 p-4">
                          <div className="flex items-center gap-2 mb-3">
                            <Brain className="h-4 w-4 text-indigo-400" />
                            <h4 className="text-xs font-semibold text-indigo-400 uppercase tracking-wide">
                              Why this signal exists
                            </h4>
                          </div>
                          <div className="space-y-3">
                            <div>
                              <p className="text-xs text-slate-500 mb-1">Signal Source</p>
                              <p className="text-sm text-slate-300">{explanation.source}</p>
                            </div>
                            <div>
                              <p className="text-xs text-slate-500 mb-1">AI Analysis</p>
                              <p className="text-sm text-slate-300">{explanation.analysis}</p>
                            </div>
                            <div>
                              <p className="text-xs text-slate-500 mb-1">Expected hires</p>
                              <div className="flex flex-wrap gap-1.5">
                                {explanation.expectedHires.map((hire, i) => (
                                  <span
                                    key={i}
                                    className="text-xs px-2 py-0.5 rounded-full bg-indigo-900/40 text-indigo-300 border border-indigo-700/30"
                                  >
                                    {hire}
                                  </span>
                                ))}
                              </div>
                            </div>
                          </div>
                        </div>
                      )}

                      <div>
                        <h4 className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-2">
                          Lifecycle Context
                        </h4>
                        <p className="text-sm text-slate-300">{opp.lifecycleContext}</p>
                      </div>

                      {linkedSignalData.length > 0 && (
                        <div>
                          <h4 className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-2">
                            Linked Signals
                          </h4>
                          <div className="space-y-2">
                            {linkedSignalData.map((signal) => (
                              <div
                                key={signal.id}
                                className="flex items-start gap-2 rounded-lg border border-slate-800 px-3 py-2"
                              >
                                <div className={`text-xs px-2 py-0.5 rounded-full border shrink-0 ${getSignalTypeColor(signal.signalType)}`}>
                                  {signal.signalType}
                                </div>
                                <p className="text-xs text-slate-400">{signal.title}</p>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Right: BD Actions Panel */}
                    <div className="space-y-3">
                      <div className="rounded-lg border border-slate-700 bg-slate-900/50 p-4">
                        <div className="flex items-center gap-2 mb-3">
                          <Lightbulb className="h-4 w-4 text-amber-400" />
                          <h4 className="text-xs font-semibold text-slate-400 uppercase tracking-wide">
                            Recommended BD Actions
                          </h4>
                        </div>
                        <div className="space-y-2 mb-4">
                          {actions.map((action, i) => (
                            <div key={i} className="flex items-start gap-2">
                              <div className="h-1.5 w-1.5 rounded-full bg-indigo-400 mt-1.5 shrink-0" />
                              <p className="text-xs text-slate-300">{action}</p>
                            </div>
                          ))}
                        </div>
                        <div className="space-y-2">
                          <button
                            onClick={(e) => { e.stopPropagation(); setMarketIntelId(opp.id) }}
                            className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded-lg bg-indigo-900/30 border border-indigo-700/30 text-xs font-medium text-indigo-300 hover:bg-indigo-900/50 transition-colors"
                          >
                            <Brain className="h-3 w-3" />
                            View Market Intelligence
                          </button>
                          <Link href={`/scripts?opp=${opp.id}`}>
                            <Button size="sm" className="w-full gap-2 text-xs">
                              <Sparkles className="h-3 w-3" />
                              Generate BD Script
                            </Button>
                          </Link>
                          <Link href={`/companies/${company?.id}`}>
                            <Button variant="outline" size="sm" className="w-full gap-2 text-xs">
                              <Building2 className="h-3 w-3" />
                              View Company
                            </Button>
                          </Link>
                          <Link href="/candidates">
                            <Button variant="outline" size="sm" className="w-full gap-2 text-xs">
                              <Users className="h-3 w-3" />
                              Match Candidates
                            </Button>
                          </Link>
                        </div>
                      </div>

                      <div className="rounded-lg border border-slate-800 bg-slate-900/50 p-3">
                        <div className="flex items-center gap-2 mb-1">
                          <Activity className="h-3 w-3 text-indigo-400" />
                          <p className="text-xs font-medium text-slate-400">
                            Signal Strength: <span className={`font-bold ${getScoreColor(opp.opportunityScore).split(' ')[0]}`}>{opp.opportunityScore}</span>
                          </p>
                        </div>
                        <p className="text-xs text-slate-500">
                          AI confidence that hiring activity will occur based on detected market signals.
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </Card>
          )
        })}
      </div>

      {/* Market Intelligence Modal */}
      <Dialog open={!!marketIntelId} onOpenChange={(open) => !open && setMarketIntelId(null)}>
        <DialogContent className="max-w-2xl bg-slate-900 border-slate-700 text-white max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-3">
              <Brain className="h-5 w-5 text-indigo-400" />
              Market Intelligence
              {marketIntelCompany && (
                <span className="text-sm font-normal text-slate-400">— {marketIntelCompany.name}</span>
              )}
            </DialogTitle>
          </DialogHeader>

          {marketIntelExplanation && (
            <div className="space-y-4 mt-2">
              {/* Signal Source */}
              <div className="rounded-lg border border-indigo-700/30 bg-indigo-900/10 p-4">
                <p className="text-xs font-semibold text-indigo-400 uppercase tracking-wide mb-2">Signal Source</p>
                <p className="text-sm text-slate-300">{marketIntelExplanation.source}</p>
              </div>

              {/* AI Analysis */}
              <div className="rounded-lg border border-slate-700 bg-slate-800/50 p-4">
                <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-2">AI Analysis</p>
                <p className="text-sm text-slate-300 leading-relaxed">{marketIntelExplanation.analysis}</p>
              </div>

              {/* Expected Hires */}
              <div>
                <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-2">Expected Hires</p>
                <div className="flex flex-wrap gap-2">
                  {marketIntelExplanation.expectedHires.map((hire, i) => (
                    <span
                      key={i}
                      className="text-xs px-3 py-1 rounded-full bg-indigo-900/40 text-indigo-300 border border-indigo-700/30"
                    >
                      {hire}
                    </span>
                  ))}
                </div>
              </div>

              {/* Lifecycle Context */}
              {marketIntelOpp?.lifecycleContext && (
                <div className="rounded-lg border border-slate-700 bg-slate-800/50 p-4">
                  <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-2">Lifecycle Context</p>
                  <p className="text-sm text-slate-300">{marketIntelOpp.lifecycleContext}</p>
                </div>
              )}

              {/* Linked Signals */}
              {marketIntelSignals.length > 0 && (
                <div>
                  <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-2">Linked Signals</p>
                  <div className="space-y-2">
                    {marketIntelSignals.map((signal) => (
                      <div key={signal.id} className="rounded-lg border border-slate-800 bg-slate-900/50 px-3 py-2.5">
                        <div className="flex items-start gap-2">
                          <span className={`text-xs px-2 py-0.5 rounded-full border shrink-0 ${getSignalTypeColor(signal.signalType)}`}>
                            {signal.signalType}
                          </span>
                          <div>
                            <p className="text-xs text-slate-300 font-medium">{signal.title}</p>
                            <p className="text-xs text-slate-500 mt-0.5">{signal.whyItMatters}</p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Scores */}
              {marketIntelOpp && (
                <div className="grid grid-cols-2 gap-3">
                  <div className="rounded-lg bg-slate-800/50 border border-slate-700 p-3">
                    <p className="text-xs text-slate-500 mb-1">Signal Strength</p>
                    <p className="text-2xl font-bold text-indigo-400">{marketIntelOpp.opportunityScore}</p>
                    <p className="text-xs text-slate-600 mt-1">AI confidence of hiring activity</p>
                  </div>
                  <div className="rounded-lg bg-slate-800/50 border border-slate-700 p-3">
                    <p className="text-xs text-slate-500 mb-1">Momentum Score</p>
                    <p className="text-2xl font-bold text-emerald-400">{marketIntelOpp.momentumScore}</p>
                    <p className="text-xs text-slate-600 mt-1">Rate of signal acceleration</p>
                  </div>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
