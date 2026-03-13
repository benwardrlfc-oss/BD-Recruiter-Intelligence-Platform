'use client'

import { createContext, useContext, useEffect, useState } from 'react'

export type Theme = 'dark' | 'light'

export type ColorPalette =
  | 'dark'        // default — indigo on slate-950
  | 'midnight'    // deep blue on near-black
  | 'rose'        // rose/pink accent on slate-950
  | 'emerald'     // emerald/green on slate-950
  | 'amber'       // amber/gold on slate-950
  | 'violet'      // violet/purple on slate-950
  | 'ocean'       // cyan/teal on slate-950
  | 'slate'       // monochrome slate
  | 'light'       // light mode with indigo

export interface PaletteDef {
  id: ColorPalette
  label: string
  preview: string   // CSS color for the swatch
  description: string
  dark: boolean     // is this a dark-bg palette
}

export const PALETTES: PaletteDef[] = [
  { id: 'dark',     label: 'Indigo',    preview: '#6366f1', description: 'Default dark theme', dark: true },
  { id: 'midnight', label: 'Midnight',  preview: '#3b82f6', description: 'Deep navy with blue',  dark: true },
  { id: 'rose',     label: 'Rose',      preview: '#f43f5e', description: 'Bold rose accent',      dark: true },
  { id: 'emerald',  label: 'Emerald',   preview: '#10b981', description: 'Clean green tone',      dark: true },
  { id: 'amber',    label: 'Amber',     preview: '#f59e0b', description: 'Warm gold accent',      dark: true },
  { id: 'violet',   label: 'Violet',    preview: '#8b5cf6', description: 'Rich purple palette',   dark: true },
  { id: 'ocean',    label: 'Ocean',     preview: '#06b6d4', description: 'Cool cyan / teal',      dark: true },
  { id: 'slate',    label: 'Slate',     preview: '#94a3b8', description: 'Monochrome grey',       dark: true },
  { id: 'light',    label: 'Light',     preview: '#6366f1', description: 'Clean white mode',      dark: false },
]

// ── CSS variable injection ─────────────────────────────────────────────────────
// Each palette sets CSS custom properties that override the accent colour tokens.
// Components that use var(--accent-*) will automatically reflect the chosen palette.
// The globals.css file defines :root defaults matching the 'dark' palette.

