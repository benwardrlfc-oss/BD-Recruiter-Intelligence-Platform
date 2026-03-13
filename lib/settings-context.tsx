'use client'

import { createContext, useContext, useEffect, useState, ReactNode, useCallback } from 'react'
import { useSession } from 'next-auth/react'

// ── Market Profile ──────────────────────────────────────────────────────────

export interface MarketProfile {
  id: string
  name: string
  // Taxonomy fields
  industry: string
  subsector: string
  niche: string
  functions: string[]
  seniority: string[]
  regions: string[]
  subGeos: string[]
  stages: string[]
  companyTypes: string[]
  signalPreferences: string[]
  // Signal configuration
  signalFamilies: string[]        // e.g. ['capital-ownership', 'talent-hiring']
  commercialModel: string         // 'vc' | 'pe' | 'revenue' | 'mixed' — explicit, not just inferred
  // AI builder metadata
  rawInput: string
  parsedConfidence: Record<string, number>
  createdAt: string
}

export interface UserSettings {
  // Flat fields kept for backward-compat with companyMatchesSettings() callers
  sector: string        // = activeProfile.industry
  subsector: string     // = activeProfile.subsector
  stages: string[]
  regions: string[]
  subGeos: string[]
  functions: string[]
  seniority: string[]
  nlpProfile: string
  // Multi-profile support
  marketProfiles: MarketProfile[]
  activeProfileId: string
}

function makeDefaultProfile(): MarketProfile {
  return {
    id: 'default',
    name: 'Life Sciences US – Biotech Focus',
    industry: 'Life Sciences',
    subsector: 'Biotech',
    niche: '',
    functions: ['R&D', 'Clinical', 'Regulatory', 'Commercial'],
    seniority: ['C-Suite', 'VP', 'Director'],
    regions: ['USA'],
    subGeos: [],
    stages: ['Seed', 'Series A', 'Series B', 'Series C', 'Growth'],
    companyTypes: ['VC-backed', 'Public company'],
    signalPreferences: ['Funding rounds', 'Leadership changes'],
    signalFamilies: ['capital-ownership', 'talent-hiring', 'regulatory-milestone'],
    commercialModel: 'vc',
    rawInput: '',
    parsedConfidence: {},
    createdAt: new Date().toISOString(),
  }
}

const defaultSettings: UserSettings = {
  sector: 'Biotech',
  subsector: '',
  stages: ['Seed', 'Series A', 'Series B', 'Series C', 'Growth'],
  regions: ['USA'],
  subGeos: [],
  functions: ['R&D', 'Clinical Development', 'Regulatory Affairs', 'Commercial', 'Manufacturing'],
  seniority: ['C-Suite', 'VP', 'Director'],
  nlpProfile: '',
  marketProfiles: [makeDefaultProfile()],
  activeProfileId: 'default',
}

// ── Sector families for fuzzy matching ──────────────────────────────────────

const sectorFamilies: Record<string, string[]> = {
  Biotech: ['Biotech', 'Biotechnology', 'Gene Therapy', 'Cell Therapy', 'Cell & Gene Therapy'],
  Biotechnology: ['Biotech', 'Biotechnology', 'Gene Therapy', 'Cell Therapy', 'Cell & Gene Therapy'],
  'Life Sciences': ['Biotech', 'Biotechnology', 'Pharma', 'MedTech', 'Diagnostics', 'CRO', 'CDMO', 'Gene Therapy', 'Cell Therapy', 'Digital Health', 'Life Sciences'],
  'Cell & Gene Therapy': ['Gene Therapy', 'Cell Therapy', 'Cell & Gene Therapy', 'Biotech', 'Biotechnology'],
  'Gene Therapy': ['Gene Therapy', 'Cell & Gene Therapy', 'Biotech', 'Biotechnology'],
  'Cell Therapy': ['Cell Therapy', 'Cell & Gene Therapy', 'Biotech', 'Biotechnology'],
  Pharma: ['Pharma', 'Pharmaceutical', 'Biopharma', 'Biopharmaceutical', 'Specialty Pharma'],
  'Specialty Pharma': ['Specialty Pharma', 'Pharma', 'Pharmaceutical'],
  CRO: ['CRO', 'CRO/CDMO', 'CRO / CDMO', 'Contract Research', 'Preclinical CRO', 'Clinical CRO', 'CDMO'],
  'CRO/CDMO': ['CRO', 'CRO/CDMO', 'CRO / CDMO', 'CDMO', 'Contract Research'],
  'CRO / CDMO': ['CRO', 'CRO/CDMO', 'CRO / CDMO', 'CDMO', 'Contract Research'],
  Diagnostics: ['Diagnostics', 'In Vitro Diagnostics', 'Molecular Diagnostics'],
  MedTech: ['MedTech', 'Medical Device', 'Medical Devices', 'Medical Technology'],
  'Digital Health': ['Digital Health', 'Digital Therapeutics', 'Health Tech', 'HealthTech'],
  Oncology: ['Oncology', 'Biotech', 'Biotechnology'],
  Technology: ['SaaS', 'AI / Machine Learning', 'Cybersecurity', 'FinTech', 'Cloud Infrastructure', 'Semiconductors', 'Robotics', 'Technology'],
  SaaS: ['SaaS', 'Software', 'B2B SaaS'],
  'AI / Machine Learning': ['AI / Machine Learning', 'Artificial Intelligence', 'Machine Learning'],
  Cybersecurity: ['Cybersecurity', 'Cyber Security'],
  'Financial Services': ['Private Equity', 'Venture Capital', 'Investment Banking', 'Asset Management', 'Financial Services'],
  Healthcare: ['Hospitals & Health Systems', 'Healthcare IT', 'Healthcare', 'Value-Based Care'],
  'Manufacturing & Engineering': ['Aerospace & Defense', 'Automotive', 'Industrial Equipment', 'Manufacturing'],
}

