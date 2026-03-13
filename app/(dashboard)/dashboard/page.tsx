'use client'

import { useState, useEffect, useCallback } from 'react'
import Link from 'next/link'
import {
  Target, TrendingUp, DollarSign,
  ArrowRight, MapPin, Radio, Newspaper,
  X, Plus, Settings2, RotateCcw, LayoutGrid,
  Eye,
} from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { mockSignals, mockInvestors } from '@/lib/mock-data'
import { formatTimeAgo } from '@/lib/utils'
import { useSettings } from '@/lib/settings-context'
import { useWatchlist } from '@/lib/watchlist-context'
import { useMarketConfig } from '@/lib/market-config'
import { useCompanies, useSignals, useOpportunities, useInvestors } from '@/lib/hooks/use-data'

import { MODULE_CATALOGUE, LayoutEntry, getDefaultLayout } from './module-catalogue'
import { loadLayout, saveLayout } from './layout-storage'
import { ModuleWrapper } from './ModuleWrapper'
import { TopHiringSignals } from './modules/TopHiringSignals'
import { FundingSignals } from './modules/FundingSignals'
import { RoleDemand } from './modules/RoleDemand'
import { HiringMomentum } from './modules/HiringMomentum'
import { QuickActions } from './modules/QuickActions'
import { WatchlistUpdates } from './modules/WatchlistUpdates'
import { EmergingCompanies } from './modules/EmergingCompanies'
import { InvestorActivity } from './modules/InvestorActivity'
import { MarketRadarPreview } from './modules/MarketRadarPreview'

// ── Static data ───────────────────────────────────────────────────────────────

const roleDemand = [
  { role: 'Chief Scientific Officer', signals: 12 },
  { role: 'VP Clinical Development', signals: 9 },
  { role: 'Head of CMC', signals: 7 },
  { role: 'VP Regulatory Affairs', signals: 5 },
  { role: 'Chief Medical Officer', signals: 4 },
]

const emergingCompanies = [
  { id: 'comp_4', name: 'GenVec Bio', stage: 'Series A', sector: 'Gene Therapy', hires: ['Head of Manufacturing', 'QA Director', 'Analytical Dev Director'] },
  { id: 'comp_2', name: 'DiagnostiX Labs', stage: 'Series B', sector: 'Diagnostics', hires: ['Chief Commercial Officer', 'VP Sales', 'Dir Market Access'] },
]

const bdActionsMap: Record<string, string[]> = {
  opp_1: ['Contact CEO regarding Phase 3 leadership expansion', 'Engage board members or venture investors on C-suite search'],
  opp_2: ['Reach out to CEO regarding CCO placement', 'Propose full commercial team build mandate'],
  opp_3: ['Contact new CEO Dr. Chen directly within 30 days', 'Engage investors about C-suite rebuild mandate'],
  opp_4: ['Contact COO regarding European leadership expansion', 'Propose EMEA VP and Country GM mandate'],
  opp_5: ['Contact CEO regarding CMC and manufacturing leadership', 'Engage HealthVentures for portfolio referral'],
}

// ── Skeleton loader ───────────────────────────────────────────────────────────

function DashboardSkeleton() {
  return (
    <div className="grid grid-cols-2 gap-6 animate-pulse">
      {[...Array(6)].map((_, i) => (
        <div
          key={i}
          className={`rounded-xl bg-slate-800/50 ${i % 3 === 0 ? 'col-span-2 h-48' : 'col-span-1 h-40'}`}
        />
      ))}
    </div>
  )
}

// ── Main page ─────────────────────────────────────────────────────────────────

