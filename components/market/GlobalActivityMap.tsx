'use client'

import { useState, useMemo } from 'react'
import Link from 'next/link'
import { ComposableMap, Geographies, Geography, Marker, ZoomableGroup } from 'react-simple-maps'
import { Building2, X, ChevronRight, Globe } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { mockCompanies, mockSignals } from '@/lib/mock-data'
import { cn } from '@/lib/utils'
import type { UserSettings } from '@/lib/settings-context'

// World GeoJSON from Natural Earth via CDN
const GEO_URL = 'https://cdn.jsdelivr.net/npm/world-atlas@2/countries-110m.json'

const SIGNAL_TYPE_COLORS: Record<string, string> = {
  funding:     '#10b981',
  hiring:      '#6366f1',
  leadership:  '#a855f7',
  partnership: '#f59e0b',
  expansion:   '#3b82f6',
  clinical:    '#ec4899',
  regulatory:  '#ef4444',
}

const cityCoords: Record<string, [number, number]> = {
  'boston':            [-71.06, 42.36],
  'cambridge, ma':     [-71.11, 42.37],
  'san francisco':     [-122.42, 37.77],
  'san diego':         [-117.16, 32.72],
  'raleigh':           [-78.64, 35.78],
  'chicago':           [-87.65, 41.85],
  'new york':          [-74.01, 40.71],
  'london':            [-0.13, 51.51],
  'cambridge, uk':     [0.12, 52.20],
  'munich':            [11.58, 48.14],
  'zurich':            [8.54, 47.38],
  'berlin':            [13.41, 52.52],
  'amsterdam':         [4.90, 52.37],
  'stockholm':         [18.07, 59.33],
  'toronto':           [-79.38, 43.65],
  'seattle':           [-122.33, 47.61],
  'houston':           [-95.37, 29.76],
  'los angeles':       [-118.24, 34.05],
  'philadelphia':      [-75.16, 39.95],
  'maryland':          [-76.64, 39.05],
  'research triangle': [-79.05, 35.90],
}

function geoToCoords(geography: string): [number, number] | null {
  const geo = geography.toLowerCase()
  for (const [key, coords] of Object.entries(cityCoords)) {
    if (geo.includes(key)) return coords
  }
  return null
}

// Default zoom centres per geo filter
const GEO_VIEWS: Record<string, { center: [number, number]; zoom: number }> = {
  Global:        { center: [0, 20], zoom: 1 },
  'North America': { center: [-98, 40], zoom: 2.5 },
  Europe:        { center: [15, 52], zoom: 3.5 },
  Asia:          { center: [100, 35], zoom: 2 },
}

interface Props {
  signalFilter: string
  timeRange: number
  geoFilter: string
  searchQuery: string
  selectedCompanyId: string | null
  onSelectCompany: (id: string | null) => void
  onClose: () => void
  userSettings: UserSettings
}