const PALETTE_VARS: Record<ColorPalette, Record<string, string>> = {
  dark: {
    '--accent-400': '#818cf8',
    '--accent-500': '#6366f1',
    '--accent-600': '#4f46e5',
    '--accent-700': '#4338ca',
    '--accent-bg':  'rgba(99,102,241,0.1)',
    '--accent-border': 'rgba(99,102,241,0.3)',
    '--page-bg': '#020617',
    '--surface': '#0f172a',
    '--surface-2': '#1e293b',
    '--text-primary': '#f8fafc',
    '--text-secondary': '#94a3b8',
    '--border': '#1e293b',
  },
  midnight: {
    '--accent-400': '#60a5fa',
    '--accent-500': '#3b82f6',
    '--accent-600': '#2563eb',
    '--accent-700': '#1d4ed8',
    '--accent-bg':  'rgba(59,130,246,0.1)',
    '--accent-border': 'rgba(59,130,246,0.3)',
    '--page-bg': '#03071e',
    '--surface': '#0d1b2a',
    '--surface-2': '#1b263b',
    '--text-primary': '#f0f4ff',
    '--text-secondary': '#8eaacb',
    '--border': '#1b263b',
  },
  rose: {
    '--accent-400': '#fb7185',
    '--accent-500': '#f43f5e',
    '--accent-600': '#e11d48',
    '--accent-700': '#be123c',
    '--accent-bg':  'rgba(244,63,94,0.1)',
    '--accent-border': 'rgba(244,63,94,0.3)',
    '--page-bg': '#0a0008',
    '--surface': '#120012',
    '--surface-2': '#1e0018',
    '--text-primary': '#fff1f2',
    '--text-secondary': '#fda4af',
    '--border': '#2d0022',
  },
  emerald: {
    '--accent-400': '#34d399',
    '--accent-500': '#10b981',
    '--accent-600': '#059669',
    '--accent-700': '#047857',
    '--accent-bg':  'rgba(16,185,129,0.1)',
    '--accent-border': 'rgba(16,185,129,0.3)',
    '--page-bg': '#011208',
    '--surface': '#021f0e',
    '--surface-2': '#063018',
    '--text-primary': '#ecfdf5',
    '--text-secondary': '#6ee7b7',
    '--border': '#064e21',
  },
  amber: {
    '--accent-400': '#fbbf24',
    '--accent-500': '#f59e0b',
    '--accent-600': '#d97706',
    '--accent-700': '#b45309',
    '--accent-bg':  'rgba(245,158,11,0.1)',
    '--accent-border': 'rgba(245,158,11,0.3)',
    '--page-bg': '#0c0800',
    '--surface': '#1a1200',
    '--surface-2': '#2a1e00',
    '--text-primary': '#fffbeb',
    '--text-secondary': '#fcd34d',
    '--border': '#3d2a00',
  },
  violet: {
    '--accent-400': '#a78bfa',
    '--accent-500': '#8b5cf6',
    '--accent-600': '#7c3aed',
    '--accent-700': '#6d28d9',
    '--accent-bg':  'rgba(139,92,246,0.1)',
    '--accent-border': 'rgba(139,92,246,0.3)',
    '--page-bg': '#050212',
    '--surface': '#0d0824',
    '--surface-2': '#160f38',
    '--text-primary': '#f5f3ff',
    '--text-secondary': '#c4b5fd',
    '--border': '#2d1f5a',
  },
  ocean: {
    '--accent-400': '#22d3ee',
    '--accent-500': '#06b6d4',
    '--accent-600': '#0891b2',
    '--accent-700': '#0e7490',
    '--accent-bg':  'rgba(6,182,212,0.1)',
    '--accent-border': 'rgba(6,182,212,0.3)',
    '--page-bg': '#00090f',
    '--surface': '#001520',
    '--surface-2': '#002235',
    '--text-primary': '#ecfeff',
    '--text-secondary': '#67e8f9',
    '--border': '#003d55',
  },
  slate: {
    '--accent-400': '#cbd5e1',
    '--accent-500': '#94a3b8',
    '--accent-600': '#64748b',
    '--accent-700': '#475569',
    '--accent-bg':  'rgba(148,163,184,0.1)',
    '--accent-border': 'rgba(148,163,184,0.3)',
    '--page-bg': '#020617',
    '--surface': '#0f172a',
    '--surface-2': '#1e293b',
    '--text-primary': '#f8fafc',
    '--text-secondary': '#94a3b8',
    '--border': '#1e293b',
  },
  light: {
    '--accent-400': '#818cf8',
    '--accent-500': '#6366f1',
    '--accent-600': '#4f46e5',
    '--accent-700': '#4338ca',
    '--accent-bg':  'rgba(99,102,241,0.08)',
    '--accent-border': 'rgba(99,102,241,0.25)',
    '--page-bg': '#f8fafc',
    '--surface': '#ffffff',
    '--surface-2': '#f1f5f9',
    '--text-primary': '#0f172a',
    '--text-secondary': '#475569',
    '--border': '#e2e8f0',
  },
}

function applyPalette(palette: ColorPalette) {
  const vars = PALETTE_VARS[palette]
  const root = document.documentElement
  for (const [key, value] of Object.entries(vars)) {
    root.style.setProperty(key, value)
  }
  root.setAttribute('data-palette', palette)
  const paletteDef = PALETTES.find((p) => p.id === palette)
  root.classList.toggle('light', !paletteDef?.dark)
}

// ── Context ───────────────────────────────────────────────────────────────────

interface ThemeContextValue {
  theme: Theme
  setTheme: (t: Theme) => void
  palette: ColorPalette
  setPalette: (p: ColorPalette) => void
}

const ThemeContext = createContext<ThemeContextValue>({
  theme: 'dark',
  setTheme: () => {},
  palette: 'dark',
  setPalette: () => {},
})

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [palette, setPaletteState] = useState<ColorPalette>('dark')
  const theme: Theme = PALETTES.find((p) => p.id === palette)?.dark === false ? 'light' : 'dark'

  useEffect(() => {
    if (typeof window === 'undefined') return
    const stored = localStorage.getItem('color-palette') as ColorPalette | null
    if (stored && PALETTES.some((p) => p.id === stored)) {
      setPaletteState(stored)
      applyPalette(stored)
    } else {
      applyPalette('dark')
    }
  }, [])

  const setPalette = (p: ColorPalette) => {
    setPaletteState(p)
    localStorage.setItem('color-palette', p)
    applyPalette(p)
  }

  const setTheme = (t: Theme) => {
    setPalette(t === 'light' ? 'light' : 'dark')
  }

  return (
    <ThemeContext.Provider value={{ theme, setTheme, palette, setPalette }}>
      {children}
    </ThemeContext.Provider>
  )
}

export function useTheme() {
  return useContext(ThemeContext)
}
