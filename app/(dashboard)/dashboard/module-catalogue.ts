// ── Module catalogue ──────────────────────────────────────────────────────────

export type ModuleSize = 'full' | 'half'
export type ModuleCategory = 'Signals' | 'Accounts' | 'Capital' | 'Geography' | 'Intelligence' | 'Execution'

export interface ModuleDef {
  id: string
  label: string
  description: string
  category: ModuleCategory
  defaultSize: ModuleSize
}

export const MODULE_CATALOGUE: ModuleDef[] = [
  { id: 'top-hiring-signals',   label: 'Top Hiring Signals',   description: 'Ranked companies with active hiring probability signals',   category: 'Signals',      defaultSize: 'full' },
  { id: 'funding-signals',      label: 'Capital Signals',       description: 'Recent funding rounds and capital activity',                category: 'Capital',      defaultSize: 'half' },
  { id: 'watchlist-updates',    label: 'Watchlist Updates',     description: 'Movement from your watched companies and VCs',              category: 'Accounts',     defaultSize: 'full' },
  { id: 'emerging-companies',   label: 'Emerging Companies',    description: 'New entrants showing early hiring signals',                 category: 'Accounts',     defaultSize: 'full' },
  { id: 'role-demand',          label: 'Role Demand Heatmap',   description: 'Most in-demand leadership roles in your market',           category: 'Intelligence', defaultSize: 'half' },
  { id: 'hiring-momentum',      label: 'Hiring Momentum',       description: 'Companies ranked by momentum score',                        category: 'Intelligence', defaultSize: 'half' },
  { id: 'quick-actions',        label: 'Quick Actions',         description: 'Shortcuts to key BD workflows',                            category: 'Execution',    defaultSize: 'half' },
  { id: 'investor-activity',    label: 'Investor Activity',     description: 'Top investors by portfolio signal activity',                category: 'Capital',      defaultSize: 'half' },
  { id: 'market-radar-preview', label: 'Market Radar',          description: 'Latest market signals from your radar',                     category: 'Signals',      defaultSize: 'half' },
]

// ── Layout types ──────────────────────────────────────────────────────────────

export interface LayoutEntry { id: string; size: ModuleSize }

// ── Industry default module layouts ──────────────────────────────────────────

export const INDUSTRY_DEFAULT_LAYOUTS: Record<string, LayoutEntry[]> = {
  'Life Sciences': [
    { id: 'top-hiring-signals', size: 'full' },
    { id: 'funding-signals', size: 'half' },
    { id: 'role-demand', size: 'half' },
    { id: 'watchlist-updates', size: 'full' },
    { id: 'investor-activity', size: 'half' },
    { id: 'emerging-companies', size: 'full' },
  ],
  Technology: [
    { id: 'top-hiring-signals', size: 'full' },
    { id: 'funding-signals', size: 'half' },
    { id: 'hiring-momentum', size: 'half' },
    { id: 'market-radar-preview', size: 'half' },
    { id: 'role-demand', size: 'half' },
    { id: 'watchlist-updates', size: 'full' },
  ],
  Legal: [
    { id: 'top-hiring-signals', size: 'full' },
    { id: 'role-demand', size: 'half' },
    { id: 'hiring-momentum', size: 'half' },
    { id: 'market-radar-preview', size: 'half' },
    { id: 'quick-actions', size: 'half' },
    { id: 'watchlist-updates', size: 'full' },
  ],
  'Financial Services': [
    { id: 'top-hiring-signals', size: 'full' },
    { id: 'funding-signals', size: 'half' },
    { id: 'investor-activity', size: 'half' },
    { id: 'role-demand', size: 'half' },
    { id: 'hiring-momentum', size: 'half' },
    { id: 'watchlist-updates', size: 'full' },
  ],
  'Real Estate & Construction': [
    { id: 'top-hiring-signals', size: 'full' },
    { id: 'funding-signals', size: 'half' },
    { id: 'role-demand', size: 'half' },
    { id: 'market-radar-preview', size: 'half' },
    { id: 'quick-actions', size: 'half' },
    { id: 'watchlist-updates', size: 'full' },
    { id: 'emerging-companies', size: 'full' },
  ],
  Healthcare: [
    { id: 'top-hiring-signals', size: 'full' },
    { id: 'funding-signals', size: 'half' },
    { id: 'role-demand', size: 'half' },
    { id: 'watchlist-updates', size: 'full' },
    { id: 'emerging-companies', size: 'full' },
  ],
}

export const DEFAULT_LAYOUT: LayoutEntry[] = [
  { id: 'top-hiring-signals', size: 'full' },
  { id: 'funding-signals', size: 'half' },
  { id: 'role-demand', size: 'half' },
  { id: 'watchlist-updates', size: 'full' },
  { id: 'quick-actions', size: 'half' },
  { id: 'hiring-momentum', size: 'half' },
  { id: 'emerging-companies', size: 'full' },
]

export function getDefaultLayout(industry: string): LayoutEntry[] {
  return INDUSTRY_DEFAULT_LAYOUTS[industry] || DEFAULT_LAYOUT
}
