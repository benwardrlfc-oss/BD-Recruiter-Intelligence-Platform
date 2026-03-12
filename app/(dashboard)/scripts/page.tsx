'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Sparkles, Copy, CheckCircle, Loader2, Mail, Linkedin, Phone, RotateCcw } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Textarea } from '@/components/ui/textarea'
import { mockOpportunities, mockCompanies } from '@/lib/mock-data'

interface ScriptResult {
  emailOpener: string
  linkedinOpener: string
  coldCallOpener: string
  followUpEmail: string
}

export default function ScriptsPage() {
  const [selectedOpp, setSelectedOpp] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [scripts, setScripts] = useState<ScriptResult | null>(null)
  const [copiedKey, setCopiedKey] = useState<string | null>(null)

  const handleGenerate = async () => {
    if (!selectedOpp) return
    setIsLoading(true)
    try {
      const response = await fetch('/api/scripts/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ opportunityId: selectedOpp }),
      })
      const data = await response.json()
      setScripts(data)
    } catch (error) {
      console.error('Error generating scripts:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleCopy = (text: string, key: string) => {
    navigator.clipboard.writeText(text)
    setCopiedKey(key)
    setTimeout(() => setCopiedKey(null), 2000)
  }

  const selectedOpportunity = mockOpportunities.find((o) => o.id === selectedOpp)
  const selectedCompany = selectedOpportunity
    ? mockCompanies.find((c) => c.id === selectedOpportunity.companyId)
    : null

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-white">BD Scripts</h1>
        <p className="text-sm text-slate-400 mt-1">
          AI-generated outreach scripts tailored to each opportunity
        </p>
      </div>

      <div className="grid grid-cols-3 gap-6">
        {/* Opportunity Selector */}
        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Select Opportunity</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <Select value={selectedOpp} onValueChange={setSelectedOpp}>
                <SelectTrigger>
                  <SelectValue placeholder="Choose an opportunity..." />
                </SelectTrigger>
                <SelectContent>
                  {mockOpportunities.map((opp) => {
                    const company = mockCompanies.find((c) => c.id === opp.companyId)
                    return (
                      <SelectItem key={opp.id} value={opp.id}>
                        {company?.name} ({opp.opportunityScore})
                      </SelectItem>
                    )
                  })}
                </SelectContent>
              </Select>

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
                    <p className="text-xs text-slate-500">Score</p>
                    <p className="text-sm font-bold text-emerald-400">{selectedOpportunity.opportunityScore}/100</p>
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
            </CardContent>
          </Card>

          {/* Tips */}
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Script Tips</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {[
                'Reference the specific signal that triggered the opportunity',
                'Lead with value, not the ask',
                'Keep LinkedIn messages under 300 chars',
                'Email subject lines should be specific, not generic',
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
                  Select an opportunity and click Generate Scripts to get AI-powered, personalized BD outreach
                </p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  )
}
