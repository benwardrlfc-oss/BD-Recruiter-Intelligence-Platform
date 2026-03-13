'use client'

import { useState, useEffect, useCallback } from 'react'
import Link from 'next/link'
import {
  Target, TrendingUp, Zap, Sparkles, Building2, DollarSign, Users,
  ArrowRight, ChevronRight, MapPin, Radio, Newspaper, Bookmark,
  Activity, GripVertical, X, Plus, Settings2, RotateCcw, LayoutGrid,
  Eye, EyeOff, Expand, Shrink,
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { mockOpportunities, mockCompanies, mockSignals, mockInvestors } from '@/lib/mock-data'
import { formatTimeAgo, formatCurrency, getScoreColor, getSignalTypeColor, signalTypeIcons, cn } from '@/lib/utils'
import { useSettings, companyMatchesSettings } from '@/lib/settings-context'
import { useWatchlist } from '@/lib/watchlist-context'
import { useMarketConfig } from '@/lib/market-config'

// ── Module catalogue ──────────────────────────────────────────────────────────

type ModuleSize = 'full' | 'half'
type ModuleCategory = 'Signals' | 'Accounts' | 'Capital' | 'Geography' | 'Intelligence' | 'Execution'

interface ModuleDef {
  id: string
  label: string
  description: string
  category: ModuleCategory
  defaultSize: ModuleSize
}

const MODULE_CATALOGUE: ModuleDef[] = [
  { id: 'top-hiring-signals',  label: 'Top Hiring Signals',       description: 'Ranked companies with active hiring probability signals',     category: 'Signals',      defaultSize: 'full' },
  { id: 'funding-signals',     label: 'Capital Signals',           description: 'Recent funding rounds and capital activity',                  category: 'Capital',      defaultSize: 'half' },
  { id: 'watchlist-updates',   label: 'Watchlist Updates',         description: 'Movement from your watched companies and VCs',                category: 'Accounts',     defaultSize: 'full' },
  { id: 'emerging-companies',  label: 'Emerging Companies',        description: 'New entrants showing early hiring signals',                   category: 'Accounts',     defaultSize: 'full' },
  { id: 'role-demand',         label: 'Role Demand Heatmap',       description: 'Most in-demand leadership roles in your market',             category: 'Intelligence', defaultSize: 'half' },
  { id: 'hiring-momentum',     label: 'Hiring Momentum',           description: 'Companies ranked by momentum score',                          category: 'Intelligence', defaultSize: 'half' },
  { id: 'quick-actions',       label: 'Quick Actions',             description: 'Shortcuts to key BD workflows',                              category: 'Execution',    defaultSize: 'half' },
  { id: 'investor-activity',   label: 'Investor Activity',         description: 'Top investors by portfolio signal activity',                  category: 'Capital',      defaultSize: 'half' },
  { id: 'market-radar-preview',label: 'Market Radar',             description: 'Latest market signals from your radar',                       category: 'Signals',      defaultSize: 'half' },
]

// ── Industry default module layouts ──────────────────────────────────────────

interface LayoutEntry { id: string; size: ModuleSize }

const INDUSTRY_DEFAULT_LAYOUTS: Record<string, LayoutEntry[]> = {
  'Life Sciences': [
    { id: 'top-hiring-signals', size: 'full' },
    { id: 'funding-signals', size: 'half' },
    { id: 'role-demand', size: 'half' },
    { id: 'watchlist-updates', size: 'full' },
    { id: 'investor-activity', size: 'half' },
    { id: 'emerging-companies', size: 'full' },
  ],
  Technology: [
    { id: 'top-hiring-signals', size: 'full' },
    { id: 'funding-signals', size: 'half' },
    { id: 'hiring-momentum', size: 'half' },
    { id: 'market-radar-preview', size: 'half' },
    { id: 'role-demand', size: 'half' },
    { id: 'watchlist-updates', size: 'full' },
  ],
  Legal: [
    { id: 'top-hiring-signals', size: 'full' },
    { id: 'role-demand', size: 'half' },
    { id: 'hiring-momentum', size: 'half' },
    { id: 'market-radar-preview', size: 'half' },
    { id: 'quick-actions', size: 'half' },
    { id: 'watchlist-updates', size: 'full' },
  ],
  'Financial Services': [
    { id: 'top-hiring-signals', size: 'full' },
    { id: 'funding-signals', size: 'half' },
    { id: 'investor-activity', size: 'half' },
    { id: 'role-demand', size: 'half' },
    { id: 'hiring-momentum', size: 'half' },
    { id: 'watchlist-updates', size: 'full' },
  ],
  'Real Estate & Construction': [
    { id: 'top-hiring-signals', size: 'full' },
    { id: 'funding-signals', size: 'half' },
    { id: 'role-demand', size: 'half' },
    { id: 'market-radar-preview', size: 'half' },
    { id: 'quick-actions', size: 'half' },
    { id: 'watchlist-updates', size: 'full' },
    { id: 'emerging-companies', size: 'full' },
  ],
  Healthcare: [
    { id: 'top-hiring-signals', size: 'full' },
    { id: 'funding-signals', size: 'half' },
    { id: 'role-demand', size: 'half' },
    { id: 'watchlist-updates', size: 'full' },
    { id: 'emerging-companies', size: 'full' },
  ],
}

const DEFAULT_LAYOUT: LayoutEntry[] = [
  { id: 'top-hiring-signals', size: 'full' },
  { id: 'funding-signals', size: 'half' },
  { id: 'role-demand', size: 'half' },
  { id: 'watchlist-updates', size: 'full' },
  { id: 'quick-actions', size: 'half' },
  { id: 'hiring-momentum', size: 'half' },
  { id: 'emerging-companies', size: 'full' },
]

function getDefaultLayout(industry: string): LayoutEntry[] {
  return INDUSTRY_DEFAULT_LAYOUTS[industry] || DEFAULT_LAYOUT
}

// ── Persisted layout state ────────────────────────────────────────────────────

interface SavedLayout {
  industry: string
  entries: LayoutEntry[]
  hidden: string[]
}

const STORAGE_KEY = 'bd_dashboard_layout_v1'

function loadLayout(industry: string): { entries: LayoutEntry[]; hidden: string[] } {
  if (typeof window === 'undefined') return { entries: getDefaultLayout(industry), hidden: [] }
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (raw) {
      const saved: SavedLayout = JSON.parse(raw)
      if (saved.industry === industry) return { entries: saved.entries, hidden: saved.hidden }
    }
  } catch {}
  return { entries: getDefaultLayout(industry), hidden: [] }
}

