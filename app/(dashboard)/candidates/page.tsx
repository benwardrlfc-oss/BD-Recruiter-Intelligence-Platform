'use client'

import { useState, useCallback } from 'react'
import Link from 'next/link'
import {
  Upload,
  FileText,
  Building2,
  TrendingUp,
  User,
  Copy,
  CheckCircle,
  Loader2,
  ClipboardPaste,
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { getScoreColor } from '@/lib/utils'

interface MatchResult {
  parsedProfile: {
    name?: string
    currentRole: string
    seniority: string
    expertise: string[]
    yearsExperience?: number
    therapeuticAreas: string[]
    marketRelevance: string
  }
  matches: Array<{
    companyId: string
    companyName: string
    matchScore: number
    reasonForFit: string
    stakeholderToTarget: string
    outreachDraft: string
  }>
}

export default function CandidatesPage() {
  const [cvText, setCvText] = useState('')
  const [isDragging, setIsDragging] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [result, setResult] = useState<MatchResult | null>(null)
  const [copiedId, setCopiedId] = useState<string | null>(null)

  const handleSubmit = async () => {
    if (!cvText.trim()) return
    setIsLoading(true)
    try {
      const response = await fetch('/api/candidates', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ rawText: cvText }),
      })
      const data = await response.json()
      setResult(data)
    } catch (error) {
      console.error('Error matching candidate:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleCopy = (text: string, id: string) => {
    navigator.clipboard.writeText(text)
    setCopiedId(id)
    setTimeout(() => setCopiedId(null), 2000)
  }

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
    const file = e.dataTransfer.files[0]
    if (file && file.type === 'text/plain') {
      const reader = new FileReader()
      reader.onload = (event) => {
        setCvText(event.target?.result as string)
      }
      reader.readAsText(file)
    }
  }, [])

  const sampleCV = `Dr. Sarah Mitchell
VP Clinical Operations | Oncology Specialist

EXPERIENCE:
• VP Clinical Operations at NovaBiotech (2019-2024) - Led Phase 2/3 oncology trials, managed 45-person team
• Director Clinical Development at Genentech (2014-2019) - NSCLC and breast cancer programs
• Senior Clinical Project Manager at Covance (2010-2014)

EDUCATION: PhD Pharmacology, Johns Hopkins University

EXPERTISE: Clinical Operations, Phase 2/3 Trials, CRO Management, Regulatory Strategy, Oncology, Rare Disease, FDA Submissions, Budget Management ($50M+), Cross-functional Leadership

THERAPEUTIC AREAS: Oncology (NSCLC, breast, colorectal), Rare Pediatric Disease, Hematology

ACHIEVEMENTS: Successfully delivered 3 Phase 3 programs to NDA submission. Built clinical ops team from 8 to 45 people during Series B to commercial stage transition.`

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-white">Candidate Matcher</h1>
        <p className="text-sm text-slate-400 mt-1">
          Upload a CV for AI analysis — identifies BD targets based on candidate profile. No candidate database stored.
        </p>
      </div>

      <div className="grid grid-cols-2 gap-6">
        {/* Upload Zone */}
        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Candidate Profile</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Drag & Drop Zone */}
              <div
                onDragOver={(e) => { e.preventDefault(); setIsDragging(true) }}
                onDragLeave={() => setIsDragging(false)}
                onDrop={handleDrop}
                className={`rounded-lg border-2 border-dashed p-6 text-center transition-colors ${
                  isDragging
                    ? 'border-indigo-500 bg-indigo-900/20'
                    : 'border-slate-700 hover:border-slate-600'
                }`}
              >
                <Upload className="h-8 w-8 text-slate-500 mx-auto mb-2" />
                <p className="text-sm text-slate-400">Drop a text file here</p>
                <p className="text-xs text-slate-600 mt-1">or paste CV text below</p>
              </div>

              {/* Text Area */}
              <Textarea
                value={cvText}
                onChange={(e) => setCvText(e.target.value)}
                placeholder="Paste candidate CV / resume text here..."
                className="min-h-[240px] text-sm"
              />

              <div className="flex gap-2">
                <Button
                  onClick={handleSubmit}
                  disabled={!cvText.trim() || isLoading}
                  className="flex-1 gap-2"
                >
                  {isLoading ? (
                    <><Loader2 className="h-4 w-4 animate-spin" /> Analyzing...</>
                  ) : (
                    <><TrendingUp className="h-4 w-4" /> Match to Companies</>
                  )}
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCvText(sampleCV)}
                  className="gap-2 text-xs"
                >
                  <ClipboardPaste className="h-3 w-3" />
                  Load Sample
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Results */}
        <div className="space-y-4">
          {result ? (
            <>
              {/* Parsed Profile */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Parsed Profile</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-full bg-indigo-600 flex items-center justify-center">
                      <User className="h-5 w-5 text-white" />
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-white">
                        {result.parsedProfile.name || 'Candidate'}
                      </p>
                      <p className="text-xs text-slate-400">{result.parsedProfile.currentRole}</p>
                    </div>
                    <Badge variant="secondary" className="ml-auto">
                      {result.parsedProfile.seniority}
                    </Badge>
                  </div>

                  <div className="flex flex-wrap gap-1.5">
                    {result.parsedProfile.expertise.map((exp) => (
                      <span
                        key={exp}
                        className="text-xs px-2 py-0.5 rounded-full bg-slate-800 text-slate-400 border border-slate-700"
                      >
                        {exp}
                      </span>
                    ))}
                  </div>

                  <div className="rounded-lg bg-slate-800/50 px-3 py-2">
                    <p className="text-xs text-slate-500 mb-1">Market Relevance</p>
                    <p className="text-xs text-slate-300">{result.parsedProfile.marketRelevance}</p>
                  </div>
                </CardContent>
              </Card>

              {/* Company Matches */}
              <div className="space-y-3">
                <h3 className="text-sm font-semibold text-slate-400">Top Companies Likely to Hire This Profile</h3>
                {result.matches.map((match, idx) => (
                  <Card key={idx}>
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between">
                        <div className="flex items-center gap-3">
                          <div className="h-9 w-9 rounded-lg bg-slate-800 flex items-center justify-center">
                            <Building2 className="h-4 w-4 text-slate-400" />
                          </div>
                          <div>
                            <Link href={`/companies/${match.companyId}`}>
                              <p className="text-sm font-semibold text-white hover:text-indigo-400 transition-colors">{match.companyName}</p>
                            </Link>
                            <p className="text-xs text-slate-500">Target: {match.stakeholderToTarget}</p>
                          </div>
                        </div>
                        <span className={`text-lg font-bold px-3 py-1 rounded-lg ${getScoreColor(match.matchScore)}`}>
                          {match.matchScore}
                        </span>
                      </div>

                      <div className="mt-3">
                        <p className="text-xs text-slate-500 mb-1">Why this candidate fits</p>
                        <p className="text-xs text-slate-300">{match.reasonForFit}</p>
                      </div>

                      {match.outreachDraft && (
                        <div className="mt-3">
                          <div className="flex items-center justify-between mb-1">
                            <p className="text-xs font-medium text-indigo-400">Outreach Draft</p>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-6 gap-1 text-xs"
                              onClick={() => handleCopy(match.outreachDraft, `${idx}`)}
                            >
                              {copiedId === `${idx}` ? (
                                <><CheckCircle className="h-3 w-3 text-emerald-400" /> Copied</>
                              ) : (
                                <><Copy className="h-3 w-3" /> Copy</>
                              )}
                            </Button>
                          </div>
                          <div className="rounded-lg bg-slate-900 border border-slate-700 px-3 py-2 max-h-32 overflow-y-auto">
                            <p className="text-xs text-slate-400 whitespace-pre-line">{match.outreachDraft}</p>
                          </div>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                ))}
              </div>
            </>
          ) : (
            <Card className="h-full">
              <CardContent className="flex flex-col items-center justify-center py-16 text-center">
                <FileText className="h-12 w-12 text-slate-700 mb-4" />
                <p className="text-slate-500 font-medium">No matches yet</p>
                <p className="text-sm text-slate-600 mt-2">
                  Paste or upload a candidate CV to see AI-powered company matches
                </p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  )
}
