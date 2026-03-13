'use client'

import { useState, useMemo } from 'react'
import Link from 'next/link'
import {
  Bookmark,
  Building2,
  TrendingUp,
  MapPin,
  ChevronRight,
  Zap,
  DollarSign,
  Users,
  Radio,
  Activity,
  AlertCircle,
  X,
  Sparkles,
  BarChart3,
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { useWatchlist } from '@/lib/watchlist-context'
import { formatTimeAgo, getSignalTypeColor, cn } from '@/lib/utils'
import { useCompanies, useInvestors, useSignals } from '@/lib/hooks/use-data'

type FilterType = 'all' | 'companies' | 'vcs' | 'movement' | 'high-priority'
type TimeRange = '7d' | '30d' | '90d'

const signalTypeLabel: Record<string, string> = {
  funding: 'Funding Round',
  hiring: 'Hiring Signal',
  leadership: 'Leadership Change',
  partnership: 'Partnership',
  regulatory: 'Regulatory Milestone',
  expansion: 'Expansion',
}

const signalTypeIcon: Record<string, typeof DollarSign> = {
  funding: DollarSign,
  hiring: Users,
  leadership: Radio,
  partnership: BarChart3,
  regulatory: AlertCircle,
  expansion: TrendingUp,
}

const whyItMattersMap: Record<string, string> = {
  funding: 'Post-funding hiring surges typically follow within 60–90 days. Prime window for BD outreach.',
  hiring: 'Active hiring indicates growth phase and open mandate opportunities.',
  leadership: 'New leadership typically rebuilds executive teams within 90–180 days.',
  partnership: 'Strategic partnerships often trigger commercial and operational build-outs.',
  regulatory: 'Regulatory milestones accelerate commercialisation and C-suite hiring.',
  expansion: 'Geographic or product expansion creates senior leadership demand.',
}

export default function WatchlistPage() {
  const { watchedCompanies, watchedVCs, removeCompany, removeVC } = useWatchlist()
  const { data: allCompanies } = useCompanies()
  const { data: allInvestors } = useInvestors()
  const { data: allSignals } = useSignals()
  const [filterType, setFilterType] = useState<FilterType>('all')
  const [timeRange, setTimeRange] = useState<TimeRange>('30d')

  const watchedCompanyIds = new Set(watchedCompanies.map((w) => w.entityId))
  const watchedVCIds = new Set(watchedVCs.map((w) => w.entityId))

  const companies = useMemo(
    () => allCompanies.filter((c) => watchedCompanyIds.has(c.id)),
    [allCompanies, watchedCompanies]
  )

  const investors = useMemo(
    () => allInvestors.filter((inv) => watchedVCIds.has(inv.id)),
    [allInvestors, watchedVCs]
  )

  // Movement feed: signals from watched companies + portfolio activity from watched VCs
  const movementItems = useMemo(() => {
    const items: Array<{
      id: string
      entityName: string
      entityType: 'company' | 'vc'
      entityId: string
      signalType: string
      title: string
      summary: string
      whyItMatters: string
      publishedAt: Date
      isHighPriority: boolean
    }> = []

    // Signals for watched companies
    for (const signal of allSignals) {
      if (signal.companyId && watchedCompanyIds.has(signal.companyId)) {
        const company = allCompanies.find((c) => c.id === signal.companyId)
        if (!company) continue
        items.push({
          id: signal.id,
          entityName: company.name,
          entityType: 'company',
          entityId: company.id,
          signalType: signal.signalType,
          title: signal.title,
          summary: signal.summary,
          whyItMatters: signal.whyItMatters,
          publishedAt: signal.publishedAt,
          isHighPriority: signal.relevanceScore >= 88,
        })
      }
    }

    // Portfolio activity for watched VCs
    for (const inv of investors) {
      for (const signal of allSignals) {
        if (signal.companyId && inv.portfolioCompanyIds?.includes(signal.companyId)) {
          const portCo = allCompanies.find((c) => c.id === signal.companyId)
          if (!portCo) continue
          // avoid duplicates if same signal already added via company watch
          if (items.some((i) => i.id === `vc_${signal.id}`)) continue
          items.push({
            id: `vc_${signal.id}`,
            entityName: inv.name,
            entityType: 'vc',
            entityId: inv.id,
            signalType: signal.signalType,
            title: `Portfolio: ${signal.title}`,
            summary: `${portCo.name} — ${signal.summary}`,
            whyItMatters: signal.whyItMatters,
            publishedAt: signal.publishedAt,
            isHighPriority: signal.relevanceScore >= 88,
          })
        }
      }
    }

    return items.sort((a, b) => b.publishedAt.getTime() - a.publishedAt.getTime())
  }, [allSignals, allCompanies, watchedCompanies, watchedVCs, investors])

  // Time-filtered movement
  const daysMap: Record<TimeRange, number> = { '7d': 7, '30d': 30, '90d': 90 }
  const cutoff = new Date(Date.now() - daysMap[timeRange] * 86400000)
  const filteredMovement = movementItems.filter((m) => m.publishedAt >= cutoff)

  // Stats
  const withMovement = new Set([
    ...filteredMovement.filter((m) => m.entityType === 'company').map((m) => m.entityId),
    ...filteredMovement.filter((m) => m.entityType === 'vc').map((m) => m.entityId),
  ]).size
  const highPriority = filteredMovement.filter((m) => m.isHighPriority).length

  const totalWatched = watchedCompanies.length + watchedVCs.length

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Watchlist</h1>
          <p className="text-sm text-slate-400 mt-1">
            Your monitored accounts and territory movement · {totalWatched} accounts tracked
          </p>
        </div>
        <div className="flex items-center gap-2">
          {(['7d', '30d', '90d'] as TimeRange[]).map((t) => (
            <button
              key={t}
              onClick={() => setTimeRange(t)}
              className={cn(
                'px-3 py-1.5 text-xs font-medium rounded-lg border transition-colors',
                timeRange === t
                  ? 'bg-indigo-600 text-white border-indigo-500'
                  : 'bg-slate-900 text-slate-400 border-slate-800 hover:border-slate-600'
              )}
            >
              {t === '7d' ? 'Last 7 days' : t === '30d' ? 'Last 30 days' : 'Last 90 days'}
            </button>
          ))}
        </div>
      </div>

      {/* Section A: Summary Stats */}
      <div className="grid grid-cols-4 gap-4">
        {[
          {
            label: 'Watched Companies',
            value: watchedCompanies.length,
            icon: Building2,
            color: 'text-indigo-400',
            bg: 'bg-indigo-400/10',
          },
          {
            label: 'Watched Venture Firms',
            value: watchedVCs.length,
            icon: TrendingUp,
            color: 'text-purple-400',
            bg: 'bg-purple-400/10',
          },
          {
            label: 'Accounts with Movement',
            value: withMovement,
            icon: Activity,
            color: 'text-emerald-400',
            bg: 'bg-emerald-400/10',
          },
          {
            label: 'High-Priority Signals',
            value: highPriority,
            icon: Zap,
            color: 'text-amber-400',
            bg: 'bg-amber-400/10',
          },
        ].map((stat) => (
          <Card key={stat.label}>
            <CardContent className="p-5">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-sm text-slate-400">{stat.label}</p>
                  <p className="text-3xl font-bold text-white mt-1">{stat.value}</p>
                </div>
                <div className={`rounded-lg p-2.5 ${stat.bg}`}>
                  <stat.icon className={`h-5 w-5 ${stat.color}`} />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Filter bar */}
      <div className="flex items-center gap-2">
        {([
          { key: 'all', label: 'All' },
          { key: 'movement', label: 'With Movement' },
          { key: 'high-priority', label: 'High Priority' },
          { key: 'companies', label: 'Companies' },
          { key: 'vcs', label: 'Venture Firms' },
        ] as { key: FilterType; label: string }[]).map((f) => (
          <button
            key={f.key}
            onClick={() => setFilterType(f.key)}
            className={cn(
              'px-3 py-1.5 text-xs font-medium rounded-lg border transition-colors',
              filterType === f.key
                ? 'bg-indigo-600 text-white border-indigo-500'
                : 'bg-slate-900 text-slate-400 border-slate-800 hover:border-slate-600 hover:text-white'
            )}
          >
            {f.label}
          </button>
        ))}
      </div>

      {totalWatched === 0 ? (
        /* Empty state */
        <Card>
          <CardContent className="py-16 flex flex-col items-center gap-4">
            <div className="h-16 w-16 rounded-2xl bg-indigo-500/10 flex items-center justify-center">
              <Bookmark className="h-8 w-8 text-indigo-400" />
            </div>
            <div className="text-center">
              <p className="text-white font-semibold text-lg">No accounts watched yet</p>
              <p className="text-slate-400 text-sm mt-1">Add companies and venture firms to your watchlist to track their movement</p>
            </div>
            <div className="flex gap-3 mt-2">
              <Link href="/companies">
                <Button variant="secondary" className="gap-2">
                  <Building2 className="h-4 w-4" />
                  Browse Companies
                </Button>
              </Link>
              <Link href="/investors">
                <Button variant="secondary" className="gap-2">
                  <TrendingUp className="h-4 w-4" />
                  Browse Venture Firms
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      ) : (
        <>
          {/* Section B: Recent Movement */}
          {(filterType === 'all' || filterType === 'movement' || filterType === 'high-priority') && (
            <div>
              <div className="flex items-center gap-2 mb-3">
                <Activity className="h-4 w-4 text-emerald-400" />
                <h2 className="text-base font-semibold text-white">Recent Movement</h2>
                <span className="text-xs text-slate-500">· {filteredMovement.length} updates</span>
              </div>

              {filteredMovement.length === 0 ? (
                <Card>
                  <CardContent className="py-10 text-center">
                    <p className="text-slate-500 text-sm">No movement in the last {daysMap[timeRange]} days</p>
                  </CardContent>
                </Card>
              ) : (
                <div className="space-y-3">
                  {filteredMovement
                    .filter((m) => filterType !== 'high-priority' || m.isHighPriority)
                    .map((item) => {
                      const SignalIcon = signalTypeIcon[item.signalType] || Radio
                      const colorClass = getSignalTypeColor(item.signalType)
                      return (
                        <div
                          key={item.id}
                          className={cn(
                            'rounded-xl border p-4 transition-colors',
                            item.isHighPriority
                              ? 'border-amber-500/20 bg-amber-900/5'
                              : 'border-slate-800 bg-slate-900/40'
                          )}
                        >
                          <div className="flex items-start gap-3">
                            <div className={cn('h-9 w-9 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5', `${colorClass.replace('text-', 'bg-').replace('-400', '-500/15')}`)}>
                              <SignalIcon className={cn('h-4 w-4', colorClass)} />
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-start justify-between gap-3">
                                <div className="min-w-0">
                                  <div className="flex items-center gap-2 flex-wrap mb-0.5">
                                    <span className="text-sm font-semibold text-white">{item.entityName}</span>
                                    <Badge
                                      variant="outline"
                                      className={cn('text-xs py-0', item.entityType === 'vc' ? 'text-purple-400 border-purple-500/30' : 'text-indigo-400 border-indigo-500/30')}
                                    >
                                      {item.entityType === 'vc' ? 'Venture Firm' : 'Company'}
                                    </Badge>
                                    <Badge variant="secondary" className="text-xs py-0">
                                      {signalTypeLabel[item.signalType] || item.signalType}
                                    </Badge>
                                    {item.isHighPriority && (
                                      <span className="text-xs px-1.5 py-0.5 rounded-full bg-amber-500/15 text-amber-400 border border-amber-500/20 font-medium">
                                        High Priority
                                      </span>
                                    )}
                                  </div>
                                  <p className="text-sm text-white font-medium leading-snug">{item.title}</p>
                                  <p className="text-xs text-slate-400 mt-1 line-clamp-2">{item.summary}</p>
                                  <div className="mt-2 flex items-start gap-1.5">
                                    <Zap className="h-3 w-3 text-teal-400 flex-shrink-0 mt-0.5" />
                                    <p className="text-xs text-teal-300 leading-relaxed">{item.whyItMatters}</p>
                                  </div>
                                </div>
                                <span className="text-xs text-slate-500 flex-shrink-0">{formatTimeAgo(item.publishedAt)}</span>
                              </div>

                              {/* Quick actions */}
                              <div className="flex items-center gap-2 mt-3 pt-3 border-t border-slate-800/60">
                                <Link href={item.entityType === 'company' ? `/companies/${item.entityId}` : `/investors`}>
                                  <Button variant="ghost" size="sm" className="h-7 text-xs gap-1.5">
                                    <ChevronRight className="h-3 w-3" />
                                    Open {item.entityType === 'company' ? 'Company' : 'VC'}
                                  </Button>
                                </Link>
                                <Link href="/scripts">
                                  <Button variant="ghost" size="sm" className="h-7 text-xs gap-1.5">
                                    <Sparkles className="h-3 w-3" />
                                    Generate BD Script
                                  </Button>
                                </Link>
                                <Link href="/radar">
                                  <Button variant="ghost" size="sm" className="h-7 text-xs gap-1.5">
                                    <Radio className="h-3 w-3" />
                                    View Signal
                                  </Button>
                                </Link>
                                <button
                                  onClick={() => {
                                    if (item.entityType === 'company') removeCompany(item.entityId)
                                    else removeVC(item.entityId)
                                  }}
                                  className="ml-auto h-7 px-2 text-xs text-slate-500 hover:text-red-400 transition-colors flex items-center gap-1"
                                >
                                  <X className="h-3 w-3" />
                                  Unwatch
                                </button>
                              </div>
                            </div>
                          </div>
                        </div>
                      )
                    })}
                </div>
              )}
            </div>
          )}

          {/* Section C: Watched Companies */}
          {(filterType === 'all' || filterType === 'companies') && companies.length > 0 && (
            <div>
              <div className="flex items-center gap-2 mb-3">
                <Building2 className="h-4 w-4 text-indigo-400" />
                <h2 className="text-base font-semibold text-white">Watched Companies</h2>
                <span className="text-xs text-slate-500">· {companies.length}</span>
              </div>
              <div className="grid grid-cols-1 gap-3">
                {companies.map((co) => {
                  const companySignals = allSignals.filter((s) => s.companyId === co.id)
                  const latestSignal = companySignals[0]
                  const addedEntry = watchedCompanies.find((w) => w.entityId === co.id)
                  return (
                    <div
                      key={co.id}
                      className="rounded-xl border border-slate-800 bg-slate-900/40 p-4 hover:border-slate-700 transition-colors"
                    >
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap mb-1">
                            <Link href={`/companies/${co.id}`}>
                              <span className="text-sm font-semibold text-white hover:text-indigo-400 transition-colors">
                                {co.name}
                              </span>
                            </Link>
                            <Badge variant="secondary" className="text-xs">{co.stage}</Badge>
                            <Badge variant="outline" className="text-xs">{co.sector}</Badge>
                          </div>
                          <div className="flex items-center gap-1 mb-2">
                            <MapPin className="h-3 w-3 text-slate-600" />
                            <span className="text-xs text-slate-500">{co.geography}</span>
                          </div>

                          {latestSignal && (
                            <div className="mb-2">
                              <p className="text-xs text-slate-500 mb-0.5">Latest movement</p>
                              <p className="text-xs text-slate-300 leading-snug line-clamp-1">{latestSignal.title}</p>
                            </div>
                          )}

                          <div className="flex items-start gap-1.5">
                            <Zap className="h-3 w-3 text-teal-400 flex-shrink-0 mt-0.5" />
                            <p className="text-xs text-teal-300 line-clamp-2">
                              {latestSignal?.whyItMatters || 'Monitor for upcoming leadership changes and hiring signals.'}
                            </p>
                          </div>
                        </div>

                        <div className="flex flex-col items-end gap-2 flex-shrink-0">
                          <div className="flex items-center gap-1.5">
                            <span className="text-xs text-slate-500">Added {addedEntry ? formatTimeAgo(new Date(addedEntry.addedAt)) : ''}</span>
                          </div>
                          <span className="text-xs font-medium text-indigo-400">{companySignals.length} signal{companySignals.length !== 1 ? 's' : ''}</span>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 mt-3 pt-3 border-t border-slate-800/60">
                        <Link href={`/companies/${co.id}`}>
                          <Button variant="ghost" size="sm" className="h-7 text-xs gap-1.5">
                            <ChevronRight className="h-3 w-3" />
                            Open Company
                          </Button>
                        </Link>
                        <Link href="/scripts">
                          <Button variant="ghost" size="sm" className="h-7 text-xs gap-1.5">
                            <Sparkles className="h-3 w-3" />
                            BD Script
                          </Button>
                        </Link>
                        <Link href="/radar">
                          <Button variant="ghost" size="sm" className="h-7 text-xs gap-1.5">
                            <Radio className="h-3 w-3" />
                            Signals
                          </Button>
                        </Link>
                        <button
                          onClick={() => removeCompany(co.id)}
                          className="ml-auto h-7 px-2 text-xs text-slate-500 hover:text-red-400 transition-colors flex items-center gap-1"
                        >
                          <X className="h-3 w-3" />
                          Unwatch
                        </button>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          )}

          {/* Section D: Watched VCs */}
          {(filterType === 'all' || filterType === 'vcs') && investors.length > 0 && (
            <div>
              <div className="flex items-center gap-2 mb-3">
                <TrendingUp className="h-4 w-4 text-purple-400" />
                <h2 className="text-base font-semibold text-white">Watched Venture Firms</h2>
                <span className="text-xs text-slate-500">· {investors.length}</span>
              </div>
              <div className="grid grid-cols-1 gap-3">
                {investors.map((inv) => {
                  const portfolioCompanies = allCompanies.filter((c) => inv.portfolioCompanyIds?.includes(c.id))
                  const portfolioSignals = allSignals.filter((s) => s.companyId && inv.portfolioCompanyIds?.includes(s.companyId))
                  const latestPortfolioSignal = portfolioSignals[0]
                  const addedEntry = watchedVCs.find((w) => w.entityId === inv.id)
                  return (
                    <div
                      key={inv.id}
                      className="rounded-xl border border-slate-800 bg-slate-900/40 p-4 hover:border-slate-700 transition-colors"
                    >
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap mb-1">
                            <span className="text-sm font-semibold text-white">{inv.name}</span>
                            {inv.stageFocus.slice(0, 2).map((s) => (
                              <Badge key={s} variant="secondary" className="text-xs">{s}</Badge>
                            ))}
                          </div>
                          <div className="flex items-center gap-1 mb-2">
                            <MapPin className="h-3 w-3 text-slate-600" />
                            <span className="text-xs text-slate-500">{inv.geography}</span>
                            <span className="text-xs text-slate-600 mx-1">·</span>
                            <span className="text-xs text-slate-500">{inv.sectorFocus.slice(0, 2).join(', ')}</span>
                          </div>

                          {latestPortfolioSignal && (
                            <div className="mb-2">
                              <p className="text-xs text-slate-500 mb-0.5">Latest portfolio movement</p>
                              <p className="text-xs text-slate-300 leading-snug line-clamp-1">{latestPortfolioSignal.title}</p>
                            </div>
                          )}

                          {portfolioCompanies.length > 0 && (
                            <div className="flex items-center gap-1 flex-wrap mt-1">
                              <span className="text-xs text-slate-500">Portfolio:</span>
                              {portfolioCompanies.map((pc) => (
                                <Link key={pc.id} href={`/companies/${pc.id}`}>
                                  <span className="text-xs text-indigo-400 hover:text-indigo-300 transition-colors">{pc.name}</span>
                                </Link>
                              ))}
                            </div>
                          )}
                        </div>

                        <div className="flex flex-col items-end gap-2 flex-shrink-0">
                          <span className="text-xs text-slate-500">Added {addedEntry ? formatTimeAgo(new Date(addedEntry.addedAt)) : ''}</span>
                          <span className="text-xs font-medium text-purple-400">{portfolioSignals.length} portfolio signal{portfolioSignals.length !== 1 ? 's' : ''}</span>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 mt-3 pt-3 border-t border-slate-800/60">
                        <Link href="/investors">
                          <Button variant="ghost" size="sm" className="h-7 text-xs gap-1.5">
                            <ChevronRight className="h-3 w-3" />
                            Open VC Page
                          </Button>
                        </Link>
                        <Link href="/companies">
                          <Button variant="ghost" size="sm" className="h-7 text-xs gap-1.5">
                            <Building2 className="h-3 w-3" />
                            Portfolio Companies
                          </Button>
                        </Link>
                        <Link href="/radar">
                          <Button variant="ghost" size="sm" className="h-7 text-xs gap-1.5">
                            <Radio className="h-3 w-3" />
                            Signals
                          </Button>
                        </Link>
                        <button
                          onClick={() => removeVC(inv.id)}
                          className="ml-auto h-7 px-2 text-xs text-slate-500 hover:text-red-400 transition-colors flex items-center gap-1"
                        >
                          <X className="h-3 w-3" />
                          Unwatch
                        </button>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  )
}