function saveLayout(industry: string, entries: LayoutEntry[], hidden: string[]) {
  if (typeof window === 'undefined') return
  localStorage.setItem(STORAGE_KEY, JSON.stringify({ industry, entries, hidden }))
}

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

// ── Module wrapper ────────────────────────────────────────────────────────────

function ModuleWrapper({
  id, size, isEditMode, isDragOver, isDragging,
  onDragStart, onDragOver, onDrop, onDragEnd,
  onHide, onToggleSize, children,
}: {
  id: string
  size: ModuleSize
  isEditMode: boolean
  isDragOver: boolean
  isDragging: boolean
  onDragStart: () => void
  onDragOver: (e: React.DragEvent) => void
  onDrop: () => void
  onDragEnd: () => void
  onHide: () => void
  onToggleSize: () => void
  children: React.ReactNode
}) {
  const def = MODULE_CATALOGUE.find((m) => m.id === id)
  return (
    <div
      className={cn(
        'relative transition-all duration-200',
        size === 'full' ? 'col-span-2' : 'col-span-1',
        isEditMode && isDragOver && !isDragging && 'ring-2 ring-indigo-500/60 ring-offset-2 ring-offset-slate-950 rounded-xl',
        isEditMode && isDragging && 'opacity-40 scale-[0.98]',
      )}
      draggable={isEditMode}
      onDragStart={isEditMode ? onDragStart : undefined}
      onDragOver={isEditMode ? onDragOver : undefined}
      onDrop={isEditMode ? onDrop : undefined}
      onDragEnd={isEditMode ? onDragEnd : undefined}
    >
      {isEditMode && (
        <div className="absolute top-2 right-2 z-20 flex items-center gap-1">
          <button
            onClick={onToggleSize}
            title={size === 'full' ? 'Make half-width' : 'Make full-width'}
            className="h-7 w-7 rounded-lg bg-slate-800 border border-slate-700 flex items-center justify-center text-slate-400 hover:text-white hover:bg-slate-700 transition-colors"
          >
            {size === 'full' ? <Shrink className="h-3.5 w-3.5" /> : <Expand className="h-3.5 w-3.5" />}
          </button>
          <button
            onClick={onHide}
            title="Hide module"
            className="h-7 w-7 rounded-lg bg-slate-800 border border-slate-700 flex items-center justify-center text-slate-400 hover:text-rose-400 hover:bg-slate-700 transition-colors"
          >
            <EyeOff className="h-3.5 w-3.5" />
          </button>
        </div>
      )}
      {isEditMode && (
        <div className="absolute top-2 left-2 z-20 flex items-center gap-1.5 cursor-grab active:cursor-grabbing">
          <div className="h-7 px-2 rounded-lg bg-slate-800 border border-slate-700 flex items-center gap-1.5 text-slate-400">
            <GripVertical className="h-3.5 w-3.5" />
            <span className="text-xs">{def?.label}</span>
          </div>
        </div>
      )}
      <div className={cn(isEditMode && 'pt-2')}>
        {children}
      </div>
    </div>
  )
}

