import { type ClassValue, clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatDate(date: Date | string) {
  return new Date(date).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  })
}

export function formatTimeAgo(date: Date | string) {
  const now = new Date()
  const past = new Date(date)
  const diffMs = now.getTime() - past.getTime()
  const diffMinutes = Math.floor(diffMs / 60000)
  const diffHours = Math.floor(diffMs / 3600000)
  const diffDays = Math.floor(diffMs / 86400000)

  if (diffMinutes < 60) return `${diffMinutes}m ago`
  if (diffHours < 24) return `${diffHours}h ago`
  if (diffDays < 30) return `${diffDays}d ago`
  return formatDate(date)
}

export function getScoreColor(score: number) {
  if (score >= 80) return 'text-green-400 bg-green-400/10'
  if (score >= 60) return 'text-indigo-400 bg-indigo-400/10'
  if (score >= 40) return 'text-amber-400 bg-amber-400/10'
  return 'text-red-400 bg-red-400/10'
}

export function getScoreBadgeVariant(score: number): 'high' | 'medium' | 'low' | 'critical' {
  if (score >= 80) return 'high'
  if (score >= 60) return 'medium'
  if (score >= 40) return 'low'
  return 'critical'
}

export function getSignalTypeColor(signalType: string) {
  const colors: Record<string, string> = {
    funding: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30',
    hiring: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
    leadership: 'bg-purple-500/20 text-purple-400 border-purple-500/30',
    partnership: 'bg-amber-500/20 text-amber-400 border-amber-500/30',
    expansion: 'bg-indigo-500/20 text-indigo-400 border-indigo-500/30',
    regulatory: 'bg-red-500/20 text-red-400 border-red-500/30',
    product: 'bg-cyan-500/20 text-cyan-400 border-cyan-500/30',
    clinical: 'bg-pink-500/20 text-pink-400 border-pink-500/30',
  }
  return colors[signalType.toLowerCase()] || 'bg-slate-500/20 text-slate-400 border-slate-500/30'
}

export function getTimingBadgeColor(timing: string) {
  const lower = timing.toLowerCase()
  if (lower.includes('now') || lower.includes('immediate')) return 'bg-red-500/20 text-red-400 border-red-500/30'
  if (lower.includes('30') || lower.includes('month')) return 'bg-amber-500/20 text-amber-400 border-amber-500/30'
  if (lower.includes('90') || lower.includes('quarter')) return 'bg-indigo-500/20 text-indigo-400 border-indigo-500/30'
  return 'bg-slate-500/20 text-slate-400 border-slate-500/30'
}

export function truncate(str: string, maxLength: number) {
  if (str.length <= maxLength) return str
  return str.slice(0, maxLength) + '...'
}

export function formatCurrency(amount: number) {
  if (amount >= 1e9) return `$${(amount / 1e9).toFixed(1)}B`
  if (amount >= 1e6) return `$${(amount / 1e6).toFixed(1)}M`
  if (amount >= 1e3) return `$${(amount / 1e3).toFixed(0)}K`
  return `$${amount}`
}

export function getGreeting() {
  const hour = new Date().getHours()
  if (hour < 12) return 'Good morning'
  if (hour < 18) return 'Good afternoon'
  return 'Good evening'
}

export const signalTypeIcons: Record<string, string> = {
  funding: '💰',
  hiring: '👥',
  leadership: '👤',
  partnership: '🤝',
  expansion: '🌍',
  regulatory: '📋',
  product: '🧬',
  clinical: '🔬',
}
