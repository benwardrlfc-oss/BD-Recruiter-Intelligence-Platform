'use client'

import { useState } from 'react'
import Link from 'next/link'
import {
  Target,
  TrendingUp,
  Zap,
  Sparkles,
  Building2,
  DollarSign,
  Users,
  ArrowRight,
  ChevronRight,
  MapPin,
  Edit3,
  Radio,
  Newspaper,
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { mockOpportunities, mockCompanies, mockSignals } from '@/lib/mock-data'
import { formatTimeAgo, formatCurrency, getScoreColor, getSignalTypeColor } from '@/lib/utils'

const signalTypeIcons: Record<string, string> = {
  funding: '💰',
  hiring: '👥',
  leadership: '👤',
  partnership: '🤝',
  expansion: '🌍',
  regulatory: '📋',
  product: '🧬',
  clinical: '🔬',
}

const marketScope = {
  sector: 'Biotech',
  subsector: 'Oncology',
  geography: 'USA → Massachusetts → Boston',
  companyStage: 'Seed – Series C',
  functionFocus: 'R&D Leadership / C-Suite',
}

const roleDemand = [
  { role: 'Chief Scientific Officer', signals: 12 },
  { role: 'VP Clinical Development', signals: 9 },
  { role: 'Head of CMC', signals: 7 },
  { role: 'VP Regulatory Affairs', signals: 5 },
  { role: 'Chief Medical Officer', signals: 4 },
]

const emergingCompanies = [
  {
    id: 'comp_4',
    name: 'GenVec Bio',
    stage: 'Series A',
    sector: 'Gene Therapy',
    hires: ['Head of Manufacturing', 'QA Director', 'Analytical Dev Director'],
  },
  {
    id: 'comp_2',
    name: 'DiagnostiX Labs',
    stage: 'Series B',
    sector: 'Diagnostics',
    hires: ['Chief Commercial Officer', 'VP Sales', 'Dir Market Access'],
  },
]

const bdActionsMap: Record<string, string[]> = {
  opp_1: [
    'Contact CEO regarding Phase 3 leadership expansion',
    'Engage board members or venture investors on C-suite search',
  ],
  opp_2: [
    'Reach out to CEO regarding CCO placement',
    'Propose full commercial team build mandate',
  ],
  opp_3: [
    'Contact new CEO Dr. Chen directly within 30 days',
    'Engage investors about C-suite rebuild mandate',
  ],
  opp_4: [
    'Contact COO regarding European leadership expansion',
    'Propose EMEA VP and Country GM mandate',
  ],
  opp_5: [
    'Contact CEO regarding CMC and manufacturing leadership',
    'Engage HealthVentures for portfolio referral',
  ],
}

export default function DashboardPage() {
  const [, setEditingScope] = useState(false)
  const opportunities = mockOpportunities
  const signals = mockSignals
  const companies = mockCompanies

  const stats = [
    {
      label: 'Active Hiring Signals',
      value: opportunities.length,
      icon: Radio,
      color: 'text-indigo-400',
      bg: 'bg-indigo-400/10',
      change: '+3 this week',
    },
    {
      label: 'High Probability Searches',
      value: opportunities.filter((o) => o.opportunityScore >= 85).length,
      icon: Target,
      color: 'text-emerald-400',
      bg: 'bg-emerald-400/10',
      change: 'Signal Strength 85+',
    },
    {
      label: 'New Funding Signals',
      value: signals.filter((s) => s.signalType === 'funding').length,
      icon: DollarSign,
      color: 'text-amber-400',
      bg: 'bg-amber-400/10',
      change: 'Last 30 days',
    },
    {
      label: 'Market Momentum',
      value: opportunities.filter((o) => o.momentumScore > 80).length,
      icon: TrendingUp,
      color: 'text-purple-400',
      bg: 'bg-purple-400/10',
      change: 'High momentum companies',
    },
  ]

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">BD Command Centre</h1>
          <p className="text-sm text-slate-400 mt-1">
            Market Intelligence &amp; Hiring Signal Engine for Executive Search • Updated{' '}
            {formatTimeAgo(new Date())}
          </p>
        </div>
        <Button className="gap-2">
          <Zap className="h-4 w-4" />
          Scan Market Signals
        </Button>
      </div>

      {/* Daily Briefing */}
      <div className="briefing-gradient rounded-xl p-5">
        <div className="flex items-start gap-3">
          <div className="h-8 w-8 rounded-lg flex items-center justify-center flex-shrink-0" style={{ background: 'rgba(20,184,166,0.15)' }}>
            <Newspaper className="h-4 w-4" style={{ color: '#14b8a6' }} />
          </div>
          <div>
            <div className="flex items-center gap-2 mb-1.5">
              <span className="text-xs font-semibold uppercase tracking-wide" style={{ color: '#14b8a6' }}>Your Market Pulse</span>
              <span className="text-xs text-slate-600">· Today</span>
            </div>
            <p className="text-sm text-slate-300 leading-relaxed">
              Three oncology biotech companies announced funding rounds in Boston, signalling upcoming leadership hiring across discovery and clinical development.{' '}
              <Link href="/companies/comp_1" className="text-indigo-400 hover:text-indigo-300 transition-colors">BioNova Therapeutics</Link> posted positive Phase 2 data for BNV-401, triggering expected Phase 3 team build-out.{' '}
              <Link href="/companies/comp_2" className="text-indigo-400 hover:text-indigo-300 transition-colors">DiagnostiX Labs</Link> received FDA Breakthrough Device Designation, accelerating their commercial leadership hiring timeline.
            </p>
          </div>
        </div>
      </div>

      {/* Market Scope Panel */}
      <Card className="border-indigo-500/30 bg-indigo-900/10">
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-5 flex-wrap">
              <span className="text-xs font-semibold text-indigo-400 uppercase tracking-wide">
                Market Scope
              </span>
              <div className="flex items-center gap-1.5">
                <span className="text-xs text-slate-500">Sector:</span>
                <Badge variant="secondary" className="text-xs">{marketScope.sector}</Badge>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="text-xs text-slate-500">Subsector:</span>
                <Badge variant="secondary" className="text-xs">{marketScope.subsector}</Badge>
              </div>
              <div className="flex items-center gap-1.5">
                <MapPin className="h-3 w-3 text-slate-500" />
                <span className="text-xs text-slate-300">{marketScope.geography}</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="text-xs text-slate-500">Stage:</span>
                <span className="text-xs text-slate-300">{marketScope.companyStage}</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="text-xs text-slate-500">Focus:</span>
                <span className="text-xs text-slate-300">{marketScope.functionFocus}</span>
              </div>
            </div>
            <Button
              variant="ghost"
              size="sm"
              className="gap-1 text-xs text-indigo-400 hover:text-indigo-300 shrink-0"
              onClick={() => setEditingScope(true)}
            >
              <Edit3 className="h-3 w-3" />
              Edit Scope
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Stats Row */}
      <div className="grid grid-cols-4 gap-4">
        {stats.map((stat) => (
          <Card key={stat.label} className="card-hover cursor-default">
            <CardContent className="p-5">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-sm text-slate-400">{stat.label}</p>
                  <p className="text-3xl font-bold text-white mt-1">{stat.value}</p>
                  <p className="text-xs text-slate-500 mt-1">{stat.change}</p>
                </div>
                <div className={`rounded-lg p-2.5 ${stat.bg}`}>
                  <stat.icon className={`h-5 w-5 ${stat.color}`} />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Main Grid */}
      <div className="grid grid-cols-3 gap-6">
        {/* Top Hiring Signals */}
        <div className="col-span-2">
          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base">Top Hiring Signals</CardTitle>
                <Link href="/opportunities">
                  <Button variant="ghost" size="sm" className="gap-1 text-xs">
                    View all <ChevronRight className="h-3 w-3" />
                  </Button>
                </Link>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {opportunities.slice(0, 5).map((opp) => {
                  const company = companies.find((c) => c.id === opp.companyId)
                  const actions = bdActionsMap[opp.id] || []
                  return (
                    <div
                      key={opp.id}
                      className="rounded-lg border border-slate-800 bg-slate-900/50 px-4 py-3"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3 flex-1 min-w-0">
                          <div className="h-9 w-9 rounded-lg bg-slate-800 flex items-center justify-center flex-shrink-0">
                            <Building2 className="h-4 w-4 text-slate-400" />
                          </div>
                          <div className="min-w-0">
                            <div className="flex items-center gap-2 flex-wrap">
                              <Link href={`/companies/${opp.companyId}`}>
                                <p className="text-sm font-semibold text-white hover:text-indigo-400 transition-colors truncate">{company?.name}</p>
                              </Link>
                              <Badge variant="outline" className="text-xs shrink-0">{company?.sector}</Badge>
                              <Badge variant="secondary" className="text-xs shrink-0">{company?.stage}</Badge>
                            </div>
                            <div className="flex items-center gap-1 mt-0.5">
                              <MapPin className="h-3 w-3 text-slate-600" />
                              <p className="text-xs text-slate-500">{company?.geography}</p>
                            </div>
                            <p className="text-xs text-slate-500 truncate mt-0.5">
                              Likely hire: {opp.recommendedStakeholder}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2 ml-3 flex-shrink-0">
                          <div className="text-center">
                            <span className={`text-xs font-bold px-2 py-1 rounded-full ${getScoreColor(opp.opportunityScore)}`}>
                              {opp.opportunityScore}
                            </span>
                            <p className="text-xs text-slate-600 mt-0.5">Signal Strength</p>
                          </div>
                          <Link href="/opportunities">
                            <Button variant="ghost" size="icon" className="h-7 w-7">
                              <ArrowRight className="h-3 w-3" />
                            </Button>
                          </Link>
                        </div>
                      </div>
                      {actions.length > 0 && (
                        <div className="mt-2 pt-2 border-t border-slate-800">
                          <p className="text-xs text-slate-500 mb-1 font-medium">Recommended BD Actions:</p>
                          <div className="flex flex-wrap gap-1">
                            {actions.map((action, i) => (
                              <span
                                key={i}
                                className="text-xs px-2 py-0.5 rounded-full bg-indigo-900/40 text-indigo-300 border border-indigo-700/30"
                              >
                                {action}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Quick Actions + Hiring Momentum */}
        <div className="space-y-4">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Quick Actions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <Link href="/candidates">
                <Button variant="secondary" className="w-full justify-start gap-2 text-sm">
                  <Users className="h-4 w-4" />
                  Match a Candidate
                </Button>
              </Link>
              <Link href="/scripts">
                <Button variant="secondary" className="w-full justify-start gap-2 text-sm">
                  <Sparkles className="h-4 w-4" />
                  Generate BD Script
                </Button>
              </Link>
              <Link href="/content">
                <Button variant="secondary" className="w-full justify-start gap-2 text-sm">
                  <Zap className="h-4 w-4" />
                  Create LinkedIn Post
                </Button>
              </Link>
              <Link href="/radar">
                <Button variant="secondary" className="w-full justify-start gap-2 text-sm">
                  <Target className="h-4 w-4" />
                  Browse Signals
                </Button>
              </Link>
            </CardContent>
          </Card>

          {/* Hiring Momentum */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Hiring Momentum</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {opportunities
                  .sort((a, b) => b.momentumScore - a.momentumScore)
                  .slice(0, 5)
                  .map((opp, idx) => {
                    const company = companies.find((c) => c.id === opp.companyId)
                    return (
                      <div key={opp.id} className="flex items-center gap-3">
                        <span className="text-xs font-bold text-slate-500 w-4">{idx + 1}</span>
                        <div className="flex-1 min-w-0">
                          <Link href={`/companies/${opp.companyId}`}>
                            <p className="text-sm font-medium text-white hover:text-indigo-400 transition-colors truncate">{company?.name}</p>
                          </Link>
                          <p className="text-xs text-slate-500">{company?.stage} · {company?.sector}</p>
                        </div>
                        <div className="flex items-center gap-1">
                          <TrendingUp className="h-3 w-3 text-emerald-400" />
                          <span className="text-xs font-semibold text-emerald-400">{opp.momentumScore}</span>
                        </div>
                      </div>
                    )
                  })}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Funding Signals + Role Demand */}
      <div className="grid grid-cols-2 gap-6">
        {/* Recent Funding Signals */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Recent Funding Signals</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {signals
                .filter((s) => s.signalType === 'funding')
                .map((signal) => {
                  const company = companies.find((c) => c.id === signal.companyId)
                  const linkedOpp = opportunities.find((o) => o.companyId === signal.companyId)
                  const likelyHires = linkedOpp?.likelyHiringNeed?.split(',').slice(0, 3) || []
                  return (
                    <div key={signal.id} className="rounded-lg border border-slate-800 px-4 py-3">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="h-8 w-8 rounded-full bg-emerald-500/20 flex items-center justify-center">
                            <DollarSign className="h-4 w-4 text-emerald-400" />
                          </div>
                          <div>
                            <Link href={company ? `/companies/${company.id}` : '#'}>
                              <p className="text-sm font-semibold text-white hover:text-indigo-400 transition-colors">{company?.name || 'Unknown'}</p>
                            </Link>
                            <p className="text-xs text-slate-500">{company?.stage} · {company?.geography}</p>
                          </div>
                        </div>
                        <p className="text-sm font-bold text-emerald-400">
                          {company?.fundingTotal ? formatCurrency(company.fundingTotal) : 'N/A'}
                        </p>
                      </div>
                      {likelyHires.length > 0 && (
                        <div className="mt-2">
                          <p className="text-xs text-slate-500 mb-1">Expected hires:</p>
                          <div className="flex flex-wrap gap-1">
                            {likelyHires.map((hire, i) => (
                              <span key={i} className="text-xs px-2 py-0.5 rounded-full bg-emerald-900/20 text-emerald-400 border border-emerald-700/20">
                                {hire.trim()}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  )
                })}
            </div>
          </CardContent>
        </Card>

        {/* Role Demand Heatmap */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Most In-Demand Leadership Roles</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {roleDemand.map((item, idx) => (
                <div key={item.role} className="flex items-center gap-3">
                  <span className="text-xs font-bold text-slate-600 w-4">{idx + 1}</span>
                  <div className="flex-1">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-sm text-white">{item.role}</span>
                      <span className="text-xs font-bold text-indigo-400">{item.signals} signals</span>
                    </div>
                    <div className="h-1.5 bg-slate-800 rounded-full">
                      <div
                        className="h-1.5 rounded-full bg-gradient-to-r from-indigo-600 to-indigo-400"
                        style={{ width: `${(item.signals / roleDemand[0].signals) * 100}%` }}
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Emerging Companies Module */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Emerging Companies (Last 90 Days)</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-4">
            {emergingCompanies.map((co) => {
              const fullCo = companies.find((c) => c.id === co.id)
              return (
                <div key={co.id} className="rounded-lg border border-slate-800 bg-slate-900/50 p-4">
                  <div className="flex items-center justify-between mb-3">
                    <div>
                      <Link href={`/companies/${co.id}`}>
                        <p className="text-sm font-semibold text-white hover:text-indigo-400 transition-colors">{co.name}</p>
                      </Link>
                      <p className="text-xs text-slate-500">{fullCo?.geography}</p>
                    </div>
                    <div className="flex gap-1.5">
                      <Badge variant="secondary" className="text-xs">{co.stage}</Badge>
                      <Badge variant="outline" className="text-xs">{co.sector}</Badge>
                    </div>
                  </div>
                  <div>
                    <p className="text-xs text-slate-500 mb-1">Expected hires:</p>
                    <div className="flex flex-wrap gap-1">
                      {co.hires.map((hire, i) => (
                        <span key={i} className="text-xs px-2 py-0.5 rounded-full bg-slate-800 text-slate-400 border border-slate-700">
                          {hire}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
