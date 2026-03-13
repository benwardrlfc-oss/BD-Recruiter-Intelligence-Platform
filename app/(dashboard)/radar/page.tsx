'use client'

import { useState, useMemo, useCallback } from 'react'
import Link from 'next/link'
import { Filter, ExternalLink, Building2, Clock, ChevronDown, ChevronRight, Zap, Loader2, CheckCircle } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Tooltip } from '@/components/ui/tooltip'
import { formatTimeAgo, formatDate, getSignalTypeColor, signalTypeIcons, cn } from '@/lib/utils'
import { useSettings } from '@/lib/settings-context'
import { useMarketConfig } from '@/lib/market-config'
import { useSignals, useCompanies } from '@/lib/hooks/use-data'

const allSignalTypes = ['All', 'funding', 'hiring', 'leadership', 'partnership', 'expansion', 'regulatory', 'clinical']
const sectors = ['All', 'Biotechnology', 'Biotech', 'MedTech', 'Diagnostics', 'CRO/CDMO', 'CRO / CDMO', 'Gene Therapy', 'Cell Therapy', 'Pharma', 'Digital Health']

export default function RadarPage() {
  const { settings } = useSettings()
  const marketConfig = useMarketConfig()
  const { data: allSignals } = useSignals(settings)
  const { data: allCompanies } = useCompanies()

  // Build signal type filter list: market-priority types first, then remaining, prefixed with All
  const signalTypes = [
    'All',
    ...marketConfig.prioritySignalTypes,
    ...allSignalTypes.filter((t) => t !== 'All' && !marketConfig.prioritySignalTypes.includes(t)),
  ]
  const [selectedType, setSelectedType] = useState('All')
  const [selectedSector, setSelectedSector] = useState('All')
  const [searchQuery, setSearchQuery] = useState('')
  const [dateRange, setDateRange] = useState<'all' | '7d' | '30d' | '90d'>('all')
  const [expandedId, setExpandedId] = useState<string | null>(null)
  const [refreshing, setRefreshing] = useState(false)
  const [refreshResult, setRefreshResult] = useState<{ signalsFound: number } | null>(null)

  const handleRefreshIntelligence = useCallback(async () => {
    setRefreshing(true)
    setRefreshResult(null)
    try {
      const res = await fetch('/api/intelligence/run', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({}),
      })
      const data = await res.json()
      if (res.ok) {
        setRefreshResult({ signalsFound: data.signalsFound ?? 0 })
        // Clear result badge after 5 seconds
        setTimeout(() => setRefreshResult(null), 5000)
      }
    } catch {}
    setRefreshing(false)
  }, [])

  const filtered = useMemo(() => {
    const now = new Date()
    // When user picks a sector from the dropdown, use it directly.
    // When set to 'All', fall back to the user's saved settings sector.
    const effectiveSector = selectedSector !== 'All' ? selectedSector : settings.sector
    return allSignals.filter((s) => {
      if (selectedType !== 'All' && s.signalType !== selectedType) return false
      if (effectiveSector && effectiveSector !== 'All' && s.sector) {
        if (s.sector.toLowerCase() !== effectiveSector.toLowerCase()) return false
      }
      if (searchQuery && !s.title.toLowerCase().includes(searchQuery.toLowerCase())) return false
      if (dateRange !== 'all') {
        const days = dateRange === '7d' ? 7 : dateRange === '30d' ? 30 : 90
        const cutoff = new Date(now.getTime() - days * 24 * 60 * 60 * 1000)
        if (new Date(s.publishedAt) < cutoff) return false
      }
      return true
    })
  }, [allSignals, selectedType, selectedSector, searchQuery, dateRange, settings.sector])

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white">Market Radar</h1>
          <p className="text-sm text-slate-400 mt-1">
            {filtered.length} signals · {settings.sector} · {settings.regions.join(', ')}
          </p>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          {refreshResult && (
            <div className="flex items-center gap-1.5 text-xs text-emerald-400">
              <CheckCircle className="h-3.5 w-3.5" />
              {refreshResult.signalsFound} new signals
            </div>
          )}
          <Button
            variant="outline"
            size="sm"
            className="gap-2"
            onClick={handleRefreshIntelligence}
            disabled={refreshing}
          >
            {refreshing
              ? <Loader2 className="h-3.5 w-3.5 animate-spin" />
              : <Zap className="h-3.5 w-3.5" />
            }
            {refreshing ? 'Running…' : 'Run Intelligence'}
          </Button>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="flex items-center gap-3 flex-wrap">
        <div className="flex items-center gap-2">
          <Filter className="h-4 w-4 text-slate-500" />
          <span className="text-sm text-slate-400">Filter:</span>
        </div>

        <input
          type="text"
          placeholder="Search signals..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="px-3 py-1.5 text-sm bg-slate-900 border border-slate-700 rounded-lg text-slate-300 placeholder-slate-600 focus:outline-none focus:border-indigo-500 w-56"
        />

        <div className="flex items-center gap-2 flex-wrap">
          {signalTypes.map((type) => (
            <button
              key={type}
              onClick={() => setSelectedType(type)}
              className={cn(
                'px-3 py-1.5 rounded-full text-xs font-medium border transition-colors',
                selectedType === type
                  ? 'bg-indigo-600 text-white border-indigo-500'
                  : 'bg-slate-900 text-slate-400 border-slate-700 hover:border-slate-600'
              )}
            >
              {type === 'All' ? 'All Types' : marketConfig.signalTypeLabels[type] || type}
            </button>
          ))}
        </div>

        <Select value={selectedSector} onValueChange={setSelectedSector}>
          <SelectTrigger className="w-40">
            <SelectValue placeholder="Sector" />
          </SelectTrigger>
          <SelectContent>
            {sectors.map((s) => (
              <SelectItem key={s} value={s}>{s === 'All' ? 'All Sectors' : s}</SelectItem>
            ))}
          </SelectContent>
        </Select>

        <div className="flex items-center gap-1.5">
          <span className="text-xs text-slate-500">Period:</span>
          {([
            { key: 'all', label: 'All time' },
            { key: '7d', label: 'Last 7 days' },
            { key: '30d', label: 'Last 30 days' },
            { key: '90d', label: 'Last 90 days' },
          ] as const).map((opt) => (
            <button
              key={opt.key}
              onClick={() => setDateRange(opt.key)}
              className={cn(
                'px-3 py-1.5 rounded-full text-xs font-medium border transition-colors',
                dateRange === opt.key
                  ? 'bg-indigo-600 text-white border-indigo-500'
                  : 'bg-slate-900 text-slate-400 border-slate-700 hover:border-slate-600'
              )}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>

      {/* Signal Cards Grid */}
      <div className="grid grid-cols-2 gap-4">
        {filtered.map((signal) => {
          const company = allCompanies.find((c) => c.id === signal.companyId)
          const isExpanded = expandedId === signal.id

          return (
            <Card
              key={signal.id}
              className={cn(
                'transition-all duration-200 cursor-pointer',
                isExpanded ? 'border-indigo-500/40' : 'hover:border-slate-600'
              )}
              onClick={() => setExpandedId(isExpanded ? null : signal.id)}
            >
              <CardContent className="p-5">
                {/* Signal Header */}
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-2">
                    <span className="text-xl">{signalTypeIcons[signal.signalType] || '📊'}</span>
                    <div
                      className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold ${getSignalTypeColor(signal.signalType)}`}
                    >
                      {signal.signalType}
                    </div>
                    {signal.sourceName && (
                      <span className="text-xs text-slate-600 bg-slate-800 px-2 py-0.5 rounded">
                        {signal.sourceName}
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <div className="flex items-center gap-1 text-xs text-slate-600">
                      <Clock className="h-3 w-3" />
                      {formatTimeAgo(signal.publishedAt)}
                    </div>
                    {isExpanded
                      ? <ChevronDown className="h-4 w-4 text-slate-500" />
                      : <ChevronRight className="h-4 w-4 text-slate-500" />
                    }
                  </div>
                </div>

                {/* Title */}
                <h3 className="mt-3 text-sm font-semibold text-white leading-snug">{signal.title}</h3>

                {/* Summary — truncated when collapsed, full when expanded */}
                <p className={cn('mt-2 text-xs text-slate-400', !isExpanded && 'line-clamp-2')}>
                  {signal.summary}
                </p>

                {/* Why It Matters */}
                <div className="mt-3 rounded-lg bg-slate-800/60 border border-slate-700/50 px-3 py-2">
                  <p className="text-xs font-medium text-amber-400 mb-1">Why it matters</p>
                  <p className={cn('text-xs text-slate-400', !isExpanded && 'line-clamp-2')}>
                    {signal.whyItMatters}
                  </p>
                </div>

                {/* BD Angle */}
                {signal.bdAngle && (
                  <div className="mt-2 rounded-lg bg-indigo-900/20 border border-indigo-700/30 px-3 py-2">
                    <p className="text-xs font-medium text-indigo-400 mb-1">BD Angle</p>
                    <p className={cn('text-xs text-slate-400', !isExpanded && 'line-clamp-2')}>
                      {signal.bdAngle}
                    </p>
                  </div>
                )}

                {/* Expanded-only content */}
                {isExpanded && (
                  <div className="mt-3 space-y-3 border-t border-slate-800 pt-3">
                    {/* Full date */}
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-slate-500">Published</span>
                      <span className="text-slate-300">{formatDate(signal.publishedAt)}</span>
                    </div>

                    {/* All impacted functions */}
                    {signal.impactedFunctions.length > 0 && (
                      <div>
                        <p className="text-xs text-slate-500 mb-1.5">Impacted Functions</p>
                        <div className="flex flex-wrap gap-1">
                          {signal.impactedFunctions.map((fn) => (
                            <span
                              key={fn}
                              className="text-xs px-2 py-0.5 rounded-full bg-slate-800 text-slate-400 border border-slate-700"
                            >
                              {fn}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Source URL */}
                    {signal.sourceUrl && (
                      <a
                        href={signal.sourceUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        onClick={(e) => e.stopPropagation()}
                        className="flex items-center gap-2 rounded-lg border border-slate-700 px-3 py-2 text-xs text-indigo-400 hover:bg-indigo-900/20 hover:border-indigo-500/40 transition-colors w-full"
                      >
                        <ExternalLink className="h-3.5 w-3.5 shrink-0" />
                        <span className="truncate">{signal.sourceUrl}</span>
                        <span className="ml-auto shrink-0 text-slate-500">Open article →</span>
                      </a>
                    )}
                  </div>
                )}

                {/* Footer */}
                <div className="mt-3 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    {company && (
                      <Link
                        href={`/companies/${company.id}`}
                        onClick={(e) => e.stopPropagation()}
                        className="flex items-center gap-1 text-xs text-indigo-400 hover:text-indigo-300"
                      >
                        <Building2 className="h-3 w-3" />
                        {company.name}
                      </Link>
                    )}
                    {!isExpanded && (
                      <div className="flex items-center gap-1">
                        {signal.impactedFunctions.slice(0, 2).map((fn) => (
                          <span
                            key={fn}
                            className="text-xs px-2 py-0.5 rounded-full bg-slate-800 text-slate-400 border border-slate-700"
                          >
                            {fn}
                          </span>
                        ))}
                        {signal.impactedFunctions.length > 2 && (
                          <span className="text-xs text-slate-600">+{signal.impactedFunctions.length - 2}</span>
                        )}
                      </div>
                    )}
                  </div>
                  <Tooltip
                    content="Signal Strength (0–100): AI confidence score that meaningful hiring activity will occur at this company based on the detected market signals."
                    side="top"
                  >
                    <span className="text-xs font-semibold text-indigo-400 cursor-help border-b border-dashed border-indigo-400/40">
                      {signal.relevanceScore}
                    </span>
                  </Tooltip>
                </div>
              </CardContent>
            </Card>
          )
        })}
      </div>

      {filtered.length === 0 && (
        <div className="text-center py-16 text-slate-500">
          <p className="text-lg font-medium">No signals match your filters</p>
          <p className="text-sm mt-1">Try adjusting your search criteria</p>
        </div>
      )}
    </div>
  )
}