export default function DashboardPage() {
  const { settings, activeProfile } = useSettings()
  const { watchedCompanies, watchedVCs } = useWatchlist()
  const marketConfig = useMarketConfig()

  const industry = activeProfile?.industry || settings.sector || 'Life Sciences'

  // ── Data via hooks ───────────────────────────────────────────────────────────
  const { data: companies } = useCompanies(settings)
  const { data: signals } = useSignals(settings)
  const { data: opportunities } = useOpportunities(settings)
  const { data: investors } = useInvestors()

  // ── Layout state ────────────────────────────────────────────────────────────
  const [isEditMode, setIsEditMode] = useState(false)
  const [showDrawer, setShowDrawer] = useState(false)
  const [activeEntries, setActiveEntries] = useState<LayoutEntry[]>([])
  const [hiddenIds, setHiddenIds] = useState<string[]>([])
  const [dragIdx, setDragIdx] = useState<number | null>(null)
  const [dragOverIdx, setDragOverIdx] = useState<number | null>(null)
  const [layoutLoaded, setLayoutLoaded] = useState(false)

  // Load layout from localStorage on mount / industry change
  useEffect(() => {
    const { entries, hidden } = loadLayout(industry)
    setActiveEntries(entries)
    setHiddenIds(hidden)
    setLayoutLoaded(true)
  }, [industry])

  // Persist whenever layout changes
  useEffect(() => {
    if (!layoutLoaded) return
    saveLayout(industry, activeEntries, hiddenIds)
  }, [activeEntries, hiddenIds, industry, layoutLoaded])

  // ── Drag handlers ────────────────────────────────────────────────────────────
  const handleDragStart = useCallback((idx: number) => setDragIdx(idx), [])
  const handleDragOver = useCallback((e: React.DragEvent, idx: number) => {
    e.preventDefault()
    setDragOverIdx(idx)
  }, [])
  const handleDrop = useCallback((targetIdx: number) => {
    if (dragIdx === null || dragIdx === targetIdx) return
    setActiveEntries((prev) => {
      const next = [...prev]
      const [item] = next.splice(dragIdx, 1)
      next.splice(targetIdx, 0, item)
      return next
    })
    setDragIdx(null)
    setDragOverIdx(null)
  }, [dragIdx])
  const handleDragEnd = useCallback(() => {
    setDragIdx(null)
    setDragOverIdx(null)
  }, [])

  // ── Module actions ───────────────────────────────────────────────────────────
  const hideModule = (id: string) => {
    setActiveEntries((prev) => prev.filter((e) => e.id !== id))
    setHiddenIds((prev) => [...prev, id])
  }

  const addModule = (id: string) => {
    const def = MODULE_CATALOGUE.find((m) => m.id === id)
    if (!def) return
    setHiddenIds((prev) => prev.filter((h) => h !== id))
    setActiveEntries((prev) => [...prev, { id, size: def.defaultSize }])
    setShowDrawer(false)
  }

  const toggleSize = (id: string) => {
    setActiveEntries((prev) =>
      prev.map((e) => e.id === id ? { ...e, size: e.size === 'full' ? 'half' : 'full' } : e)
    )
  }

  const resetLayout = () => {
    const defaults = getDefaultLayout(industry)
    setActiveEntries(defaults)
    setHiddenIds([])
    setIsEditMode(false)
  }

  // ── Market scope ─────────────────────────────────────────────────────────────
  const marketScope = {
    sector: settings.sector || 'Biotech',
    subsector: settings.subsector || '',
    geography: [...settings.regions, ...(settings.subGeos.length ? settings.subGeos : [])].filter(Boolean).join(' · ') || 'USA',
    companyStage: settings.stages.length ? `${settings.stages[0]} – ${settings.stages[settings.stages.length - 1]}` : 'All stages',
    functionFocus: settings.functions.slice(0, 2).join(' / ') || 'All functions',
  }

  const stats = [
    { label: 'Active Hiring Signals', value: opportunities.length, icon: Radio, color: 'text-indigo-400', bg: 'bg-indigo-400/10', change: '+3 this week', href: '/opportunities' },
    { label: 'High Probability Searches', value: opportunities.filter((o) => o.opportunityScore >= 85).length, icon: Target, color: 'text-emerald-400', bg: 'bg-emerald-400/10', change: 'Signal Strength 85+', href: '/opportunities' },
    { label: marketConfig.fundingCardLabel, value: signals.filter((s) => s.signalType === 'funding').length, icon: DollarSign, color: 'text-amber-400', bg: 'bg-amber-400/10', change: 'Last 30 days', href: '/radar' },
    { label: 'Market Momentum', value: opportunities.filter((o) => o.momentumScore > 80).length, icon: TrendingUp, color: 'text-purple-400', bg: 'bg-purple-400/10', change: 'High momentum companies', href: '/opportunities' },
  ]

  // ── Module renderer ──────────────────────────────────────────────────────────

  const renderModule = (id: string) => {
    switch (id) {
      case 'top-hiring-signals':
        return <TopHiringSignals opportunities={opportunities} companies={companies} bdActionsMap={bdActionsMap} />
      case 'funding-signals':
        return <FundingSignals signals={signals} companies={companies} opportunities={opportunities} fundingCardLabel={marketConfig.fundingCardLabel} />
      case 'role-demand':
        return <RoleDemand roleDemand={roleDemand} />
      case 'hiring-momentum':
        return <HiringMomentum opportunities={opportunities} companies={companies} />
      case 'quick-actions':
        return <QuickActions />
      case 'watchlist-updates':
        return (
          <WatchlistUpdates
            watchedCompanies={watchedCompanies}
            watchedVCs={watchedVCs}
            allSignals={mockSignals}
            allCompanies={companies}
            allInvestors={mockInvestors}
          />
        )
      case 'emerging-companies':
        return <EmergingCompanies emergingCompanies={emergingCompanies} companies={companies} />
      case 'investor-activity':
        return <InvestorActivity investors={investors} signals={signals} capitalTabLabel={marketConfig.capitalTabLabel} />
      case 'market-radar-preview':
        return <MarketRadarPreview signals={signals} companies={companies} />
      default:
        return null
    }
  }

  // Modules available to add (hidden ones)
  const availableModules = MODULE_CATALOGUE.filter((m) => hiddenIds.includes(m.id) || !activeEntries.some((e) => e.id === m.id))
  const moduleCategories = Array.from(new Set(availableModules.map((m) => m.category)))

  return (
    <div className="space-y-6">
      {/* ── Fixed top layer (non-editable) ────────────────────────────────── */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">BD Command Centre</h1>
          <p className="text-sm text-slate-400 mt-1">
            Market Intelligence &amp; Hiring Signal Engine · Updated {formatTimeAgo(new Date())}
          </p>
        </div>
        {/* Edit mode controls */}
        <div className="flex items-center gap-2">
          {isEditMode && (
            <>
              <Button variant="outline" size="sm" onClick={resetLayout} className="gap-1.5 text-xs">
                <RotateCcw className="h-3.5 w-3.5" /> Reset
              </Button>
              <Button variant="outline" size="sm" onClick={() => setShowDrawer(true)} className="gap-1.5 text-xs">
                <Plus className="h-3.5 w-3.5" /> Add Module
              </Button>
            </>
          )}
          <Button
            variant={isEditMode ? 'default' : 'outline'}
            size="sm"
            onClick={() => { setIsEditMode((v) => !v); setShowDrawer(false) }}
            className="gap-1.5 text-xs"
          >
            {isEditMode
              ? <><Eye className="h-3.5 w-3.5" /> Done</>
              : <><Settings2 className="h-3.5 w-3.5" /> Customise</>
            }
          </Button>
        </div>
      </div>

      {/* Daily Briefing */}
      <div className="briefing-gradient rounded-xl p-5">
        <div className="flex items-start gap-3">
          <div className="h-8 w-8 rounded-lg flex items-center justify-center shrink-0" style={{ background: 'rgba(20,184,166,0.15)' }}>
            <Newspaper className="h-4 w-4" style={{ color: '#14b8a6' }} />
          </div>
          <div>
            <div className="flex items-center gap-2 mb-1.5">
              <span className="text-xs font-semibold uppercase tracking-wide" style={{ color: '#14b8a6' }}>Your Market Pulse</span>
              <span className="text-xs text-slate-600">· Today</span>
            </div>
            <p className="text-sm text-slate-300 leading-relaxed">
              {marketConfig.commercialModel === 'vc' ? (
                <>Three companies in your market announced {marketConfig.investmentLabel.toLowerCase()}s this week, signalling upcoming leadership hiring.{' '}<Link href="/companies/comp_1" className="text-indigo-400 hover:text-indigo-300 transition-colors">BioNova Therapeutics</Link> posted positive Phase 2 data, triggering expected team build-out.{' '}<Link href="/companies/comp_2" className="text-indigo-400 hover:text-indigo-300 transition-colors">DiagnostiX Labs</Link> reached a key milestone, accelerating their commercial leadership hiring timeline.</>
              ) : marketConfig.commercialModel === 'pe' ? (
                <>Two platform acquisitions were completed in your market this week, driving leadership changes across portfolio companies.{' '}<Link href="/companies/comp_1" className="text-indigo-400 hover:text-indigo-300 transition-colors">BioNova Therapeutics</Link> completed a PE-backed management buyout, triggering C-suite restructuring.{' '}<Link href="/investors" className="text-indigo-400 hover:text-indigo-300 transition-colors">HealthVentures Capital</Link> added three new portfolio companies, creating near-term senior leadership hiring opportunities.</>
              ) : marketConfig.commercialModel === 'revenue' ? (
                <>Three significant contract wins and two office expansions were announced this week, signalling senior commercial hiring.{' '}<Link href="/companies/comp_3" className="text-indigo-400 hover:text-indigo-300 transition-colors">ClinPath Solutions</Link> secured a major new mandate, triggering expected practice build-out.{' '}<Link href="/companies/comp_2" className="text-indigo-400 hover:text-indigo-300 transition-colors">DiagnostiX Labs</Link> announced geographic expansion, creating senior leadership demand.</>
              ) : (
                <>Multiple growth signals this week across your configured market.{' '}<Link href="/companies/comp_1" className="text-indigo-400 hover:text-indigo-300 transition-colors">BioNova Therapeutics</Link> announced a significant capital event, triggering expected leadership hiring.{' '}<Link href="/companies/comp_2" className="text-indigo-400 hover:text-indigo-300 transition-colors">DiagnostiX Labs</Link> reached a milestone accelerating their senior team build-out.</>
              )}
            </p>
          </div>
        </div>
      </div>

      {/* Market Scope */}
      <Card className="border-indigo-500/30 bg-indigo-900/10">
        <CardContent className="p-4">
          <div className="flex items-center gap-5 flex-wrap">
            <span className="text-xs font-semibold text-indigo-400 uppercase tracking-wide">Market Scope</span>
            <div className="flex items-center gap-1.5">
              <span className="text-xs text-slate-500">Sector:</span>
              <Badge variant="secondary" className="text-xs">{marketScope.sector}</Badge>
              {marketScope.subsector && <Badge variant="secondary" className="text-xs">{marketScope.subsector}</Badge>}
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
        </CardContent>
      </Card>

      {/* Stats row */}
      <div className="grid grid-cols-4 gap-4">
        {stats.map((stat) => (
          <Link key={stat.label} href={stat.href}>
            <Card className="card-hover cursor-pointer">
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
          </Link>
        ))}
      </div>

      {/* ── Edit mode banner ──────────────────────────────────────────────── */}
      {isEditMode && (
        <div className="rounded-xl border border-indigo-500/30 bg-indigo-900/10 px-4 py-3 flex items-center gap-3">
          <LayoutGrid className="h-4 w-4 text-indigo-400 shrink-0" />
          <p className="text-sm text-slate-300">
            <span className="text-indigo-300 font-medium">Edit mode</span> — drag modules to reorder, resize or hide them. Click <span className="text-indigo-300">Add Module</span> to add from the library.
          </p>
        </div>
      )}

      {/* ── Skeleton while layout loads ───────────────────────────────────── */}
      {!layoutLoaded && <DashboardSkeleton />}

      {/* ── Dynamic module workspace ───────────────────────────────────────── */}
      {layoutLoaded && (
        <div className="grid grid-cols-2 gap-6">
          {activeEntries.map((entry, idx) => (
            <ModuleWrapper
              key={entry.id}
              id={entry.id}
              size={entry.size}
              isEditMode={isEditMode}
              isDragging={dragIdx === idx}
              isDragOver={dragOverIdx === idx}
              onDragStart={() => handleDragStart(idx)}
              onDragOver={(e) => handleDragOver(e, idx)}
              onDrop={() => handleDrop(idx)}
              onDragEnd={handleDragEnd}
              onHide={() => hideModule(entry.id)}
              onToggleSize={() => toggleSize(entry.id)}
            >
              {renderModule(entry.id)}
            </ModuleWrapper>
          ))}
        </div>
      )}

      {layoutLoaded && activeEntries.length === 0 && (
        <div className="rounded-xl border border-dashed border-slate-700 p-12 text-center">
          <LayoutGrid className="h-8 w-8 text-slate-600 mx-auto mb-3" />
          <p className="text-slate-400 font-medium">No modules visible</p>
          <p className="text-sm text-slate-600 mt-1">Click "Add Module" to add modules to your workspace</p>
          <Button variant="outline" size="sm" onClick={() => setShowDrawer(true)} className="mt-4 gap-2">
            <Plus className="h-4 w-4" /> Add Module
          </Button>
        </div>
      )}

      {/* ── Module library drawer ──────────────────────────────────────────── */}
      {showDrawer && (
        <>
          {/* Backdrop */}
          <div
            className="fixed inset-0 bg-slate-950/60 z-40"
            onClick={() => setShowDrawer(false)}
          />
          {/* Drawer */}
          <div className="fixed inset-y-0 right-0 w-80 bg-slate-900 border-l border-slate-800 z-50 flex flex-col shadow-2xl">
            <div className="flex items-center justify-between px-5 py-4 border-b border-slate-800 shrink-0">
              <div>
                <h2 className="text-sm font-semibold text-white">Module Library</h2>
                <p className="text-xs text-slate-500 mt-0.5">Add modules to your workspace</p>
              </div>
              <button onClick={() => setShowDrawer(false)} className="text-slate-400 hover:text-white transition-colors">
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto px-4 py-4 space-y-5">
              {availableModules.length === 0 ? (
                <div className="text-center py-8">
                  <p className="text-slate-500 text-sm">All modules are already on your dashboard</p>
                </div>
              ) : (
                moduleCategories.map((cat) => {
                  const catModules = availableModules.filter((m) => m.category === cat)
                  if (catModules.length === 0) return null
                  return (
                    <div key={cat}>
                      <p className="text-xs font-medium text-slate-500 uppercase tracking-wide mb-2">{cat}</p>
                      <div className="space-y-2">
                        {catModules.map((mod) => (
                          <button
                            key={mod.id}
                            onClick={() => addModule(mod.id)}
                            className="w-full text-left p-3 rounded-lg border border-slate-700 hover:border-indigo-500/50 hover:bg-indigo-900/10 transition-all group"
                          >
                            <div className="flex items-start justify-between gap-2">
                              <div>
                                <p className="text-sm font-medium text-white group-hover:text-indigo-300 transition-colors">{mod.label}</p>
                                <p className="text-xs text-slate-500 mt-0.5">{mod.description}</p>
                                <span className="text-xs text-slate-600 mt-1 inline-block">{mod.defaultSize === 'full' ? 'Full width' : 'Half width'}</span>
                              </div>
                              <Plus className="h-4 w-4 text-slate-500 group-hover:text-indigo-400 transition-colors shrink-0 mt-0.5" />
                            </div>
                          </button>
                        ))}
                      </div>
                    </div>
                  )
                })
              )}
            </div>

            <div className="px-4 py-3 border-t border-slate-800 shrink-0">
              <p className="text-xs text-slate-600 text-center">
                {industry} market · {activeEntries.length} active modules
              </p>
            </div>
          </div>
        </>
      )}
    </div>
  )
}
