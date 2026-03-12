'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Brain, ChevronRight, Check, Globe, Building2, Briefcase, Users } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { cn } from '@/lib/utils'

const steps = [
  { id: 1, title: 'Welcome', icon: Brain },
  { id: 2, title: 'Your Focus', icon: Globe },
  { id: 3, title: 'Company Types', icon: Building2 },
  { id: 4, title: 'Functions', icon: Briefcase },
  { id: 5, title: 'Complete', icon: Check },
]

const geographies = ['US - East Coast', 'US - West Coast', 'US - Southeast', 'US - Midwest', 'EU - UK', 'EU - Germany', 'EU - Switzerland', 'Asia Pacific']
const sectors = ['Biotech', 'MedTech', 'Diagnostics', 'CRO/CDMO', 'Pharma', 'Digital Health']
const stages = ['Seed', 'Series A', 'Series B', 'Series C', 'Growth', 'Pre-IPO']
const functions = ['Clinical Operations', 'Regulatory Affairs', 'Medical Affairs', 'Commercial/Sales', 'Business Development', 'Research/Discovery', 'Manufacturing', 'Finance/CFO']

export default function OnboardingPage() {
  const router = useRouter()
  const [step, setStep] = useState(1)
  const [profile, setProfile] = useState({
    name: '',
    company: '',
    geos: [] as string[],
    sector: '',
    stages: [] as string[],
    functions: [] as string[],
  })

  const toggle = <T extends string>(arr: T[], item: T): T[] =>
    arr.includes(item) ? arr.filter((i) => i !== item) : [...arr, item]

  const handleComplete = async () => {
    try {
      await fetch('/api/market-profiles', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: `${profile.sector} - ${profile.geos[0] || 'Global'} Focus`,
          geography: profile.geos,
          sector: profile.sector,
          companyStages: profile.stages,
          functionFocus: profile.functions,
          modalities: [],
          investorFocus: [],
          isDefault: true,
        }),
      })
    } catch (e) {
      // DB might not be available
    }
    router.push('/dashboard')
  }

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

        {/* Progress Steps */}
        <div className="flex items-center justify-center gap-2 mb-8">
          {steps.map((s, idx) => (
            <div key={s.id} className="flex items-center">
              <div
                className={cn(
                  'flex h-8 w-8 items-center justify-center rounded-full text-xs font-bold transition-colors',
                  step > s.id
                    ? 'bg-emerald-500 text-white'
                    : step === s.id
                    ? 'bg-indigo-600 text-white'
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

        {/* Step Content */}
        <div className="rounded-xl border border-slate-800 bg-slate-900 p-8">
          {step === 1 && (
            <div className="text-center space-y-4">
              <h2 className="text-xl font-bold text-white">Welcome to BD Intelligence OS</h2>
              <p className="text-slate-400">
                The AI-powered market intelligence platform built specifically for life sciences recruiters.
                Let&apos;s set up your market profile so we can surface the right opportunities for you.
              </p>
              <div className="grid grid-cols-2 gap-3 mt-6">
                {[
                  { label: 'Market Signals', desc: 'AI-analyzed funding, hiring & leadership changes' },
                  { label: 'BD Opportunities', desc: 'Scored and ranked by timing and potential' },
                  { label: 'BD Scripts', desc: 'Personalized outreach for each opportunity' },
                  { label: 'Content Studio', desc: 'LinkedIn posts from market intelligence' },
                ].map((feat) => (
                  <div key={feat.label} className="rounded-lg border border-slate-700 p-3 text-left">
                    <p className="text-sm font-semibold text-white">{feat.label}</p>
                    <p className="text-xs text-slate-500 mt-0.5">{feat.desc}</p>
                  </div>
                ))}
              </div>
              <div className="space-y-3 pt-4">
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

          {step === 2 && (
            <div className="space-y-4">
              <h2 className="text-xl font-bold text-white">Where do you focus?</h2>
              <p className="text-slate-400 text-sm">Select your target geographies and primary sector</p>
              <div>
                <p className="text-sm font-medium text-slate-300 mb-2">Geographies</p>
                <div className="flex flex-wrap gap-2">
                  {geographies.map((geo) => (
                    <button
                      key={geo}
                      onClick={() => setProfile({ ...profile, geos: toggle(profile.geos, geo) })}
                      className={cn(
                        'px-3 py-1.5 rounded-lg text-sm border transition-colors',
                        profile.geos.includes(geo)
                          ? 'bg-indigo-600 text-white border-indigo-500'
                          : 'bg-slate-800 text-slate-400 border-slate-700'
                      )}
                    >
                      {geo}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <p className="text-sm font-medium text-slate-300 mb-2">Primary Sector</p>
                <div className="flex flex-wrap gap-2">
                  {sectors.map((sector) => (
                    <button
                      key={sector}
                      onClick={() => setProfile({ ...profile, sector })}
                      className={cn(
                        'px-3 py-1.5 rounded-lg text-sm border transition-colors',
                        profile.sector === sector
                          ? 'bg-indigo-600 text-white border-indigo-500'
                          : 'bg-slate-800 text-slate-400 border-slate-700'
                      )}
                    >
                      {sector}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {step === 3 && (
            <div className="space-y-4">
              <h2 className="text-xl font-bold text-white">What company stages?</h2>
              <p className="text-slate-400 text-sm">Which funding/growth stages do you typically work with?</p>
              <div className="flex flex-wrap gap-2">
                {stages.map((stage) => (
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

          {step === 4 && (
            <div className="space-y-4">
              <h2 className="text-xl font-bold text-white">Which functions?</h2>
              <p className="text-slate-400 text-sm">What functional areas do you place candidates into?</p>
              <div className="flex flex-wrap gap-2">
                {functions.map((fn) => (
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
          )}

          {step === 5 && (
            <div className="text-center space-y-4">
              <div className="inline-flex h-16 w-16 items-center justify-center rounded-full bg-emerald-500/20 border border-emerald-500/30">
                <Check className="h-8 w-8 text-emerald-400" />
              </div>
              <h2 className="text-xl font-bold text-white">You&apos;re all set!</h2>
              <p className="text-slate-400">
                Your BD Intelligence OS is configured. You&apos;ll now see opportunities, signals, and insights
                tailored to your market focus.
              </p>
              <div className="rounded-lg border border-slate-700 bg-slate-800/50 p-4 text-left space-y-2">
                <p className="text-xs text-slate-500 font-medium uppercase">Your Profile Summary</p>
                <p className="text-sm text-white">Sector: {profile.sector || 'Not set'}</p>
                <p className="text-sm text-white">Geographies: {profile.geos.join(', ') || 'Not set'}</p>
                <p className="text-sm text-white">Stages: {profile.stages.join(', ') || 'Not set'}</p>
              </div>
            </div>
          )}
        </div>

        {/* Navigation */}
        <div className="flex justify-between mt-4">
          {step > 1 ? (
            <Button variant="ghost" onClick={() => setStep(step - 1)}>
              Back
            </Button>
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
