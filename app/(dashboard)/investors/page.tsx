'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Building2, DollarSign, Globe, TrendingUp, MapPin, Search, ChevronRight, Award, BarChart3, Zap, Users, Network } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Tooltip } from '@/components/ui/tooltip'
import { mockInvestors, mockSignals, mockCompanies } from '@/lib/mock-data'
import { formatCurrency, cn } from '@/lib/utils'

function EngagementBar({ score }: { score: number }) {
  const color = score >= 90 ? '#10b981' : score >= 75 ? '#14b8a6' : score >= 60 ? '#f59e0b' : '#ef4444'
  const label = score >= 90 ? 'Very High' : score >= 75 ? 'High' : score >= 60 ? 'Medium' : 'Low'
  return (
    <div className="space-y-1">
      <div className="flex items-center justify-between">
        <Tooltip content="Engagement Score (0–100): Measures how actively this VC firm is deploying capital and engaging with new deals. Scores above 90 indicate very high activity. Based on fund recency, capital deployment rate, and deal frequency." side="right">
          <span className="text-xs text-slate-500 cursor-help border-b border-dashed border-slate-600">Engagement Signal</span>
        </Tooltip>
        <span className="text-xs font-bold" style={{ color }}>{label} · {score}</span>
      </div>
      <div className="h-1.5 bg-slate-800 rounded-full">
        <div className="h-1.5 rounded-full transition-all" style={{ width: `${score}%`, backgroundColor: color }} />
      </div>
    </div>
  )
}

