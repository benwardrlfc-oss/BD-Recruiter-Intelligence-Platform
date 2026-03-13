'use client'

import { mockCompanies, mockSignals, mockInvestors, mockOpportunities } from '@/lib/mock-data'
import { UserSettings, companyMatchesSettings } from '@/lib/settings-context'

// ── useCompanies ─────────────────────────────────────────────────────────────

export function useCompanies(settings?: UserSettings) {
  const data = settings
    ? mockCompanies.filter((c) => companyMatchesSettings(c, settings))
    : mockCompanies
  return { data, isLoading: false as const }
}

// ── useSignals ───────────────────────────────────────────────────────────────

export function useSignals(settings?: UserSettings) {
  // Always derive filtered company IDs (avoids conditional hook call)
  const filteredCompanyIds = settings
    ? new Set(mockCompanies.filter((c) => companyMatchesSettings(c, settings)).map((c) => c.id))
    : null

  const data = filteredCompanyIds
    ? mockSignals.filter((s) => !s.companyId || filteredCompanyIds.has(s.companyId))
    : mockSignals

  return { data, isLoading: false as const }
}

// ── useInvestors ─────────────────────────────────────────────────────────────

export function useInvestors() {
  return { data: mockInvestors, isLoading: false as const }
}

// ── useOpportunities ─────────────────────────────────────────────────────────

export function useOpportunities(settings?: UserSettings) {
  // Always derive filtered company IDs (avoids conditional hook call)
  const filteredCompanyIds = settings
    ? new Set(mockCompanies.filter((c) => companyMatchesSettings(c, settings)).map((c) => c.id))
    : null

  const data = filteredCompanyIds
    ? mockOpportunities.filter((o) => filteredCompanyIds.has(o.companyId))
    : mockOpportunities

  return { data, isLoading: false as const }
}
