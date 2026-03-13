'use client'

import Link from 'next/link'
import { Bookmark, Activity, ChevronRight, Sparkles, Radio, Zap, Plus } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { formatTimeAgo } from '@/lib/utils'

interface Company {
  id: string
  name: string
}

interface Investor {
  id: string
  name: string
  portfolioCompanyIds?: string[]
}

interface Signal {
  id: string
  signalType: string
  title: string
  whyItMatters: string
  publishedAt: Date
  companyId: string | null
  investorId: string | null
}

interface WatchEntry {
  entityId: string
}

interface WatchlistUpdatesProps {
  watchedCompanies: WatchEntry[]
  watchedVCs: WatchEntry[]
  allSignals: Signal[]
  allCompanies: Company[]
  allInvestors: Investor[]
}

export function WatchlistUpdates({
  watchedCompanies,
  watchedVCs,
  allSignals,
  allCompanies,
  allInvestors,
}: WatchlistUpdatesProps) {
  const watchedCompanyIds = new Set(watchedCompanies.map((w) => w.entityId))
  const watchedVCIds = new Set(watchedVCs.map((w) => w.entityId))

  const watchlistSignals = allSignals
    .filter((s) =>
      (s.companyId && watchedCompanyIds.has(s.companyId)) ||
      (s.investorId && watchedVCIds.has(s.investorId))
    )
    .slice(0, 4)

  const watchedInvestors = allInvestors.filter((inv) => watchedVCIds.has(inv.id))
  const portfolioSignals = allSignals
    .filter(
      (s) =>
        s.companyId &&
        watchedInvestors.some((inv) => inv.portfolioCompanyIds?.includes(s.companyId!))
    )
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
            const company = signal.companyId ? allCompanies.find((c) => c.id === signal.companyId) : null
            const investor = signal.investorId ? allInvestors.find((inv) => inv.id === signal.investorId) : null
            const isPortfolioSignal = !watchlistSignals.some((ws) => ws.id === signal.id)
            const entityName = isPortfolioSignal && investor
              ? `${investor.name} Portfolio`
              : (company?.name || investor?.name || 'Unknown')
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
