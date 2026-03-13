'use client'

import Link from 'next/link'
import { BarChart3, Lock, Users, Zap, Eye } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'

const comingSoonMetrics = [
  {
    icon: Users,
    title: 'Team Activity',
    description: 'users active this week',
    value: '--',
  },
  {
    icon: Zap,
    title: 'AI Credits Used',
    description: 'tokens consumed this month',
    value: '--',
  },
  {
    icon: Eye,
    title: 'Signals Reviewed',
    description: 'signals opened this month',
    value: '--',
  },
]

export default function ReportingPage() {
  return (
    <div className="space-y-8">
      {/* Page header */}
      <div>
        <h1 className="text-2xl font-bold text-white">Reporting</h1>
        <p className="text-sm text-slate-400 mt-1">Team and platform usage analytics</p>
      </div>

      {/* Main empty state card */}
      <Card>
        <CardContent className="flex flex-col items-center text-center py-16 px-8">
          <div className="h-16 w-16 rounded-2xl bg-slate-800 border border-slate-700 flex items-center justify-center mb-6">
            <BarChart3 className="h-8 w-8 text-slate-400" />
          </div>
          <h2 className="text-xl font-bold text-white mb-3">Reporting &amp; Analytics</h2>
          <p className="text-sm text-slate-400 leading-relaxed max-w-md mb-8">
            Track team activity, module usage, AI consumption, and market coverage across your
            organisation. Available for Team and Enterprise plans.
          </p>
          <Button asChild size="lg">
            <Link href="/org-admin?tab=billing">Upgrade to Team</Link>
          </Button>
        </CardContent>
      </Card>

      {/* Coming soon metric cards */}
      <div>
        <h2 className="text-sm font-semibold text-slate-400 uppercase tracking-wide mb-4">
          Coming Soon
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {comingSoonMetrics.map((metric) => (
            <div key={metric.title} className="relative rounded-xl border border-slate-800 bg-slate-900 p-5 overflow-hidden">
              {/* Lock overlay */}
              <div className="absolute inset-0 bg-slate-950/60 flex items-center justify-center z-10 rounded-xl">
                <div className="flex flex-col items-center gap-2">
                  <Lock className="h-5 w-5 text-slate-500" />
                  <span className="text-xs text-slate-500 font-medium">Team Plan</span>
                </div>
              </div>

              {/* Card content (greyed out beneath overlay) */}
              <div className="flex items-start justify-between mb-3 opacity-40">
                <p className="text-xs font-medium text-slate-500 uppercase tracking-wide">
                  {metric.title}
                </p>
                <div className="h-8 w-8 rounded-lg bg-slate-800 flex items-center justify-center">
                  <metric.icon className="h-4 w-4 text-slate-500" />
                </div>
              </div>
              <p className="text-2xl font-bold text-white opacity-40">{metric.value}</p>
              <p className="text-xs text-slate-500 mt-1 opacity-40">{metric.description}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
