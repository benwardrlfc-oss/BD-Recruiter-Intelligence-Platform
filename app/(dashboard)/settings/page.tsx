'use client'

import { useState } from 'react'
import { Save, CheckCircle, ChevronDown, ChevronRight, Globe, Sparkles } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { cn } from '@/lib/utils'
import { useTheme } from '@/lib/theme-context'

const GEO_REGIONS: Record<string, string[]> = {
  USA: [
    'Massachusetts', 'California', 'New York', 'North Carolina', 'New Jersey',
    'Texas', 'Maryland', 'Connecticut', 'Illinois', 'Washington', 'Pennsylvania',
    'Colorado', 'Michigan', 'Minnesota', 'Indiana',
  ],
  Europe: [
    'UK', 'Germany', 'France', 'Switzerland', 'Netherlands', 'Denmark',
    'Sweden', 'Belgium', 'Ireland', 'Spain', 'Italy', 'Finland', 'Norway',
  ],
  APAC: [
    'Australia', 'Japan', 'China', 'Singapore', 'South Korea', 'India',
    'New Zealand', 'Taiwan', 'Hong Kong',
  ],
  Canada: ['Ontario', 'British Columbia', 'Quebec', 'Alberta'],
  'Middle East': ['Israel', 'UAE', 'Saudi Arabia', 'Qatar'],
  'Latin America': ['Brazil', 'Argentina', 'Mexico', 'Chile', 'Colombia'],
  Africa: ['South Africa', 'Kenya', 'Nigeria', 'Egypt'],
}

const SECTORS = ['Biotech', 'MedTech', 'Diagnostics', 'CRO/CDMO', 'Pharma', 'Digital Health', 'Gene Therapy', 'Cell Therapy']
const STAGES = ['Seed', 'Series A', 'Series B', 'Series C', 'Growth', 'Pre-IPO', 'Public']
const FUNCTIONS = ['Clinical Operations', 'Regulatory Affairs', 'Medical Affairs', 'Business Development', 'Commercial', 'Research', 'Manufacturing', 'Finance', 'People/HR']