export default function InvestorsPage() {
  const [selectedId, setSelectedId] = useState<string | null>(mockInvestors[0]?.id || null)
  const [searchQuery, setSearchQuery] = useState('')
  const [sortBy, setSortBy] = useState<'capitalDeployed' | 'recentFundSize' | 'engagementScore'>('capitalDeployed')
  const [engagementFilter, setEngagementFilter] = useState<'all' | 'very-high' | 'high' | 'medium'>('all')

  const filtered = mockInvestors
    .filter(
      (inv) => {
        const nameMatch = inv.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          inv.sectorFocus.some((s) => s.toLowerCase().includes(searchQuery.toLowerCase()))
        if (!nameMatch) return false
        if (engagementFilter === 'very-high' && inv.engagementScore < 90) return false
        if (engagementFilter === 'high' && inv.engagementScore < 75) return false
        if (engagementFilter === 'medium' && inv.engagementScore < 60) return false
        return true
      }
    )
    .sort((a, b) => (b[sortBy] ?? 0) - (a[sortBy] ?? 0))

  const selected = mockInvestors.find((inv) => inv.id === selectedId)
  const selectedSignals = mockSignals.filter((s) => s.investorId === selectedId)
  const portfolioCompanies = mockCompanies.filter((c) =>
    selected?.portfolioCompanyIds?.includes(c.id)
  )

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-bold text-white">Venture Intelligence</h1>
        <p className="text-sm text-slate-400 mt-1">Venture firms ranked by capital activity and engagement strength</p>
      </div>

      <div className="grid grid-cols-3 gap-6" style={{ height: 'calc(100vh - 210px)' }}>
        {/* Left Panel */}
        <div className="col-span-1 flex flex-col gap-3 min-h-0">
          {/* Search + Sort */}
          <div className="space-y-2">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
              <input
                type="text"
                placeholder="Search venture firms..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-4 py-2 text-sm bg-slate-900 border border-slate-800 rounded-lg text-slate-300 placeholder-slate-600 focus:outline-none focus:border-indigo-500"
              />
            </div>
            <div className="flex gap-1 flex-wrap">
              {([
                { key: 'all', label: 'All' },
                { key: 'very-high', label: '⚡ Very High' },
                { key: 'high', label: '↑ High' },
                { key: 'medium', label: '~ Medium' },
              ] as const).map((opt) => (
                <button
                  key={opt.key}
                  onClick={() => setEngagementFilter(opt.key)}
                  className={cn(
                    'px-2 py-1 rounded text-xs font-medium border transition-colors',
                    engagementFilter === opt.key
                      ? 'bg-teal-600/80 text-white border-teal-500'
                      : 'bg-slate-900 text-slate-400 border-slate-800 hover:border-slate-600'
                  )}
                >
                  {opt.label}
                </button>
              ))}
            </div>
            <div className="flex gap-1.5">
              {[
                { key: 'capitalDeployed', label: 'Deployed' },
                { key: 'recentFundSize', label: 'Fund Size' },
                { key: 'engagementScore', label: 'Engagement' },
              ].map((opt) => (
                <button
                  key={opt.key}
                  onClick={() => setSortBy(opt.key as typeof sortBy)}
                  className={cn(
                    'flex-1 px-2 py-1 rounded text-xs font-medium border transition-colors',
                    sortBy === opt.key
                      ? 'bg-indigo-600 text-white border-indigo-500'
                      : 'bg-slate-900 text-slate-400 border-slate-800 hover:border-slate-600'
                  )}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          {/* Firm List */}
          <div className="space-y-2 overflow-y-auto flex-1">
            {filtered.map((investor, idx) => {
              const firmSignals = mockSignals.filter((s) => s.investorId === investor.id)
              const isSelected = selectedId === investor.id
              return (
                <button
                  key={investor.id}
                  onClick={() => setSelectedId(investor.id)}
                  className={cn(
                    'w-full text-left rounded-xl border p-3.5 transition-all',
                    isSelected
                      ? 'bg-indigo-900/20 border-indigo-500/40'
                      : 'bg-slate-900/50 border-slate-800/60 hover:border-slate-700'
                  )}
                >
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2 min-w-0">
                      <span className="text-xs font-bold text-slate-600 w-4">{idx + 1}</span>
                      <p className="text-sm font-semibold text-white truncate">{investor.name}</p>
                    </div>
                    <ChevronRight className="h-3.5 w-3.5 text-slate-600 shrink-0" />
                  </div>
                  <div className="flex items-center justify-between text-xs mb-2">
                    <span className="text-slate-500">{investor.geography}</span>
                    {investor.aum && (
                      <span className="text-emerald-400 font-semibold">{formatCurrency(investor.aum)} AUM</span>
                    )}
                  </div>
                  <EngagementBar score={investor.engagementScore} />
                  <div className="flex items-center justify-between mt-2">
                    <div className="flex gap-1">
                      {investor.stageFocus.slice(0, 2).map((s) => (
                        <Badge key={s} variant="secondary" className="text-xs py-0">{s}</Badge>
                      ))}
                    </div>
                    {firmSignals.length > 0 && (
                      <span className="text-xs font-medium" style={{ color: '#14b8a6' }}>
                        {firmSignals.length} signal{firmSignals.length > 1 ? 's' : ''}
                      </span>
                    )}
                  </div>
                </button>
              )
            })}
          </div>
        </div>

        {/* Right Panel */}
        <div className="col-span-2 overflow-y-auto space-y-4">
          {selected ? (
            <>
              {/* Firm Overview */}
              <Card>
                <CardContent className="p-5">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <div className="h-12 w-12 rounded-xl bg-slate-800 flex items-center justify-center">
                        <TrendingUp className="h-6 w-6 text-indigo-400" />
                      </div>
                      <div>
                        <h2 className="text-lg font-bold text-white">{selected.name}</h2>
                        <div className="flex items-center gap-1 mt-1">
                          <MapPin className="h-3 w-3 text-slate-500" />
                          <span className="text-xs text-slate-400">{selected.geography}</span>
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-xs text-slate-500">AUM</p>
                      <p className="text-xl font-bold text-emerald-400">{formatCurrency(selected.aum)}</p>
                    </div>
                  </div>

                  <p className="text-sm text-slate-400 mb-4">{selected.activitySummary}</p>

                  {/* Key Metrics */}
                  <div className="grid grid-cols-4 gap-3 mb-4">
                    {[
                      { icon: DollarSign, label: 'Capital Deployed', value: formatCurrency(selected.capitalDeployed), color: 'text-emerald-400' },
                      { icon: BarChart3, label: 'Recent Fund', value: formatCurrency(selected.recentFundSize), color: 'text-indigo-400' },
                      { icon: Zap, label: 'Avg Deal Size', value: formatCurrency(selected.averageDealSize), color: 'text-amber-400' },
                      { icon: Award, label: 'Investments', value: `${selected.totalInvestments} cos`, color: 'text-purple-400' },
                    ].map((m) => (
                      <div key={m.label} className="rounded-lg bg-slate-800/50 p-3">
                        <m.icon className={`h-3.5 w-3.5 ${m.color} mb-1`} />
                        <p className="text-xs text-slate-500">{m.label}</p>
                        <p className={`text-sm font-bold ${m.color}`}>{m.value}</p>
                      </div>
                    ))}
                  </div>

                  {/* Engagement Signal */}
                  <EngagementBar score={selected.engagementScore} />

                  <div className="grid grid-cols-3 gap-4 mt-4">
                    <div>
                      <p className="text-xs font-medium text-slate-500 mb-2">Stage Focus</p>
                      <div className="flex flex-wrap gap-1.5">
                        {selected.stageFocus.map((s) => (
                          <Badge key={s} variant="secondary" className="text-xs">{s}</Badge>
                        ))}
                      </div>
                    </div>
                    <div>
                      <p className="text-xs font-medium text-slate-500 mb-2">Sector Focus</p>
                      <div className="flex flex-wrap gap-1.5">
                        {selected.sectorFocus.map((s) => (
                          <Badge key={s} variant="outline" className="text-xs">{s}</Badge>
                        ))}
                      </div>
                    </div>
                    <div>
                      <p className="text-xs font-medium text-slate-500 mb-2">Geography</p>
                      <span className="text-xs text-slate-300">{selected.geography}</span>
                      {selected.website && (
                        <a href={selected.website} target="_blank" rel="noopener noreferrer"
                          className="flex items-center gap-1 text-xs text-indigo-400 hover:text-indigo-300 mt-1">
                          <Globe className="h-3 w-3" /> Website
                        </a>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Portfolio Companies */}
              {portfolioCompanies.length > 0 && (
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-base">Portfolio Companies</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      {portfolioCompanies.map((co) => {
                        const coSignals = mockSignals.filter((s) => s.companyId === co.id)
                        return (
                          <Link key={co.id} href={`/companies/${co.id}`}>
                            <div className="flex items-center justify-between rounded-xl border border-slate-800/60 px-4 py-3 hover:border-indigo-500/30 hover:bg-indigo-900/10 transition-all cursor-pointer">
                              <div className="flex items-center gap-3">
                                <div className="h-8 w-8 rounded-lg bg-slate-800 flex items-center justify-center">
                                  <Building2 className="h-4 w-4 text-slate-400" />
                                </div>
                                <div>
                                  <p className="text-sm font-semibold text-white">{co.name}</p>
                                  <p className="text-xs text-slate-500">{co.geography}</p>
                                </div>
                              </div>
                              <div className="flex items-center gap-2">
                                <Badge variant="secondary" className="text-xs">{co.stage}</Badge>
                                <Badge variant="outline" className="text-xs">{co.sector}</Badge>
                                {coSignals.length > 0 && (
                                  <span className="text-xs font-medium" style={{ color: '#14b8a6' }}>
                                    {coSignals.length} signal{coSignals.length > 1 ? 's' : ''}
                                  </span>
                                )}
                                <ChevronRight className="h-3.5 w-3.5 text-slate-600" />
                              </div>
                            </div>
                          </Link>
                        )
                      })}
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Hiring Signals in Portfolio */}
              {selectedSignals.length > 0 && (
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-base">Hiring Signals in Portfolio</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {selectedSignals.map((signal) => {
                        const co = mockCompanies.find((c) => c.id === signal.companyId)
                        return (
                          <div key={signal.id} className="rounded-xl border border-slate-800/60 bg-slate-900/50 p-4">
                            <div className="flex items-center justify-between mb-2">
                              <p className="text-sm font-medium text-white">{signal.title}</p>
                              <Badge variant="outline" className="text-xs shrink-0 ml-2">{signal.signalType}</Badge>
                            </div>
                            {co && (
                              <Link href={`/companies/${co.id}`}>
                                <p className="text-xs text-indigo-400 hover:text-indigo-300 mb-2 inline-flex items-center gap-1">
                                  <Building2 className="h-3 w-3" />{co.name} · {co.stage}
                                </p>
                              </Link>
                            )}
                            <p className="text-xs text-slate-400">{signal.bdAngle}</p>
                            <div className="mt-2 flex items-center gap-1">
                              <span className="text-xs font-medium" style={{ color: '#14b8a6' }}>
                                Signal Strength: {signal.relevanceScore}
                              </span>
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Expected Portfolio Hiring */}
              {selected.expectedPortfolioHiring && selected.expectedPortfolioHiring.length > 0 && (
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-base flex items-center gap-2">
                      <Users className="h-4 w-4 text-indigo-400" />
                      Expected Hiring — Portfolio & Market Signals
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {selected.expectedPortfolioHiring.map((item: any, idx: number) => (
                        <div key={idx} className="rounded-xl border border-slate-800/60 bg-slate-900/50 p-4">
                          <div className="flex items-center justify-between mb-2">
                            <p className="text-sm font-semibold text-white">{item.companyName}</p>
                            <span className={`text-xs px-2 py-0.5 rounded-full border font-medium ${
                              item.urgency === 'High'
                                ? 'bg-rose-900/20 text-rose-400 border-rose-700/30'
                                : 'bg-amber-900/20 text-amber-400 border-amber-700/30'
                            }`}>
                              {item.urgency} Priority
                            </span>
                          </div>
                          <p className="text-xs text-slate-500 mb-2">{item.reason}</p>
                          <div className="flex flex-wrap gap-1">
                            {item.roles.map((role: string, i: number) => (
                              <span key={i} className="text-xs px-2 py-0.5 rounded-full bg-indigo-900/30 text-indigo-300 border border-indigo-700/30">
                                {role}
                              </span>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Typical Co-Investors */}
              {selected.typicalCoInvestors && selected.typicalCoInvestors.length > 0 && (
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-base flex items-center gap-2">
                      <Network className="h-4 w-4 text-teal-400" />
                      Typical Co-Investors (Top 5)
                    </CardTitle>
                    <p className="text-xs text-slate-500 mt-1">
                      Firms that frequently co-invest — useful for warm introductions and deal intelligence.
                    </p>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      {selected.typicalCoInvestors.map((co: any, idx: number) => (
                        <div key={idx} className="flex items-center justify-between rounded-lg border border-slate-800/60 px-3 py-2.5">
                          <div className="flex items-center gap-3">
                            <span className="text-xs font-bold text-slate-600 w-4">{idx + 1}</span>
                            <div>
                              <p className="text-sm font-medium text-white">{co.name}</p>
                              <p className="text-xs text-slate-500">{co.focus}</p>
                            </div>
                          </div>
                          <div className="flex items-center gap-1.5">
                            <div className="h-1.5 rounded-full" style={{
                              width: `${Math.round((co.deals / selected.typicalCoInvestors[0].deals) * 48)}px`,
                              backgroundColor: '#14b8a6',
                              minWidth: '8px'
                            }} />
                            <span className="text-xs font-semibold" style={{ color: '#14b8a6' }}>{co.deals} deals</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}
            </>
          ) : (
            <div className="flex items-center justify-center h-64">
              <p className="text-slate-500">Select a venture firm to view details</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
