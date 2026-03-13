'use client'

import Link from 'next/link'
import { Target, Building2, Bell } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'

export default function TargetListsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white">Target Lists</h1>
        <p className="text-sm text-slate-400 mt-1">
          Save curated lists of target companies with signal alerts
        </p>
      </div>

      <Card className="border-dashed border-slate-700 bg-slate-900/30">
        <CardContent className="flex flex-col items-center justify-center py-20 text-center">
          <div className="h-14 w-14 rounded-xl bg-indigo-500/10 flex items-center justify-center mb-4">
            <Target className="h-7 w-7 text-indigo-400" />
          </div>
          <h2 className="text-lg font-semibold text-white mb-2">No target lists yet</h2>
          <p className="text-sm text-slate-400 max-w-sm leading-relaxed mb-2">
            Target Lists let you save groups of companies you are actively pursuing and receive
            signal alerts when anything changes — funding rounds, leadership moves, hiring surges.
          </p>
          <div className="flex items-center gap-4 mt-2 mb-6 text-xs text-slate-500">
            <div className="flex items-center gap-1.5">
              <Building2 className="h-3.5 w-3.5 text-slate-500" />
              Group companies into named lists
            </div>
            <div className="flex items-center gap-1.5">
              <Bell className="h-3.5 w-3.5 text-slate-500" />
              Get notified on key signals
            </div>
          </div>
          <Link href="/companies">
            <Button className="gap-2">
              <Building2 className="h-4 w-4" />
              Browse Companies
            </Button>
          </Link>
        </CardContent>
      </Card>
    </div>
  )
}
