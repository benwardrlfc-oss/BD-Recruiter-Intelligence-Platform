'use client'

import Link from 'next/link'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'

interface EmergingCompanyEntry {
  id: string
  name: string
  stage: string
  sector: string
  hires: string[]
}

interface Company {
  id: string
  geography: string
}

interface EmergingCompaniesProps {
  emergingCompanies: EmergingCompanyEntry[]
  companies: Company[]
}

export function EmergingCompanies({ emergingCompanies, companies }: EmergingCompaniesProps) {
  return (
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
}
