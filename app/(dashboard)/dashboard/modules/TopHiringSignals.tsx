'use client'

import Link from 'next/link'
import { Building2, MapPin, ArrowRight, ChevronRight } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { getScoreColor } from '@/lib/utils'

interface Company {
  id: string
  name: string
  sector: string
  stage: string
  geography: string
}

interface Opportunity {
  id: string
  companyId: string
  opportunityScore: number
  recommendedStakeholder: string
}

interface TopHiringSignalsProps {
  opportunities: Opportunity[]
  companies: Company[]
  bdActionsMap: Record<string, string[]>
}

export function TopHiringSignals({ opportunities, companies, bdActionsMap }: TopHiringSignalsProps) {
  return (
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
}