const usStateMap: Record<string, string[]> = {
  Massachusetts: ['MA', 'Boston', 'Cambridge'],
  California: ['CA', 'San Francisco', 'San Diego', 'Los Angeles'],
  'New York': ['NY', 'New York City', 'NYC'],
  'North Carolina': ['NC', 'Research Triangle'],
  Maryland: ['MD'],
  Connecticut: ['CT'],
  'New Jersey': ['NJ'],
  Pennsylvania: ['PA', 'Philadelphia'],
  Illinois: ['IL', 'Chicago'],
  Texas: ['TX', 'Houston', 'Dallas'],
  Washington: ['WA', 'Seattle'],
  Colorado: ['CO', 'Denver'],
  'New Hampshire': ['NH'],
  Minnesota: ['MN'],
  Indiana: ['IN'],
}

export function companyMatchesSettings(
  company: { sector?: string; stage?: string; geography?: string },
  settings: UserSettings
): boolean {
  // Sector match — use industry/subsector from active profile if available
  const effectiveSector = settings.sector
  if (effectiveSector && effectiveSector !== 'All') {
    const allowedSectors = sectorFamilies[effectiveSector] || [effectiveSector]
    const companySector = company.sector || ''
    const sectorMatch = allowedSectors.some(
      (s) =>
        companySector.toLowerCase().includes(s.toLowerCase()) ||
        s.toLowerCase().includes(companySector.toLowerCase())
    )
    if (!sectorMatch) return false
  }

  // Stage match
  if (settings.stages && settings.stages.length > 0) {
    const companyStage = company.stage || ''
    const stageMatch = settings.stages.some(
      (s) =>
        companyStage.toLowerCase().includes(s.toLowerCase()) ||
        s.toLowerCase().includes(companyStage.toLowerCase())
    )
    if (!stageMatch) return false
  }

  // Geography match
  if (settings.regions && settings.regions.length > 0) {
    const companyGeo = company.geography || ''
    const regionMatch = settings.regions.some((region) => {
      if (region === 'USA' || region === 'US') {
        const usKeywords = ['USA', 'US', 'MA', 'CA', 'NY', 'NC', 'MD', 'CT', 'NJ', 'PA', 'TX', 'WA', 'CO', 'IL', 'MN', 'IN', 'NH']
        return usKeywords.some((kw) => companyGeo.includes(kw))
      }
      if (region === 'EU' || region === 'Europe') {
        const euKeywords = ['UK', 'Germany', 'France', 'Switzerland', 'Netherlands', 'Sweden', 'Denmark', 'Belgium', 'Spain', 'Italy', 'Europe']
        return euKeywords.some((kw) => companyGeo.includes(kw))
      }
      if (region === 'APAC') {
        const apacKeywords = ['Japan', 'China', 'South Korea', 'Australia', 'Singapore', 'India', 'APAC']
        return apacKeywords.some((kw) => companyGeo.includes(kw))
      }
      return companyGeo.toLowerCase().includes(region.toLowerCase())
    })

    if (regionMatch && settings.subGeos && settings.subGeos.length > 0) {
      const subGeoMatch = settings.subGeos.some((subGeo) => {
        const aliases = usStateMap[subGeo] || []
        return (
          companyGeo.toLowerCase().includes(subGeo.toLowerCase()) ||
          aliases.some((alias) => companyGeo.includes(alias))
        )
      })
      if (!subGeoMatch) return false
    }

    if (!regionMatch) return false
  }

  return true
}

// ── Context ─────────────────────────────────────────────────────────────────

interface SettingsContextValue {
  settings: UserSettings
  updateSettings: (updates: Partial<UserSettings>) => void
  activeProfile: MarketProfile | undefined
  addProfile: (profile: Omit<MarketProfile, 'id' | 'createdAt'>) => string
  updateProfile: (id: string, updates: Partial<MarketProfile>) => void
  deleteProfile: (id: string) => void
  switchProfile: (id: string) => void
}

const SettingsContext = createContext<SettingsContextValue>({
  settings: defaultSettings,
  updateSettings: () => {},
  activeProfile: undefined,
  addProfile: () => '',
  updateProfile: () => {},
  deleteProfile: () => {},
  switchProfile: () => {},
})

