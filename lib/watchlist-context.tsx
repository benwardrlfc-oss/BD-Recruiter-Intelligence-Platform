'use client'

import { createContext, useContext, useState, useEffect, ReactNode } from 'react'
import { useSession } from 'next-auth/react'

export interface WatchedCompany {
  id: string
  entityType: 'company'
  entityId: string
  addedAt: string
}

export interface WatchedVC {
  id: string
  entityType: 'vc'
  entityId: string
  addedAt: string
}

interface StoredWatchlist {
  companies: WatchedCompany[]
  vcs: WatchedVC[]
}

interface WatchlistContextValue {
  watchedCompanies: WatchedCompany[]
  watchedVCs: WatchedVC[]
  isWatchingCompany: (id: string) => boolean
  isWatchingVC: (id: string) => boolean
  toggleCompany: (id: string) => void
  toggleVC: (id: string) => void
  removeCompany: (id: string) => void
  removeVC: (id: string) => void
}

const WatchlistContext = createContext<WatchlistContextValue | null>(null)

const STORAGE_KEY = 'bd_watchlist_v1'

// Default watched items so the feature is visible on first load
const DEFAULT_WATCHLIST: StoredWatchlist = {
  companies: [
    { id: 'wc_comp_1', entityType: 'company', entityId: 'comp_1', addedAt: new Date(Date.now() - 2 * 86400000).toISOString() },
    { id: 'wc_comp_4', entityType: 'company', entityId: 'comp_4', addedAt: new Date(Date.now() - 5 * 86400000).toISOString() },
  ],
  vcs: [
    { id: 'wv_inv_1', entityType: 'vc', entityId: 'inv_1', addedAt: new Date(Date.now() - 3 * 86400000).toISOString() },
  ],
}

export function WatchlistProvider({ children }: { children: ReactNode }) {
  const [watchedCompanies, setWatchedCompanies] = useState<WatchedCompany[]>(DEFAULT_WATCHLIST.companies)
  const [watchedVCs, setWatchedVCs] = useState<WatchedVC[]>(DEFAULT_WATCHLIST.vcs)
  const [loaded, setLoaded] = useState(false)
  const { data: session } = useSession()

  useEffect(() => {
    ;(async () => {
      // Try backend first if session is available
      if (session?.user) {
        try {
          const res = await fetch('/api/watchlist')
          if (res.ok) {
            const data = await res.json()
            if (data && (Array.isArray(data.companies) || Array.isArray(data.vcs))) {
              setWatchedCompanies(data.companies || DEFAULT_WATCHLIST.companies)
              setWatchedVCs(data.vcs || DEFAULT_WATCHLIST.vcs)
              setLoaded(true)
              return
            }
          }
        } catch {}
      }
      // Fall back to localStorage
      try {
        const stored = localStorage.getItem(STORAGE_KEY)
        if (stored) {
          const parsed: StoredWatchlist = JSON.parse(stored)
          setWatchedCompanies(parsed.companies || DEFAULT_WATCHLIST.companies)
          setWatchedVCs(parsed.vcs || DEFAULT_WATCHLIST.vcs)
        }
      } catch {}
      setLoaded(true)
    })()
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => {
    if (!loaded) return
    // Persist to localStorage
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify({ companies: watchedCompanies, vcs: watchedVCs }))
    } catch {}
    // Sync to backend if session exists
    if (session?.user) {
      fetch('/api/watchlist', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ watchedCompanies, watchedVCs }),
      }).catch(() => {})
    }
  }, [watchedCompanies, watchedVCs, loaded, session])

  const isWatchingCompany = (id: string) => watchedCompanies.some((w) => w.entityId === id)
  const isWatchingVC = (id: string) => watchedVCs.some((w) => w.entityId === id)

  const toggleCompany = (id: string) => {
    setWatchedCompanies((prev) => {
      if (prev.some((w) => w.entityId === id)) return prev.filter((w) => w.entityId !== id)
      return [...prev, { id: `wc_${id}_${Date.now()}`, entityType: 'company', entityId: id, addedAt: new Date().toISOString() }]
    })
  }

  const toggleVC = (id: string) => {
    setWatchedVCs((prev) => {
      if (prev.some((w) => w.entityId === id)) return prev.filter((w) => w.entityId !== id)
      return [...prev, { id: `wv_${id}_${Date.now()}`, entityType: 'vc', entityId: id, addedAt: new Date().toISOString() }]
    })
  }

  const removeCompany = (id: string) => setWatchedCompanies((prev) => prev.filter((w) => w.entityId !== id))
  const removeVC = (id: string) => setWatchedVCs((prev) => prev.filter((w) => w.entityId !== id))

  return (
    <WatchlistContext.Provider value={{ watchedCompanies, watchedVCs, isWatchingCompany, isWatchingVC, toggleCompany, toggleVC, removeCompany, removeVC }}>
      {children}
    </WatchlistContext.Provider>
  )
}

export function useWatchlist() {
  const ctx = useContext(WatchlistContext)
  if (!ctx) throw new Error('useWatchlist must be used within WatchlistProvider')
  return ctx
}
