'use client'

import { use, useState } from 'react'
import Link from 'next/link'
import {
  Building2,
  Globe,
  MapPin,
  Users,
  DollarSign,
  TrendingUp,
  Clock,
  User,
  ArrowLeft,
  ExternalLink,
  Sparkles,
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { formatDate, formatCurrency, getScoreColor, getSignalTypeColor, getTimingBadgeColor, formatTimeAgo, signalTypeIcons } from '@/lib/utils'
import { useCompanies, useSignals, useOpportunities, useInvestors } from '@/lib/hooks/use-data'

export default function CompanyDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const { data: allCompanies } = useCompanies()
  const { data: allSignals } = useSignals()
  const { data: allOpportunities } = useOpportunities()
  const { data: allInvestors } = useInvestors()

  const company = allCompanies.find((c) => c.id === id)
  const signals = allSignals.filter((s) => s.companyId === id)
  const opportunity = allOpportunities.find((o) => o.companyId === id)
  const leadInvestor = company?.leadInvestorId ? allInvestors.find((i) => i.id === company.leadInvestorId) : null

  if (!company) {
    return (
      <div className="text-center py-16">
        <p className="text-slate-400">Company not found</p>
        <Link href="/companies">
          <Button variant="ghost" className="mt-4">Back to Companies</Button>
        </Link>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Back */}
      <Link href="/companies">
        <Button variant="ghost" size="sm" className="gap-2 text-slate-400">
          <ArrowLeft className="h-4 w-4" />
          Back to Companies
        </Button>
      </Link>

      {/* Company Header */}
      <div className="flex items-start justify-between">
        <div className="flex items-start gap-4">
          <div className="h-16 w-16 rounded-xl bg-slate-800 flex items-center justify-center">
            <Building2 className="h-8 w-8 text-slate-400" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-white">{company.name}</h1>
            <div className="flex items-center gap-3 mt-2">
              <Badge variant="outline">{company.sector}</Badge>
              {company.subsector && <Badge variant="secondary">{company.subsector}</Badge>}
              <Badge variant="secondary">{company.stage}</Badge>
              <span className="flex items-center gap-1 text-sm text-slate-400">
                <MapPin className="h-3.5 w-3.5" />
                {company.geography}
              </span>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {company.website && (
            <a href={company.website} target="_blank" rel="noopener noreferrer">
              <Button variant="outline" size="sm" className="gap-2">
                <Globe className="h-4 w-4" />
                Website
              </Button>
            </a>
          )}
          {opportunity ? (
            <Link href={`/scripts?opp=${opportunity.id}`}>
              <Button size="sm" className="gap-2">
                <Sparkles className="h-4 w-4" />
                Generate Script
              </Button>
            </Link>
          ) : (
            <Button size="sm" className="gap-2" disabled title="No opportunity data yet — run intelligence to generate">
              <Sparkles className="h-4 w-4" />
              Generate Script
            </Button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-3 gap-6">
        {/* Main Content */}
        <div className="col-span-2 space-y-6">
          {/* Company Summary */}
          <Card>
            <CardHeader>
              <CardTitle>Overview</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-slate-300">{company.summary}</p>
              <div className="grid grid-cols-4 gap-4 mt-4">
                <div className="rounded-lg bg-slate-800/50 p-3">
                  <p className="text-xs text-slate-500">Employees</p>
                  <p className="text-lg font-bold text-white">{company.employeeCount?.toLocaleString() || 'N/A'}</p>
                </div>
                <div className="rounded-lg bg-slate-800/50 p-3">
                  <p className="text-xs text-slate-500">Total Funding</p>
                  <p className="text-lg font-bold text-emerald-400">
                    {company.fundingTotal ? formatCurrency(company.fundingTotal) : 'N/A'}
                  </p>
                </div>
                <div className="rounded-lg bg-slate-800/50 p-3">
                  <p className="text-xs text-slate-500">Last Funding</p>
                  <p className="text-lg font-bold text-white">
                    {company.lastFundingDate ? formatDate(company.lastFundingDate) : 'N/A'}
                  </p>
                </div>
                <div className="rounded-lg bg-slate-800/50 p-3">
                  <p className="text-xs text-slate-500 mb-1">Lead Investor</p>
                  {leadInvestor ? (
                    <Link href="/investors">
                      <p className="text-sm font-semibold text-indigo-400 hover:text-indigo-300 transition-colors leading-tight">
                        {leadInvestor.name}
                      </p>
                    </Link>
                  ) : (
                    <p className="text-sm font-semibold text-white">N/A</p>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Signal Timeline */}
          <Card>
            <CardHeader>
              <CardTitle>Signal Timeline</CardTitle>
            </CardHeader>
            <CardContent>
              {signals.length === 0 ? (
                <p className="text-sm text-slate-500">No signals found for this company</p>
              ) : (
                <div className="relative">
                  <div className="absolute left-4 top-0 bottom-0 w-px bg-slate-800" />
                  <div className="space-y-6 ml-4">
                    {signals
                      .sort((a, b) => new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime())
                      .map((signal) => (
                        <div key={signal.id} className="relative pl-8">
                          <div className="absolute left-0 top-1 flex h-5 w-5 -translate-x-1/2 items-center justify-center rounded-full bg-slate-900 border-2 border-slate-700 text-xs">
                            {signalTypeIcons[signal.signalType] || '📊'}
                          </div>
                          <div className="rounded-lg border border-slate-800 bg-slate-900/50 p-4">
                            <div className="flex items-start justify-between">
                              <div>
                                <div className={`inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-medium mb-2 ${getSignalTypeColor(signal.signalType)}`}>
                                  {signal.signalType}
                                </div>
                                <h4 className="text-sm font-semibold text-white">{signal.title}</h4>
                                <p className="text-xs text-slate-400 mt-1">{signal.summary}</p>
                              </div>
                              <span className="text-xs text-slate-600 ml-4 shrink-0">
                                {formatDate(signal.publishedAt)}
                              </span>
                            </div>
                            <div className="mt-2 pt-2 border-t border-slate-800">
                              <p className="text-xs text-amber-400 font-medium">Why it matters</p>
                              <p className="text-xs text-slate-400 mt-1">{signal.whyItMatters}</p>
                            </div>
                          </div>
                        </div>
                      ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Active Hires */}
          {(company as any).activeHires && (company as any).activeHires.length > 0 && (
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center gap-2">
                    <Users className="h-4 w-4 text-emerald-400" />
                    Active Hires
                    <span className="text-xs font-normal text-slate-500 ml-1">
                      {(company as any).activeHires.length} open positions
                    </span>
                  </CardTitle>
                  {company.website && (
                    <a
                      href={company.website}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-xs text-indigo-400 hover:text-indigo-300 flex items-center gap-1"
                    >
                      <ExternalLink className="h-3 w-3" />
                      View all on website
                    </a>
                  )}
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {(company as any).activeHires.map((hire: any, idx: number) => (
                    <div
                      key={idx}
                      className="flex items-center justify-between rounded-lg border border-slate-800 px-4 py-3 hover:border-slate-700 transition-colors"
                    >
                      <div className="flex items-center gap-3">
                        <div className="h-8 w-8 rounded-lg bg-indigo-900/30 border border-indigo-700/20 flex items-center justify-center">
                          <User className="h-4 w-4 text-indigo-400" />
                        </div>
                        <div>
                          <p className="text-sm font-semibold text-white">{hire.title}</p>
                          <p className="text-xs text-slate-500">{hire.department}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="text-xs px-2 py-0.5 rounded-full bg-slate-800 text-slate-400 border border-slate-700">
                          {hire.seniority}
                        </span>
                        <span className="text-xs text-slate-600">Posted {hire.postedDate}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Action Panel Sidebar */}
        <div className="space-y-4">
          {opportunity && (
            <Card className="border-indigo-700/30 bg-indigo-900/10">
              <CardHeader>
                <CardTitle className="text-base text-indigo-300">BD Opportunity</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Score */}
                <div className="flex items-center justify-between">
                  <span className="text-sm text-slate-400">Signal Strength</span>
                  <span className={`text-xl font-bold px-3 py-1 rounded-lg ${getScoreColor(opportunity.opportunityScore)}`}>
                    {opportunity.opportunityScore}
                  </span>
                </div>

                {/* Momentum */}
                <div className="flex items-center justify-between">
                  <span className="text-sm text-slate-400">Momentum</span>
                  <div className="flex items-center gap-1">
                    <TrendingUp className="h-4 w-4 text-emerald-400" />
                    <span className="text-sm font-bold text-emerald-400">{opportunity.momentumScore}</span>
                  </div>
                </div>

                {/* Timing */}
                <div>
                  <p className="text-xs text-slate-500 mb-1">Timing Window</p>
                  <div className={`inline-flex items-center gap-1 text-xs px-3 py-1.5 rounded-full border font-medium ${getTimingBadgeColor(opportunity.timingWindow || '')}`}>
                    <Clock className="h-3 w-3" />
                    {opportunity.timingWindow}
                  </div>
                </div>

                {/* Stakeholder */}
                <div>
                  <p className="text-xs text-slate-500 mb-1">Recommended Stakeholder</p>
                  <div className="flex items-center gap-2">
                    <User className="h-4 w-4 text-indigo-400" />
                    <span className="text-sm font-medium text-white">{opportunity.recommendedStakeholder}</span>
                  </div>
                </div>

                {/* Outreach Angle */}
                <div>
                  <p className="text-xs text-slate-500 mb-2">Outreach Angle</p>
                  <div className="rounded-lg bg-slate-900/50 border border-slate-700 px-3 py-2">
                    <p className="text-xs text-slate-300">{opportunity.outreachAngle}</p>
                  </div>
                </div>

                <Link href={`/scripts?opp=${opportunity.id}`}>
                  <Button size="sm" className="w-full gap-2">
                    <Sparkles className="h-4 w-4" />
                    Generate BD Script
                  </Button>
                </Link>
              </CardContent>
            </Card>
          )}

          {/* Similar Companies */}
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Similar Companies</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {allCompanies
                  .filter((c) => c.id !== id && c.sector === company.sector)
                  .slice(0, 3)
                  .map((similar) => (
                    <Link key={similar.id} href={`/companies/${similar.id}`}>
                      <div className="flex items-center gap-2 rounded-lg border border-slate-800 px-3 py-2 hover:border-slate-700 transition-colors">
                        <Building2 className="h-4 w-4 text-slate-500" />
                        <div>
                          <p className="text-xs font-medium text-white">{similar.name}</p>
                          <p className="text-xs text-slate-500">{similar.stage}</p>
                        </div>
                      </div>
                    </Link>
                  ))}
                {allCompanies.filter((c) => c.id !== id && c.sector === company.sector).length === 0 && (
                  <p className="text-xs text-slate-500">No similar companies found</p>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