function profileToFlatSettings(profile: MarketProfile): Partial<UserSettings> {
  return {
    // Use subsector as 'sector' if available (existing filter logic keys on subsector level)
    // e.g. industry=Life Sciences + subsector=Biotech → sector=Biotech for sectorFamilies lookup
    sector: profile.subsector || profile.industry,
    subsector: profile.subsector,
    stages: profile.stages,
    regions: profile.regions,
    subGeos: profile.subGeos,
    functions: profile.functions,
    seniority: profile.seniority,
  }
}

export function SettingsProvider({ children }: { children: ReactNode }) {
  const [settings, setSettings] = useState<UserSettings>(defaultSettings)
  const { data: session } = useSession()

  const syncToBackend = useCallback((next: UserSettings) => {
    if (!session?.user) return
    fetch('/api/user/settings', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ settings: next }),
    }).catch(() => {})
  }, [session])

  const loadFromBackend = useCallback(async (): Promise<boolean> => {
    if (!session?.user) return false
    try {
      const res = await fetch('/api/user/settings')
      if (!res.ok) return false
      const data = await res.json()
      const s = data?.settings
      if (s && typeof s === 'object' && Array.isArray(s.marketProfiles) && s.marketProfiles.length > 0) {
        setSettings({ ...defaultSettings, ...s })
        if (typeof window !== 'undefined') {
          localStorage.setItem('user-market-settings', JSON.stringify(s))
        }
        return true
      }
    } catch {}
    return false
  }, [session])

  useEffect(() => {
    if (typeof window === 'undefined') return
    ;(async () => {
      const hydrated = await loadFromBackend()
      if (hydrated) return
      // Fall back to localStorage
      try {
        const stored = localStorage.getItem('user-market-settings')
        if (stored) {
          const parsed = JSON.parse(stored)
          // Ensure marketProfiles array exists (migration from old format)
          if (!parsed.marketProfiles || parsed.marketProfiles.length === 0) {
            parsed.marketProfiles = [makeDefaultProfile()]
            parsed.activeProfileId = 'default'
          }
          setSettings({ ...defaultSettings, ...parsed })
        }
      } catch {}
    })()
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const persist = useCallback((next: UserSettings) => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('user-market-settings', JSON.stringify(next))
    }
  }, [])

  const updateSettings = useCallback((updates: Partial<UserSettings>) => {
    setSettings((prev) => {
      const next = { ...prev, ...updates }
      persist(next)
      return next
    })
  }, [persist])

  const addProfile = useCallback((profile: Omit<MarketProfile, 'id' | 'createdAt'>): string => {
    const id = crypto.randomUUID()
    const newProfile: MarketProfile = { ...profile, id, createdAt: new Date().toISOString() }
    setSettings((prev) => {
      const next: UserSettings = {
        ...prev,
        marketProfiles: [...prev.marketProfiles, newProfile],
        activeProfileId: id,
        ...profileToFlatSettings(newProfile),
      }
      persist(next)
      syncToBackend(next)
      return next
    })
    return id
  }, [persist, syncToBackend])

  const updateProfile = useCallback((id: string, updates: Partial<MarketProfile>) => {
    setSettings((prev) => {
      const profiles = prev.marketProfiles.map((p) => (p.id === id ? { ...p, ...updates } : p))
      const active = profiles.find((p) => p.id === prev.activeProfileId)
      const next: UserSettings = {
        ...prev,
        marketProfiles: profiles,
        ...(active ? profileToFlatSettings(active) : {}),
      }
      persist(next)
      syncToBackend(next)
      return next
    })
  }, [persist, syncToBackend])

  const deleteProfile = useCallback((id: string) => {
    setSettings((prev) => {
      if (prev.marketProfiles.length <= 1) return prev // keep at least one
      const profiles = prev.marketProfiles.filter((p) => p.id !== id)
      const newActiveId = prev.activeProfileId === id ? profiles[0].id : prev.activeProfileId
      const active = profiles.find((p) => p.id === newActiveId)!
      const next: UserSettings = {
        ...prev,
        marketProfiles: profiles,
        activeProfileId: newActiveId,
        ...profileToFlatSettings(active),
      }
      persist(next)
      syncToBackend(next)
      return next
    })
  }, [persist, syncToBackend])

  const switchProfile = useCallback((id: string) => {
    setSettings((prev) => {
      const active = prev.marketProfiles.find((p) => p.id === id)
      if (!active) return prev
      const next: UserSettings = {
        ...prev,
        activeProfileId: id,
        ...profileToFlatSettings(active),
      }
      persist(next)
      syncToBackend(next)
      return next
    })
  }, [persist, syncToBackend])

  const activeProfile = settings.marketProfiles.find((p) => p.id === settings.activeProfileId)

  return (
    <SettingsContext.Provider value={{ settings, updateSettings, activeProfile, addProfile, updateProfile, deleteProfile, switchProfile }}>
      {children}
    </SettingsContext.Provider>
  )
}

export function useSettings() {
  return useContext(SettingsContext)
}
