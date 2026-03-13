'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Brain, ChevronRight, Check, Globe, Building2, Briefcase, Sparkles, RefreshCw } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { cn } from '@/lib/utils'
import { INDUSTRIES, SUBSECTORS, COMPANY_STAGES, FUNCTIONS, SENIORITY_LEVELS, MARKET_TEMPLATES } from '@/lib/market-taxonomy'
import { parseMarketInput } from '@/lib/market-parser'
import { useSettings } from '@/lib/settings-context'

const steps = [
  { id: 1, title: 'Welcome', icon: Brain },
  { id: 2, title: 'Your Market', icon: Globe },
  { id: 3, title: 'Company Types', icon: Building2 },
  { id: 4, title: 'Functions', icon: Briefcase },
  { id: 5, title: 'Complete', icon: Check },
]

export default function OnboardingPage() {
  const router = useRouter()
  const { addProfile } = useSettings()
  const [step, setStep] = useState(1)
  const [profile, setProfile] = useState({
    name: '',
    company: '',
    industry: '',
    subsector: '',
    niche: '',
    regions: [] as string[],
    stages: [] as string[],
    functions: [] as string[],
    seniority: [] as string[],
  })
  const [nlpInput, setNlpInput] = useState('')
  const [isParsing, setIsParsing] = useState(false)
  const [nlpApplied, setNlpApplied] = useState(false)

  const toggle = <T extends string>(arr: T[], item: T): T[] =>
    arr.includes(item) ? arr.filter((i) => i !== item) : [...arr, item]

  const applyTemplate = (templateId: string) => {
    const t = MARKET_TEMPLATES.find((m) => m.id === templateId)
    if (!t) return
    setProfile((p) => ({
      ...p,
      industry: t.industry,
      subsector: t.subsectors[0] || '',
      functions: t.functions,
      seniority: t.seniority,
      stages: t.stages,
    }))
    setNlpApplied(true)
  }

  const handleNlpParse = () => {
    if (!nlpInput.trim()) return
    setIsParsing(true)
    setTimeout(() => {
      const parsed = parseMarketInput(nlpInput)
      setProfile((p) => ({
        ...p,
        industry: parsed.industry || p.industry,
        subsector: parsed.subsector || p.subsector,
        niche: parsed.niche || p.niche,
        regions: parsed.regions.length ? parsed.regions : p.regions,
        stages: parsed.stages.length ? parsed.stages : p.stages,
        functions: parsed.functions.length ? parsed.functions : p.functions,
        seniority: parsed.seniority.length ? parsed.seniority : p.seniority,
      }))
      setIsParsing(false)
      setNlpApplied(true)
    }, 700)
  }

  const handleComplete = async () => {
    const profileId = addProfile({
      name: profile.industry
        ? `${profile.subsector || profile.industry} – ${profile.regions[0] || 'Global'}`
        : 'My Market Profile',
      industry: profile.industry,
      subsector: profile.subsector,
      niche: profile.niche,
      functions: profile.functions,
      seniority: profile.seniority,
      regions: profile.regions,
      subGeos: [],
      stages: profile.stages,
      companyTypes: [],
      signalPreferences: ['Funding rounds', 'Leadership changes'],
      signalFamilies: ['capital-ownership', 'talent-hiring'],
      commercialModel: 'vc',
      rawInput: nlpInput,
      parsedConfidence: {},
    })

    try {
      await fetch('/api/market-profiles', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: profileId,
          name: profile.industry ? `${profile.industry} – ${profile.regions[0] || 'Global'}` : 'My Market',
          geography: profile.regions,
          sector: profile.industry,
          subsector: profile.subsector,
          companyStages: profile.stages,
          functionFocus: profile.functions,
          seniority: profile.seniority,
          isDefault: true,
        }),
      })
    } catch {
      // DB not yet available
    }
    router.push('/dashboard')
  }

  const subsectorOptions = SUBSECTORS[profile.industry] || []

  return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4">
      <div className="w-full max-w-xl">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-indigo-600 mb-4">
            <Brain className="h-8 w-8 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-white">BD Intelligence OS</h1>
        </div>

        {/* Progress */}
        <div className="flex items-center justify-center gap-2 mb-8">
          {steps.map((s, idx) => (
            <div key={s.id} className="flex items-center">
              <div
                className={cn(
                  'flex h-8 w-8 items-center justify-center rounded-full text-xs font-bold transition-colors',
                  step > s.id ? 'bg-emerald-500 text-white'
                    : step === s.id ? 'bg-indigo-600 text-white'
                    : 'bg-slate-800 text-slate-500'
                )}
              >
                {step > s.id ? <Check className="h-4 w-4" /> : s.id}
              </div>
              {idx < steps.length - 1 && (
                <div className={cn('h-px w-8 transition-colors', step > s.id ? 'bg-emerald-500' : 'bg-slate-800')} />
              )}
            </div>
          ))}
        </div>

        <div className="rounded-xl border border-slate-800 bg-slate-900 p-8">
          {/* Step 1 — Welcome */}
          {step === 1 && (
            <div className="space-y-4">
              <h2 className="text-xl font-bold text-white text-center">Welcome to BD Intelligence OS</h2>
              <p className="text-slate-400 text-sm text-center">
                The AI-powered market intelligence platform for recruiters. Tell us your market and we'll configure everything for you.
              </p>

              {/* AI Market Builder */}
              <div className="rounded-xl border border-indigo-500/30 bg-indigo-900/10 p-4 space-y-3">
                <div className="flex items-center gap-2">
                  <Sparkles className="h-4 w-4 text-indigo-400" />
                  <p className="text-sm font-medium text-white">Describe your market</p>
                </div>
                <textarea
                  value={nlpInput}
                  onChange={(e) => setNlpInput(e.target.value)}
                  placeholder={`e.g. "I recruit CTOs for Series A AI startups in San Francisco"\ne.g. "I place CFOs for PE-backed industrial firms in the UK"\ne.g. "I focus on clinical and regulatory hires in biotech"`}
                  className="w-full h-20 px-3 py-2 text-sm bg-slate-950 border border-slate-700 rounded-lg text-slate-300 placeholder-slate-600 focus:outline-none focus:border-indigo-500 resize-none"
                />
                <div className="flex items-center gap-2">
                  <Button
                    size="sm"
                    onClick={handleNlpParse}
                    disabled={!nlpInput.trim() || isParsing}
                    className="gap-1.5"
                  >
                    {isParsing ? (
                      <><RefreshCw className="h-3.5 w-3.5 animate-spin" /> Parsing…</>
                    ) : (
                      <><Sparkles className="h-3.5 w-3.5" /> Auto-configure</>
                    )}
                  </Button>
                  {nlpApplied && (
                    <span className="text-xs text-emerald-400 flex items-center gap-1">
                      <Check className="h-3.5 w-3.5" /> Profile configured
                    </span>
                  )}
                </div>
              </div>

              <p className="text-xs text-center text-slate-500">or pick a quick-start template</p>
              <div className="grid grid-cols-2 gap-2">
                {MARKET_TEMPLATES.slice(0, 6).map((t) => (
                  <button
                    key={t.id}
                    onClick={() => applyTemplate(t.id)}
                    className={cn(
                      'text-left p-3 rounded-xl border transition-all',
                      profile.industry === t.industry
                        ? 'border-indigo-500 bg-indigo-900/20'
                        : 'border-slate-700 hover:border-indigo-500/40'
                    )}
                  >
                    <p className="text-sm font-medium text-white">{t.label}</p>
                    <p className="text-xs text-slate-500 mt-0.5">{t.description}</p>
                  </button>
                ))}
              </div>

              <div className="space-y-3 pt-2">
                <Input
                  placeholder="Your name"
                  value={profile.name}
                  onChange={(e) => setProfile({ ...profile, name: e.target.value })}
                />
                <Input
                  placeholder="Your recruiting firm"
                  value={profile.company}
                  onChange={(e) => setProfile({ ...profile, company: e.target.value })}
                />
              </div>
            </div>
          )}

          {/* Step 2 — Market focus */}
          {step === 2 && (
            <div className="space-y-4">
              <h2 className="text-xl font-bold text-white">Your market focus</h2>
              <p className="text-slate-400 text-sm">Select your primary industry and geography</p>

              <div>
                <p className="text-sm font-medium text-slate-300 mb-2">Industry</p>
                <div className="flex flex-wrap gap-2">
                  {INDUSTRIES.map((ind) => (
                    <button
                      key={ind}
                      onClick={() => setProfile({ ...profile, industry: ind, subsector: '' })}
                      className={cn(
                        'px-3 py-1.5 rounded-lg text-sm border transition-colors',
                        profile.industry === ind
                          ? 'bg-indigo-600 text-white border-indigo-500'
                          : 'bg-slate-800 text-slate-400 border-slate-700 hover:border-indigo-500/40'
                      )}
                    >
                      {ind}
                    </button>
                  ))}
                </div>
              </div>

              {subsectorOptions.length > 0 && (
                <div>
                  <p className="text-sm font-medium text-slate-300 mb-2">Subsector <span className="text-slate-500 text-xs">optional</span></p>
                  <div className="flex flex-wrap gap-2">
                    {subsectorOptions.map((sub) => (
                      <button
                        key={sub}
                        onClick={() => setProfile({ ...profile, subsector: profile.subsector === sub ? '' : sub })}
                        className={cn(
                          'px-3 py-1.5 rounded-lg text-sm border transition-colors',
                          profile.subsector === sub
                            ? 'bg-teal-600/80 text-white border-teal-500'
                            : 'bg-slate-800 text-slate-400 border-slate-700'
                        )}
                      >
                        {sub}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              <div>
                <p className="text-sm font-medium text-slate-300 mb-2">Geography</p>
                <div className="flex flex-wrap gap-2">
                  {['USA', 'Europe', 'APAC', 'Canada', 'Middle East', 'Latin America', 'Global'].map((region) => (
                    <button
                      key={region}
                      onClick={() => setProfile({ ...profile, regions: toggle(profile.regions, region) })}
                      className={cn(
                        'px-3 py-1.5 rounded-lg text-sm border transition-colors',
                        profile.regions.includes(region)
                          ? 'bg-indigo-600 text-white border-indigo-500'
                          : 'bg-slate-800 text-slate-400 border-slate-700'
                      )}
                    >
                      {region}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Step 3 — Company stages */}
          {step === 3 && (
            <div className="space-y-4">
              <h2 className="text-xl font-bold text-white">Company stages</h2>
              <p className="text-slate-400 text-sm">Which company stages do you typically recruit for?</p>
              <div className="flex flex-wrap gap-2">
                {COMPANY_STAGES.map((stage) => (
                  <button
                    key={stage}
                    onClick={() => setProfile({ ...profile, stages: toggle(profile.stages, stage) })}
                    className={cn(
                      'px-3 py-1.5 rounded-lg text-sm border transition-colors',
                      profile.stages.includes(stage)
                        ? 'bg-emerald-600 text-white border-emerald-500'
                        : 'bg-slate-800 text-slate-400 border-slate-700'
                    )}
                  >
                    {stage}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Step 4 — Functions & seniority */}
          {step === 4 && (
            <div className="space-y-4">
              <h2 className="text-xl font-bold text-white">Functions & seniority</h2>
              <p className="text-slate-400 text-sm">What functional areas and seniority levels do you focus on?</p>
              <div>
                <p className="text-sm font-medium text-slate-300 mb-2">Functions</p>
                <div className="flex flex-wrap gap-2">
                  {FUNCTIONS.map((fn) => (
                    <button
                      key={fn}
                      onClick={() => setProfile({ ...profile, functions: toggle(profile.functions, fn) })}
                      className={cn(
                        'px-3 py-1.5 rounded-lg text-sm border transition-colors',
                        profile.functions.includes(fn)
                          ? 'bg-purple-600 text-white border-purple-500'
                          : 'bg-slate-800 text-slate-400 border-slate-700'
                      )}
                    >
                      {fn}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <p className="text-sm font-medium text-slate-300 mb-2">Seniority</p>
                <div className="flex flex-wrap gap-2">
                  {SENIORITY_LEVELS.map((level) => (
                    <button
                      key={level}
                      onClick={() => setProfile({ ...profile, seniority: toggle(profile.seniority, level) })}
                      className={cn(
                        'px-3 py-1.5 rounded-lg text-sm border transition-colors',
                        profile.seniority.includes(level)
                          ? 'bg-amber-600 text-white border-amber-500'
                          : 'bg-slate-800 text-slate-400 border-slate-700'
                      )}
                    >
                      {level}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Step 5 — Complete */}
          {step === 5 && (
            <div className="text-center space-y-4">
              <div className="inline-flex h-16 w-16 items-center justify-center rounded-full bg-emerald-500/20 border border-emerald-500/30">
                <Check className="h-8 w-8 text-emerald-400" />
              </div>
              <h2 className="text-xl font-bold text-white">You're all set!</h2>
              <p className="text-slate-400 text-sm">
                Your market profile is configured. The platform will now surface signals, opportunities, and insights tailored to your market.
              </p>
              <div className="rounded-lg border border-slate-700 bg-slate-800/50 p-4 text-left space-y-2">
                <p className="text-xs text-slate-500 font-medium uppercase">Profile Summary</p>
                <p className="text-sm text-white">Industry: {profile.industry || 'Not set'}</p>
                {profile.subsector && <p className="text-sm text-slate-300">Subsector: {profile.subsector}</p>}
                <p className="text-sm text-white">Geography: {profile.regions.join(', ') || 'Not set'}</p>
                <p className="text-sm text-white">Stages: {profile.stages.join(', ') || 'Not set'}</p>
                <p className="text-sm text-slate-300">Functions: {profile.functions.join(', ') || 'Not set'}</p>
              </div>
            </div>
          )}
        </div>

        {/* Navigation */}
        <div className="flex justify-between mt-4">
          {step > 1 ? (
            <Button variant="ghost" onClick={() => setStep(step - 1)}>Back</Button>
          ) : (
            <div />
          )}
          {step < 5 ? (
            <Button onClick={() => setStep(step + 1)} className="gap-2">
              Next <ChevronRight className="h-4 w-4" />
            </Button>
          ) : (
            <Button onClick={handleComplete} className="gap-2">
              <Check className="h-4 w-4" /> Go to Dashboard
            </Button>
          )}
        </div>
      </div>
    </div>
  )
}
