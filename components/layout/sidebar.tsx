'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  LayoutDashboard,
  Radar,
  Target,
  Building2,
  TrendingUp,
  Users,
  FileText,
  Sparkles,
  BarChart3,
  Settings,
  Zap,
  Brain,
  Bookmark,
  DollarSign,
  Lock,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { useMarketConfig } from '@/lib/market-config'
import { useSession } from 'next-auth/react'
import { canAccessModule, ModuleId } from '@/lib/permissions'

interface NavItem {
  label: string
  href: string
  icon: React.ComponentType<{ className?: string }>
  moduleId: ModuleId | null
}

const staticNavItems: NavItem[] = [
  { label: 'BD Command Centre', href: '/dashboard',    icon: LayoutDashboard, moduleId: 'dashboard' },
  { label: 'Market Radar',      href: '/radar',        icon: Radar,           moduleId: 'radar' },
  { label: 'Hiring Signals',    href: '/opportunities',icon: Target,          moduleId: 'hiring_signals' },
  { label: 'Companies',         href: '/companies',    icon: Building2,       moduleId: 'companies' },
]

const bottomNavItems: NavItem[] = [
  { label: 'Watchlist',          href: '/watchlist',  icon: Bookmark,   moduleId: 'watchlist' },
  { label: 'Candidate Matcher',  href: '/candidates', icon: Users,      moduleId: 'candidate_matcher' },
  { label: 'BD Scripts',         href: '/scripts',    icon: FileText,   moduleId: 'bd_scripts' },
  { label: 'Content Studio',     href: '/content',    icon: Sparkles,   moduleId: 'content_studio' },
  { label: 'Market Intelligence',href: '/trends',     icon: BarChart3,  moduleId: 'market_intelligence' },
  { label: 'Settings',           href: '/settings',   icon: Settings,   moduleId: null },
]

export function Sidebar() {
  const pathname = usePathname()
  const marketConfig = useMarketConfig()
  const { data: session } = useSession()

  const capitalIcon =
    marketConfig.commercialModel === 'vc'
      ? TrendingUp
      : marketConfig.commercialModel === 'pe'
      ? DollarSign
      : BarChart3

  const capitalNavItem: NavItem = {
    label: marketConfig.capitalTabLabel,
    href: '/investors',
    icon: capitalIcon,
    moduleId: 'capital_intelligence',
  }

  const allNavItems: NavItem[] = [
    ...staticNavItems,
    capitalNavItem,
    ...bottomNavItems,
  ]

  // Determine enabled modules from session, or assume all enabled if no session
  const enabledModules: string[] = session?.user
    ? ((session.user as Record<string, unknown>).enabledModules as string[] | undefined) ??
      allNavItems.map((i) => i.moduleId).filter(Boolean) as string[]
    : allNavItems.map((i) => i.moduleId).filter(Boolean) as string[]

  const role = ((session?.user as Record<string, unknown> | undefined)?.role as string | undefined) ?? 'member'
  const billingStatus = ((session?.user as Record<string, unknown> | undefined)?.billingStatus as string | undefined) ?? 'active'

  function isAccessible(moduleId: ModuleId | null): boolean {
    // No session — show all items normally
    if (!session) return true
    // Always accessible
    if (moduleId === null) return true
    return canAccessModule(
      moduleId,
      enabledModules,
      role as Parameters<typeof canAccessModule>[2],
      billingStatus as Parameters<typeof canAccessModule>[3],
    )
  }

  return (
    <div
      className="hidden lg:flex h-screen flex-col border-r border-slate-800/50 flex-shrink-0"
      style={{ width: '260px', minWidth: '260px', background: 'var(--sidebar)' }}
    >
      {/* Logo */}
      <div className="flex items-center gap-3 px-6 py-5 border-b border-slate-800/50">
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-600">
          <Brain className="h-5 w-5 text-white" />
        </div>
        <div>
          <div className="text-sm font-semibold text-white tracking-tight">BD Intelligence</div>
          <div className="text-xs text-slate-500">Market Intelligence Engine</div>
        </div>
      </div>

      {/* Intelligence Status */}
      <div className="px-4 py-3 border-b border-slate-800/50">
        <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-teal-500/10 border border-teal-500/20">
          <div className="h-1.5 w-1.5 rounded-full bg-teal-400 animate-pulse" />
          <span className="text-xs font-medium" style={{ color: '#14b8a6' }}>Intelligence Active</span>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-0.5">
        {allNavItems.map((item) => {
          const isActive = pathname === item.href || pathname.startsWith(item.href + '/')
          const accessible = isAccessible(item.moduleId)
          return accessible ? (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all duration-200',
                isActive
                  ? 'nav-active text-white'
                  : 'text-slate-400 hover:bg-slate-800/60 hover:text-white'
              )}
            >
              <item.icon
                className={cn(
                  'h-4 w-4 flex-shrink-0',
                  isActive ? 'text-indigo-400' : 'text-slate-500'
                )}
              />
              {item.label}
            </Link>
          ) : (
            <div
              key={item.href}
              className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium opacity-50 pointer-events-none select-none"
              title="Upgrade to access this feature"
            >
              <Lock className="h-4 w-4 flex-shrink-0 text-slate-500" />
              {item.label}
            </div>
          )
        })}
      </nav>

      {/* Bottom Credits */}
      <div className="px-4 py-4 border-t border-slate-800/50">
        <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-indigo-600/10 border border-indigo-500/10">
          <Zap className="h-4 w-4 text-indigo-400" />
          <div>
            <div className="text-xs font-medium text-indigo-400">AI Credits</div>
            <div className="text-xs text-slate-500">Powered by Claude</div>
          </div>
        </div>
      </div>
    </div>
  )
}
