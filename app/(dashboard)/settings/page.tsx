'use client'

import { useState, useEffect, useCallback } from 'react'
import {
  Save, CheckCircle, ChevronDown, ChevronRight, Globe, Sparkles,
  Plus, Trash2, ChevronLeft, RefreshCw, AlertCircle, ArrowRight,
  Building2, Users, MapPin, Zap, BarChart2, FileText,
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { cn } from '@/lib/utils'
import { useTheme, PALETTES } from '@/lib/theme-context'
import { useSettings, type MarketProfile } from '@/lib/settings-context'
import { getMarketConfig } from '@/lib/market-config'
import {
  INDUSTRIES, SUBSECTORS, NICHES, FUNCTIONS, FUNCTIONS_BY_INDUSTRY,
  SENIORITY_LEVELS, COMPANY_TYPES, COMPANY_STAGES, SIGNAL_PREFERENCES,
  SIGNAL_FAMILIES, MARKET_TEMPLATES,
} from '@/lib/market-taxonomy'
import { parseMarketInput, type ParsedMarketProfile } from '@/lib/market-parser'

// ── Geo regions ───────────────────────────────────────────────────────────────

const GEO_REGIONS: Record<string, string[]> = {
  USA: [
    'Massachusetts', 'California', 'New York', 'North Carolina', 'New Jersey',
    'Texas', 'Maryland', 'Connecticut', 'Illinois', 'Washington', 'Pennsylvania',
    'Colorado', 'Michigan', 'Minnesota', 'Indiana', 'Ohio', 'Georgia', 'Florida',
    'Virginia', 'Arizona', 'Tennessee', 'Utah', 'Oregon', 'Wisconsin',
  ],
  Europe: [
    'UK', 'Germany', 'France', 'Switzerland', 'Netherlands', 'Denmark',
    'Sweden', 'Belgium', 'Ireland', 'Spain', 'Italy', 'Finland', 'Norway',
    'Austria', 'Portugal', 'Poland',
  ],
  APAC: ['Australia', 'Japan', 'China', 'Singapore', 'South Korea', 'India', 'New Zealand', 'Taiwan', 'Hong Kong'],
  Canada: ['Ontario', 'British Columbia', 'Quebec', 'Alberta'],
  'Middle East': ['Israel', 'UAE', 'Saudi Arabia', 'Qatar'],
  'Latin America': ['Brazil', 'Argentina', 'Mexico', 'Chile', 'Colombia'],
  Africa: ['South Africa', 'Kenya', 'Nigeria', 'Egypt'],
}

// ── Wizard step definitions ───────────────────────────────────────────────────

const WIZARD_STEPS = [
  { id: 'start',     label: 'Define',     icon: Sparkles,   description: 'AI builder or quick-start template' },
  { id: 'name',      label: 'Name',       icon: FileText,   description: 'Name this market profile' },
  { id: 'industry',  label: 'Industry',   icon: Building2,  description: 'Select your primary industry' },
  { id: 'subsector', label: 'Focus',      icon: BarChart2,  description: 'Narrow down your market' },
  { id: 'functions', label: 'Functions',  icon: Users,      description: 'Which functions do you recruit for?' },
  { id: 'seniority', label: 'Seniority',  icon: Users,      description: 'Which seniority levels?' },
  { id: 'ownership', label: 'Ownership',  icon: Building2,  description: 'Company type & ownership model' },
  { id: 'stage',     label: 'Stage',      icon: BarChart2,  description: 'Company growth stage' },
  { id: 'geography', label: 'Geography',  icon: MapPin,     description: 'Target territories' },
  { id: 'signals',   label: 'Signals',    icon: Zap,        description: 'Which signals matter most?' },
  { id: 'summary',   label: 'Summary',    icon: CheckCircle, description: 'Review & save' },
] as const

type WizardStepId = (typeof WIZARD_STEPS)[number]['id']

// ── Helper components ─────────────────────────────────────────────────────────

function ConfidencePill({ value }: { value: number }) {
  const pct = Math.round(value * 100)
  const color = pct >= 75 ? 'text-emerald-400 bg-emerald-400/10 border-emerald-500/20'
    : pct >= 45 ? 'text-amber-400 bg-amber-400/10 border-amber-500/20'
    : 'text-rose-400 bg-rose-400/10 border-rose-500/20'
  return <span className={cn('text-xs px-1.5 py-0.5 rounded-full border', color)}>{pct}% confident</span>
}

function ChipGroup({
  options, selected, onToggle, color = 'indigo', single = false,
}: {
  options: string[]
  selected: string | string[]
  onToggle: (v: string) => void
  color?: 'indigo' | 'teal' | 'emerald' | 'amber' | 'purple' | 'rose'
  single?: boolean
}) {
  const colorMap = {
    indigo: 'bg-indigo-600 text-white border-indigo-500',
    teal:   'bg-teal-600/80 text-white border-teal-500',
    emerald:'bg-emerald-600/80 text-white border-emerald-500',
    amber:  'bg-amber-600/80 text-white border-amber-500',
    purple: 'bg-purple-600/80 text-white border-purple-500',
    rose:   'bg-rose-600/80 text-white border-rose-500',
  }
  const isSelected = (v: string) => Array.isArray(selected) ? selected.includes(v) : selected === v
  return (
    <div className="flex flex-wrap gap-2">
      {options.map((opt) => (
        <button
          key={opt}
          onClick={() => onToggle(opt)}
          className={cn(
            'px-3 py-1.5 rounded-lg text-sm border transition-colors',
            isSelected(opt) ? colorMap[color] : 'bg-slate-900 text-slate-400 border-slate-700 hover:border-slate-600'
          )}
        >
          {opt}
        </button>
      ))}
    </div>
  )
}

// ── Step progress bar ─────────────────────────────────────────────────────────

function WizardProgress({ currentStep }: { currentStep: number }) {
  // Steps 1–10 visible in progress (step 0 = start, not shown in bar)
  const visible = WIZARD_STEPS.slice(1)
  return (
    <div className="flex items-center gap-1">
      {visible.map((step, idx) => {
        const stepNum = idx + 1
        const isComplete = currentStep > stepNum
        const isCurrent = currentStep === stepNum
        return (
          <div key={step.id} className="flex items-center gap-1">
            <div className={cn(
              'h-1.5 rounded-full transition-all',
              isComplete ? 'bg-indigo-500 w-6' : isCurrent ? 'bg-indigo-400 w-6' : 'bg-slate-700 w-4'
            )} />
          </div>
        )
      })}
    </div>
  )
}

// ── Live summary panel ────────────────────────────────────────────────────────

function MarketSummaryPanel({
  profileName, industry, subsector, niche, functions: fns, seniority,
  companyTypes, stages, regions, subGeos, signalFamilies, signals,
}: {
  profileName: string
  industry: string
  subsector: string
  niche: string
  functions: string[]
  seniority: string[]
  companyTypes: string[]
  stages: string[]
  regions: string[]
  subGeos: string[]
  signalFamilies: string[]
  signals: string[]
}) {
  const hasAny = industry || fns.length || seniority.length || companyTypes.length
  if (!hasAny) return null

  const rows = [
    { label: 'Profile', value: profileName || '—' },
    { label: 'Industry', value: industry || '—' },
    { label: 'Focus', value: [subsector, niche].filter(Boolean).join(' · ') || '—' },
    { label: 'Functions', value: fns.length ? fns.join(', ') : '—' },
    { label: 'Seniority', value: seniority.length ? seniority.join(', ') : '—' },
    { label: 'Ownership', value: companyTypes.length ? companyTypes.join(', ') : '—' },
    { label: 'Stage', value: stages.length ? stages.join(', ') : '—' },
    { label: 'Geography', value: [...regions, ...subGeos].join(', ') || '—' },
    { label: 'Signal families', value: signalFamilies.length ? signalFamilies.map((id) => SIGNAL_FAMILIES.find((f) => f.id === id)?.label || id).join(', ') : '—' },
  ]

  return (
    <div className="rounded-xl border border-indigo-500/20 bg-indigo-900/10 p-4 space-y-2">
      <p className="text-xs font-medium text-indigo-400 uppercase tracking-wide mb-3">Market Profile Preview</p>
      {rows.map(({ label, value }) => (
        <div key={label} className="flex items-start gap-3">
          <span className="text-xs text-slate-500 w-24 shrink-0 pt-0.5">{label}</span>
          <span className={cn('text-xs', value !== '—' ? 'text-slate-300' : 'text-slate-600')}>{value}</span>
        </div>
      ))}
    </div>
  )
}

// ── Main page ─────────────────────────────────────────────────────────────────

export default function SettingsPage() {
  const { settings, updateSettings, activeProfile, addProfile, updateProfile, deleteProfile, switchProfile } = useSettings()
  const { theme, setTheme, palette, setPalette } = useTheme()

  // ── Wizard state ──────────────────────────────────────────────────────────
  const [wizardStep, setWizardStep] = useState<number>(0)

  // ── Profile fields ────────────────────────────────────────────────────────
  const [profileName, setProfileName] = useState('')
  const [industry, setIndustry] = useState('')
  const [subsector, setSubsector] = useState('')
  const [niche, setNiche] = useState('')
  const [selectedFunctions, setSelectedFunctions] = useState<string[]>([])
  const [selectedSeniority, setSelectedSeniority] = useState<string[]>([])
  const [selectedRegions, setSelectedRegions] = useState<string[]>([])
  const [selectedSubGeos, setSelectedSubGeos] = useState<string[]>([])
  const [selectedStages, setSelectedStages] = useState<string[]>([])
  const [selectedCompanyTypes, setSelectedCompanyTypes] = useState<string[]>([])
  const [selectedSignals, setSelectedSignals] = useState<string[]>([])
  const [selectedSignalFamilies, setSelectedSignalFamilies] = useState<string[]>([])
  const [expandedRegion, setExpandedRegion] = useState<string | null>('USA')
  const [saved, setSaved] = useState(false)

  // ── AI builder state ──────────────────────────────────────────────────────
  const [nlpInput, setNlpInput] = useState('')
  const [parsedResult, setParsedResult] = useState<ParsedMarketProfile | null>(null)
  const [showConfirmation, setShowConfirmation] = useState(false)
  const [isParsing, setIsParsing] = useState(false)

  // ── Load active profile ───────────────────────────────────────────────────
  const loadProfile = useCallback((p: MarketProfile) => {
    setProfileName(p.name)
    setIndustry(p.industry)
    setSubsector(p.subsector)
    setNiche(p.niche)
    setSelectedFunctions(p.functions)
    setSelectedSeniority(p.seniority)
    setSelectedRegions(p.regions)
    setSelectedSubGeos(p.subGeos)
    setSelectedStages(p.stages)
    setSelectedCompanyTypes(p.companyTypes)
    setSelectedSignals(p.signalPreferences)
    setSelectedSignalFamilies(p.signalFamilies || [])
  }, [])

  useEffect(() => {
    if (activeProfile) loadProfile(activeProfile)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeProfile?.id])

  useEffect(() => {
    if (activeProfile) loadProfile(activeProfile)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // ── Toggle helpers ────────────────────────────────────────────────────────
  const toggleMulti = (arr: string[], item: string, setter: (v: string[]) => void) =>
    setter(arr.includes(item) ? arr.filter((i) => i !== item) : [...arr, item])

  const toggleRegion = (region: string) => {
    if (selectedRegions.includes(region)) {
      setSelectedRegions(selectedRegions.filter((r) => r !== region))
      const subs = GEO_REGIONS[region] || []
      setSelectedSubGeos(selectedSubGeos.filter((g) => !subs.includes(g)))
      if (expandedRegion === region) setExpandedRegion(null)
    } else {
      setSelectedRegions([...selectedRegions, region])
      setExpandedRegion(region)
    }
  }

  // Toggle signal family — also syncs individual signals
  const toggleSignalFamily = (familyId: string) => {
    const family = SIGNAL_FAMILIES.find((f) => f.id === familyId)
    if (!family) return
    if (selectedSignalFamilies.includes(familyId)) {
      setSelectedSignalFamilies(selectedSignalFamilies.filter((id) => id !== familyId))
      setSelectedSignals(selectedSignals.filter((s) => !family.signals.includes(s)))
    } else {
      setSelectedSignalFamilies([...selectedSignalFamilies, familyId])
      const toAdd = family.signals.filter((s) => !selectedSignals.includes(s))
      setSelectedSignals([...selectedSignals, ...toAdd])
    }
  }

  // ── AI market builder ─────────────────────────────────────────────────────
  const handleParse = () => {
    if (!nlpInput.trim()) return
    setIsParsing(true)
    setTimeout(() => {
      const result = parseMarketInput(nlpInput)
      setParsedResult(result)
      setShowConfirmation(true)
      setIsParsing(false)
    }, 600)
  }

  const applyParsed = () => {
    if (!parsedResult) return
    if (parsedResult.industry) setIndustry(parsedResult.industry)
    if (parsedResult.subsector) setSubsector(parsedResult.subsector)
    if (parsedResult.niche) setNiche(parsedResult.niche)
    if (parsedResult.functions.length) setSelectedFunctions(parsedResult.functions)
    if (parsedResult.seniority.length) setSelectedSeniority(parsedResult.seniority)
    if (parsedResult.regions.length) setSelectedRegions(parsedResult.regions)
    if (parsedResult.subGeos.length) setSelectedSubGeos(parsedResult.subGeos)
    if (parsedResult.stages.length) setSelectedStages(parsedResult.stages)
    if (parsedResult.companyTypes.length) setSelectedCompanyTypes(parsedResult.companyTypes)
    if (parsedResult.signalPreferences.length) setSelectedSignals(parsedResult.signalPreferences)
    setShowConfirmation(false)
    setParsedResult(null)
    setNlpInput('')
    setWizardStep(1) // advance to name step after AI parse
  }

  // ── Apply template ────────────────────────────────────────────────────────
  const applyTemplate = (templateId: string) => {
    const t = MARKET_TEMPLATES.find((m) => m.id === templateId)
    if (!t) return
    setIndustry(t.industry)
    setSubsector(t.subsectors[0] || '')
    setNiche('')
    setSelectedFunctions(t.functions)
    setSelectedSeniority(t.seniority)
    setSelectedStages(t.stages)
    setSelectedCompanyTypes(t.companyTypes)
    setSelectedSignals(t.signalPreferences)
    setSelectedSignalFamilies(t.signalFamilies)
    setProfileName(t.label)
    // Derive + store the commercial model immediately so the platform updates
    const derived = getMarketConfig(t.industry, t.companyTypes).commercialModel
    if (activeProfile) {
      updateProfile(activeProfile.id, {
        industry: t.industry, subsector: t.subsectors[0] || '', functions: t.functions,
        seniority: t.seniority, stages: t.stages, companyTypes: t.companyTypes,
        signalPreferences: t.signalPreferences, signalFamilies: t.signalFamilies,
        commercialModel: derived, name: t.label,
      })
    }
    setWizardStep(1)
  }

  // ── Save profile ──────────────────────────────────────────────────────────
  const handleSave = async () => {
    // Derive commercialModel from current ownership/industry selections
    const derivedModel = getMarketConfig(industry, selectedCompanyTypes).commercialModel
    const profileData = {
      name: profileName,
      industry,
      subsector,
      niche,
      functions: selectedFunctions,
      seniority: selectedSeniority,
      regions: selectedRegions,
      subGeos: selectedSubGeos,
      stages: selectedStages,
      companyTypes: selectedCompanyTypes,
      signalPreferences: selectedSignals,
      signalFamilies: selectedSignalFamilies,
      commercialModel: derivedModel,
      rawInput: nlpInput,
      parsedConfidence: parsedResult?.confidence || {},
    }
    if (activeProfile) updateProfile(activeProfile.id, profileData)
    updateSettings({
      sector: subsector || industry,
      subsector,
      stages: selectedStages,
      regions: selectedRegions,
      subGeos: selectedSubGeos,
      functions: selectedFunctions,
      seniority: selectedSeniority,
    })
    try {
      await fetch('/api/market-profiles', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...profileData, isDefault: true }),
      })
    } catch { /* backend not wired yet */ }
    setSaved(true)
    setTimeout(() => setSaved(false), 2500)
  }

  const handleAddProfile = () => {
    const t = MARKET_TEMPLATES[0]
    addProfile({
      name: 'New Market Profile',
      industry: t.industry,
      subsector: t.subsectors[0],
      niche: '',
      functions: t.functions,
      seniority: t.seniority,
      regions: ['USA'],
      subGeos: [],
      stages: t.stages,
      companyTypes: t.companyTypes,
      signalPreferences: t.signalPreferences,
      signalFamilies: t.signalFamilies,
      commercialModel: getMarketConfig(t.industry, t.companyTypes).commercialModel,
      rawInput: '',
      parsedConfidence: {},
    })
  }

  const subsectorOptions = SUBSECTORS[industry] || []
  const nicheOptions = NICHES[subsector] || []
  const functionOptions = FUNCTIONS_BY_INDUSTRY[industry] || FUNCTIONS
  const totalGeoCount = selectedRegions.length + selectedSubGeos.length

  const goNext = () => setWizardStep((s) => Math.min(s + 1, WIZARD_STEPS.length - 1))
  const goBack = () => setWizardStep((s) => Math.max(s - 1, 0))

  // ── Render wizard step content ────────────────────────────────────────────

  const renderStepContent = () => {
    const step = WIZARD_STEPS[wizardStep]

    // Step 0 — Start: AI builder or template
    if (step.id === 'start') {
      return (
        <div className="space-y-6">
          {!showConfirmation ? (
            <>
              {/* AI Builder */}
              <div className="rounded-xl border border-indigo-500/30 bg-indigo-900/10 p-5 space-y-4">
                <div className="flex items-center gap-2">
                  <Sparkles className="h-4 w-4 text-indigo-400" />
                  <p className="text-sm font-semibold text-white">AI Market Builder</p>
                </div>
                <p className="text-sm text-slate-400">Describe your market in plain language — we'll structure it for you.</p>
                <textarea
                  value={nlpInput}
                  onChange={(e) => setNlpInput(e.target.value)}
                  placeholder={`e.g. "I recruit CTOs and VP Engineering for Series A AI startups in San Francisco."\ne.g. "I work on GTM hires for cybersecurity scaleups across Europe."\ne.g. "I recruit CFOs for PE-backed industrial firms in the UK."`}
                  className="w-full h-28 px-3 py-2 text-sm bg-slate-900 border border-slate-700 rounded-lg text-slate-300 placeholder-slate-600 focus:outline-none focus:border-indigo-500 resize-none"
                />
                <Button onClick={handleParse} className="gap-2" disabled={!nlpInput.trim() || isParsing}>
                  {isParsing
                    ? <><RefreshCw className="h-4 w-4 animate-spin" /> Parsing…</>
                    : <><Sparkles className="h-4 w-4" /> Generate Profile</>
                  }
                </Button>
              </div>

              {/* Templates */}
              <div>
                <p className="text-xs font-medium text-slate-500 uppercase mb-3">Or start from a template</p>
                <div className="grid grid-cols-2 gap-2">
                  {MARKET_TEMPLATES.map((t) => (
                    <button
                      key={t.id}
                      onClick={() => applyTemplate(t.id)}
                      className="text-left p-3 rounded-xl border border-slate-700 hover:border-indigo-500/50 hover:bg-indigo-900/10 transition-all group"
                    >
                      <p className="text-sm font-medium text-white group-hover:text-indigo-300 transition-colors">{t.label}</p>
                      <p className="text-xs text-slate-500 mt-0.5">{t.description}</p>
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex items-center gap-3 pt-2">
                <Button variant="outline" onClick={goNext} className="gap-2">
                  Build manually <ArrowRight className="h-4 w-4" />
                </Button>
              </div>
            </>
          ) : (
            /* AI confirmation panel */
            <div className="rounded-xl border border-emerald-500/30 bg-emerald-900/5 p-5 space-y-4">
              <div className="flex items-center gap-2">
                <CheckCircle className="h-5 w-5 text-emerald-400" />
                <p className="text-sm font-semibold text-white">Here's how I've understood your market</p>
              </div>
              <p className="text-sm text-slate-400 italic">"{parsedResult?.rawInput}"</p>
              <div className="space-y-3">
                {[
                  { label: 'Industry', value: parsedResult?.industry, field: 'industry' },
                  { label: 'Subsector', value: parsedResult?.subsector, field: 'subsector' },
                  { label: 'Niche', value: parsedResult?.niche || '—', field: 'niche' },
                  { label: 'Functions', value: parsedResult?.functions.join(', ') || '—', field: 'functions' },
                  { label: 'Seniority', value: parsedResult?.seniority.join(', ') || '—', field: 'seniority' },
                  { label: 'Geography', value: [...(parsedResult?.regions || []), ...(parsedResult?.subGeos || [])].join(', ') || '—', field: 'geography' },
                  { label: 'Company Type', value: parsedResult?.companyTypes.join(', ') || '—', field: 'companyTypes' },
                  { label: 'Stage', value: parsedResult?.stages.join(', ') || '—', field: 'stages' },
                ].map(({ label, value, field }) => (
                  <div key={field} className="flex items-start justify-between gap-4 py-2 border-b border-slate-800/60 last:border-0">
                    <div>
                      <p className="text-xs text-slate-500 uppercase font-medium">{label}</p>
                      <p className={cn('text-sm mt-0.5', value && value !== '—' ? 'text-white' : 'text-slate-600')}>{value || '—'}</p>
                    </div>
                    {parsedResult?.confidence[field] !== undefined && parsedResult.confidence[field] > 0 && (
                      <ConfidencePill value={parsedResult.confidence[field]} />
                    )}
                  </div>
                ))}
              </div>
              {parsedResult && Object.values(parsedResult.confidence).some((c) => c === 0) && (
                <div className="flex items-start gap-2 p-3 rounded-lg bg-amber-500/5 border border-amber-500/20">
                  <AlertCircle className="h-4 w-4 text-amber-400 mt-0.5 shrink-0" />
                  <p className="text-xs text-amber-300">Some fields couldn't be detected. You can fill them in manually in the next steps.</p>
                </div>
              )}
              <div className="flex items-center gap-3 pt-2">
                <Button onClick={applyParsed} className="gap-2">
                  <CheckCircle className="h-4 w-4" /> Confirm & Continue
                </Button>
                <Button variant="outline" onClick={() => { setShowConfirmation(false); setParsedResult(null) }} className="gap-2">
                  <ChevronLeft className="h-4 w-4" /> Edit Input
                </Button>
              </div>
            </div>
          )}
        </div>
      )
    }

    // Step 1 — Name
    if (step.id === 'name') {
      return (
        <div className="space-y-4">
          <p className="text-sm text-slate-400">Give this market profile a memorable name so you can identify it quickly.</p>
          <Input
            value={profileName}
            onChange={(e) => setProfileName(e.target.value)}
            placeholder="e.g. US Biotech Clinical Stage, UK PE Finance Leaders…"
            className="max-w-md text-base"
            autoFocus
          />
          <p className="text-xs text-slate-500">Choose something that describes your specific market niche.</p>
        </div>
      )
    }

    // Step 2 — Industry
    if (step.id === 'industry') {
      return (
        <div className="space-y-4">
          <p className="text-sm text-slate-400">Select the primary industry you recruit in. This drives all downstream options.</p>
          <ChipGroup
            options={INDUSTRIES as unknown as string[]}
            selected={industry}
            onToggle={(v) => { setIndustry(v); setSubsector(''); setSelectedFunctions([]) }}
            color="indigo"
            single
          />
          {industry && (
            <p className="text-xs text-emerald-400 flex items-center gap-1.5">
              <CheckCircle className="h-3.5 w-3.5" /> {industry} selected — subsector options will load in the next step
            </p>
          )}
        </div>
      )
    }

    // Step 3 — Subsector + Niche
    if (step.id === 'subsector') {
      return (
        <div className="space-y-6">
          {subsectorOptions.length > 0 && (
            <div className="space-y-3">
              <div>
                <p className="text-sm font-medium text-slate-300 mb-1">Subsector</p>
                <p className="text-xs text-slate-500 mb-3">Narrow your market to the most relevant segment within {industry}.</p>
              </div>
              <ChipGroup
                options={subsectorOptions}
                selected={subsector}
                onToggle={(v) => setSubsector(subsector === v ? '' : v)}
                color="teal"
                single
              />
            </div>
          )}
          <div className="space-y-3">
            <div>
              <p className="text-sm font-medium text-slate-300 mb-1">
                Niche / Specialty <span className="text-xs text-slate-500 font-normal ml-1">optional</span>
              </p>
              <p className="text-xs text-slate-500 mb-3">For highly specific markets. Use a preset niche or type your own.</p>
            </div>
            {nicheOptions.length > 0 && (
              <div className="flex flex-wrap gap-1.5">
                {nicheOptions.map((n) => (
                  <button
                    key={n}
                    onClick={() => setNiche(niche === n ? '' : n)}
                    className={cn(
                      'px-2.5 py-1 rounded-lg text-xs border transition-colors',
                      niche === n
                        ? 'bg-rose-600/70 text-white border-rose-500'
                        : 'bg-slate-900 text-slate-500 border-slate-700 hover:border-slate-600'
                    )}
                  >
                    {n}
                  </button>
                ))}
              </div>
            )}
            <Input
              value={niche}
              onChange={(e) => setNiche(e.target.value)}
              placeholder="e.g. Radiopharma, AI drug discovery, PE-backed SaaS finance…"
              className="max-w-md"
            />
            <p className="text-xs text-slate-500">If you enter a custom niche not in our taxonomy, it will be stored as a custom specialty.</p>
          </div>
        </div>
      )
    }

    // Step 4 — Functions
    if (step.id === 'functions') {
      return (
        <div className="space-y-4">
          <div>
            <p className="text-sm text-slate-400 mb-1">
              Which functions do you place into?
              <span className="ml-2 text-xs text-slate-500">({selectedFunctions.length} selected)</span>
            </p>
            <p className="text-xs text-slate-500">
              Showing functions relevant to <span className="text-slate-300">{industry || 'your selected industry'}</span>.
            </p>
          </div>
          <ChipGroup
            options={functionOptions}
            selected={selectedFunctions}
            onToggle={(v) => toggleMulti(selectedFunctions, v, setSelectedFunctions)}
            color="purple"
          />
        </div>
      )
    }

    // Step 5 — Seniority
    if (step.id === 'seniority') {
      return (
        <div className="space-y-4">
          <p className="text-sm text-slate-400">
            Which seniority levels do you typically recruit for?
            <span className="ml-2 text-xs text-slate-500">({selectedSeniority.length} selected)</span>
          </p>
          <ChipGroup
            options={SENIORITY_LEVELS}
            selected={selectedSeniority}
            onToggle={(v) => toggleMulti(selectedSeniority, v, setSelectedSeniority)}
            color="amber"
          />
        </div>
      )
    }

    // Step 6 — Ownership / Company Type
    if (step.id === 'ownership') {
      return (
        <div className="space-y-4">
          <div>
            <p className="text-sm text-slate-400 mb-1">
              What types of companies do you recruit for?
              <span className="ml-2 text-xs text-slate-500">({selectedCompanyTypes.length} selected)</span>
            </p>
            <p className="text-xs text-slate-500">Select all ownership and capital models relevant to your market.</p>
          </div>
          <ChipGroup
            options={COMPANY_TYPES}
            selected={selectedCompanyTypes}
            onToggle={(v) => toggleMulti(selectedCompanyTypes, v, setSelectedCompanyTypes)}
            color="teal"
          />
        </div>
      )
    }

    // Step 7 — Stage
    if (step.id === 'stage') {
      return (
        <div className="space-y-4">
          <p className="text-sm text-slate-400">
            Which company growth stages do you target?
            <span className="ml-2 text-xs text-slate-500">({selectedStages.length} selected)</span>
          </p>
          <ChipGroup
            options={COMPANY_STAGES}
            selected={selectedStages}
            onToggle={(v) => toggleMulti(selectedStages, v, setSelectedStages)}
            color="emerald"
          />
        </div>
      )
    }

    // Step 8 — Geography
    if (step.id === 'geography') {
      return (
        <div className="space-y-4">
          <p className="text-sm text-slate-400">
            Select your target territories.
            <span className="ml-2 text-xs text-slate-500">({totalGeoCount} selected)</span>
          </p>
          <div className="space-y-2">
            {Object.entries(GEO_REGIONS).map(([region, subGeos]) => {
              const isRegionSelected = selectedRegions.includes(region)
              const isExpanded = expandedRegion === region
              const selectedInRegion = subGeos.filter((g) => selectedSubGeos.includes(g))
              return (
                <div key={region} className="rounded-xl border border-slate-800/60 overflow-hidden">
                  <div className="flex items-center justify-between px-4 py-3">
                    <div className="flex items-center gap-3">
                      <button
                        onClick={() => toggleRegion(region)}
                        className={cn(
                          'h-5 w-5 rounded border-2 flex items-center justify-center transition-colors shrink-0',
                          isRegionSelected ? 'bg-indigo-600 border-indigo-500' : 'border-slate-600 hover:border-slate-400'
                        )}
                      >
                        {isRegionSelected && (
                          <svg className="h-3 w-3 text-white" fill="none" viewBox="0 0 12 12">
                            <path d="M2 6l3 3 5-5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                          </svg>
                        )}
                      </button>
                      <div className="flex items-center gap-2">
                        <Globe className="h-3.5 w-3.5 text-slate-500" />
                        <span className="text-sm font-medium text-white">{region}</span>
                        {selectedInRegion.length > 0 && (
                          <span className="text-xs px-1.5 py-0.5 rounded-full bg-indigo-600/20 text-indigo-400 border border-indigo-500/20">
                            {selectedInRegion.length} selected
                          </span>
                        )}
                      </div>
                    </div>
                    <button onClick={() => setExpandedRegion(isExpanded ? null : region)} className="text-slate-500 hover:text-white transition-colors">
                      {isExpanded ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                    </button>
                  </div>
                  {isExpanded && (
                    <div className="px-4 pb-3 border-t border-slate-800/60 pt-3">
                      <p className="text-xs text-slate-500 mb-2">{region === 'USA' ? 'Select states:' : 'Select countries:'}</p>
                      <div className="flex flex-wrap gap-1.5">
                        {subGeos.map((geo) => (
                          <button
                            key={geo}
                            onClick={() => setSelectedSubGeos(
                              selectedSubGeos.includes(geo)
                                ? selectedSubGeos.filter((g) => g !== geo)
                                : [...selectedSubGeos, geo]
                            )}
                            className={cn(
                              'px-2.5 py-1 rounded-lg text-xs border transition-colors',
                              selectedSubGeos.includes(geo)
                                ? 'bg-indigo-600 text-white border-indigo-500'
                                : 'bg-slate-900 text-slate-400 border-slate-700 hover:border-slate-500'
                            )}
                          >
                            {geo}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        </div>
      )
    }

    // Step 9 — Signal Preferences
    if (step.id === 'signals') {
      return (
        <div className="space-y-6">
          <div>
            <p className="text-sm text-slate-400 mb-1">Which types of market signals matter most for your market?</p>
            <p className="text-xs text-slate-500">Select by signal family or pick individual signals below.</p>
          </div>

          {/* Signal families */}
          <div className="space-y-3">
            <p className="text-xs font-medium text-slate-400 uppercase">Signal Families</p>
            {SIGNAL_FAMILIES.map((family) => {
              const isSelected = selectedSignalFamilies.includes(family.id)
              return (
                <button
                  key={family.id}
                  onClick={() => toggleSignalFamily(family.id)}
                  className={cn(
                    'w-full text-left p-4 rounded-xl border transition-all',
                    isSelected
                      ? 'border-indigo-500/50 bg-indigo-900/20'
                      : 'border-slate-700 hover:border-slate-600'
                  )}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className={cn('text-sm font-medium', isSelected ? 'text-indigo-300' : 'text-white')}>{family.label}</p>
                      <p className="text-xs text-slate-500 mt-0.5">{family.description}</p>
                      <div className="flex flex-wrap gap-1 mt-2">
                        {family.signals.map((s) => (
                          <span key={s} className="text-xs px-2 py-0.5 rounded-full bg-slate-800 text-slate-400 border border-slate-700">{s}</span>
                        ))}
                      </div>
                    </div>
                    <div className={cn(
                      'h-5 w-5 rounded border-2 flex items-center justify-center shrink-0 mt-0.5 transition-colors',
                      isSelected ? 'bg-indigo-600 border-indigo-500' : 'border-slate-600'
                    )}>
                      {isSelected && (
                        <svg className="h-3 w-3 text-white" fill="none" viewBox="0 0 12 12">
                          <path d="M2 6l3 3 5-5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                      )}
                    </div>
                  </div>
                </button>
              )
            })}
          </div>

          {/* Individual signal overrides */}
          <div className="space-y-2">
            <p className="text-xs font-medium text-slate-400 uppercase">
              Individual Signals
              <span className="ml-2 normal-case font-normal text-slate-600">({selectedSignals.length} selected)</span>
            </p>
            <ChipGroup
              options={SIGNAL_PREFERENCES}
              selected={selectedSignals}
              onToggle={(v) => toggleMulti(selectedSignals, v, setSelectedSignals)}
              color="indigo"
            />
          </div>
        </div>
      )
    }

    // Step 10 — Summary
    if (step.id === 'summary') {
      const derivedModel = industry ? getMarketConfig(industry, selectedCompanyTypes).commercialModel : '—'
      const modelLabel: Record<string, string> = {
        vc: 'VC-backed (Venture Intelligence)',
        pe: 'PE-backed (Capital Intelligence)',
        revenue: 'Revenue / Private (Investor Intelligence)',
        mixed: 'Mixed (Capital Intelligence)',
      }
      const rows = [
        { label: 'Profile name', value: profileName || '—', ok: !!profileName },
        { label: 'Industry', value: industry || '—', ok: !!industry },
        { label: 'Subsector / Focus', value: [subsector, niche].filter(Boolean).join(' · ') || '—', ok: true },
        { label: 'Commercial model', value: modelLabel[derivedModel] || derivedModel, ok: !!industry },
        { label: 'Functions', value: selectedFunctions.join(', ') || '—', ok: selectedFunctions.length > 0 },
        { label: 'Seniority', value: selectedSeniority.join(', ') || '—', ok: selectedSeniority.length > 0 },
        { label: 'Ownership / Company type', value: selectedCompanyTypes.join(', ') || '—', ok: selectedCompanyTypes.length > 0 },
        { label: 'Company stage', value: selectedStages.join(', ') || '—', ok: selectedStages.length > 0 },
        { label: 'Geography', value: [...selectedRegions, ...selectedSubGeos].join(', ') || '—', ok: selectedRegions.length > 0 },
        { label: 'Signal families', value: selectedSignalFamilies.map((id) => SIGNAL_FAMILIES.find((f) => f.id === id)?.label || id).join(', ') || '—', ok: selectedSignalFamilies.length > 0 },
        { label: 'Individual signals', value: selectedSignals.join(', ') || '—', ok: selectedSignals.length > 0 },
      ]
      const issues = rows.filter((r) => !r.ok)
      return (
        <div className="space-y-5">
          <p className="text-sm text-slate-400">Review your market profile before saving. This configuration drives every module in the platform.</p>

          {issues.length > 0 && (
            <div className="flex items-start gap-2 p-3 rounded-lg bg-amber-500/5 border border-amber-500/20">
              <AlertCircle className="h-4 w-4 text-amber-400 mt-0.5 shrink-0" />
              <p className="text-xs text-amber-300">
                {issues.map((i) => i.label).join(', ')} {issues.length === 1 ? 'is' : 'are'} not yet configured. You can save and edit later.
              </p>
            </div>
          )}

          <div className="rounded-xl border border-slate-700 overflow-hidden">
            {rows.map(({ label, value, ok }, i) => (
              <div
                key={label}
                className={cn(
                  'flex items-start gap-4 px-4 py-3',
                  i !== rows.length - 1 && 'border-b border-slate-800/60'
                )}
              >
                <span className="text-xs text-slate-500 w-44 shrink-0 pt-0.5">{label}</span>
                <span className={cn('text-sm flex-1', ok && value !== '—' ? 'text-white' : 'text-slate-600')}>{value}</span>
                {ok && value !== '—' && <CheckCircle className="h-3.5 w-3.5 text-emerald-400 shrink-0 mt-0.5" />}
              </div>
            ))}
          </div>

          <Button onClick={handleSave} className="gap-2 w-full sm:w-auto">
            {saved
              ? <><CheckCircle className="h-4 w-4 text-emerald-400" /> Profile Saved!</>
              : <><Save className="h-4 w-4" /> Save Market Profile</>
            }
          </Button>

          {saved && (
            <p className="text-xs text-emerald-400 flex items-center gap-1.5">
              <CheckCircle className="h-3.5 w-3.5" />
              Market profile saved — the entire platform will now reflect this market configuration.
            </p>
          )}
        </div>
      )
    }

    return null
  }

  const currentStepDef = WIZARD_STEPS[wizardStep]
  const isFirstStep = wizardStep === 0
  const isLastStep = wizardStep === WIZARD_STEPS.length - 1

  return (
    <div className="space-y-6 max-w-3xl">
      <div>
        <h1 className="text-2xl font-bold text-white">Market Settings</h1>
        <p className="text-sm text-slate-400 mt-1">Configure the market profile that drives every module in the platform</p>
      </div>

      {/* ── Profile Switcher ── */}
      <Card>
        <CardContent className="pt-4 pb-4">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-xs text-slate-500 mr-1">Profiles:</span>
            {settings.marketProfiles.map((p) => (
              <div key={p.id} className="flex items-center gap-1">
                <button
                  onClick={() => switchProfile(p.id)}
                  className={cn(
                    'px-3 py-1.5 rounded-lg text-sm border transition-colors',
                    settings.activeProfileId === p.id
                      ? 'bg-indigo-600 text-white border-indigo-500'
                      : 'bg-slate-900 text-slate-400 border-slate-700 hover:border-slate-500'
                  )}
                >
                  {p.name}
                </button>
                {settings.marketProfiles.length > 1 && settings.activeProfileId === p.id && (
                  <button
                    onClick={() => deleteProfile(p.id)}
                    className="p-1 rounded text-slate-600 hover:text-rose-400 transition-colors"
                    title="Delete profile"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                )}
              </div>
            ))}
            <button
              onClick={handleAddProfile}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm border border-dashed border-slate-600 text-slate-500 hover:border-slate-400 hover:text-slate-300 transition-colors"
            >
              <Plus className="h-3.5 w-3.5" />
              Add Market
            </button>
          </div>
        </CardContent>
      </Card>

      {/* ── Guided Wizard ── */}
      <Card>
        <CardHeader className="pb-4">
          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="text-xs text-slate-500 uppercase font-medium mb-1">
                {wizardStep === 0 ? 'Step 1 of 10' : `Step ${wizardStep} of 10`}
              </p>
              <CardTitle className="text-base">{currentStepDef.description}</CardTitle>
            </div>
            <WizardProgress currentStep={wizardStep} />
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          {renderStepContent()}

          {/* Live summary (shown from step 2 onward) */}
          {wizardStep >= 2 && (
            <MarketSummaryPanel
              profileName={profileName}
              industry={industry}
              subsector={subsector}
              niche={niche}
              functions={selectedFunctions}
              seniority={selectedSeniority}
              companyTypes={selectedCompanyTypes}
              stages={selectedStages}
              regions={selectedRegions}
              subGeos={selectedSubGeos}
              signalFamilies={selectedSignalFamilies}
              signals={selectedSignals}
            />
          )}

          {/* Navigation */}
          {wizardStep > 0 && (
            <div className="flex items-center gap-3 pt-2 border-t border-slate-800/60">
              <Button variant="outline" onClick={goBack} className="gap-2">
                <ChevronLeft className="h-4 w-4" /> Back
              </Button>
              {!isLastStep && (
                <Button onClick={goNext} className="gap-2">
                  Continue <ArrowRight className="h-4 w-4" />
                </Button>
              )}
              {!isLastStep && (
                <button
                  onClick={() => setWizardStep(WIZARD_STEPS.length - 1)}
                  className="ml-auto text-xs text-slate-500 hover:text-slate-300 transition-colors"
                >
                  Skip to summary →
                </button>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* ── Account ── */}
      <Card>
        <CardHeader>
          <CardTitle>Account Settings</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">Name</label>
              <Input placeholder="Your name" defaultValue="Demo User" />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">Email</label>
              <Input placeholder="your@email.com" defaultValue="demo@bdintelligence.ai" />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">Company</label>
            <Input placeholder="Your recruiting firm" defaultValue="Elite Life Sciences Search" />
          </div>
          <Button variant="outline">Update Account</Button>
        </CardContent>
      </Card>

      {/* ── API Keys ── */}
      <Card>
        <CardHeader>
          <CardTitle>API Configuration</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">Anthropic API Key</label>
            <Input type="password" placeholder="sk-ant-..." />
            <p className="text-xs text-slate-500 mt-1">Required for AI-powered features. Add to .env file.</p>
          </div>
          <Button variant="outline">Save API Keys</Button>
        </CardContent>
      </Card>

      {/* ── Theme ── */}
      <Card>
        <CardHeader>
          <CardTitle>Appearance</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">

          {/* Display mode */}
          <div>
            <p className="text-sm font-medium text-slate-300 mb-3">Display mode</p>
            <div className="flex gap-3">
              {(['dark', 'light'] as const).map((t) => (
                <button
                  key={t}
                  onClick={() => setTheme(t)}
                  className={cn(
                    'flex-1 flex flex-col items-center gap-2 p-4 rounded-xl border-2 transition-all',
                    theme === t ? 'border-indigo-500 bg-indigo-900/20' : 'border-slate-700 hover:border-slate-600'
                  )}
                >
                  <div className={cn(
                    'h-12 w-full rounded-lg border flex items-center justify-center',
                    t === 'dark' ? 'bg-slate-900 border-slate-700' : 'bg-slate-100 border-slate-200'
                  )}>
                    <span className={cn('text-xs', t === 'dark' ? 'text-slate-400' : 'text-slate-700')}>Aa</span>
                  </div>
                  <span className="text-sm font-medium text-white capitalize">{t} Mode</span>
                  {theme === t && <span className="text-xs text-indigo-400">Active</span>}
                </button>
              ))}
            </div>
          </div>

          {/* Colour palette */}
          <div>
            <p className="text-sm font-medium text-slate-300 mb-1">Colour palette</p>
            <p className="text-xs text-slate-500 mb-3">Choose an accent colour for the interface.</p>
            <div className="grid grid-cols-3 sm:grid-cols-5 gap-2">
              {PALETTES.map((p) => (
                <button
                  key={p.id}
                  onClick={() => setPalette(p.id)}
                  title={p.description}
                  className={cn(
                    'flex flex-col items-center gap-1.5 p-3 rounded-xl border-2 transition-all',
                    palette === p.id
                      ? 'border-indigo-500 bg-indigo-900/20'
                      : 'border-slate-700 hover:border-slate-600 bg-slate-800/40'
                  )}
                >
                  <div
                    className="h-6 w-6 rounded-full ring-2 ring-white/10"
                    style={{ backgroundColor: p.preview }}
                  />
                  <span className="text-xs text-slate-300 font-medium">{p.label}</span>
                  {palette === p.id && (
                    <span className="text-[10px] text-indigo-400 leading-none">Active</span>
                  )}
                </button>
              ))}
            </div>
          </div>

        </CardContent>
      </Card>
    </div>
  )
}
