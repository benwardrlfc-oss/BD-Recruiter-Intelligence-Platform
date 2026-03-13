'use client'

import Link from 'next/link'
import { ChevronRight } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { formatTimeAgo, getSignalTypeColor, signalTypeIcons } from '@/lib/utils'

interface Company {
  id: string
  name: string
}

interface Signal {
  id: string
  signalType: string
  title: string
  publishedAt: Date
  companyId: string | null
}

interface MarketRadarPreviewProps {
  signals: Signal[]
  companies: Company[]
}

export function MarketRadarPreview({ signals, companies }: MarketRadarPreviewProps) {
  return (
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
}
