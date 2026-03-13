'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

interface RoleDemandItem {
  role: string
  signals: number
}

interface RoleDemandProps {
  roleDemand: RoleDemandItem[]
}

export function RoleDemand({ roleDemand }: RoleDemandProps) {
  return (
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
}
