'use client'

import { useState, useRef, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Search, X, Building2, TrendingUp, Radio, LayoutDashboard } from 'lucide-react'
import { mockCompanies, mockInvestors, mockSignals } from '@/lib/mock-data'

const PAGES = [
  { label: 'Dashboard', href: '/dashboard', keywords: 'home overview' },
  { label: 'Market Radar', href: '/radar', keywords: 'radar signals news' },
  { label: 'Hiring Signals', href: '/opportunities', keywords: 'opportunities hiring' },
  { label: 'Companies', href: '/targets', keywords: 'companies targets accounts' },
  { label: 'Venture Intelligence', href: '/investors', keywords: 'investors venture vc' },
  { label: 'Candidates', href: '/candidates', keywords: 'candidates people' },
  { label: 'BD Scripts', href: '/scripts', keywords: 'scripts outreach bd' },
  { label: 'Content Studio', href: '/content', keywords: 'content posts linkedin' },
  { label: 'Market Intelligence', href: '/trends', keywords: 'trends intelligence analytics' },
  { label: 'Settings', href: '/settings', keywords: 'settings profile preferences' },
]

interface ResultItem {
  label: string
  sublabel?: string
  href: string
  category: 'Company' | 'Investor' | 'Signal' | 'Page'
}

export function SearchBar() {
  const [query, setQuery] = useState('')
  const [open, setOpen] = useState(false)
  const router = useRouter()
  const wrapperRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const results: ResultItem[] = []

  if (query.trim().length >= 2) {
    const q = query.toLowerCase()

    // Companies
    mockCompanies
      .filter(
        (c) =>
          c.name.toLowerCase().includes(q) ||
          c.sector?.toLowerCase().includes(q) ||
          c.geography?.toLowerCase().includes(q)
      )
      .slice(0, 4)
      .forEach((c) =>
        results.push({
          label: c.name,
          sublabel: `${c.sector} · ${c.stage}`,
          href: `/companies/${c.id}`,
          category: 'Company',
        })
      )

    // Investors
    mockInvestors
      .filter((i) => i.name.toLowerCase().includes(q))
      .slice(0, 3)
      .forEach((i) =>
        results.push({
          label: i.name,
          sublabel: (i as any).type || 'Investor',
          href: '/investors',
          category: 'Investor',
        })
      )

    // Signals
    mockSignals
      .filter((s) => s.title.toLowerCase().includes(q) || s.summary?.toLowerCase().includes(q))
      .slice(0, 3)
      .forEach((s) =>
        results.push({
          label: s.title,
          sublabel: s.signalType,
          href: '/radar',
          category: 'Signal',
        })
      )

    // Pages
    PAGES.filter(
      (p) =>
        p.label.toLowerCase().includes(q) || p.keywords.toLowerCase().includes(q)
    )
      .slice(0, 2)
      .forEach((p) =>
        results.push({ label: p.label, href: p.href, category: 'Page' })
      )
  }

  const categories = ['Company', 'Investor', 'Signal', 'Page'] as const

  function navigate(href: string) {
    setQuery('')
    setOpen(false)
    router.push(href)
  }

  const categoryIcons = {
    Company: <Building2 className="h-3 w-3" />,
    Investor: <TrendingUp className="h-3 w-3" />,
    Signal: <Radio className="h-3 w-3" />,
    Page: <LayoutDashboard className="h-3 w-3" />,
  }

  return (
    <div ref={wrapperRef} className="relative flex-1">
      <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-500 pointer-events-none" />
      <input
        ref={inputRef}
        type="text"
        value={query}
        onChange={(e) => {
          setQuery(e.target.value)
          setOpen(true)
        }}
        onFocus={() => query.length >= 2 && setOpen(true)}
        placeholder="Search companies, investors, roles, or signals…"
        className="w-full pl-9 pr-8 py-1.5 text-sm bg-slate-900/80 border border-slate-800/60 rounded-lg text-slate-300 placeholder-slate-600 focus:outline-none focus:border-indigo-500/50 transition-colors"
      />
      {query && (
        <button
          onClick={() => { setQuery(''); setOpen(false); inputRef.current?.focus() }}
          className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 transition-colors"
        >
          <X className="h-3.5 w-3.5" />
        </button>
      )}

      {open && query.length >= 2 && (
        <div className="absolute top-full left-0 right-0 mt-1.5 rounded-xl border border-slate-700/60 bg-slate-900 shadow-2xl z-50 max-h-80 overflow-y-auto">
          {results.length === 0 ? (
            <div className="px-4 py-3 text-xs text-slate-500">No results for "{query}"</div>
          ) : (
            <div className="p-1">
              {categories.map((cat) => {
                const catResults = results.filter((r) => r.category === cat)
                if (!catResults.length) return null
                return (
                  <div key={cat} className="mb-1">
                    <div className="flex items-center gap-1.5 px-3 py-1.5 text-xs text-slate-600 uppercase tracking-wider">
                      {categoryIcons[cat]}
                      {cat === 'Company' ? 'Companies' : cat === 'Investor' ? 'Investors' : cat === 'Signal' ? 'Signals' : 'Pages'}
                    </div>
                    {catResults.map((r, i) => (
                      <button
                        key={i}
                        onClick={() => navigate(r.href)}
                        className="w-full flex items-start gap-2 px-3 py-2 rounded-lg text-left hover:bg-slate-800/60 transition-colors"
                      >
                        <span className="mt-0.5 text-slate-500">{categoryIcons[cat]}</span>
                        <div>
                          <p className="text-sm text-white font-medium">{r.label}</p>
                          {r.sublabel && <p className="text-xs text-slate-500">{r.sublabel}</p>}
                        </div>
                      </button>
                    ))}
                  </div>
                )
              })}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