export default function SettingsPage() {
  const [profileName, setProfileName] = useState('Life Sciences US - Biotech Focus')
  const [expandedRegion, setExpandedRegion] = useState<string | null>('USA')
  const [selectedRegions, setSelectedRegions] = useState<string[]>(['USA'])
  const [selectedSubGeos, setSelectedSubGeos] = useState<string[]>(['Massachusetts', 'California'])
  const [selectedSector, setSelectedSector] = useState('Biotech')
  const [selectedStages, setSelectedStages] = useState(['Series B', 'Series C', 'Growth'])
  const [selectedFunctions, setSelectedFunctions] = useState(['Clinical Operations', 'Regulatory Affairs', 'Commercial'])
  const [saved, setSaved] = useState(false)
  const [nlpInput, setNlpInput] = useState('')
  const [nlpParsed, setNlpParsed] = useState(false)
  const { theme, setTheme } = useTheme()

  const toggleRegion = (region: string) => {
    if (selectedRegions.includes(region)) {
      setSelectedRegions(selectedRegions.filter((r) => r !== region))
      // remove sub-geos for this region
      const subs = GEO_REGIONS[region] || []
      setSelectedSubGeos(selectedSubGeos.filter((g) => !subs.includes(g)))
      if (expandedRegion === region) setExpandedRegion(null)
    } else {
      setSelectedRegions([...selectedRegions, region])
      setExpandedRegion(region)
    }
  }

  const toggleSubGeo = (geo: string) => {
    setSelectedSubGeos(
      selectedSubGeos.includes(geo)
        ? selectedSubGeos.filter((g) => g !== geo)
        : [...selectedSubGeos, geo]
    )
  }

  const toggle = <T extends string>(arr: T[], item: T, setter: (v: T[]) => void) => {
    setter(arr.includes(item) ? arr.filter((i) => i !== item) : [...arr, item])
  }

  const handleSave = async () => {
    try {
      await fetch('/api/market-profiles', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: profileName,
          geography: [...selectedRegions, ...selectedSubGeos],
          sector: selectedSector,
          companyStages: selectedStages,
          functionFocus: selectedFunctions,
          modalities: [],
          investorFocus: [],
          isDefault: true,
        }),
      })
    } catch (e) {}
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }

  const totalGeoCount = selectedRegions.length + selectedSubGeos.length

  const handleNlpParse = () => {
    const text = nlpInput.toLowerCase()

    // Parse sector
    if (text.includes('biotech')) setSelectedSector('Biotech')
    else if (text.includes('medtech') || text.includes('medical device')) setSelectedSector('MedTech')
    else if (text.includes('diagnostic')) setSelectedSector('Diagnostics')
    else if (text.includes('gene therapy')) setSelectedSector('Gene Therapy')
    else if (text.includes('cell therapy')) setSelectedSector('Cell Therapy')
    else if (text.includes('pharma')) setSelectedSector('Pharma')
    else if (text.includes('digital health')) setSelectedSector('Digital Health')

    // Parse stages
    const stages: string[] = []
    if (text.includes('seed') || text.includes('early stage') || text.includes('early-stage')) stages.push('Seed')
    if (text.includes('series a') || text.includes('early stage') || text.includes('early-stage')) stages.push('Series A')
    if (text.includes('series b') || text.includes('mid stage') || text.includes('growth')) stages.push('Series B')
    if (text.includes('series c') || text.includes('late stage') || text.includes('growth')) stages.push('Series C')
    if (text.includes('growth') || text.includes('pre-ipo') || text.includes('pre ipo')) stages.push('Growth')
    if (text.includes('pre-ipo') || text.includes('pre ipo')) stages.push('Pre-IPO')
    if (stages.length > 0) setSelectedStages([...new Set(stages)])

    // Parse geography - regions
    const regions: string[] = []
    const subGeos: string[] = []
    if (text.includes('usa') || text.includes('us ') || text.includes('united states') || text.includes('america')) {
      regions.push('USA')
      // Parse US sub-regions
      if (text.includes('northeast') || text.includes('ne usa') || text.includes('boston') || text.includes('new england')) {
        subGeos.push('Massachusetts', 'Connecticut', 'New York', 'New Jersey', 'Pennsylvania')
      }
      if (text.includes('california') || text.includes('bay area') || text.includes('san francisco') || text.includes('west coast')) {
        subGeos.push('California')
      }
      if (text.includes('north carolina') || text.includes('rtp') || text.includes('research triangle')) {
        subGeos.push('North Carolina')
      }
      if (text.includes('texas')) subGeos.push('Texas')
      if (text.includes('maryland') || text.includes('dc') || text.includes('mid-atlantic')) subGeos.push('Maryland')
    }
    if (text.includes('europe') || text.includes('eu ') || text.includes('uk') || text.includes('european')) {
      regions.push('Europe')
      if (text.includes('uk') || text.includes('london')) subGeos.push('UK')
      if (text.includes('germany')) subGeos.push('Germany')
      if (text.includes('switzerland')) subGeos.push('Switzerland')
    }
    if (text.includes('apac') || text.includes('asia')) regions.push('APAC')
    if (regions.length > 0) {
      setSelectedRegions(regions)
      if (subGeos.length > 0) setSelectedSubGeos(subGeos)
    }

    // Parse functions
    const fns: string[] = []
    if (text.includes('clinical')) fns.push('Clinical Operations')
    if (text.includes('regulatory')) fns.push('Regulatory Affairs')
    if (text.includes('commercial') || text.includes('sales')) fns.push('Commercial')
    if (text.includes('medical affairs')) fns.push('Medical Affairs')
    if (text.includes('research') || text.includes('r&d')) fns.push('Research')
    if (text.includes('manufacturing') || text.includes('cmc')) fns.push('Manufacturing')
    if (text.includes('finance') || text.includes('cfo')) fns.push('Finance')
    if (text.includes('hr') || text.includes('people') || text.includes('talent')) fns.push('People/HR')
    if (fns.length > 0) setSelectedFunctions(fns)

    // Build profile name
    const sectorHint = text.includes('biotech') ? 'Biotech' : text.includes('medtech') ? 'MedTech' : 'Life Sciences'
    const geoHint = text.includes('usa') || text.includes('us ') ? 'US' : text.includes('europe') ? 'EU' : 'Global'
    const stageHint = text.includes('early') ? 'Early Stage' : text.includes('late') ? 'Late Stage' : 'All Stage'
    setProfileName(`${sectorHint} ${stageHint} – ${geoHint} Focus`)

    setNlpParsed(true)
  }

  return (
    <div className="space-y-6 max-w-3xl">
      <div>
        <h1 className="text-2xl font-bold text-white">Settings</h1>
        <p className="text-sm text-slate-400 mt-1">Configure your market profile and preferences</p>
      </div>

      {/* Natural Language Profile Builder */}
      <Card className="border-indigo-500/30 bg-indigo-900/10">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-indigo-400" />
            Build Your Market Profile with AI
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-slate-400">
            Describe your focus in plain English and we'll configure your market profile automatically.
          </p>
          <textarea
            value={nlpInput}
            onChange={(e) => setNlpInput(e.target.value)}
            placeholder={`e.g. "I focus on early stage biotechs in oncology in the Northeast USA, Series A to C, with an interest in clinical and regulatory leadership roles"`}
            className="w-full h-24 px-3 py-2 text-sm bg-slate-900 border border-slate-700 rounded-lg text-slate-300 placeholder-slate-600 focus:outline-none focus:border-indigo-500 resize-none"
          />
          <div className="flex items-center gap-3">
            <Button onClick={handleNlpParse} className="gap-2" disabled={!nlpInput.trim()}>
              <Sparkles className="h-4 w-4" />
              Generate Profile
            </Button>
            {nlpParsed && (
              <span className="text-sm text-emerald-400 flex items-center gap-1">
                <CheckCircle className="h-4 w-4" />
                Profile generated — review and adjust below
              </span>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Market Profile */}
      <Card>
        <CardHeader>
          <CardTitle>Market Intelligence Profile</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Profile Name */}
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">Profile Name</label>
            <Input
              value={profileName}
              onChange={(e) => setProfileName(e.target.value)}
              placeholder="e.g. US Biotech Clinical Stage"
              className="max-w-md"
            />
          </div>

          {/* Geography — Hierarchical */}
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-1">
              Target Geographies
              <span className="ml-2 text-xs text-slate-500">
                ({totalGeoCount} selected)
              </span>
            </label>
            <p className="text-xs text-slate-500 mb-3">Select a region to expand and choose specific states or countries.</p>

            <div className="space-y-2">
              {Object.entries(GEO_REGIONS).map(([region, subGeos]) => {
                const isRegionSelected = selectedRegions.includes(region)
                const isExpanded = expandedRegion === region
                const selectedInRegion = subGeos.filter((g) => selectedSubGeos.includes(g))

                return (
                  <div key={region} className="rounded-xl border border-slate-800/60 overflow-hidden">
                    {/* Region Header */}
                    <div className="flex items-center justify-between px-4 py-3">
                      <div className="flex items-center gap-3">
                        <button
                          onClick={() => toggleRegion(region)}
                          className={cn(
                            'h-5 w-5 rounded border-2 flex items-center justify-center transition-colors flex-shrink-0',
                            isRegionSelected
                              ? 'bg-indigo-600 border-indigo-500'
                              : 'border-slate-600 hover:border-slate-400'
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
                      <button
                        onClick={() => setExpandedRegion(isExpanded ? null : region)}
                        className="text-slate-500 hover:text-white transition-colors"
                      >
                        {isExpanded
                          ? <ChevronDown className="h-4 w-4" />
                          : <ChevronRight className="h-4 w-4" />
                        }
                      </button>
                    </div>

                    {/* Sub-geos */}
                    {isExpanded && (
                      <div className="px-4 pb-3 border-t border-slate-800/60 pt-3">
                        <p className="text-xs text-slate-500 mb-2">
                          {region === 'USA' ? 'Select states:' : 'Select countries:'}
                        </p>
                        <div className="flex flex-wrap gap-1.5">
                          {subGeos.map((geo) => (
                            <button
                              key={geo}
                              onClick={() => toggleSubGeo(geo)}
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

          {/* Primary Sector */}
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">Primary Sector</label>
            <div className="flex flex-wrap gap-2">
              {SECTORS.map((sector) => (
                <button
                  key={sector}
                  onClick={() => setSelectedSector(sector)}
                  className={cn(
                    'px-3 py-1.5 rounded-lg text-sm border transition-colors',
                    selectedSector === sector
                      ? 'bg-indigo-600 text-white border-indigo-500'
                      : 'bg-slate-900 text-slate-400 border-slate-700 hover:border-slate-600'
                  )}
                >
                  {sector}
                </button>
              ))}
            </div>
          </div>

          {/* Company Stages */}
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">
              Company Stages
              <span className="ml-2 text-xs text-slate-500">({selectedStages.length} selected)</span>
            </label>
            <div className="flex flex-wrap gap-2">
              {STAGES.map((stage) => (
                <button
                  key={stage}
                  onClick={() => toggle(selectedStages, stage, setSelectedStages)}
                  className={cn(
                    'px-3 py-1.5 rounded-lg text-sm border transition-colors',
                    selectedStages.includes(stage)
                      ? 'bg-emerald-600/80 text-white border-emerald-500'
                      : 'bg-slate-900 text-slate-400 border-slate-700 hover:border-slate-600'
                  )}
                >
                  {stage}
                </button>
              ))}
            </div>
          </div>

          {/* Function Focus */}
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">
              Function Focus
              <span className="ml-2 text-xs text-slate-500">({selectedFunctions.length} selected)</span>
            </label>
            <div className="flex flex-wrap gap-2">
              {FUNCTIONS.map((fn) => (
                <button
                  key={fn}
                  onClick={() => toggle(selectedFunctions, fn, setSelectedFunctions)}
                  className={cn(
                    'px-3 py-1.5 rounded-lg text-sm border transition-colors',
                    selectedFunctions.includes(fn)
                      ? 'bg-purple-600/80 text-white border-purple-500'
                      : 'bg-slate-900 text-slate-400 border-slate-700 hover:border-slate-600'
                  )}
                >
                  {fn}
                </button>
              ))}
            </div>
          </div>

          <Button onClick={handleSave} className="gap-2">
            {saved ? (
              <><CheckCircle className="h-4 w-4 text-emerald-400" /> Saved!</>
            ) : (
              <><Save className="h-4 w-4" /> Save Profile</>
            )}
          </Button>
        </CardContent>
      </Card>

      {/* Account */}
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

      {/* API Keys */}
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

      {/* Theme */}
      <Card>
        <CardHeader>
          <CardTitle>Display Mode</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-slate-400">Choose your preferred interface appearance.</p>
          <div className="flex gap-3">
            <button
              onClick={() => setTheme('dark')}
              className={cn(
                'flex-1 flex flex-col items-center gap-2 p-4 rounded-xl border-2 transition-all',
                theme === 'dark'
                  ? 'border-indigo-500 bg-indigo-900/20'
                  : 'border-slate-700 hover:border-slate-600'
              )}
            >
              <div className="h-12 w-full rounded-lg bg-slate-900 border border-slate-700 flex items-center justify-center">
                <span className="text-xs text-slate-400">Aa</span>
              </div>
              <span className="text-sm font-medium text-white">Dark Mode</span>
              {theme === 'dark' && <span className="text-xs text-indigo-400">Active</span>}
            </button>
            <button
              onClick={() => setTheme('light')}
              className={cn(
                'flex-1 flex flex-col items-center gap-2 p-4 rounded-xl border-2 transition-all',
                theme === 'light'
                  ? 'border-indigo-500 bg-indigo-900/20'
                  : 'border-slate-700 hover:border-slate-600'
              )}
            >
              <div className="h-12 w-full rounded-lg bg-slate-100 border border-slate-200 flex items-center justify-center">
                <span className="text-xs text-slate-700">Aa</span>
              </div>
              <span className="text-sm font-medium text-white">Light Mode</span>
              {theme === 'light' && <span className="text-xs text-indigo-400">Active</span>}
            </button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
