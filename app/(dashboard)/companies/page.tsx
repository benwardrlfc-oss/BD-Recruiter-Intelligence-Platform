'use client'

import { useState, useMemo } from 'react'
import Link from 'next/link'
import {
  ArrowUpDown,
  TrendingUp,
  ChevronRight,
  MapPin,
  Star,
  Upload,
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { getScoreColor, cn } from '@/lib/utils'
import { useSettings, companyMatchesSettings } from '@/lib/settings-context'
import { useWatchlist } from '@/lib/watchlist-context'
import { WatchButton } from '@/components/ui/watch-button'
import { useOpportunities, useCompanies, useSignals } from '@/lib/hooks/use-data'
import { ImportCompaniesDialog } from '@/components/companies/ImportCompaniesDialog'
import { rankCompanies } from '@/lib/scoring'
import { useMarketConfig } from '@/lib/market-config'

type SortKey = 'opportunityScore' | 'momentumScore' | 'name'
type FilterLocation = 'all' | string
type FilterStage = 'all' | string

export default function CompaniesPage() {
  const [sortKey, setSortKey] = useState<SortKey>('opportunityScore')
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('desc')
  const [filterLocation, setFilterLocation] = useState<FilterLocation>('all')
  const [filterStage, setFilterStage] = useState<FilterStage>('all')
  const [importOpen, setImportOpen] = useState(false)
  const { settings } = useSettings()
  const { isWatchingCompany, toggleCompany } = useWatchlist()
  const marketConfig = useMarketConfig()
  const { data: allOpportunities } = useOpportunities(settings)
  const { data: allCompanies } = useCompanies(settings)
  const { data: allSignals } = useSignals(settings)

  // Build signal lookup per company
  const signalsByCompany = useMemo(() => {
    const map: Record<string, typeof allSignals> = {}
    for (const s of allSignals) {
      if (s.companyId) {
        if (!map[s.companyId]) map[s.companyId] = []
        map[s.companyId].push(s)
      }
    }
    return map
  }, [allSignals])

  // Companies with no opportunity record — score them using scoring engine
  const oppCompanyIds = new Set(allOpportunities.map((o) => o.companyId))
  const unscoredCompanies = allCompanies
    .filter((c) => !oppCompanyIds.has(c.id) && companyMatchesSettings(c, settings))
  const engineScored = useMemo(() =>
    rankCompanies(unscoredCompanies, signalsByCompany, marketConfig.scoringWeights),
    [unscoredCompanies, signalsByCompany, marketConfig.scoringWeights]
  )

  // Merge opportunity-backed targets + engine-scored targets
  const oppTargets = allOpportunities
    .map((opp) => ({
      ...opp,
      company: (opp as any).company ?? allCompanies.find((c) => c.id === opp.companyId),
    }))
    .filter((t) => t.company && companyMatchesSettings(t.company, settings))

  // Engine-scored companies formatted to match opp shape
  const engineTargets = engineScored
    .filter((c) => c.opportunityScore > 0)
    .map((c) => ({
      id: `scored_${c.id}`,
      companyId: c.id,
      company: c,
      opportunityScore: c.opportunityScore,
      momentumScore: c.momentumScore,
      timingWindow: c.timingWindow,
      linkedSignals: [],
      likelyHiringNeed: null,
      outreachAngle: null,
      lifecycleContext: null,
      recommendedStakeholder: null,
      isArchived: false,
    }))

  const allTargets = [...oppTargets, ...engineTargets]

  // Top 10 by opportunity score
  const top10 = useMemo(
    () =>
      [...allTargets]
        .sort((a, b) => b.opportunityScore - a.opportunityScore)
        .slice(0, 10),
    [allTargets]
  )

  // Unique locations and stages for filters
  const locations = useMemo(() => {
    const locs = [...new Set(allTargets.map((t) => t.company?.geography || '').filter(Boolean))]
    return locs.sort()
  }, [allTargets])

  const stages = useMemo(() => {
    const st = [...new Set(allTargets.map((t) => t.company?.stage || '').filter(Boolean))]
    return st
  }, [allTargets])

  // Full filtered and sorted list
  const sorted = useMemo(() => {
    return [...allTargets]
      .filter((t) => filterLocation === 'all' || t.company?.geography === filterLocation)
      .filter((t) => filterStage === 'all' || t.company?.stage === filterStage)
      .sort((a, b) => {
        let aVal: any = sortKey === 'name' ? a.company?.name : a[sortKey]
        let bVal: any = sortKey === 'name' ? b.company?.name : b[sortKey]
        if (typeof aVal === 'string') aVal = aVal.toLowerCase()
        if (typeof bVal === 'string') bVal = bVal.toLowerCase()
        if (aVal < bVal) return sortDir === 'asc' ? -1 : 1
        if (aVal > bVal) return sortDir === 'asc' ? 1 : -1
        return 0
      })
  }, [allTargets, filterLocation, filterStage, sortKey, sortDir])

  const handleSort = (key: SortKey) => {
    if (sortKey === key) {
      setSortDir(sortDir === 'asc' ? 'desc' : 'asc')
    } else {
      setSortKey(key)
      setSortDir('desc')
    }
  }

  const SortButton = ({ sortFor, label }: { sortFor: SortKey; label: string }) => (
    <button
      onClick={() => handleSort(sortFor)}
      className="flex items-center gap-1 text-xs font-medium text-slate-400 hover:text-white"
    >
      {label}
      <ArrowUpDown className={cn('h-3 w-3', sortKey === sortFor && 'text-indigo-400')} />
    </button>
  )

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white">Companies</h1>
          <p className="text-sm text-slate-400 mt-1">
            {allTargets.length} companies matching your profile · {allOpportunities.length} total tracked
          </p>
        </div>
        <Button variant="outline" size="sm" className="gap-2 shrink-0" onClick={() => setImportOpen(true)}>
          <Upload className="h-3.5 w-3.5" />
          Import CSV
        </Button>
      </div>

      <ImportCompaniesDialog
        open={importOpen}
        onClose={() => setImportOpen(false)}
        onSuccess={() => { /* Data hooks will re-fetch on next render cycle */ }}
      />

      {/* Section 1: Top 10 Accounts */}
      <Card className="border-indigo-500/20 bg-indigo-900/5">
        <CardHeader className="pb-3">
          <div className="flex items-center gap-2">
            <Star className="h-4 w-4 text-amber-400" />
            <CardTitle className="text-base">Top 10 Priority Accounts</CardTitle>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Ranked by hiring signal strength, momentum, and market timing
          </p>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {top10.map((target, idx) => {
              const companySignals = allSignals.filter((s) => s.companyId === target.companyId)
              const latestSignal = companySignals[0]
              return (
                <div
                  key={target.id}
                  className="rounded-xl border border-slate-800/80 bg-slate-900/40 p-4 hover:border-slate-700 transition-colors"
                >
                  <div className="flex items-start justify-between gap-4">
                    {/* Rank + Company */}
                    <div className="flex items-start gap-3 flex-1 min-w-0">
                      <div className={cn(
                        'h-8 w-8 rounded-lg flex items-center justify-center flex-shrink-0 text-xs font-bold',
                        idx === 0 ? 'bg-amber-500/20 text-amber-400' :
                        idx === 1 ? 'bg-slate-600/30 text-slate-300' :
                        idx === 2 ? 'bg-amber-700/20 text-amber-700' :
                        'bg-slate-800 text-slate-500'
                      )}>
                        {idx + 1}
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <Link href={`/companies/${target.companyId}`}>
                            <p className="text-sm font-semibold text-white hover:text-indigo-400 transition-colors">
                              {target.company?.name}
                            </p>
                          </Link>
                          <Badge variant="secondary" className="text-xs">{target.company?.stage}</Badge>
                          <Badge variant="outline" className="text-xs">{target.company?.sector}</Badge>
                        </div>
                        <div className="flex items-center gap-1 mt-0.5">
                          <MapPin className="h-3 w-3 text-slate-600" />
                          <span className="text-xs text-slate-500">{target.company?.geography}</span>
                        </div>

                        {/* Why ranked */}
                        {target.lifecycleContext && (
                          <div className="mt-1.5">
                            <p className="text-xs text-slate-500 mb-0.5">Why this account</p>
                            <p className="text-xs text-slate-400 leading-relaxed line-clamp-2">{target.lifecycleContext}</p>
                          </div>
                        )}

                        {/* Latest signal */}
                        {latestSignal && (
                          <div className="mt-2 flex items-center gap-1.5">
                            <div className="h-1.5 w-1.5 rounded-full bg-teal-400" />
                            <p className="text-xs text-slate-500 line-clamp-1">{latestSignal.title}</p>
                          </div>
                        )}

                        {/* Likely hires */}
                        {target.likelyHiringNeed && (
                          <div className="flex flex-wrap gap-1 mt-2">
                            {target.likelyHiringNeed.split(',').slice(0, 3).map((hire, i) => (
                              <span key={i} className="text-xs px-2 py-0.5 rounded-full bg-indigo-900/30 text-indigo-300 border border-indigo-700/30">
                                {hire.trim()}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Scores + Action */}
                    <div className="flex flex-col items-end gap-2 flex-shrink-0">
                      <div className="flex items-center gap-2">
                        <div className="text-center">
                          <span className={`text-xs font-bold px-2 py-1 rounded-full ${getScoreColor(target.opportunityScore)}`}>
                            {target.opportunityScore}
                          </span>
                          <p className="text-xs text-slate-600 mt-0.5">Signal</p>
                        </div>
                        <div className="text-center">
                          <div className="flex items-center gap-0.5">
                            <TrendingUp className="h-3 w-3 text-emerald-400" />
                            <span className="text-xs font-bold text-emerald-400">{target.momentumScore}</span>
                          </div>
                          <p className="text-xs text-slate-600 mt-0.5">Momentum</p>
                        </div>
                      </div>
                      <WatchButton
                        isWatching={isWatchingCompany(target.companyId)}
                        onToggle={() => toggleCompany(target.companyId)}
                      />
                      <Link href={`/companies/${target.companyId}`}>
                        <Button variant="ghost" size="icon" className="h-7 w-7">
                          <ChevronRight className="h-4 w-4" />
                        </Button>
                      </Link>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        </CardContent>
      </Card>

      {/* Section 2: Full Company List */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-white">All Companies</h2>
          <p className="text-xs text-slate-500">{sorted.length} companies</p>
        </div>

        {/* Filters */}
        <div className="flex items-center gap-3 mb-4 flex-wrap">
          {/* Location filter */}
          <select
            value={filterLocation}
            onChange={(e) => setFilterLocation(e.target.value)}
            className="px-3 py-1.5 text-xs bg-slate-900 border border-slate-800 rounded-lg text-slate-300 focus:outline-none focus:border-indigo-500"
          >
            <option value="all">All Locations</option>
            {locations.map((loc) => (
              <option key={loc} value={loc}>{loc}</option>
            ))}
          </select>

          {/* Stage filter */}
          <select
            value={filterStage}
            onChange={(e) => setFilterStage(e.target.value)}
            className="px-3 py-1.5 text-xs bg-slate-900 border border-slate-800 rounded-lg text-slate-300 focus:outline-none focus:border-indigo-500"
          >
            <option value="all">All Stages</option>
            {stages.map((stage) => (
              <option key={stage} value={stage}>{stage}</option>
            ))}
          </select>

          {/* Sort alphabetical shortcut */}
          <button
            onClick={() => { setSortKey('name'); setSortDir(sortKey === 'name' && sortDir === 'asc' ? 'desc' : 'asc') }}
            className={cn(
              'px-3 py-1.5 text-xs border rounded-lg transition-colors',
              sortKey === 'name'
                ? 'bg-indigo-600 text-white border-indigo-500'
                : 'bg-slate-900 text-slate-400 border-slate-800 hover:border-slate-600'
            )}
          >
            A–Z {sortKey === 'name' ? (sortDir === 'asc' ? '↑' : '↓') : ''}
          </button>

          {(filterLocation !== 'all' || filterStage !== 'all') && (
            <button
              onClick={() => { setFilterLocation('all'); setFilterStage('all') }}
              className="text-xs text-slate-500 hover:text-white transition-colors"
            >
              Clear filters
            </button>
          )}
        </div>

        {/* Table */}
        <Card>
          <CardContent className="p-0">
            <div className="grid grid-cols-12 gap-4 px-6 py-3 border-b border-slate-800 text-xs font-medium text-slate-500 uppercase tracking-wide">
              <div className="col-span-3">
                <SortButton sortFor="name" label="Company" />
              </div>
              <div className="col-span-1">
                <SortButton sortFor="opportunityScore" label="Strength" />
              </div>
              <div className="col-span-1">
                <SortButton sortFor="momentumScore" label="Momentum" />
              </div>
              <div className="col-span-2">Stage</div>
              <div className="col-span-3">Hiring Need</div>
              <div className="col-span-1">Signals</div>
              <div className="col-span-1"></div>
            </div>

            <div className="divide-y divide-slate-800">
              {sorted.map((target, idx) => {
                const coSignals = allSignals.filter((s) => s.companyId === target.companyId)
                return (
                  <div
                    key={target.id}
                    className="grid grid-cols-12 gap-4 px-6 py-4 hover:bg-slate-900/50 transition-colors items-center"
                  >
                    <div className="col-span-3 flex items-center gap-3">
                      <div className="flex items-center justify-center h-8 w-8 rounded-lg bg-slate-800 text-xs font-bold text-slate-500 flex-shrink-0">
                        {idx + 1}
                      </div>
                      <div>
                        <Link href={`/companies/${target.companyId}`}>
                          <p className="text-sm font-semibold text-white hover:text-indigo-400 transition-colors">{target.company?.name}</p>
                        </Link>
                        <div className="flex items-center gap-1 mt-0.5">
                          <MapPin className="h-3 w-3 text-slate-600" />
                          <span className="text-xs text-slate-500">{target.company?.geography}</span>
                        </div>
                      </div>
                    </div>

                    <div className="col-span-1">
                      <span className={`text-sm font-bold px-2.5 py-1 rounded-lg ${getScoreColor(target.opportunityScore)}`}>
                        {target.opportunityScore}
                      </span>
                    </div>

                    <div className="col-span-1">
                      <div className="flex items-center gap-1">
                        <TrendingUp className="h-3.5 w-3.5 text-emerald-400" />
                        <span className="text-sm font-semibold text-emerald-400">{target.momentumScore}</span>
                      </div>
                    </div>

                    <div className="col-span-2">
                      <Badge variant="secondary" className="text-xs">{target.company?.stage}</Badge>
                    </div>

                    <div className="col-span-3">
                      <p className="text-xs text-slate-400 line-clamp-2">
                        {target.likelyHiringNeed?.split(',')[0]}
                      </p>
                    </div>

                    <div className="col-span-1">
                      {coSignals.length > 0 && (
                        <span className="text-xs font-medium text-teal-400">
                          {coSignals.length}
                        </span>
                      )}
                    </div>

                    <div className="col-span-1 flex items-center justify-end gap-1">
                      <WatchButton
                        isWatching={isWatchingCompany(target.companyId)}
                        onToggle={() => toggleCompany(target.companyId)}
                      />
                      <Link href={`/companies/${target.companyId}`}>
                        <Button variant="ghost" size="icon" className="h-7 w-7">
                          <ChevronRight className="h-4 w-4" />
                        </Button>
                      </Link>
                    </div>
                  </div>
                )
              })}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
