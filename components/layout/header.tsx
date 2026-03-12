'use client'

import { useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useSession, signOut } from 'next-auth/react'
import {
  Search, Bell, ChevronDown, LogOut, Settings, Zap,
  LayoutDashboard, Radar, Target, Building2 as Building2Icon, TrendingUp,
  Users, FileText, Sparkles, BarChart3, Settings as SettingsIcon,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { mockSignals, mockOpportunities } from '@/lib/mock-data'
import { cn } from '@/lib/utils'

function getGreeting() {
  const hour = new Date().getHours()
  if (hour < 12) return 'Good morning'
  if (hour < 18) return 'Good afternoon'
  return 'Good evening'
}

export function Header() {
  const { data: session } = useSession()
  const [showUserMenu, setShowUserMenu] = useState(false)
  const pathname = usePathname()

  const firstName = session?.user?.name?.split(' ')[0] || session?.user?.email?.split('@')[0] || 'there'
  const activeSignals = mockSignals.length
  const highProbability = mockOpportunities.filter((o) => o.opportunityScore >= 85).length

  return (
    <header
      className="border-b border-slate-800/60 bg-slate-950 sticky top-0 z-30"
      style={{ boxShadow: '0 1px 20px rgba(0,0,0,0.4)' }}
    >
      {/* Top row: greeting + actions */}
      <div className="flex h-14 items-center justify-between px-6 border-b border-slate-800/40">
        {/* Search */}
        <div className="flex items-center gap-3 flex-1 max-w-sm">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-500" />
            <input
              type="text"
              placeholder="Search companies, investors, roles, or signals…"
              className="w-full pl-9 pr-4 py-1.5 text-sm bg-slate-900/80 border border-slate-800/60 rounded-lg text-slate-300 placeholder-slate-600 focus:outline-none focus:border-indigo-500/50 transition-colors"
            />
          </div>
        </div>

        {/* Right section */}
        <div className="flex items-center gap-3">
          {/* Scan Market Signals */}
          <Button
            size="sm"
            className="gap-2 text-xs bg-indigo-600 hover:bg-indigo-500 text-white border-0"
            onClick={async () => {
              try {
                await fetch('/api/intelligence/run', { method: 'POST', body: JSON.stringify({}) })
              } catch (e) {}
            }}
          >
            <Zap className="h-3 w-3" />
            Scan Market Signals
          </Button>

          {/* Notifications */}
          <Button variant="ghost" size="icon" className="relative h-8 w-8">
            <Bell className="h-4 w-4 text-slate-400" />
            <span className="absolute top-1 right-1 h-2 w-2 rounded-full bg-indigo-500" />
          </Button>

          {/* User Menu */}
          <div className="relative">
            <button
              onClick={() => setShowUserMenu(!showUserMenu)}
              className="flex items-center gap-2 rounded-lg px-2.5 py-1.5 hover:bg-slate-800/60 transition-colors"
            >
              <div className="h-6 w-6 rounded-full bg-indigo-600 flex items-center justify-center">
                <span className="text-xs font-semibold text-white">
                  {session?.user?.name?.charAt(0) || session?.user?.email?.charAt(0) || 'U'}
                </span>
              </div>
              <span className="text-xs font-medium text-white hidden sm:block">{firstName}</span>
              <ChevronDown className="h-3 w-3 text-slate-500" />
            </button>

            {showUserMenu && (
              <div className="absolute right-0 top-full mt-1 w-48 rounded-xl border border-slate-700/60 bg-slate-900 shadow-2xl z-50">
                <div className="p-1">
                  <a
                    href="/settings"
                    className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm text-slate-400 hover:bg-slate-800 hover:text-white transition-colors"
                  >
                    <Settings className="h-4 w-4" />
                    Settings
                  </a>
                  <button
                    onClick={() => signOut()}
                    className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm text-slate-400 hover:bg-slate-800 hover:text-white transition-colors"
                  >
                    <LogOut className="h-4 w-4" />
                    Sign out
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Context bar: greeting + market scope + signal summary */}
      <div className="flex items-center justify-between px-6 py-2.5">
        <div className="flex items-center gap-6">
          <div>
            <span className="text-sm font-semibold text-white">
              {getGreeting()}, {firstName}
            </span>
          </div>
          <div className="flex items-center gap-1.5 text-xs text-slate-500">
            <span className="text-slate-400 font-medium">Biotech</span>
            <span>·</span>
            <span className="text-slate-400 font-medium">Oncology</span>
            <span>·</span>
            <span className="text-slate-400 font-medium">USA</span>
            <span>·</span>
            <span className="text-slate-400 font-medium">Seed – Series C</span>
          </div>
        </div>
        <div className="flex items-center gap-4 text-xs">
          <div className="flex items-center gap-1.5">
            <div className="h-1.5 w-1.5 rounded-full bg-teal-400" />
            <span className="text-slate-400">Signals today:</span>
            <span className="font-bold text-white">{activeSignals}</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="h-1.5 w-1.5 rounded-full bg-indigo-400" />
            <span className="text-slate-400">High probability:</span>
            <span className="font-bold text-white">{highProbability}</span>
          </div>
        </div>
      </div>

      {/* Mobile Nav — visible only below lg */}
      <div className="lg:hidden border-t border-slate-800/40 px-3 py-2">
        <div className="mobile-nav-bar gap-1">
          {[
            { label: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
            { label: 'Radar', href: '/radar', icon: Radar },
            { label: 'Signals', href: '/opportunities', icon: Target },
            { label: 'Targets', href: '/targets', icon: Building2Icon },
            { label: 'Ventures', href: '/investors', icon: TrendingUp },
            { label: 'Candidates', href: '/candidates', icon: Users },
            { label: 'Scripts', href: '/scripts', icon: FileText },
            { label: 'Content', href: '/content', icon: Sparkles },
            { label: 'Intelligence', href: '/trends', icon: BarChart3 },
            { label: 'Settings', href: '/settings', icon: SettingsIcon },
          ].map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'flex flex-col items-center gap-0.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors flex-shrink-0',
                pathname === item.href || pathname.startsWith(item.href + '/')
                  ? 'bg-indigo-600/20 text-indigo-400'
                  : 'text-slate-500 hover:text-slate-300'
              )}
            >
              <item.icon className="h-4 w-4" />
              {item.label}
            </Link>
          ))}
        </div>
      </div>
    </header>
  )
}
