'use client'

import { useState } from 'react'
import Link from 'next/link'
import {
  ArrowUpDown,
  Building2,
  TrendingUp,
  Clock,
  ChevronRight,
  MapPin,
} from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { mockOpportunities, mockCompanies } from '@/lib/mock-data'
import { getScoreColor, getTimingBadgeColor, cn } from '@/lib/utils'

type SortKey = 'opportunityScore' | 'momentumScore' | 'name'

export default function TargetsPage() {
  const [sortKey, setSortKey] = useState<SortKey>('opportunityScore')
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('desc')

  const targets = mockOpportunities.map((opp) => ({
    ...opp,
    company: mockCompanies.find((c) => c.id === opp.companyId),
  }))

  const sorted = [...targets].sort((a, b) => {
    let aVal: any = sortKey === 'name' ? a.company?.name : a[sortKey]
    let bVal: any = sortKey === 'name' ? b.company?.name : b[sortKey]
    if (typeof aVal === 'string') aVal = aVal.toLowerCase()
    if (typeof bVal === 'string') bVal = bVal.toLowerCase()
    if (aVal < bVal) return sortDir === 'asc' ? -1 : 1
    if (aVal > bVal) return sortDir === 'asc' ? 1 : -1
    return 0
  })

  const handleSort = (key: SortKey) => {
    if (sortKey === key) {
      setSortDir(sortDir === 'asc' ? 'desc' : 'asc')
    } else {
      setSortKey(key)
      setSortDir('desc')
    }
  }

  const SortButton = ({ sortFor, label }: { sortFor: SortKey; label: string }) => (
    <button
      onClick={() => handleSort(sortFor)}
      className="flex items-center gap-1 text-xs font-medium text-slate-400 hover:text-white"
    >
      {label}
      <ArrowUpDown className={cn('h-3 w-3', sortKey === sortFor && 'text-indigo-400')} />
    </button>
  )

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-white">Target Accounts</h1>
        <p className="text-sm text-slate-400 mt-1">
          {sorted.length} prioritized accounts ranked by BD potential
        </p>
      </div>

      {/* Table */}
      <Card>
        <CardContent className="p-0">
          {/* Table Header */}
          <div className="grid grid-cols-12 gap-4 px-6 py-3 border-b border-slate-800 text-xs font-medium text-slate-500 uppercase tracking-wide">
            <div className="col-span-3">
              <SortButton sortFor="name" label="Company" />
            </div>
            <div className="col-span-1">
              <SortButton sortFor="opportunityScore" label="Score" />
            </div>
            <div className="col-span-1">
              <SortButton sortFor="momentumScore" label="Momentum" />
            </div>
            <div className="col-span-2">Timing Window</div>
            <div className="col-span-2">Hiring Need</div>
            <div className="col-span-2">Stakeholder</div>
            <div className="col-span-1"></div>
          </div>

          {/* Table Rows */}
          <div className="divide-y divide-slate-800">
            {sorted.map((target, idx) => (
              <div
                key={target.id}
                className="grid grid-cols-12 gap-4 px-6 py-4 hover:bg-slate-900/50 transition-colors items-center"
              >
                {/* Company */}
                <div className="col-span-3 flex items-center gap-3">
                  <div className="flex items-center justify-center h-8 w-8 rounded-lg bg-slate-800 text-xs font-bold text-slate-500 flex-shrink-0">
                    {idx + 1}
                  </div>
                  <div>
                    <Link href={`/companies/${target.companyId}`}>
                      <p className="text-sm font-semibold text-white hover:text-indigo-400 transition-colors">{target.company?.name}</p>
                    </Link>
                    <div className="flex items-center gap-1 mt-0.5">
                      <MapPin className="h-3 w-3 text-slate-600" />
                      <span className="text-xs text-slate-500">{target.company?.geography}</span>
                    </div>
                  </div>
                </div>

                {/* Score */}
                <div className="col-span-1">
                  <span className={`text-sm font-bold px-2.5 py-1 rounded-lg ${getScoreColor(target.opportunityScore)}`}>
                    {target.opportunityScore}
                  </span>
                </div>

                {/* Momentum */}
                <div className="col-span-1">
                  <div className="flex items-center gap-1">
                    <TrendingUp className="h-3.5 w-3.5 text-emerald-400" />
                    <span className="text-sm font-semibold text-emerald-400">{target.momentumScore}</span>
                  </div>
                </div>

                {/* Timing */}
                <div className="col-span-2">
                  <div
                    className={`inline-flex items-center gap-1 text-xs px-2 py-1 rounded-full border font-medium ${getTimingBadgeColor(target.timingWindow || '')}`}
                  >
                    <Clock className="h-3 w-3" />
                    {target.timingWindow}
                  </div>
                </div>

                {/* Hiring Need */}
                <div className="col-span-2">
                  <p className="text-xs text-slate-400 line-clamp-2">
                    {target.likelyHiringNeed?.split(',')[0]}
                  </p>
                </div>

                {/* Stakeholder */}
                <div className="col-span-2">
                  <span className="text-xs font-medium text-indigo-400 bg-indigo-900/30 border border-indigo-700/30 px-2 py-1 rounded">
                    {target.recommendedStakeholder}
                  </span>
                </div>

                {/* Action */}
                <div className="col-span-1 flex justify-end">
                  <Link href={`/companies/${target.companyId}`}>
                    <Button variant="ghost" size="icon" className="h-7 w-7">
                      <ChevronRight className="h-4 w-4" />
                    </Button>
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
