'use client'

import Link from 'next/link'
import { DollarSign, ChevronRight } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { formatCurrency } from '@/lib/utils'

interface Investor {
  id: string
  name: string
  totalInvestments?: number
  portfolioCompanyIds?: string[]
}

interface Signal {
  id: string
  companyId: string | null
}

interface InvestorActivityProps {
  investors: Investor[]
  signals: Signal[]
  capitalTabLabel: string
}

export function InvestorActivity({ investors, signals, capitalTabLabel }: InvestorActivityProps) {
  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base">{capitalTabLabel}</CardTitle>
          <Link href="/investors"><Button variant="ghost" size="sm" className="gap-1 text-xs">View all <ChevronRight className="h-3 w-3" /></Button></Link>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {investors.slice(0, 4).map((inv) => {
            const portfolioSignalCount = signals.filter(
              (s) => s.companyId && inv.portfolioCompanyIds?.includes(s.companyId)
            ).length
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
}
