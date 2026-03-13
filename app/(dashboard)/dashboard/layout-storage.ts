import { LayoutEntry, getDefaultLayout } from './module-catalogue'

// ── Persisted layout state ────────────────────────────────────────────────────

export interface SavedLayout {
  industry: string
  entries: LayoutEntry[]
  hidden: string[]
}

export const STORAGE_KEY = 'bd_dashboard_layout_v1'

export function loadLayout(industry: string): { entries: LayoutEntry[]; hidden: string[] } {
  if (typeof window === 'undefined') return { entries: getDefaultLayout(industry), hidden: [] }
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (raw) {
      const saved: SavedLayout = JSON.parse(raw)
      if (saved.industry === industry) return { entries: saved.entries, hidden: saved.hidden }
    }
  } catch {}
  return { entries: getDefaultLayout(industry), hidden: [] }
}

export function saveLayout(industry: string, entries: LayoutEntry[], hidden: string[]) {
  if (typeof window === 'undefined') return
  localStorage.setItem(STORAGE_KEY, JSON.stringify({ industry, entries, hidden }))
}
