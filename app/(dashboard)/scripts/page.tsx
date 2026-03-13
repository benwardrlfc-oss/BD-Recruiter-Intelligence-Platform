'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useSearchParams } from 'next/navigation'
import { Sparkles, Copy, CheckCircle, Loader2, Mail, Linkedin, Phone, RotateCcw, Search } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { useSettings } from '@/lib/settings-context'
import { cn } from '@/lib/utils'
import { useOpportunities, useCompanies, useSignals } from '@/lib/hooks/use-data'

interface ScriptResult {
  emailOpener: string
  linkedinOpener: string
  coldCallOpener: string
  followUpEmail: string
}

const SIGNAL_TYPE_FILTERS = ['All', 'Hiring', 'Funding', 'Regulatory', 'Partnership', 'Acquisition', 'Expansion'] as const

export default function ScriptsPage() {
  const [selectedOpp, setSelectedOpp] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [scripts, setScripts] = useState<ScriptResult | null>(null)
  const [copiedKey, setCopiedKey] = useState<string | null>(null)
  const [signalTypeFilter, setSignalTypeFilter] = useState<string>('All')
  const [searchQuery, setSearchQuery] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [rateLimited, setRateLimited] = useState(false)
  const [usageInfo, setUsageInfo] = useState<{ used: number; limit: number } | null>(null)
  const { settings } = useSettings()
  const searchParams = useSearchParams()
  const { data: allOpportunities } = useOpportunities(settings)
  const { data: allCompanies } = useCompanies()
  const { data: allSignals } = useSignals()

  useEffect(() => {
    const oppParam = searchParams.get('opp')
    if (oppParam && allOpportunities.find((o) => o.id === oppParam)) {
      setSelectedOpp(oppParam)
    }
  }, [searchParams, allOpportunities])

  // Persist last generated scripts to localStorage keyed by opportunity
  useEffect(() => {
    if (scripts && selectedOpp) {
      try {
        localStorage.setItem(`bd_scripts_${selectedOpp}`, JSON.stringify(scripts))
      } catch {}
    }
  }, [scripts, selectedOpp])

  // Restore scripts when opportunity selected
  useEffect(() => {
    if (!selectedOpp) return
    try {
      const saved = localStorage.getItem(`bd_scripts_${selectedOpp}`)
      if (saved) {
        const parsed = JSON.parse(saved)
        setScripts(parsed)
      } else {
        setScripts(null)
      }
    } catch {
      setScripts(null)
    }
  }, [selectedOpp])

  useEffect(() => {
    fetch('/api/user/ai-usage')
      .then((r) => r.json())
      .then((data) => { if (data?.bd_scripts) setUsageInfo(data.bd_scripts) })
      .catch(() => {})
  }, [scripts]) // refetch after generation

  // Filter opportunities by signal type and search
  const filteredOpportunities = allOpportunities.filter((opp) => {
    const company = allCompanies.find((c) => c.id === opp.companyId)
    const signals = allSignals.filter((s) => s.companyId === opp.companyId)

    const typeMatch =
      signalTypeFilter === 'All' ||
      signals.some((s) => s.signalType.toLowerCase().includes(signalTypeFilter.toLowerCase())) ||
      (opp.likelyHiringNeed || '').toLowerCase().includes(signalTypeFilter.toLowerCase())

    const searchMatch =
      !searchQuery ||
      (company?.name || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      signals.some((s) => s.title.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (opp.likelyHiringNeed || '').toLowerCase().includes(searchQuery.toLowerCase())

    return typeMatch && searchMatch
  })

  const handleGenerate = async () => {
    if (!selectedOpp) return
    setError(null)
    setRateLimited(false)
    setIsLoading(true)
    try {
      const response = await fetch('/api/scripts/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          opportunityId: selectedOpp,
          userSettings: {
            sector: settings.sector,
            regions: settings.regions,
            functions: settings.functions,
            seniority: settings.seniority,
          },
        }),
      })
      if (response.status === 429) {
        const data = await response.json()
        setRateLimited(true)
        setError(data.error || 'Daily script limit reached. Upgrade your plan for more.')
        return
      }
      if (!response.ok) throw new Error(`API error ${response.status}`)
      const data = await response.json()
      setScripts(data)
    } catch (err) {
      setError('Failed to generate scripts. Check your API key in Settings.')
      console.error('Error generating scripts:', err)
    } finally {
      setIsLoading(false)
    }
  }

  const handleCopy = (text: string, key: string) => {
    navigator.clipboard.writeText(text)
    setCopiedKey(key)
    setTimeout(() => setCopiedKey(null), 2000)
  }

  const selectedOpportunity = allOpportunities.find((o) => o.id === selectedOpp)
  const selectedCompany = selectedOpportunity
    ? allCompanies.find((c) => c.id === selectedOpportunity.companyId)
    : null

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-white">BD Scripts</h1>
        <p className="text-sm text-slate-400 mt-1">
          Select a hiring signal, generate signal-grounded outreach scripts across email, LinkedIn, cold call and follow-up
        </p>
      </div>

      <div className="grid grid-cols-3 gap-6">
        {/* Left: Opportunity Selector */}
        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Select Signal</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {/* Search */}
              <div className="relative">
                <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-500" />
                <input
                  type="text"
                  placeholder="Search companies or signals..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-8 pr-3 py-2 text-sm bg-slate-900 border border-slate-800 rounded-lg text-slate-300 placeholder-slate-600 focus:outline-none focus:border-indigo-500"
                />
              </div>

              {/* Signal type filter */}
              <div className="flex flex-wrap gap-1">
                {SIGNAL_TYPE_FILTERS.map((type) => (
                  <button
                    key={type}
                    onClick={() => setSignalTypeFilter(type)}
                    className={cn(
                      'px-2 py-0.5 rounded text-xs font-medium border transition-colors',
                      signalTypeFilter === type
                        ? 'bg-indigo-600 text-white border-indigo-500'
                        : 'bg-slate-900 text-slate-400 border-slate-800 hover:border-slate-600'
                    )}
                  >
                    {type}
                  </button>
                ))}
              </div>

              {/* Opportunities list */}
              <div className="space-y-1.5 max-h-72 overflow-y-auto">
                {filteredOpportunities.map((opp) => {
                  const company = allCompanies.find((c) => c.id === opp.companyId)
                  const signals = allSignals.filter((s) => s.companyId === opp.companyId)
                  const isSelected = selectedOpp === opp.id
                  return (
                    <button
                      key={opp.id}
                      onClick={() => setSelectedOpp(opp.id)}
                      className={cn(
                        'w-full text-left rounded-lg border p-2.5 transition-colors',
                        isSelected
                          ? 'border-indigo-500/50 bg-indigo-900/20'
                          : 'border-slate-800 hover:border-slate-700'
                      )}
                    >
                      <div className="flex items-center justify-between mb-1">
                        <p className="text-xs font-semibold text-white">{company?.name}</p>
                        <span className="text-xs font-bold text-emerald-400">{opp.opportunityScore}</span>
                      </div>
                      {signals[0] && (
                        <p className="text-xs text-slate-500 line-clamp-1">{signals[0].title}</p>
                      )}
                      <div className="flex gap-1 mt-1">
                        <Badge variant="secondary" className="text-xs py-0">{company?.stage}</Badge>
                        {signals[0] && (
                          <Badge variant="outline" className="text-xs py-0">{signals[0].signalType}</Badge>
                        )}
                      </div>
                    </button>
                  )
                })}
                {filteredOpportunities.length === 0 && (
                  <p className="text-xs text-slate-500 text-center py-4">No matching opportunities</p>
                )}
              </div>

              {/* Selected context */}
              {selectedOpportunity && selectedCompany && (
                <div className="rounded-lg border border-slate-700 bg-slate-800/50 p-3 space-y-2">
                  <div>
                    <p className="text-xs text-slate-500">Company</p>
                    <Link href={`/companies/${selectedCompany.id}`}>
                      <p className="text-sm font-semibold text-white hover:text-indigo-400 transition-colors">{selectedCompany.name}</p>
                    </Link>
                  </div>
                  <div>
                    <p className="text-xs text-slate-500">Target Stakeholder</p>
                    <p className="text-sm text-indigo-400">{selectedOpportunity.recommendedStakeholder}</p>
                  </div>
                  <div>
                    <p className="text-xs text-slate-500">Your Profile</p>
                    <p className="text-xs text-slate-400">{settings.sector} · {settings.regions.join(', ')} · {settings.seniority.slice(0, 2).join(', ')}</p>
                  </div>
                </div>
              )}

              <Button
                onClick={handleGenerate}
                disabled={!selectedOpp || isLoading}
                className="w-full gap-2"
              >
                {isLoading ? (
                  <><Loader2 className="h-4 w-4 animate-spin" /> Generating...</>
                ) : (
                  <><Sparkles className="h-4 w-4" /> Generate Scripts</>
                )}
              </Button>
              {usageInfo && usageInfo.limit < 999 && (
                <p className="text-xs text-center text-slate-500 mt-1">
                  {usageInfo.used}/{usageInfo.limit} scripts used today · resets midnight UTC
                </p>
              )}
            </CardContent>
          </Card>

          {/* Tips */}
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">SourceWhale Tips</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {[
                'Scripts use {{First Name}} syntax for SourceWhale merge fields',
                'Reference the specific signal that triggered the opportunity',
                'Lead with market insight, not the ask',
                'LinkedIn messages optimised for 300 chars max',
                'Cold calls: get to the reason in 10 seconds',
              ].map((tip, i) => (
                <div key={i} className="flex items-start gap-2">
                  <span className="text-indigo-400 text-xs font-bold mt-0.5">{i + 1}.</span>
                  <p className="text-xs text-slate-400">{tip}</p>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>

        {/* Scripts Output */}
        <div className="col-span-2">
          {error && (
            <div className={`mb-4 rounded-lg border px-4 py-3 ${rateLimited ? 'border-amber-600/40 bg-amber-900/10' : 'border-rose-700/40 bg-rose-900/10'}`}>
              <p className={`text-sm ${rateLimited ? 'text-amber-400' : 'text-rose-400'}`}>{error}</p>
              {rateLimited && (
                <a href="/org-admin?tab=billing" className="mt-2 inline-block text-xs font-semibold text-amber-300 underline underline-offset-2 hover:no-underline">
                  View upgrade options →
                </a>
              )}
            </div>
          )}
          {scripts ? (
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-base">Generated Scripts</CardTitle>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setScripts(null)}
                    className="gap-1 text-xs"
                  >
                    <RotateCcw className="h-3 w-3" />
                    Reset
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <Tabs defaultValue="email">
                  <TabsList className="grid grid-cols-4 w-full">
                    <TabsTrigger value="email" className="gap-1.5 text-xs">
                      <Mail className="h-3 w-3" /> Email
                    </TabsTrigger>
                    <TabsTrigger value="linkedin" className="gap-1.5 text-xs">
                      <Linkedin className="h-3 w-3" /> LinkedIn
                    </TabsTrigger>
                    <TabsTrigger value="call" className="gap-1.5 text-xs">
                      <Phone className="h-3 w-3" /> Cold Call
                    </TabsTrigger>
                    <TabsTrigger value="followup" className="gap-1.5 text-xs">
                      <Mail className="h-3 w-3" /> Follow-up
                    </TabsTrigger>
                  </TabsList>

                  {[
                    { key: 'email', value: 'email', label: 'Email Opener', content: scripts.emailOpener },
                    { key: 'linkedin', value: 'linkedin', label: 'LinkedIn Message', content: scripts.linkedinOpener },
                    { key: 'call', value: 'call', label: 'Cold Call Script', content: scripts.coldCallOpener },
                    { key: 'followup', value: 'followup', label: 'Follow-up Email', content: scripts.followUpEmail },
                  ].map((tab) => (
                    <TabsContent key={tab.key} value={tab.value} className="mt-4">
                      <div className="space-y-3">
                        <div className="flex items-center justify-between">
                          <h4 className="text-sm font-medium text-slate-300">{tab.label}</h4>
                          <Button
                            variant="outline"
                            size="sm"
                            className="gap-1.5 text-xs"
                            onClick={() => handleCopy(tab.content, tab.key)}
                          >
                            {copiedKey === tab.key ? (
                              <><CheckCircle className="h-3 w-3 text-emerald-400" /> Copied!</>
                            ) : (
                              <><Copy className="h-3 w-3" /> Copy</>
                            )}
                          </Button>
                        </div>
                        <Textarea
                          value={tab.content}
                          readOnly
                          className="min-h-[320px] text-sm font-mono text-slate-300"
                        />
                      </div>
                    </TabsContent>
                  ))}
                </Tabs>
              </CardContent>
            </Card>
          ) : (
            <Card className="h-full">
              <CardContent className="flex flex-col items-center justify-center py-24 text-center">
                <div className="h-16 w-16 rounded-full bg-indigo-600/20 flex items-center justify-center mb-4">
                  <Sparkles className="h-8 w-8 text-indigo-400" />
                </div>
                <p className="text-lg font-medium text-white">Ready to generate</p>
                <p className="text-sm text-slate-400 mt-2 max-w-sm">
                  Filter by signal type, select an opportunity, and generate AI-powered scripts personalised to your market profile
                </p>
                {selectedOpp && selectedCompany && (
                  <div className="mt-4 px-4 py-3 rounded-lg border border-slate-700 bg-slate-900/50 text-left max-w-xs">
                    <p className="text-xs text-slate-500 mb-1">Selected opportunity</p>
                    <p className="text-sm font-medium text-white">{selectedCompany.name}</p>
                    <p className="text-xs text-slate-400 mt-0.5">{selectedOpportunity?.recommendedStakeholder}</p>
                  </div>
                )}
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  )
}