export default function GlobalActivityMap({
  signalFilter,
  geoFilter,
  searchQuery,
  selectedCompanyId,
  onSelectCompany,
  onClose,
  userSettings,
}: Props) {
  const [tooltip, setTooltip] = useState<{ x: number; y: number; company: typeof mockCompanies[0]; signals: typeof mockSignals } | null>(null)

  const geoView = GEO_VIEWS[geoFilter] || GEO_VIEWS.Global

  interface CompanyMapDatum {
    co: typeof mockCompanies[0]
    coords: [number, number]
    allSignals: typeof mockSignals
    filteredSignals: typeof mockSignals
    hasActivity: boolean
    primarySignal: typeof mockSignals[0] | undefined
    color: string
  }

  // Build company map data, filtered by signal filter + search
  const companyData = useMemo((): CompanyMapDatum[] => {
    const results: CompanyMapDatum[] = []
    for (const co of mockCompanies) {
      const coords = geoToCoords(co.geography || '')
      if (!coords) continue

      if (searchQuery) {
        const q = searchQuery.toLowerCase()
        if (!co.name.toLowerCase().includes(q) && !(co.geography || '').toLowerCase().includes(q)) continue
      }

      const allSignals = mockSignals.filter((s) => s.companyId === co.id)
      const filteredSignals = signalFilter === 'All'
        ? allSignals
        : allSignals.filter((s) => s.signalType === signalFilter)
      const hasActivity = filteredSignals.length > 0
      const primarySignal = filteredSignals[0] || allSignals[0]
      const color = hasActivity && primarySignal
        ? (SIGNAL_TYPE_COLORS[primarySignal.signalType] || '#6366f1')
        : '#334155'

      results.push({ co, coords, allSignals, filteredSignals, hasActivity, primarySignal, color })
    }
    return results
  }, [signalFilter, searchQuery])

  const selectedData = selectedCompanyId
    ? companyData.find((d) => d.co.id === selectedCompanyId) || null
    : null

  // Regional summary stats (when nothing selected)
  const totalSignals = companyData.reduce((sum, d) => sum + d.filteredSignals.length, 0)
  const activeCount = companyData.filter((d) => d.hasActivity).length
  const signalBreakdown = Object.entries(SIGNAL_TYPE_COLORS).map(([type, color]) => ({
    type,
    color,
    count: mockSignals.filter((s) => s.signalType === type && companyData.some((d) => d.co.id === s.companyId)).length,
  })).filter((s) => s.count > 0).sort((a, b) => b.count - a.count)

  const topActive = [...companyData]
    .filter((d) => d.hasActivity)
    .sort((a, b) => b.filteredSignals.length - a.filteredSignals.length)
    .slice(0, 5)

  return (
    <div className="flex flex-1 min-h-0">
      {/* Map */}
      <div className="flex-1 relative overflow-hidden" style={{ minHeight: '500px', background: '#05090f' }}>
        {/* Subtle grid overlay */}
        <div className="absolute inset-0 pointer-events-none z-10" style={{
          backgroundImage: 'linear-gradient(rgba(99,102,241,0.03) 1px, transparent 1px), linear-gradient(90deg, rgba(99,102,241,0.03) 1px, transparent 1px)',
          backgroundSize: '60px 60px',
        }} />

        <ComposableMap
          projection="geoMercator"
          style={{ width: '100%', height: '100%' }}
        >
          <ZoomableGroup center={geoView.center} zoom={geoView.zoom} maxZoom={8} minZoom={1}>
            {/* Ocean background handled by container bg */}
            <Geographies geography={GEO_URL}>
              {({ geographies }) =>
                geographies.map((geo) => (
                  <Geography
                    key={geo.rsmKey}
                    geography={geo}
                    fill="#0d1825"
                    stroke="#1a2840"
                    strokeWidth={0.4}
                    style={{
                      default: { outline: 'none' },
                      hover:   { fill: '#111e30', outline: 'none' },
                      pressed: { outline: 'none' },
                    }}
                  />
                ))
              }
            </Geographies>

            {/* Company markers */}
            {companyData.map((d) => {
              if (!d.coords) return null
              const isSelected = selectedCompanyId === d.co.id
              const size = isSelected ? 10 : d.hasActivity ? 7 : 4

              return (
                <Marker
                  key={d.co.id}
                  coordinates={d.coords}
                  onClick={() => onSelectCompany(isSelected ? null : d.co.id)}
                  onMouseEnter={(e) => {
                    const rect = (e.target as SVGElement).closest('svg')?.getBoundingClientRect()
                    if (rect) {
                      // Tooltip position approximation — we'll use a simple approach
                      setTooltip({ x: 0, y: 0, company: d.co, signals: d.filteredSignals })
                    }
                  }}
                  onMouseLeave={() => setTooltip(null)}
                >
                  {/* Pulse ring for selected */}
                  {isSelected && (
                    <circle
                      r={size + 6}
                      fill={d.color}
                      opacity={0.2}
                      className="animate-ping"
                    />
                  )}
                  {/* Glow halo for active signals */}
                  {d.hasActivity && !isSelected && (
                    <circle r={size + 3} fill={d.color} opacity={0.15} />
                  )}
                  {/* Main marker */}
                  <circle
                    r={size}
                    fill={d.color}
                    stroke={isSelected ? 'white' : 'rgba(255,255,255,0.2)'}
                    strokeWidth={isSelected ? 1.5 : 0.5}
                    opacity={d.hasActivity ? 1 : 0.3}
                    style={{
                      cursor: 'pointer',
                      filter: d.hasActivity ? `drop-shadow(0 0 ${isSelected ? 6 : 3}px ${d.color})` : 'none',
                    }}
                  />
                </Marker>
              )
            })}
          </ZoomableGroup>
        </ComposableMap>

        {/* Hover tooltip */}
        {tooltip && (
          <div className="absolute top-4 left-4 pointer-events-none z-20 bg-slate-900/95 border border-slate-600 rounded-xl px-3 py-2.5 shadow-xl max-w-xs">
            <p className="text-xs font-bold text-white">{tooltip.company.name}</p>
            <p className="text-xs text-slate-400">{tooltip.company.geography}</p>
            {tooltip.signals.length > 0 && (
              <p className="text-xs mt-1" style={{ color: SIGNAL_TYPE_COLORS[tooltip.signals[0].signalType] || '#6366f1' }}>
                {tooltip.signals.length} signal{tooltip.signals.length > 1 ? 's' : ''}
              </p>
            )}
          </div>
        )}

        {/* Click hint */}
        {!selectedCompanyId && (
          <div className="absolute bottom-4 left-1/2 -translate-x-1/2 pointer-events-none z-20">
            <div className="bg-slate-900/80 backdrop-blur border border-slate-700/60 rounded-full px-3 py-1.5">
              <p className="text-xs text-slate-400">Click any marker to view company details</p>
            </div>
          </div>
        )}
      </div>

      {/* Right Panel */}
      <div className="w-80 border-l border-slate-800/60 overflow-y-auto shrink-0 flex flex-col" style={{ background: '#080e1c' }}>
        {selectedData ? (
          /* Company detail view */
          <div className="p-5 space-y-4 flex-1">
            <div className="flex items-start justify-between">
              <div className="min-w-0">
                <p className="text-sm font-bold text-white leading-snug">{selectedData.co.name}</p>
                <p className="text-xs text-slate-400 mt-0.5">{selectedData.co.geography}</p>
              </div>
              <button onClick={() => onSelectCompany(null)} className="text-slate-500 hover:text-white transition-colors ml-2 shrink-0">
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="flex flex-wrap gap-1.5">
              <Badge variant="secondary" className="text-xs">{selectedData.co.stage}</Badge>
              <Badge variant="outline" className="text-xs">{selectedData.co.sector}</Badge>
            </div>

            {selectedData.co.summary && (
              <p className="text-xs text-slate-400 leading-relaxed">{selectedData.co.summary}</p>
            )}

            {/* Signal count bar */}
            {selectedData.filteredSignals.length > 0 && (
              <div className="rounded-lg border border-slate-700/60 bg-slate-900/60 p-3">
                <p className="text-xs font-semibold text-slate-400 mb-2 uppercase tracking-wide">
                  {signalFilter === 'All' ? 'All' : signalFilter} Signals ({selectedData.filteredSignals.length})
                </p>
                <div className="space-y-2">
                  {selectedData.filteredSignals.slice(0, 4).map((sig) => {
                    const color = SIGNAL_TYPE_COLORS[sig.signalType] || '#6366f1'
                    return (
                      <div key={sig.id} className="rounded-lg border border-slate-800 bg-slate-950/50 p-2.5">
                        <div className="flex items-center gap-1.5 mb-1">
                          <span className="text-xs px-1.5 py-0.5 rounded-full border font-medium capitalize"
                            style={{ background: `${color}20`, color, borderColor: `${color}40` }}>
                            {sig.signalType}
                          </span>
                        </div>
                        <p className="text-xs text-white font-medium line-clamp-2">{sig.title}</p>
                        {sig.summary && (
                          <p className="text-xs text-slate-500 mt-1 line-clamp-2">{sig.summary}</p>
                        )}
                      </div>
                    )
                  })}
                </div>
              </div>
            )}

            {selectedData.filteredSignals.length === 0 && (
              <div className="rounded-lg border border-slate-700/60 bg-slate-900/60 p-3 text-center">
                <p className="text-xs text-slate-500">No {signalFilter} signals for this company in the selected time window.</p>
              </div>
            )}

            <Link href={`/companies/${selectedData.co.id}`} onClick={onClose}>
              <Button size="sm" className="w-full gap-2 text-xs">
                <Building2 className="h-3.5 w-3.5" />
                View Company Profile
              </Button>
            </Link>
          </div>
        ) : (
          /* Regional summary view */
          <div className="p-5 space-y-5 flex-1">
            <div>
              <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-3">Regional Intelligence</p>
              <div className="grid grid-cols-2 gap-2">
                <div className="rounded-lg bg-slate-900/60 border border-slate-700/60 p-3 text-center">
                  <p className="text-2xl font-bold text-white">{totalSignals}</p>
                  <p className="text-xs text-slate-500 mt-0.5">Total Signals</p>
                </div>
                <div className="rounded-lg bg-slate-900/60 border border-slate-700/60 p-3 text-center">
                  <p className="text-2xl font-bold text-indigo-400">{activeCount}</p>
                  <p className="text-xs text-slate-500 mt-0.5">Active Cos</p>
                </div>
              </div>
            </div>

            {/* Signal breakdown */}
            {signalBreakdown.length > 0 && (
              <div>
                <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-2">Signal Breakdown</p>
                <div className="space-y-2">
                  {signalBreakdown.map(({ type, color, count }) => (
                    <div key={type} className="flex items-center gap-2">
                      <div className="h-2 w-2 rounded-full shrink-0" style={{ background: color }} />
                      <span className="text-xs text-slate-300 capitalize flex-1">{type}</span>
                      <div className="flex items-center gap-1.5">
                        <div className="h-1 rounded-full" style={{
                          width: `${Math.max(8, (count / Math.max(...signalBreakdown.map(s => s.count))) * 64)}px`,
                          background: color, opacity: 0.6,
                        }} />
                        <span className="text-xs font-semibold" style={{ color }}>{count}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Most active companies */}
            {topActive.length > 0 && (
              <div>
                <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-2">Most Active Companies</p>
                <div className="space-y-1.5">
                  {topActive.map((d, i) => (
                    <button
                      key={d.co.id}
                      onClick={() => onSelectCompany(d.co.id)}
                      className="w-full flex items-center gap-2.5 rounded-lg border border-slate-700/60 bg-slate-900/50 px-3 py-2 text-left hover:border-indigo-500/40 hover:bg-indigo-900/10 transition-all"
                    >
                      <span className="text-xs font-bold text-slate-600 w-3.5">{i + 1}</span>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-medium text-white truncate">{d.co.name}</p>
                        <p className="text-xs text-slate-500 truncate">{d.co.geography}</p>
                      </div>
                      <div className="flex items-center gap-1 shrink-0">
                        <div className="h-1.5 w-1.5 rounded-full" style={{ background: d.color }} />
                        <span className="text-xs font-semibold" style={{ color: d.color }}>{d.filteredSignals.length}</span>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Market observations */}
            <div>
              <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-2">Key Observations</p>
              <div className="space-y-2">
                {[
                  'Funding activity concentrated in Boston and Bay Area corridors',
                  'Leadership change signals up 23% vs prior 90-day window',
                  'Series A/B companies showing highest hiring signal density',
                ].map((obs, i) => (
                  <div key={i} className="flex items-start gap-2">
                    <div className="h-1.5 w-1.5 rounded-full bg-indigo-400 mt-1.5 shrink-0" />
                    <p className="text-xs text-slate-400 leading-relaxed">{obs}</p>
                  </div>
                ))}
              </div>
            </div>

            <div className="pt-2">
              <Link href="/radar">
                <Button variant="outline" size="sm" className="w-full text-xs gap-2" onClick={onClose}>
                  Browse All Signals <ChevronRight className="h-3 w-3" />
                </Button>
              </Link>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
