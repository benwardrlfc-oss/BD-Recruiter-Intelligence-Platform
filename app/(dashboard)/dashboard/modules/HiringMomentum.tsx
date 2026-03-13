'use client'

import Link from 'next/link'
import { TrendingUp } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

interface Company {
  id: string
  name: string
  stage: string
  sector: string
}

interface Opportunity {
  id: string
  companyId: string
  momentumScore: number
}

interface HiringMomentumProps {
  opportunities: Opportunity[]
  companies: Company[]
}

export function HiringMomentum({ opportunities, companies }: HiringMomentumProps) {
  return (
    <Card>
      <CardHeader className="pb-3"><CardTitle className="text-base">Hiring Momentum</CardTitle></CardHeader>
      <CardContent>
        <div className="space-y-3">
          {[...opportunities].sort((a, b) => b.momentumScore - a.momentumScore).slice(0, 5).map((opp, idx) => {
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
}
