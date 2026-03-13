import data from './taxonomy-data.json'

export const INDUSTRIES: string[] = data.industries

export type Industry = (typeof INDUSTRIES)[number]

export const SUBSECTORS: Record<string, string[]> = data.subsectors

export const NICHES: Record<string, string[]> = data.niches

export const FUNCTIONS: string[] = data.functions

export const FUNCTIONS_BY_INDUSTRY: Record<string, string[]> = data.functionsByIndustry

export const SENIORITY_LEVELS: string[] = data.seniorityLevels

export const COMPANY_TYPES: string[] = data.companyTypes

export const COMPANY_STAGES: string[] = data.companyStages

export const SIGNAL_PREFERENCES: string[] = data.signalPreferences

// Signal families — groups individual signals by category
export interface SignalFamily {
  id: string
  label: string
  description: string
  signals: string[]
}

export const SIGNAL_FAMILIES: SignalFamily[] = data.signalFamilies

export interface MarketTemplate {
  id: string
  label: string
  description: string
  industry: string
  subsectors: string[]
  functions: string[]
  seniority: string[]
  stages: string[]
  companyTypes: string[]
  signalPreferences: string[]
  signalFamilies: string[]
}

export const MARKET_TEMPLATES: MarketTemplate[] = data.marketTemplates
