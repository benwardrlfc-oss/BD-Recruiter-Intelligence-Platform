'use client'

import { useState, useEffect, useCallback } from 'react'
import { mockCompanies, mockSignals, mockInvestors, mockOpportunities } from '@/lib/mock-data'
import { UserSettings, companyMatchesSettings } from '@/lib/settings-context'

// ── useCompanies ─────────────────────────────────────────────────────────────

export function useCompanies(settings?: UserSettings) {
  const initialData = settings
    ? mockCompanies.filter((c) => companyMatchesSettings(c, settings))
    : mockCompanies

  const [data, setData] = useState(initialData)
  const [isLoading, setIsLoading] = useState(false)

  useEffect(() => {
    setIsLoading(true)
    const params = new URLSearchParams()
    if (settings?.sector) params.set('sector', settings.sector)

    fetch(`/api/companies?${params}`)
      .then((r) => r.json())
      .then((result) => {
        if (Array.isArray(result) && result.length > 0) {
          const filtered = settings
            ? result.filter((c: typeof mockCompanies[0]) => companyMatchesSettings(c, settings))
            : result
          setData(filtered)
        }
      })
      .catch(() => {})
      .finally(() => setIsLoading(false))
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [settings?.sector, settings?.stage, settings?.subsector])

  return { data, isLoading }
}

// ── useSignals ───────────────────────────────────────────────────────────────

export function useSignals(settings?: UserSettings) {
  const filteredCompanyIds = settings
    ? new Set(mockCompanies.filter((c) => companyMatchesSettings(c, settings)).map((c) => c.id))
    : null

  const initialData = filteredCompanyIds
    ? mockSignals.filter((s) => !s.companyId || filteredCompanyIds.has(s.companyId))
    : mockSignals

  const [data, setData] = useState(initialData)
  const [isLoading, setIsLoading] = useState(false)

  useEffect(() => {
    setIsLoading(true)
    const params = new URLSearchParams()
    if (settings?.sector) params.set('sector', settings.sector)

    fetch(`/api/signals?${params}&limit=100`)
      .then((r) => r.json())
      .then((result) => {
        if (Array.isArray(result) && result.length > 0) {
          setData(result)
        }
      })
      .catch(() => {})
      .finally(() => setIsLoading(false))
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [settings?.sector, settings?.subsector])

  return { data, isLoading }
}

// ── useInvestors ─────────────────────────────────────────────────────────────

export function useInvestors() {
  const [data, setData] = useState(mockInvestors)
  const [isLoading, setIsLoading] = useState(false)

  useEffect(() => {
    setIsLoading(true)
    fetch('/api/investors')
      .then((r) => r.json())
      .then((result) => {
        if (Array.isArray(result) && result.length > 0) {
          setData(result)
        }
      })
      .catch(() => {})
      .finally(() => setIsLoading(false))
  }, [])

  return { data, isLoading }
}

// ── useOpportunities ─────────────────────────────────────────────────────────

export function useOpportunities(settings?: UserSettings) {
  const filteredCompanyIds = settings
    ? new Set(mockCompanies.filter((c) => companyMatchesSettings(c, settings)).map((c) => c.id))
    : null

  const initialData = filteredCompanyIds
    ? mockOpportunities.filter((o) => filteredCompanyIds.has(o.companyId))
    : mockOpportunities

  const [data, setData] = useState(initialData)
  const [isLoading, setIsLoading] = useState(false)

  const refetch = useCallback(() => {
    setIsLoading(true)
    fetch('/api/opportunities')
      .then((r) => r.json())
      .then((result) => {
        if (Array.isArray(result) && result.length > 0) {
          setData(result)
        }
      })
      .catch(() => {})
      .finally(() => setIsLoading(false))
  }, [])

  useEffect(() => {
    refetch()
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [settings?.sector, settings?.stage])

  return { data, isLoading, refetch }
}
