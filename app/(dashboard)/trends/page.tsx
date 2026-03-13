'use client'

import { useState, useCallback } from 'react'
import dynamic from 'next/dynamic'
import Link from 'next/link'
import {
  TrendingUp, MapPin, DollarSign, Users, BarChart3, ArrowUp,
  Building2, X, ChevronRight, Globe, Filter, Search, Clock, Zap,
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { mockCompanies, mockSignals } from '@/lib/mock-data'
import { cn } from '@/lib/utils'
import { useSettings } from '@/lib/settings-context'

const GlobalActivityMap = dynamic(() => import('@/components/market/GlobalActivityMap'), {
  ssr: false,
  loading: () => (
    <div className="flex-1 flex items-center justify-center" style={{ minHeight: '480px' }}>
      <div className="text-center">
        <Globe className="h-10 w-10 text-slate-700 mx-auto mb-3 animate-pulse" />
        <p className="text-sm text-slate-500">Loading map…</p>
      </div>
    </div>
  ),
})

const growingSubsectors = [
  { name: 'Radiopharmaceuticals', growth: 'Very High', color: 'text-emerald-400', bg: 'bg-emerald-400/10' },
  { name: 'AI Drug Discovery', growth: 'Very High', color: 'text-emerald-400', bg: 'bg-emerald-400/10' },
  { name: 'RNA Editing', growth: 'High', color: 'text-amber-400', bg: 'bg-amber-400/10' },
  { name: 'Antibody-Drug Conjugates', growth: 'High', color: 'text-amber-400', bg: 'bg-amber-400/10' },
  { name: 'Cell Therapy (Next Gen)', growth: 'Growing', color: 'text-indigo-400', bg: 'bg-indigo-400/10' },
  { name: 'Digital Therapeutics', growth: 'Growing', color: 'text-indigo-400', bg: 'bg-indigo-400/10' },
]

const capitalFlows = [
  { area: 'Oncology – Targeted Therapies', amount: '$4.2B', change: '+18% QoQ' },
  { area: 'Gene & Cell Therapy', amount: '$2.8B', change: '+12% QoQ' },
  { area: 'AI-Enabled Drug Discovery', amount: '$1.9B', change: '+34% QoQ' },
  { area: 'Rare Disease', amount: '$1.4B', change: '+9% QoQ' },
  { area: 'Diagnostics – Liquid Biopsy', amount: '$890M', change: '+22% QoQ' },
]

const geographicHotspots = [
  { city: 'Boston, MA', activity: 'Very High', companies: 48, signals: 23, lat: 42.36, lon: -71.06 },
  { city: 'San Francisco Bay Area', activity: 'High', companies: 41, signals: 19, lat: 37.77, lon: -122.42 },
  { city: 'San Diego, CA', activity: 'High', companies: 35, signals: 16, lat: 32.72, lon: -117.16 },
  { city: 'New York Metro', activity: 'Growing', companies: 28, signals: 12, lat: 40.71, lon: -74.01 },
  { city: 'Cambridge, UK', activity: 'Growing', companies: 19, signals: 8, lat: 52.20, lon: 0.12 },
]

const stageActivity = [
  { stage: 'Series A', signals: 18, pct: 35 },
  { stage: 'Series B', signals: 14, pct: 27 },
  { stage: 'Seed', signals: 10, pct: 19 },
  { stage: 'Series C', signals: 7, pct: 13 },
  { stage: 'Growth / Pre-IPO', signals: 3, pct: 6 },
]

const upcomingHires = [
  {
    role: 'Chief Scientific Officer', likelihood: 'Very High', signals: 12,
    reasoning: 'Post-Series B oncology companies building R&D leadership following Phase 2 data readouts',
    supportingSignals: ['3 oncology Series B rounds closed in Q4', 'Phase 2 completions driving Phase 3 planning', 'Board mandates for R&D oversight'],
    comparableCompanies: ['BioNova Therapeutics', 'ArvoGene Bio', 'NexGen Oncology'],
  },
  {
    role: 'VP Translational Biology', likelihood: 'High', signals: 9,
    reasoning: 'Clinical-stage companies advancing programs from discovery to clinic',
    supportingSignals: ['5 IND filings across portfolio', 'Preclinical data packages nearing completion', 'Partnership deals triggering R&D builds'],
    comparableCompanies: ['GenVec Bio', 'RxBridge Therapeutics', 'PrecisionBio Labs'],
  },
  {
    role: 'Head of Clinical Strategy', likelihood: 'High', signals: 8,
    reasoning: 'Phase 2 completions driving Phase 3 planning hires across multiple programs',
    supportingSignals: ['Phase 2 data readouts scheduled Q1–Q2', 'FDA end-of-Phase 2 meetings booked', 'Investor pressure to accelerate timelines'],
    comparableCompanies: ['ClinPath Solutions', 'BioNova Therapeutics', 'TargetVax Inc'],
  },
  {
    role: 'VP Regulatory Affairs', likelihood: 'High', signals: 7,
    reasoning: 'FDA submissions and Breakthrough Designations driving demand for regulatory expertise',
    supportingSignals: ['2 BLA submissions in preparation', 'Breakthrough Device Designations received', 'EU regulatory filing planned'],
    comparableCompanies: ['DiagnostiX Labs', 'NovaCyte Medical', 'OmniPath Bio'],
  },
  {
    role: 'Chief Medical Officer', likelihood: 'Growing', signals: 5,
    reasoning: 'Series C+ companies adding medical oversight as clinical programs expand into Phase 3',
    supportingSignals: ['Series C rounds averaging $150M+', 'Multiple assets entering late-stage trials', 'KOL advisory board expansions'],
    comparableCompanies: ['BioNova Therapeutics', 'GenVec Bio', 'DiagnostiX Labs'],
  },
]

const cityCoords: Record<string, { lat: number; lon: number }> = {
  'boston':            { lat: 42.36, lon: -71.06 },
  'cambridge, ma':     { lat: 42.37, lon: -71.11 },
  'san francisco':     { lat: 37.77, lon: -122.42 },
  'san diego':         { lat: 32.72, lon: -117.16 },
  'new york':          { lat: 40.71, lon: -74.01 },
  'london':            { lat: 51.51, lon: -0.13 },
  'cambridge, uk':     { lat: 52.20, lon: 0.12 },
  'seattle':           { lat: 47.61, lon: -122.33 },
}

export const SIGNAL_TYPE_COLORS: Record<string, string> = {
  funding:     '#10b981',
  hiring:      '#6366f1',
  leadership:  '#a855f7',
  partnership: '#f59e0b',
  expansion:   '#3b82f6',
  clinical:    '#ec4899',
  regulatory:  '#ef4444',
}

export const ALL_SIGNAL_TYPES = ['All', 'funding', 'hiring', 'leadership', 'partnership', 'expansion', 'clinical', 'regulatory']
const TIME_RANGES = [{ label: '7d', days: 7 }, { label: '30d', days: 30 }, { label: '90d', days: 90 }]
const GEO_QUICK = ['Global', 'North America', 'Europe', 'Asia']

function getMapPos(lat: number, lon: number) {
  return { x: ((lon + 180) / 360) * 100, y: ((90 - lat) / 180) * 100 }
}

function getCompaniesForCity(cityName: string) {
  const key = cityName.split(',')[0].toLowerCase()
  return mockCompanies.filter((c) => {
    const geo = (c.geography || '').toLowerCase()
    return geo.includes(key) ||
      (key === 'boston' && geo.includes('ma')) ||
      (key === 'san francisco bay area' && geo.includes('san francisco')) ||
      (key === 'new york metro' && geo.includes('new york')) ||
      (key === 'cambridge' && geo.includes('uk'))
  })
}

export default function TrendsPage() {
  const { settings } = useSettings()
  const [mapOpen, setMapOpen] = useState(false)
  const [globalMapOpen, setGlobalMapOpen] = useState(false)
  const [selectedHotspot, setSelectedHotspot] = useState<typeof geographicHotspots[0] | null>(null)
  const [expandedHire, setExpandedHire] = useState<string | null>(null)

  // Global map filters
  const [signalFilter, setSignalFilter] = useState('All')
  const [timeRange, setTimeRange] = useState(90)
  const [geoFilter, setGeoFilter] = useState('Global')
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedMapCompanyId, setSelectedMapCompanyId] = useState<string | null>(null)

  const mapCompanies = selectedHotspot ? getCompaniesForCity(selectedHotspot.city) : []

  const openGlobalMap = useCallback(() => {
    setGlobalMapOpen(true)
    setSelectedMapCompanyId(null)
    // Default to user's primary region
    if (settings.regions.includes('Europe')) setGeoFilter('Europe')
    else if (settings.regions.includes('APAC')) setGeoFilter('Asia')
    else setGeoFilter('North America')
  }, [settings.regions])

  const activeCompanyCount = mockCompanies.filter((c) => {
    const sigs = mockSignals.filter((s) => s.companyId === c.id && (signalFilter === 'All' || s.signalType === signalFilter))
    return sigs.length > 0
  }).length

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white">Market Intelligence</h1>
        <p className="text-sm text-slate-400 mt-1">Predictive insights, capital flows, and upcoming hiring signals</p>
      </div>

      {/* Growing Subsectors + Capital Flow */}
      <div className="grid grid-cols-2 gap-6">
        <Card className="card-hover">
          <CardHeader className="pb-3">
            <div className="flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-emerald-400" />
              <CardTitle className="text-base">Fastest Growing Areas</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {growingSubsectors.map((item) => (
                <Link key={item.name} href="/radar">
                  <div className="flex items-center justify-between rounded-lg border border-slate-800 px-3 py-2.5 hover:border-slate-700 hover:bg-slate-900/50 transition-colors cursor-pointer">
                    <span className="text-sm text-white">{item.name}</span>
                    <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${item.bg} ${item.color}`}>{item.growth}</span>
                  </div>
                </Link>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card className="card-hover">
          <CardHeader className="pb-3">
            <div className="flex items-center gap-2">
              <DollarSign className="h-4 w-4 text-amber-400" />
              <CardTitle className="text-base">Capital Flow Patterns</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {capitalFlows.map((item) => (
                <Link key={item.area} href="/radar">
                  <div className="flex items-center justify-between rounded-lg border border-slate-800 px-3 py-2.5 hover:border-slate-700 hover:bg-slate-900/50 transition-colors cursor-pointer">
                    <div>
                      <p className="text-sm text-white">{item.area}</p>
                      <p className="text-xs text-emerald-400 font-medium mt-0.5">{item.change}</p>
                    </div>
                    <div className="flex items-center gap-1">
                      <p className="text-sm font-bold text-white">{item.amount}</p>
                      <ArrowUp className="h-3 w-3 text-emerald-400" />
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Geographic Hotspots + Stage Activity */}
      <div className="grid grid-cols-2 gap-6">
        <Card className="card-hover">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <MapPin className="h-4 w-4 text-indigo-400" />
                <CardTitle className="text-base">Geographic Growth Hotspots</CardTitle>
              </div>
              <Button size="sm" className="gap-2 text-xs" onClick={openGlobalMap}>
                <Globe className="h-3.5 w-3.5" />
                Global Activity Map
              </Button>
            </div>
            <p className="text-xs text-slate-500 mt-1">Click for city view · Global Map for full intelligence</p>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {geographicHotspots.map((item, idx) => (
                <button
                  key={item.city}
                  onClick={() => { setSelectedHotspot(item); setMapOpen(true) }}
                  className="w-full flex items-center gap-3 rounded-lg border border-slate-800 px-3 py-2.5 hover:border-indigo-500/40 hover:bg-indigo-900/10 transition-colors text-left"
                >
                  <span className="text-xs font-bold text-slate-500 w-4">{idx + 1}</span>
                  <div className="flex-1">
                    <p className="text-sm text-white">{item.city}</p>
                    <p className="text-xs text-slate-500">{item.companies} companies · {item.signals} signals</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant={item.activity === 'Very High' ? 'default' : 'secondary'} className="text-xs">{item.activity}</Badge>
                    <ChevronRight className="h-3.5 w-3.5 text-slate-600" />
                  </div>
                </button>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card className="card-hover">
          <CardHeader className="pb-3">
            <div className="flex items-center gap-2">
              <BarChart3 className="h-4 w-4 text-purple-400" />
              <CardTitle className="text-base">Company Stage Activity</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {stageActivity.map((item) => (
                <div key={item.stage} className="space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-white">{item.stage}</span>
                    <span className="text-xs text-slate-400">{item.signals} signals ({item.pct}%)</span>
                  </div>
                  <div className="h-2 bg-slate-800 rounded-full">
                    <div className="h-2 rounded-full bg-gradient-to-r from-purple-600 to-indigo-500" style={{ width: `${item.pct}%` }} />
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Upcoming Leadership Hires */}
      <Card className="card-hover">
        <CardHeader className="pb-3">
          <div className="flex items-center gap-2">
            <Users className="h-4 w-4 text-indigo-400" />
            <CardTitle className="text-base">Likely Upcoming Leadership Hires</CardTitle>
          </div>
          <p className="text-xs text-slate-500 mt-1">Predicted hiring patterns based on current market signals · click to expand</p>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {upcomingHires.map((item) => (
              <div key={item.role} className="rounded-lg border border-slate-800 bg-slate-900/50 overflow-hidden">
                <button
                  onClick={() => setExpandedHire(expandedHire === item.role ? null : item.role)}
                  className="w-full px-4 py-3 text-left"
                >
                  <div className="flex items-center justify-between mb-1">
                    <p className="text-sm font-semibold text-white">{item.role}</p>
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-indigo-400">{item.signals} signals</span>
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                        item.likelihood === 'Very High' ? 'bg-emerald-400/10 text-emerald-400'
                        : item.likelihood === 'High' ? 'bg-amber-400/10 text-amber-400'
                        : 'bg-indigo-400/10 text-indigo-400'
                      }`}>{item.likelihood}</span>
                    </div>
                  </div>
                  <p className="text-xs text-slate-500">{item.reasoning}</p>
                </button>
                {expandedHire === item.role && (
                  <div className="px-4 pb-4 border-t border-slate-800 pt-3 space-y-3">
                    <div>
                      <p className="text-xs font-semibold text-slate-400 mb-1.5">Supporting signals</p>
                      <div className="space-y-1">
                        {item.supportingSignals.map((sig, i) => (
                          <div key={i} className="flex items-center gap-2">
                            <div className="h-1.5 w-1.5 rounded-full bg-indigo-400 flex-shrink-0" />
                            <span className="text-xs text-slate-400">{sig}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                    <div>
                      <p className="text-xs font-semibold text-slate-400 mb-1.5">Comparable companies</p>
                      <div className="flex flex-wrap gap-1.5">
                        {item.comparableCompanies.map((co, i) => {
                          const match = mockCompanies.find((c) => c.name === co)
                          return match ? (
                            <Link key={i} href={`/companies/${match.id}`}>
                              <span className="text-xs px-2.5 py-1 rounded-full bg-slate-800 text-indigo-300 border border-slate-700 hover:border-indigo-500/40 transition-colors cursor-pointer">{co}</span>
                            </Link>
                          ) : (
                            <span key={i} className="text-xs px-2.5 py-1 rounded-full bg-slate-800 text-slate-400 border border-slate-700">{co}</span>
                          )
                        })}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* ── City Map Modal ── */}
      {mapOpen && selectedHotspot && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black/70" onClick={() => setMapOpen(false)} />
          <div className="relative z-10 w-full max-w-4xl mx-4 rounded-2xl overflow-hidden border border-slate-700/60 shadow-2xl" style={{ maxHeight: '90vh' }}>
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-700/60" style={{ background: '#0a1628' }}>
              <div className="flex items-center gap-2">
                <MapPin className="h-4 w-4 text-indigo-400" />
                <h2 className="text-lg font-bold text-white">{selectedHotspot.city}</h2>
                <Badge variant={selectedHotspot.activity === 'Very High' ? 'default' : 'secondary'} className="text-xs">{selectedHotspot.activity}</Badge>
              </div>
              <button onClick={() => setMapOpen(false)} className="text-slate-400 hover:text-white transition-colors"><X className="h-5 w-5" /></button>
            </div>
            <div className="grid grid-cols-2" style={{ background: '#0d1b2e', maxHeight: 'calc(90vh - 73px)' }}>
              <div className="relative overflow-hidden border-r border-slate-700/60" style={{ height: '420px' }}>
                <div className="absolute inset-0" style={{ background: 'linear-gradient(135deg, #050e1a 0%, #0a1628 100%)' }}>
                  {[20, 40, 60, 80].map((p) => (
                    <div key={p} className="absolute w-full" style={{ top: `${p}%`, height: '1px', background: 'rgba(99,102,241,0.06)' }} />
                  ))}
                  {geographicHotspots.map((hotspot) => {
                    const pos = getMapPos(hotspot.lat, hotspot.lon)
                    const isSelected = hotspot.city === selectedHotspot.city
                    const color = hotspot.activity === 'Very High' ? '#10b981' : hotspot.activity === 'High' ? '#6366f1' : '#f59e0b'
                    return (
                      <button key={hotspot.city} onClick={() => setSelectedHotspot(hotspot)}
                        className="absolute transform -translate-x-1/2 -translate-y-1/2 group"
                        style={{ left: `${pos.x}%`, top: `${pos.y}%` }}
                      >
                        {isSelected && <div className="absolute -inset-3 rounded-full animate-ping opacity-30" style={{ background: color }} />}
                        <div className="rounded-full border-2 border-white/20 transition-transform group-hover:scale-125"
                          style={{ width: isSelected ? '14px' : '10px', height: isSelected ? '14px' : '10px', background: color, boxShadow: `0 0 ${isSelected ? '12px' : '6px'} ${color}` }}
                        />
                      </button>
                    )
                  })}
                </div>
              </div>
              <div className="overflow-y-auto p-4 space-y-3" style={{ height: '420px' }}>
                <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide">Companies in {selectedHotspot.city.split(',')[0]}</p>
                {mapCompanies.length > 0 ? mapCompanies.map((co) => {
                  const coSignals = mockSignals.filter((s) => s.companyId === co.id)
                  return (
                    <Link key={co.id} href={`/companies/${co.id}`}>
                      <div className="rounded-xl border border-slate-700/60 bg-slate-900/60 p-3.5 hover:border-indigo-500/40 hover:bg-indigo-900/10 transition-all cursor-pointer group mb-2">
                        <div className="flex items-center gap-3 mb-2">
                          <div className="h-8 w-8 rounded-lg bg-slate-800 flex items-center justify-center flex-shrink-0">
                            <Building2 className="h-4 w-4 text-slate-400" />
                          </div>
                          <div className="min-w-0">
                            <p className="text-sm font-semibold text-white group-hover:text-indigo-300 transition-colors">{co.name}</p>
                            <p className="text-xs text-slate-500">{co.geography}</p>
                          </div>
                        </div>
                        <div className="flex gap-1.5">
                          <Badge variant="secondary" className="text-xs">{co.stage}</Badge>
                          <Badge variant="outline" className="text-xs">{co.sector}</Badge>
                        </div>
                        {coSignals.length > 0 && (
                          <div className="flex items-center gap-1 mt-2">
                            <div className="h-1.5 w-1.5 rounded-full bg-teal-400" />
                            <span className="text-xs text-teal-400">{coSignals.length} active signal{coSignals.length > 1 ? 's' : ''}</span>
                          </div>
                        )}
                      </div>
                    </Link>
                  )
                }) : (
                  <div className="rounded-xl border border-slate-700/60 bg-slate-900/60 p-3.5">
                    <p className="text-sm font-medium text-white mb-1">{selectedHotspot.signals} Active Signals</p>
                    <p className="text-xs text-slate-500">{selectedHotspot.companies} companies tracked in this region.</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── Global Activity Map Modal ── */}
      {globalMapOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black/85" onClick={() => setGlobalMapOpen(false)} />
          <div
            className="relative z-10 w-full mx-4 rounded-2xl overflow-hidden border border-slate-700/50 shadow-2xl flex flex-col"
            style={{ maxWidth: '1200px', maxHeight: '94vh', background: '#05090f' }}
          >
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800/60 shrink-0">
              <div className="flex items-center gap-3">
                <div className="h-8 w-8 rounded-lg bg-indigo-600/20 flex items-center justify-center">
                  <Globe className="h-4 w-4 text-indigo-400" />
                </div>
                <div>
                  <h2 className="text-base font-bold text-white">Global Market Activity Map</h2>
                  <p className="text-xs text-slate-400">
                    {settings.sector || 'All markets'} · {settings.regions.length ? settings.regions.join(', ') : 'Global'} · personalised to your market settings
                  </p>
                </div>
              </div>
              <button onClick={() => setGlobalMapOpen(false)} className="text-slate-400 hover:text-white transition-colors">
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Filter Toolbar */}
            <div className="flex items-center gap-3 px-5 py-2.5 border-b border-slate-800/60 shrink-0 flex-wrap" style={{ background: '#070d1a' }}>
              <div className="flex items-center gap-1.5">
                <Filter className="h-3.5 w-3.5 text-slate-500" />
                <select
                  value={signalFilter}
                  onChange={(e) => setSignalFilter(e.target.value)}
                  className="px-2.5 py-1.5 text-xs bg-slate-900 border border-slate-700/60 rounded-lg text-slate-300 focus:outline-none focus:border-indigo-500 cursor-pointer"
                >
                  {ALL_SIGNAL_TYPES.map((t) => (
                    <option key={t} value={t}>{t === 'All' ? 'All Signals' : t.charAt(0).toUpperCase() + t.slice(1)}</option>
                  ))}
                </select>
              </div>

              <div className="flex items-center gap-1.5">
                <Clock className="h-3.5 w-3.5 text-slate-500" />
                <div className="flex rounded-lg overflow-hidden border border-slate-700/60">
                  {TIME_RANGES.map((t) => (
                    <button
                      key={t.days}
                      onClick={() => setTimeRange(t.days)}
                      className={cn(
                        'px-3 py-1.5 text-xs font-medium transition-colors',
                        timeRange === t.days ? 'bg-indigo-600 text-white' : 'bg-slate-900 text-slate-400 hover:bg-slate-800'
                      )}
                    >
                      {t.label}
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex items-center gap-1.5">
                <Globe className="h-3.5 w-3.5 text-slate-500" />
                <div className="flex rounded-lg overflow-hidden border border-slate-700/60">
                  {GEO_QUICK.map((g) => (
                    <button
                      key={g}
                      onClick={() => setGeoFilter(g)}
                      className={cn(
                        'px-3 py-1.5 text-xs font-medium transition-colors',
                        geoFilter === g ? 'bg-indigo-600 text-white' : 'bg-slate-900 text-slate-400 hover:bg-slate-800'
                      )}
                    >
                      {g}
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex items-center gap-1.5 ml-auto">
                <Search className="h-3.5 w-3.5 text-slate-500" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search company, city…"
                  className="w-44 px-2.5 py-1.5 text-xs bg-slate-900 border border-slate-700/60 rounded-lg text-slate-300 placeholder-slate-600 focus:outline-none focus:border-indigo-500"
                />
              </div>

              <span className="text-xs text-slate-500 shrink-0">{activeCompanyCount} active companies</span>
            </div>

            {/* Map + Panel */}
            <div className="flex flex-1 min-h-0">
              <GlobalActivityMap
                signalFilter={signalFilter}
                timeRange={timeRange}
                geoFilter={geoFilter}
                searchQuery={searchQuery}
                selectedCompanyId={selectedMapCompanyId}
                onSelectCompany={setSelectedMapCompanyId}
                onClose={() => setGlobalMapOpen(false)}
                userSettings={settings}
              />
            </div>

            {/* Legend */}
            <div className="flex items-center gap-4 px-5 py-2.5 border-t border-slate-800/60 shrink-0 flex-wrap" style={{ background: '#070d1a' }}>
              {Object.entries(SIGNAL_TYPE_COLORS).map(([type, color]) => (
                <div key={type} className="flex items-center gap-1.5">
                  <div className="h-2 w-2 rounded-full" style={{ background: color, boxShadow: `0 0 4px ${color}` }} />
                  <span className="text-xs text-slate-400 capitalize">{type}</span>
                </div>
              ))}
              <div className="flex items-center gap-1.5 ml-auto">
                <Zap className="h-3 w-3 text-indigo-400" />
                <span className="text-xs text-slate-500">Pulsing = active within {timeRange} days</span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
