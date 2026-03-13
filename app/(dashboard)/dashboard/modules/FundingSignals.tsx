'use client'

import Link from 'next/link'
import { DollarSign, ChevronRight } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { formatCurrency } from '@/lib/utils'

interface Company {
  id: string
  name: string
  stage: string
  geography: string
  fundingTotal: number
}

interface Signal {
  id: string
  signalType: string
  companyId: string | null
}

interface Opportunity {
  id: string
  companyId: string
  likelyHiringNeed: string
}

interface FundingSignalsProps {
  signals: Signal[]
  companies: Company[]
  opportunities: Opportunity[]
  fundingCardLabel: string
}

export function FundingSignals({ signals, companies, opportunities, fundingCardLabel }: FundingSignalsProps) {
  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base">{fundingCardLabel}</CardTitle>
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
}
