'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import Link from 'next/link'
import {
  Upload, FileText, Building2, User, Copy, CheckCircle,
  Loader2, ClipboardPaste, Mail, Sparkles, ChevronRight,
  MapPin, Pencil, Check, X, Star, Zap, Award, BookOpen,
  SlidersHorizontal, ArrowRight,
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { getScoreColor, getGreeting, cn } from '@/lib/utils'
import type { CandidateMatchResult } from '@/lib/agents/candidate-monetisation-agent'

type EditingSection = 'snapshot' | 'history' | 'specialty' | 'usp' | 'achievements' | 'notes' | null
type EshotTone = 'commercial' | 'conversational' | 'formal' | 'consultative' | 'direct' | 'warm'
type EshotStructure = 'standard' | 'concise' | 'candidate-led' | 'signal-led' | 'bullet-heavy' | 'relationship-led'
type ClosingStyle = 'soft' | 'direct'

function buildEshotTemplate(
  profile: CandidateMatchResult['parsedProfile'],
  match: CandidateMatchResult['matches'][0],
  contactName: string,
  roleContext: string,
  recruiterNotes: string,
  tone: EshotTone = 'commercial',
  structure: EshotStructure = 'standard',
  closingStyle: ClosingStyle = 'soft'
): string {
  const greeting = getGreeting()
  const name = profile.name || 'the candidate'
  const role = profile.currentRole || 'Senior Executive'
  const specialty = profile.specialty || 'executive leadership'
  const achievements = profile.achievements?.slice(0, 3) || []
  const whyFit = match.whyTheyFit || match.reasonForFit || ''
  const contact = contactName || '[Contact Name]'
  const company = match.companyName

  // ── Greeting line ────────────────────────────────────────────────────────
  const greetingLine =
    tone === 'formal' ? `Dear ${contact},` :
    tone === 'conversational' || tone === 'warm' ? `Hi ${contact},` :
    `${greeting} ${contact},`

  // ── Opening line (structure-dependent) ──────────────────────────────────
  const context = roleContext || 'continue to build your leadership team'
  const directOpening = `I have a ${role} you should know about — directly relevant to ${company} at this stage.`

  const openingLine =
    tone === 'direct'
      ? directOpening
    : structure === 'candidate-led'
      ? `I wanted to introduce you to ${name} — a ${role} with a background I think is genuinely relevant to ${company} right now.`
    : structure === 'signal-led'
      ? `Following ${company}'s recent activity, I believe the timing is right to introduce a ${role} who I think is a strong fit for where you are headed.`
    : structure === 'relationship-led'
      ? `I've been thinking about ${company}'s current direction, and I wanted to reach out directly because I'm working with someone I believe is worth your time.`
      : `I hope this message finds you well. I'm reaching out because I'm currently representing an exceptional ${role} who I believe is a compelling fit for ${company} as you ${context}.`

  // ── Tone-adjusted intro ──────────────────────────────────────────────────
  const fitContext =
    tone === 'formal'
      ? `I would like to bring to your attention the following profile, which I believe aligns closely with ${company}'s current requirements.`
    : tone === 'direct'
      ? whyFit
    : tone === 'warm'
      ? `${name} has a background that I genuinely think maps well to ${company} — the kind of profile that doesn't come up often.`
      : whyFit

  // ── Closing ──────────────────────────────────────────────────────────────
  const closingLine =
    closingStyle === 'direct'
      ? `Would you be available for a 20-minute call this week or next to discuss further?`
      : `I'd welcome the opportunity to share more detail and explore whether there might be a conversation worth having. Would you be open to a brief call in the next couple of weeks?`

  const signOff = tone === 'formal' ? 'Yours sincerely' : tone === 'warm' || tone === 'conversational' ? 'Warm regards' : 'Best regards'

  // ── Structure templates ──────────────────────────────────────────────────

  if (structure === 'concise') {
    return `${greetingLine}

${openingLine}

${achievements[0] || `Strong track record at the ${profile.seniority || 'senior'} level with ${specialty}.`} ${achievements[1] || ''} ${recruiterNotes?.trim() ? `They are ${recruiterNotes.split('\n')[0].toLowerCase()}.` : ''}

${closingLine}

${signOff}`
  }

  if (structure === 'bullet-heavy') {
    const allAchievements = achievements.length >= 3 ? achievements : [
      ...achievements,
      `Deep expertise in ${specialty}`,
      `Strong alignment with ${company}'s current stage and priorities`,
    ]
    return `${greetingLine}

${openingLine}

Key highlights:

${allAchievements.slice(0, 4).map((a) => `• ${a}`).join('\n')}
${profile.usp ? `\nUSP: ${profile.usp.split('.')[0]}.` : ''}
${recruiterNotes?.trim() ? `\nNote: ${recruiterNotes.split('\n')[0]}` : ''}

${closingLine}

${signOff}`
  }

  // Standard / candidate-led / signal-led / relationship-led
  return `${greetingLine}

${openingLine}

${fitContext}

A few highlights that stand out:

• ${achievements[0] || `Proven track record at the ${profile.seniority || 'senior'} level across high-growth environments`}
• ${achievements[1] || `Deep expertise in ${specialty} — directly relevant to ${company}'s priorities`}
• ${achievements[2] || `Strong cultural and strategic alignment with organisations at this stage`}
${recruiterNotes?.trim() ? `\nAdditional context: ${recruiterNotes.split('\n')[0]}\n` : ''}
${closingLine}

${signOff}`
}

export default function CandidatesPage() {
  // Input state
  const [cvText, setCvText] = useState('')
  const [recruiterNotes, setRecruiterNotes] = useState('')
  const [fileName, setFileName] = useState<string | null>(null)
  const [isDragging, setIsDragging] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Processing state
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [result, setResult] = useState<CandidateMatchResult | null>(null)
  const [fromCache, setFromCache] = useState(false)

  // Persist last result for 24h
  const CACHE_KEY = 'bd_candidate_last_result'
  const CACHE_TS_KEY = 'bd_candidate_last_result_ts'

  useEffect(() => {
    try {
      const ts = parseInt(localStorage.getItem(CACHE_TS_KEY) || '0', 10)
      if (Date.now() - ts < 86400000) {
        const cached = localStorage.getItem(CACHE_KEY)
        if (cached) { setResult(JSON.parse(cached)); setFromCache(true) }
      }
    } catch {}
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => {
    if (!result || fromCache) return
    try {
      localStorage.setItem(CACHE_KEY, JSON.stringify(result))
      localStorage.setItem(CACHE_TS_KEY, String(Date.now()))
    } catch {}
  }, [result, fromCache])

  // Company targeting
  const [companyCount, setCompanyCount] = useState(10)
  const [selectedCompanyIdx, setSelectedCompanyIdx] = useState<number | null>(null)

  // Profile editing
  const [editing, setEditing] = useState<EditingSection>(null)
  const [editedProfile, setEditedProfile] = useState<Partial<CandidateMatchResult['parsedProfile']>>({})

  // E-shot
  const [contactName, setContactName] = useState('')
  const [roleContext, setRoleContext] = useState('')
  const [eshotText, setEshotText] = useState('')
  const [eshotCopied, setEshotCopied] = useState(false)
  const [showEshot, setShowEshot] = useState(false)
  const [eshotTone, setEshotTone] = useState<EshotTone>('commercial')
  const [eshotStructure, setEshotStructure] = useState<EshotStructure>('standard')
  const [closingStyle, setClosingStyle] = useState<ClosingStyle>('soft')

  const profile = result ? { ...result.parsedProfile, ...editedProfile } : null
  const visibleMatches = result?.matches.slice(0, companyCount) || []
  const selectedMatch = selectedCompanyIdx !== null ? visibleMatches[selectedCompanyIdx] : null

  // ── File handling ──────────────────────────────────────────────────────────

  const handleFile = useCallback((file: File) => {
    setFileName(file.name)
    if (file.type === 'text/plain' || file.name.endsWith('.txt')) {
      const reader = new FileReader()
      reader.onload = (e) => setCvText(e.target?.result as string)
      reader.readAsText(file)
    } else {
      // PDF/DOC/DOCX — show filename, user pastes text below
      setCvText('')
    }
  }, [])

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
    const file = e.dataTransfer.files[0]
    if (file) handleFile(file)
  }, [handleFile])

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) handleFile(file)
  }

  // ── Submit ─────────────────────────────────────────────────────────────────

  const handleSubmit = async () => {
    if (!cvText.trim()) return
    setIsLoading(true)
    setError(null)
    setFromCache(false)
    try {
      const response = await fetch('/api/candidates', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ rawText: cvText, fileName, recruiterNotes }),
      })
      if (response.status === 429) {
        const data = await response.json()
        setError(data.error || 'Daily candidate match limit reached. Upgrade your plan for more.')
        return
      }
      if (!response.ok) throw new Error(`API error ${response.status}`)
      const data: CandidateMatchResult = await response.json()
      setResult(data)
      setCompanyCount(Math.min(10, data.matches?.length || 10))
      setSelectedCompanyIdx(null)
      setShowEshot(false)
      setEditedProfile({})
      setEditing(null)
    } catch (err) {
      setError('Failed to match candidate. Check your API key in Settings.')
      console.error(err)
    } finally {
      setIsLoading(false)
    }
  }

  // ── E-shot ─────────────────────────────────────────────────────────────────

  const openEshot = (idx: number) => {
    const match = visibleMatches[idx]
    if (!profile) return
    setContactName('')
    setRoleContext('')
    setEshotText(buildEshotTemplate(profile, match, '', '', recruiterNotes, eshotTone, eshotStructure, closingStyle))
    setShowEshot(true)
  }

  const regenerateEshot = () => {
    if (!profile || selectedMatch === null) return
    setEshotText(buildEshotTemplate(profile, selectedMatch, contactName, roleContext, recruiterNotes, eshotTone, eshotStructure, closingStyle))
  }

  const copyEshot = () => {
    navigator.clipboard.writeText(eshotText)
    setEshotCopied(true)
    setTimeout(() => setEshotCopied(false), 2000)
  }

  // ── Select company ─────────────────────────────────────────────────────────

  const selectCompany = (idx: number) => {
    if (selectedCompanyIdx === idx) {
      setSelectedCompanyIdx(null)
      setShowEshot(false)
    } else {
      setSelectedCompanyIdx(idx)
      setShowEshot(false)
    }
  }

  // ── Profile edit helpers ───────────────────────────────────────────────────

  const saveEdit = (section: EditingSection, value: unknown) => {
    if (!section) return
    setEditedProfile((prev) => ({ ...prev, ...(value as object) }))
    setEditing(null)
  }

  // ── Sample CV ─────────────────────────────────────────────────────────────

  const sampleCV = `Dr. Sarah Mitchell
VP Clinical Operations | Oncology Specialist
Boston, MA

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
          Upload a CV · add recruiter context · review candidate profile · generate targeted outreach
        </p>
      </div>

      {/* Step indicator */}
      <div className="flex items-center gap-2 text-xs text-slate-500">
        {['Upload CV', 'Add Context', 'Review Profile', 'Target Companies', 'Build E-shot'].map((step, i) => (
          <div key={step} className="flex items-center gap-2">
            <div className={cn(
              'flex items-center justify-center h-5 w-5 rounded-full text-xs font-bold',
              i === 0 ? 'bg-indigo-600 text-white' :
              result && i <= 4 ? 'bg-indigo-600/60 text-white' :
              'bg-slate-800 text-slate-600'
            )}>{i + 1}</div>
            <span className={result && i <= 4 ? 'text-slate-300' : ''}>{step}</span>
            {i < 4 && <ChevronRight className="h-3 w-3 text-slate-700" />}
          </div>
        ))}
      </div>

      <div className={cn('grid gap-6', result ? 'grid-cols-5' : 'grid-cols-2')}>

        {/* ── LEFT: Input Panel ─────────────────────────────────────────────── */}
        <div className={cn('space-y-4', result ? 'col-span-2' : 'col-span-1')}>

          {/* Upload area */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <FileText className="h-4 w-4 text-indigo-400" />
                CV / Resume
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div
                onDragOver={(e) => { e.preventDefault(); setIsDragging(true) }}
                onDragLeave={() => setIsDragging(false)}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
                className={cn(
                  'rounded-xl border-2 border-dashed p-6 text-center transition-all cursor-pointer',
                  isDragging
                    ? 'border-indigo-500 bg-indigo-900/20'
                    : fileName
                    ? 'border-emerald-500/40 bg-emerald-900/10'
                    : 'border-slate-700 hover:border-slate-500 hover:bg-slate-900/50'
                )}
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".pdf,.doc,.docx,.txt"
                  onChange={handleFileSelect}
                  className="hidden"
                />
                {fileName ? (
                  <div className="flex flex-col items-center gap-2">
                    <CheckCircle className="h-8 w-8 text-emerald-400" />
                    <p className="text-sm font-medium text-emerald-400">{fileName}</p>
                    <p className="text-xs text-slate-500">Click to replace</p>
                  </div>
                ) : (
                  <div className="flex flex-col items-center gap-2">
                    <Upload className="h-8 w-8 text-slate-500" />
                    <p className="text-sm text-slate-400">Drag & drop or click to upload</p>
                    <p className="text-xs text-slate-600">PDF · DOC · DOCX · TXT</p>
                  </div>
                )}
              </div>

              <div className="relative">
                <textarea
                  value={cvText}
                  onChange={(e) => setCvText(e.target.value)}
                  placeholder="Paste candidate CV / resume text here..."
                  rows={result ? 8 : 14}
                  className="w-full px-3 py-2.5 text-sm bg-slate-900 border border-slate-800 rounded-xl text-slate-300 placeholder-slate-600 focus:outline-none focus:border-indigo-500 resize-none leading-relaxed"
                />
              </div>

              <div className="flex gap-2">
                <Button
                  onClick={handleSubmit}
                  disabled={!cvText.trim() || isLoading}
                  className="flex-1 gap-2"
                >
                  {isLoading ? (
                    <><Loader2 className="h-4 w-4 animate-spin" /> Analysing...</>
                  ) : (
                    <><Sparkles className="h-4 w-4" /> Match to Companies</>
                  )}
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => { setCvText(sampleCV); setFileName(null) }}
                  className="gap-1.5 text-xs"
                >
                  <ClipboardPaste className="h-3 w-3" /> Sample
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Recruiter notes */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm text-slate-300 font-medium flex items-center gap-2">
                <BookOpen className="h-4 w-4 text-slate-400" />
                Additional Context / Interview Notes
                <span className="text-xs text-slate-600 font-normal ml-1">optional</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <textarea
                value={recruiterNotes}
                onChange={(e) => setRecruiterNotes(e.target.value)}
                placeholder="Add interview notes, recruiter observations, candidate motivations, target geographies, compensation expectations, or any context that should influence the profile and outreach."
                rows={result ? 6 : 8}
                className="w-full px-3 py-2.5 text-sm bg-slate-900 border border-slate-800 rounded-xl text-slate-300 placeholder-slate-600 focus:outline-none focus:border-indigo-500 resize-none leading-relaxed"
              />
            </CardContent>
          </Card>

          {fromCache && result && (
            <div className="flex items-center justify-between rounded-lg border border-slate-700 bg-slate-900/50 px-4 py-2 text-xs text-slate-400 mb-2">
              <span>Showing last session results</span>
              <button
                onClick={() => { setResult(null); setFromCache(false); try { localStorage.removeItem(CACHE_KEY); localStorage.removeItem(CACHE_TS_KEY) } catch {} }}
                className="text-slate-500 hover:text-white transition-colors underline"
              >
                Clear
              </button>
            </div>
          )}
          {error && (
            <div className="rounded-lg border border-rose-700/40 bg-rose-900/10 px-4 py-3">
              <p className="text-sm text-rose-400">{error}</p>
              <button
                onClick={handleSubmit}
                disabled={!cvText.trim() || isLoading}
                className="mt-2 text-xs font-medium text-rose-300 underline underline-offset-2 hover:no-underline disabled:opacity-50"
              >
                Retry
              </button>
            </div>
          )}
        </div>

        {/* ── RIGHT: Results ────────────────────────────────────────────────── */}
        {!result ? (
          <div className="col-span-1 flex flex-col">
            <Card className="flex-1">
              <CardContent className="flex flex-col items-center justify-center py-20 text-center h-full">
                <div className="h-16 w-16 rounded-2xl bg-slate-800/80 flex items-center justify-center mb-4">
                  <User className="h-8 w-8 text-slate-600" />
                </div>
                <p className="text-slate-400 font-medium text-base">No profile yet</p>
                <p className="text-sm text-slate-600 mt-2 max-w-xs">
                  Upload a CV and click Match to Companies — the system will build a candidate profile and generate a ranked target list
                </p>
              </CardContent>
            </Card>
          </div>
        ) : (
          <>
            {/* ── PROFILE PANEL ─────────────────────────────────────────────── */}
            <div className="col-span-2 space-y-4 min-h-0">

              {/* Career Snapshot */}
              <Card>
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-base flex items-center gap-2">
                      <User className="h-4 w-4 text-indigo-400" />
                      Candidate Profile
                    </CardTitle>
                    <Badge variant="secondary">{profile!.seniority}</Badge>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">

                  {/* A. Career Snapshot */}
                  <ProfileSection
                    icon={<User className="h-3.5 w-3.5" />}
                    label="Career Snapshot"
                    isEditing={editing === 'snapshot'}
                    onEdit={() => setEditing('snapshot')}
                    onCancel={() => setEditing(null)}
                    display={
                      <div className="flex items-center gap-3">
                        <div className="h-10 w-10 rounded-full bg-indigo-600 flex items-center justify-center flex-shrink-0">
                          <User className="h-5 w-5 text-white" />
                        </div>
                        <div>
                          <p className="text-sm font-semibold text-white">{profile!.name || 'Candidate'}</p>
                          <p className="text-xs text-slate-400">{profile!.currentRole}{profile!.currentCompany ? ` · ${profile!.currentCompany}` : ''}</p>
                          {profile!.location && (
                            <div className="flex items-center gap-1 mt-0.5">
                              <MapPin className="h-3 w-3 text-slate-600" />
                              <span className="text-xs text-slate-500">{profile!.location}</span>
                            </div>
                          )}
                        </div>
                      </div>
                    }
                    editContent={
                      <SnapshotEditor profile={profile!} onSave={(v) => saveEdit('snapshot', v)} onCancel={() => setEditing(null)} />
                    }
                  />

                  {/* B. Title History */}
                  <ProfileSection
                    icon={<Building2 className="h-3.5 w-3.5" />}
                    label="Career History"
                    isEditing={editing === 'history'}
                    onEdit={() => setEditing('history')}
                    onCancel={() => setEditing(null)}
                    display={
                      <div className="space-y-1.5">
                        {(profile!.titleHistory || []).map((entry, i) => (
                          <div key={i} className="flex items-center gap-2">
                            <div className="h-1.5 w-1.5 rounded-full bg-indigo-400 flex-shrink-0" />
                            <span className="text-xs text-white font-medium">{entry.title}</span>
                            <span className="text-xs text-slate-500">—</span>
                            <span className="text-xs text-slate-400">{entry.company}</span>
                          </div>
                        ))}
                      </div>
                    }
                    editContent={
                      <HistoryEditor history={profile!.titleHistory || []} onSave={(v) => saveEdit('history', { titleHistory: v })} onCancel={() => setEditing(null)} />
                    }
                  />

                  {/* C. Specialty */}
                  <ProfileSection
                    icon={<Star className="h-3.5 w-3.5" />}
                    label="Market Speciality"
                    isEditing={editing === 'specialty'}
                    onEdit={() => setEditing('specialty')}
                    onCancel={() => setEditing(null)}
                    display={
                      <p className="text-xs text-slate-300 leading-relaxed">{profile!.specialty}</p>
                    }
                    editContent={
                      <TextEditor value={profile!.specialty} onSave={(v) => saveEdit('specialty', { specialty: v })} onCancel={() => setEditing(null)} rows={2} />
                    }
                  />

                  {/* D. USP */}
                  <ProfileSection
                    icon={<Zap className="h-3.5 w-3.5" />}
                    label="Unique Selling Point"
                    isEditing={editing === 'usp'}
                    onEdit={() => setEditing('usp')}
                    onCancel={() => setEditing(null)}
                    display={
                      <p className="text-xs text-slate-300 leading-relaxed">{profile!.usp}</p>
                    }
                    editContent={
                      <TextEditor value={profile!.usp} onSave={(v) => saveEdit('usp', { usp: v })} onCancel={() => setEditing(null)} rows={3} />
                    }
                  />

                  {/* E. Achievements */}
                  <ProfileSection
                    icon={<Award className="h-3.5 w-3.5" />}
                    label="Key Achievements"
                    isEditing={editing === 'achievements'}
                    onEdit={() => setEditing('achievements')}
                    onCancel={() => setEditing(null)}
                    display={
                      <ul className="space-y-1">
                        {(profile!.achievements || []).map((a, i) => (
                          <li key={i} className="flex items-start gap-2 text-xs text-slate-300">
                            <CheckCircle className="h-3 w-3 text-emerald-400 flex-shrink-0 mt-0.5" />
                            {a}
                          </li>
                        ))}
                      </ul>
                    }
                    editContent={
                      <AchievementsEditor achievements={profile!.achievements || []} onSave={(v) => saveEdit('achievements', { achievements: v })} onCancel={() => setEditing(null)} />
                    }
                  />

                  {/* F. Recruiter Notes */}
                  {recruiterNotes.trim() && (
                    <div className="rounded-lg bg-amber-900/10 border border-amber-500/20 px-3 py-2.5">
                      <p className="text-xs font-semibold text-amber-400 mb-1.5">Recruiter Notes</p>
                      <p className="text-xs text-slate-300 leading-relaxed whitespace-pre-line">{recruiterNotes}</p>
                    </div>
                  )}

                  {/* Expertise chips */}
                  <div className="flex flex-wrap gap-1.5 pt-1">
                    {profile!.expertise.map((exp) => (
                      <span key={exp} className="text-xs px-2 py-0.5 rounded-full bg-slate-800 text-slate-400 border border-slate-700">
                        {exp}
                      </span>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Company count selector */}
              <Card className="border-indigo-500/20 bg-indigo-900/5">
                <CardContent className="p-4">
                  <div className="flex items-center gap-3">
                    <SlidersHorizontal className="h-4 w-4 text-indigo-400 flex-shrink-0" />
                    <div className="flex-1">
                      <div className="flex items-center justify-between mb-1">
                        <p className="text-xs font-medium text-white">Outreach list size</p>
                        <div className="flex items-center justify-center h-7 w-10 rounded-lg bg-indigo-600 text-white font-bold text-sm">
                          {companyCount}
                        </div>
                      </div>
                      <input
                        type="range"
                        min={1}
                        max={Math.min(30, result.matches.length)}
                        value={companyCount}
                        onChange={(e) => { setCompanyCount(Number(e.target.value)); setSelectedCompanyIdx(null); setShowEshot(false) }}
                        className="w-full accent-indigo-500"
                      />
                    </div>
                  </div>
                  <p className="text-xs text-slate-500 mt-1.5">
                    Showing top <span className="text-indigo-400 font-medium">{companyCount}</span> of {result.matches.length} ranked by fit &amp; hiring likelihood
                  </p>
                </CardContent>
              </Card>
            </div>

            {/* ── TARGET COMPANIES ──────────────────────────────────────────── */}
            <div className="col-span-1 space-y-4">
              <Card className="h-fit">
                <CardHeader className="pb-3">
                  <CardTitle className="text-base flex items-center gap-2">
                    <Building2 className="h-4 w-4 text-indigo-400" />
                    Target Companies
                  </CardTitle>
                  <p className="text-xs text-slate-500">Ranked by fit — click to open company detail</p>
                </CardHeader>
                <CardContent className="space-y-1 p-3">
                  {visibleMatches.map((match, idx) => (
                    <button
                      key={idx}
                      onClick={() => selectCompany(idx)}
                      className={cn(
                        'w-full text-left rounded-lg px-3 py-2.5 transition-all flex items-center gap-3 group',
                        selectedCompanyIdx === idx
                          ? 'bg-indigo-600/20 border border-indigo-500/40'
                          : 'hover:bg-slate-800/60 border border-transparent hover:border-slate-700'
                      )}
                    >
                      <span className="text-xs font-bold text-slate-600 w-5 text-center flex-shrink-0">{idx + 1}</span>
                      <span className={cn(
                        'text-sm font-medium flex-1 min-w-0 truncate',
                        selectedCompanyIdx === idx ? 'text-indigo-300' : 'text-slate-300 group-hover:text-white'
                      )}>
                        {match.companyName}
                      </span>
                      <span className={cn('text-xs font-bold px-1.5 py-0.5 rounded', getScoreColor(match.matchScore))}>
                        {match.matchScore}
                      </span>
                    </button>
                  ))}
                </CardContent>
              </Card>

              {/* ── COMPANY DETAIL ────────────────────────────────────────── */}
              {selectedMatch && (
                <Card className="border-indigo-500/20 bg-indigo-900/5">
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-sm font-semibold text-white flex items-center gap-2">
                        <Building2 className="h-4 w-4 text-indigo-400" />
                        {selectedMatch.companyName}
                      </CardTitle>
                      <Link href={`/companies/${selectedMatch.companyId}`}>
                        <Button variant="ghost" size="sm" className="h-7 text-xs gap-1">
                          Open <ArrowRight className="h-3 w-3" />
                        </Button>
                      </Link>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div>
                      <p className="text-xs font-semibold text-indigo-400 mb-1.5">Why they're a fit</p>
                      <p className="text-xs text-slate-300 leading-relaxed">{selectedMatch.whyTheyFit || selectedMatch.reasonForFit}</p>
                    </div>

                    <div className="flex items-center gap-2 text-xs text-slate-500">
                      <span>Target:</span>
                      <span className="text-slate-300 font-medium">{selectedMatch.stakeholderToTarget}</span>
                    </div>

                    <div className="pt-2 border-t border-slate-800/60">
                      <Button
                        onClick={() => { openEshot(selectedCompanyIdx!); setShowEshot(!showEshot) }}
                        size="sm"
                        className="w-full gap-2 text-xs"
                        variant={showEshot ? 'secondary' : 'default'}
                      >
                        <Mail className="h-3.5 w-3.5" />
                        {showEshot ? 'Hide E-shot Builder' : 'Build E-shot'}
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>
          </>
        )}
      </div>

      {/* ── E-SHOT BUILDER (full width, below) ───────────────────────────────── */}
      {showEshot && result && selectedMatch && (
        <Card className="border-indigo-500/30">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2 text-base">
                <Mail className="h-4 w-4 text-indigo-400" />
                E-shot — {selectedMatch.companyName}
              </CardTitle>
              <Button variant="ghost" size="sm" className="text-xs" onClick={() => setShowEshot(false)}>
                <X className="h-3.5 w-3.5 mr-1" /> Close
              </Button>
            </div>
            <p className="text-xs text-slate-500 mt-1">Executive search outreach · shape the tone and structure then copy</p>
          </CardHeader>
          <CardContent className="space-y-4">

            {/* Tone / Structure / Closing controls */}
            <div className="grid grid-cols-3 gap-3 p-3 rounded-xl bg-slate-800/40 border border-slate-700/60">
              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-1.5 uppercase tracking-wide">Tone</label>
                <select
                  value={eshotTone}
                  onChange={(e) => setEshotTone(e.target.value as EshotTone)}
                  className="w-full px-2.5 py-1.5 text-xs bg-slate-900 border border-slate-700 rounded-lg text-slate-300 focus:outline-none focus:border-indigo-500 cursor-pointer"
                >
                  <option value="commercial">Commercial</option>
                  <option value="conversational">Conversational</option>
                  <option value="formal">Formal</option>
                  <option value="consultative">Consultative</option>
                  <option value="direct">Direct</option>
                  <option value="warm">Warm</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-1.5 uppercase tracking-wide">Structure</label>
                <select
                  value={eshotStructure}
                  onChange={(e) => setEshotStructure(e.target.value as EshotStructure)}
                  className="w-full px-2.5 py-1.5 text-xs bg-slate-900 border border-slate-700 rounded-lg text-slate-300 focus:outline-none focus:border-indigo-500 cursor-pointer"
                >
                  <option value="standard">Standard Executive Search</option>
                  <option value="concise">Concise</option>
                  <option value="candidate-led">Candidate-led</option>
                  <option value="signal-led">Signal-led</option>
                  <option value="bullet-heavy">Bullet-heavy</option>
                  <option value="relationship-led">Relationship-led</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-1.5 uppercase tracking-wide">Closing</label>
                <select
                  value={closingStyle}
                  onChange={(e) => setClosingStyle(e.target.value as ClosingStyle)}
                  className="w-full px-2.5 py-1.5 text-xs bg-slate-900 border border-slate-700 rounded-lg text-slate-300 focus:outline-none focus:border-indigo-500 cursor-pointer"
                >
                  <option value="soft">Soft close</option>
                  <option value="direct">Direct CTA</option>
                </select>
              </div>
            </div>

            {/* Personalisation fields */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1.5">Contact Name</label>
                <input
                  type="text"
                  value={contactName}
                  onChange={(e) => setContactName(e.target.value)}
                  placeholder="e.g. Dr. James Morrison"
                  className="w-full px-3 py-2 text-sm bg-slate-900 border border-slate-700 rounded-lg text-slate-300 placeholder-slate-600 focus:outline-none focus:border-indigo-500"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1.5">Hiring Context</label>
                <input
                  type="text"
                  value={roleContext}
                  onChange={(e) => setRoleContext(e.target.value)}
                  placeholder="e.g. build out your clinical leadership team"
                  className="w-full px-3 py-2 text-sm bg-slate-900 border border-slate-700 rounded-lg text-slate-300 placeholder-slate-600 focus:outline-none focus:border-indigo-500"
                />
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" onClick={regenerateEshot} className="gap-2 text-xs">
                <Sparkles className="h-3.5 w-3.5" /> Regenerate
              </Button>
              <span className="text-xs text-slate-600">Change tone or structure above, then regenerate</span>
            </div>

            <div>
              <div className="flex items-center justify-between mb-2">
                <p className="text-xs font-medium text-slate-400">Email Template</p>
                <Button size="sm" onClick={copyEshot} className="h-7 gap-1.5 text-xs">
                  {eshotCopied ? (
                    <><CheckCircle className="h-3 w-3 text-emerald-400" /> Copied!</>
                  ) : (
                    <><Copy className="h-3 w-3" /> Copy E-shot</>
                  )}
                </Button>
              </div>
              <textarea
                value={eshotText}
                onChange={(e) => setEshotText(e.target.value)}
                rows={18}
                className="w-full px-4 py-3 text-sm bg-slate-900 border border-slate-700 rounded-xl text-slate-300 focus:outline-none focus:border-indigo-500 resize-none leading-relaxed font-mono"
              />
            </div>

            <div className="flex items-start gap-2 p-3 rounded-lg bg-slate-800/50 border border-slate-700/60">
              <Sparkles className="h-3.5 w-3.5 text-indigo-400 mt-0.5 shrink-0" />
              <p className="text-xs text-slate-400">
                This template follows executive search best practice — warm, evidence-based, and a soft close that invites conversation. Edit freely before sending.
              </p>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}

// ── Helper Components ────────────────────────────────────────────────────────

function ProfileSection({
  icon, label, display, editContent, isEditing, onEdit, onCancel,
}: {
  icon: React.ReactNode
  label: string
  display: React.ReactNode
  editContent: React.ReactNode
  isEditing: boolean
  onEdit: () => void
  onCancel: () => void
}) {
  return (
    <div className="rounded-lg border border-slate-800/60 bg-slate-900/30 px-3 py-2.5">
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-500 uppercase tracking-wide">
          <span className="text-slate-600">{icon}</span>
          {label}
        </div>
        {!isEditing ? (
          <button onClick={onEdit} className="text-slate-600 hover:text-slate-400 transition-colors">
            <Pencil className="h-3 w-3" />
          </button>
        ) : (
          <button onClick={onCancel} className="text-slate-600 hover:text-slate-400 transition-colors">
            <X className="h-3 w-3" />
          </button>
        )}
      </div>
      {isEditing ? editContent : display}
    </div>
  )
}

function TextEditor({ value, onSave, onCancel, rows = 3 }: { value: string; onSave: (v: string) => void; onCancel: () => void; rows?: number }) {
  const [text, setText] = useState(value)
  return (
    <div className="space-y-2">
      <textarea
        value={text}
        onChange={(e) => setText(e.target.value)}
        rows={rows}
        className="w-full px-2.5 py-2 text-xs bg-slate-800 border border-slate-700 rounded-lg text-slate-300 focus:outline-none focus:border-indigo-500 resize-none"
        autoFocus
      />
      <div className="flex gap-2">
        <Button size="sm" onClick={() => onSave(text)} className="h-6 text-xs gap-1">
          <Check className="h-3 w-3" /> Save
        </Button>
        <Button size="sm" variant="ghost" onClick={onCancel} className="h-6 text-xs">Cancel</Button>
      </div>
    </div>
  )
}

function SnapshotEditor({ profile, onSave, onCancel }: {
  profile: CandidateMatchResult['parsedProfile']
  onSave: (v: Partial<CandidateMatchResult['parsedProfile']>) => void
  onCancel: () => void
}) {
  const [name, setName] = useState(profile.name || '')
  const [role, setRole] = useState(profile.currentRole || '')
  const [company, setCompany] = useState(profile.currentCompany || '')
  const [location, setLocation] = useState(profile.location || '')
  return (
    <div className="space-y-2">
      {[
        { label: 'Name', value: name, set: setName },
        { label: 'Current Role', value: role, set: setRole },
        { label: 'Current Company', value: company, set: setCompany },
        { label: 'Location', value: location, set: setLocation },
      ].map(({ label, value, set }) => (
        <div key={label}>
          <label className="text-xs text-slate-500 mb-0.5 block">{label}</label>
          <input value={value} onChange={(e) => set(e.target.value)}
            className="w-full px-2.5 py-1.5 text-xs bg-slate-800 border border-slate-700 rounded-lg text-slate-300 focus:outline-none focus:border-indigo-500"
          />
        </div>
      ))}
      <div className="flex gap-2 pt-1">
        <Button size="sm" onClick={() => onSave({ name, currentRole: role, currentCompany: company, location })} className="h-6 text-xs gap-1">
          <Check className="h-3 w-3" /> Save
        </Button>
        <Button size="sm" variant="ghost" onClick={onCancel} className="h-6 text-xs">Cancel</Button>
      </div>
    </div>
  )
}

function HistoryEditor({ history, onSave, onCancel }: {
  history: Array<{ title: string; company: string }>
  onSave: (v: Array<{ title: string; company: string }>) => void
  onCancel: () => void
}) {
  const [text, setText] = useState(history.map((h) => `${h.title} — ${h.company}`).join('\n'))
  const parse = () => {
    return text.split('\n').filter(Boolean).map((line) => {
      const parts = line.split('—').map((s) => s.trim())
      return { title: parts[0] || '', company: parts[1] || '' }
    })
  }
  return (
    <div className="space-y-2">
      <p className="text-xs text-slate-600">One entry per line: Title — Company</p>
      <textarea value={text} onChange={(e) => setText(e.target.value)} rows={4}
        className="w-full px-2.5 py-2 text-xs bg-slate-800 border border-slate-700 rounded-lg text-slate-300 focus:outline-none focus:border-indigo-500 resize-none font-mono"
        autoFocus
      />
      <div className="flex gap-2">
        <Button size="sm" onClick={() => onSave(parse())} className="h-6 text-xs gap-1">
          <Check className="h-3 w-3" /> Save
        </Button>
        <Button size="sm" variant="ghost" onClick={onCancel} className="h-6 text-xs">Cancel</Button>
      </div>
    </div>
  )
}

function AchievementsEditor({ achievements, onSave, onCancel }: {
  achievements: string[]
  onSave: (v: string[]) => void
  onCancel: () => void
}) {
  const [text, setText] = useState(achievements.join('\n'))
  return (
    <div className="space-y-2">
      <p className="text-xs text-slate-600">One achievement per line</p>
      <textarea value={text} onChange={(e) => setText(e.target.value)} rows={5}
        className="w-full px-2.5 py-2 text-xs bg-slate-800 border border-slate-700 rounded-lg text-slate-300 focus:outline-none focus:border-indigo-500 resize-none"
        autoFocus
      />
      <div className="flex gap-2">
        <Button size="sm" onClick={() => onSave(text.split('\n').filter(Boolean))} className="h-6 text-xs gap-1">
          <Check className="h-3 w-3" /> Save
        </Button>
        <Button size="sm" variant="ghost" onClick={onCancel} className="h-6 text-xs">Cancel</Button>
      </div>
    </div>
  )
}