// ── Main page ─────────────────────────────────────────────────────────────────

export default function DashboardPage() {
  const { settings, activeProfile } = useSettings()
  const { watchedCompanies, watchedVCs } = useWatchlist()
  const marketConfig = useMarketConfig()

  const industry = activeProfile?.industry || settings.sector || 'Life Sciences'

  // ── Data ────────────────────────────────────────────────────────────────────
  const companies = mockCompanies.filter((c) => companyMatchesSettings(c, settings))
  const filteredCompanyIds = new Set(companies.map((c) => c.id))
  const opportunities = mockOpportunities.filter((o) => filteredCompanyIds.has(o.companyId))
  const signals = mockSignals.filter((s) => s.companyId && filteredCompanyIds.has(s.companyId))

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

  // ── Module renderers ─────────────────────────────────────────────────────────

  const renderTopHiringSignals = () => (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base">Top Hiring Signals</CardTitle>
          <Link href="/opportunities"><Button variant="ghost" size="sm" className="gap-1 text-xs">View all <ChevronRight className="h-3 w-3" /></Button></Link>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {opportunities.slice(0, 5).map((opp) => {
            const company = companies.find((c) => c.id === opp.companyId)
            const actions = bdActionsMap[opp.id] || []
            return (
              <div key={opp.id} className="rounded-lg border border-slate-800 bg-slate-900/50 px-4 py-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3 flex-1 min-w-0">
                    <div className="h-9 w-9 rounded-lg bg-slate-800 flex items-center justify-center shrink-0">
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
                      <p className="text-xs text-slate-500 truncate mt-0.5">Likely hire: {opp.recommendedStakeholder}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 ml-3 shrink-0">
                    <div className="text-center">
                      <span className={`text-xs font-bold px-2 py-1 rounded-full ${getScoreColor(opp.opportunityScore)}`}>{opp.opportunityScore}</span>
                      <p className="text-xs text-slate-600 mt-0.5">Signal Strength</p>
                    </div>
                    <Link href="/opportunities"><Button variant="ghost" size="icon" className="h-7 w-7"><ArrowRight className="h-3 w-3" /></Button></Link>
                  </div>
                </div>
                {actions.length > 0 && (
                  <div className="mt-2 pt-2 border-t border-slate-800">
                    <p className="text-xs text-slate-500 mb-1 font-medium">Recommended BD Actions:</p>
                    <div className="flex flex-wrap gap-1">
                      {actions.map((action, i) => (
                        <span key={i} className="text-xs px-2 py-0.5 rounded-full bg-indigo-900/40 text-indigo-300 border border-indigo-700/30">{action}</span>
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
  )

  const renderFundingSignals = () => (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base">{marketConfig.fundingCardLabel}</CardTitle>
          <Link href="/radar"><Button variant="ghost" size="sm" className="gap-1 text-xs">View all <ChevronRight className="h-3 w-3" /></Button></Link>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {signals.filter((s) => s.signalType === 'funding').slice(0, 4).map((signal) => {
            const company = companies.find((c) => c.id === signal.companyId)
            const linkedOpp = opportunities.find((o) => o.companyId === signal.companyId)
            const likelyHires = linkedOpp?.likelyHiringNeed?.split(',').slice(0, 2) || []
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
                  <p className="text-sm font-bold text-emerald-400">{company?.fundingTotal ? formatCurrency(company.fundingTotal) : 'N/A'}</p>
                </div>
                {likelyHires.length > 0 && (
                  <div className="mt-2">
                    <p className="text-xs text-slate-500 mb-1">Expected hires:</p>
                    <div className="flex flex-wrap gap-1">
                      {likelyHires.map((hire, i) => (
                        <span key={i} className="text-xs px-2 py-0.5 rounded-full bg-emerald-900/20 text-emerald-400 border border-emerald-700/20">{hire.trim()}</span>
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
  )

  const renderRoleDemand = () => (
    <Card>
      <CardHeader className="pb-3"><CardTitle className="text-base">Most In-Demand Leadership Roles</CardTitle></CardHeader>
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
                  <div className="h-1.5 rounded-full bg-gradient-to-r from-indigo-600 to-indigo-400" style={{ width: `${(item.signals / roleDemand[0].signals) * 100}%` }} />
                </div>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )

  const renderHiringMomentum = () => (
    <Card>
      <CardHeader className="pb-3"><CardTitle className="text-base">Hiring Momentum</CardTitle></CardHeader>
      <CardContent>
        <div className="space-y-3">
          {opportunities.sort((a, b) => b.momentumScore - a.momentumScore).slice(0, 5).map((opp, idx) => {
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
  )

  const renderQuickActions = () => (
    <Card>
      <CardHeader className="pb-3"><CardTitle className="text-base">Quick Actions</CardTitle></CardHeader>
      <CardContent className="space-y-2">
        <Link href="/candidates"><Button variant="secondary" className="w-full justify-start gap-2 text-sm"><Users className="h-4 w-4" />Match a Candidate</Button></Link>
        <Link href="/scripts"><Button variant="secondary" className="w-full justify-start gap-2 text-sm"><Sparkles className="h-4 w-4" />Generate BD Script</Button></Link>
        <Link href="/content"><Button variant="secondary" className="w-full justify-start gap-2 text-sm"><Zap className="h-4 w-4" />Create LinkedIn Post</Button></Link>
        <Link href="/radar"><Button variant="secondary" className="w-full justify-start gap-2 text-sm"><Target className="h-4 w-4" />Browse Signals</Button></Link>
      </CardContent>
    </Card>
  )

  const renderWatchlistUpdates = () => {
    const watchedCompanyIds = new Set(watchedCompanies.map((w) => w.entityId))
    const watchedVCIds = new Set(watchedVCs.map((w) => w.entityId))
    const watchlistSignals = mockSignals.filter((s) => (s.companyId && watchedCompanyIds.has(s.companyId)) || (s.investorId && watchedVCIds.has(s.investorId))).slice(0, 4)
    const watchedInvestors = mockInvestors.filter((inv) => watchedVCIds.has(inv.id))
    const portfolioSignals = mockSignals
      .filter((s) => s.companyId && watchedInvestors.some((inv) => inv.portfolioCompanyIds?.includes(s.companyId!)))
      .filter((s) => !watchlistSignals.some((ws) => ws.id === s.id))
      .slice(0, 2)
    const updates = [...watchlistSignals, ...portfolioSignals].slice(0, 5)

    if (updates.length === 0 && watchedCompanies.length === 0) {
      return (
        <Card className="border-indigo-500/20 bg-indigo-900/5">
          <CardContent className="p-6 text-center">
            <Bookmark className="h-8 w-8 text-slate-600 mx-auto mb-2" />
            <p className="text-sm text-slate-400">No watchlist activity yet</p>
            <p className="text-xs text-slate-600 mt-1">Watch companies and VCs to see their updates here</p>
            <Link href="/watchlist"><Button variant="outline" size="sm" className="mt-3 gap-2"><Plus className="h-3.5 w-3.5" />Go to Watchlist</Button></Link>
          </CardContent>
        </Card>
      )
    }

    return (
      <Card className="border-indigo-500/20 bg-indigo-900/5">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Bookmark className="h-4 w-4 text-indigo-400" />
              <CardTitle className="text-base">Watchlist Updates</CardTitle>
            </div>
            <Link href="/watchlist"><Button variant="ghost" size="sm" className="gap-1 text-xs">View watchlist <ChevronRight className="h-3 w-3" /></Button></Link>
          </div>
          <p className="text-xs text-slate-500 mt-1">Recent movement from your watched accounts</p>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {updates.map((signal) => {
              const company = signal.companyId ? mockCompanies.find((c) => c.id === signal.companyId) : null
              const investor = signal.investorId ? mockInvestors.find((inv) => inv.id === signal.investorId) : null
              const isPortfolioSignal = !watchlistSignals.some((ws) => ws.id === signal.id)
              const entityName = isPortfolioSignal && investor ? `${investor.name} Portfolio` : (company?.name || investor?.name || 'Unknown')
              const entityId = company?.id
              return (
                <div key={signal.id} className="flex items-start gap-3 rounded-lg border border-slate-800 bg-slate-900/40 px-4 py-3">
                  <div className="h-8 w-8 rounded-lg bg-indigo-500/10 flex items-center justify-center shrink-0 mt-0.5">
                    <Activity className="h-3.5 w-3.5 text-indigo-400" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <div className="flex items-center gap-1.5 mb-0.5">
                          {entityId ? (
                            <Link href={`/companies/${entityId}`}><span className="text-sm font-semibold text-white hover:text-indigo-400 transition-colors">{entityName}</span></Link>
                          ) : (
                            <span className="text-sm font-semibold text-white">{entityName}</span>
                          )}
                          <span className="text-xs px-1.5 py-0.5 rounded-full bg-slate-800 text-slate-400 border border-slate-700 capitalize">{signal.signalType}</span>
                        </div>
                        <p className="text-xs text-slate-400 line-clamp-1">{signal.title}</p>
                        <p className="text-xs text-teal-300 mt-0.5 line-clamp-1"><Zap className="h-3 w-3 inline mr-1 text-teal-400" />{signal.whyItMatters}</p>
                      </div>
                      <span className="text-xs text-slate-500 shrink-0">{formatTimeAgo(signal.publishedAt)}</span>
                    </div>
                    <div className="flex items-center gap-2 mt-2">
                      {entityId && <Link href={`/companies/${entityId}`}><button className="text-xs text-slate-400 hover:text-white transition-colors flex items-center gap-1"><ChevronRight className="h-3 w-3" />Open</button></Link>}
                      <Link href="/scripts"><button className="text-xs text-slate-400 hover:text-white transition-colors flex items-center gap-1"><Sparkles className="h-3 w-3" />BD Script</button></Link>
                      <Link href="/radar"><button className="text-xs text-slate-400 hover:text-white transition-colors flex items-center gap-1"><Radio className="h-3 w-3" />Signal</button></Link>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        </CardContent>
      </Card>
    )
  }

  const renderEmergingCompanies = () => (
    <Card>
      <CardHeader className="pb-3"><CardTitle className="text-base">Emerging Companies (Last 90 Days)</CardTitle></CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 gap-4">
          {emergingCompanies.map((co) => {
            const fullCo = companies.find((c) => c.id === co.id)
            return (
              <div key={co.id} className="rounded-lg border border-slate-800 bg-slate-900/50 p-4">
                <div className="flex items-center justify-between mb-3">
                  <div>
                    <Link href={`/companies/${co.id}`}><p className="text-sm font-semibold text-white hover:text-indigo-400 transition-colors">{co.name}</p></Link>
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
                      <span key={i} className="text-xs px-2 py-0.5 rounded-full bg-slate-800 text-slate-400 border border-slate-700">{hire}</span>
                    ))}
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      </CardContent>
    </Card>
  )

  const renderInvestorActivity = () => (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base">{marketConfig.capitalTabLabel}</CardTitle>
          <Link href="/investors"><Button variant="ghost" size="sm" className="gap-1 text-xs">View all <ChevronRight className="h-3 w-3" /></Button></Link>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {mockInvestors.slice(0, 4).map((inv) => {
            const portfolioSignalCount = mockSignals.filter((s) => s.companyId && inv.portfolioCompanyIds?.includes(s.companyId)).length
            return (
              <div key={inv.id} className="flex items-center gap-3 rounded-lg border border-slate-800 bg-slate-900/50 px-4 py-3">
                <div className="h-8 w-8 rounded-full bg-indigo-500/10 flex items-center justify-center shrink-0">
                  <DollarSign className="h-4 w-4 text-indigo-400" />
                </div>
                <div className="flex-1 min-w-0">
                  <Link href="/investors"><p className="text-sm font-semibold text-white hover:text-indigo-400 transition-colors truncate">{inv.name}</p></Link>
                  <p className="text-xs text-slate-500">{inv.totalInvestments ? formatCurrency(inv.totalInvestments) : ''} · {inv.portfolioCompanyIds?.length || 0} portfolio cos</p>
                </div>
                <div className="text-center shrink-0">
                  <span className="text-xs font-bold text-indigo-400">{portfolioSignalCount}</span>
                  <p className="text-xs text-slate-600">signals</p>
                </div>
              </div>
            )
          })}
        </div>
      </CardContent>
    </Card>
  )

  const renderMarketRadarPreview = () => (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base">Market Radar</CardTitle>
          <Link href="/radar"><Button variant="ghost" size="sm" className="gap-1 text-xs">Open Radar <ChevronRight className="h-3 w-3" /></Button></Link>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {signals.slice(0, 4).map((signal) => {
            const company = companies.find((c) => c.id === signal.companyId)
            return (
              <div key={signal.id} className="flex items-start gap-3">
                <span className="text-lg shrink-0">{signalTypeIcons[signal.signalType] || '📊'}</span>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-0.5">
                    <span className={`text-xs px-1.5 py-0.5 rounded-full border capitalize ${getSignalTypeColor(signal.signalType)}`}>{signal.signalType}</span>
                    <span className="text-xs text-slate-500">{formatTimeAgo(signal.publishedAt)}</span>
                  </div>
                  <p className="text-sm text-white truncate">{signal.title}</p>
                  {company && <p className="text-xs text-slate-500 truncate">{company.name}</p>}
                </div>
              </div>
            )
          })}
        </div>
      </CardContent>
    </Card>
  )

  const renderModule = (id: string) => {
    switch (id) {
      case 'top-hiring-signals':   return renderTopHiringSignals()
      case 'funding-signals':      return renderFundingSignals()
      case 'role-demand':          return renderRoleDemand()
      case 'hiring-momentum':      return renderHiringMomentum()
      case 'quick-actions':        return renderQuickActions()
      case 'watchlist-updates':    return renderWatchlistUpdates()
      case 'emerging-companies':   return renderEmergingCompanies()
      case 'investor-activity':    return renderInvestorActivity()
      case 'market-radar-preview': return renderMarketRadarPreview()
      default: return null
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

      {/* ── Dynamic module workspace ───────────────────────────────────────── */}
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

      {activeEntries.length === 0 && (
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
