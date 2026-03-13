'use client'

import { useState, useMemo } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useSession, signOut } from 'next-auth/react'
import {
  Bell, ChevronDown, LogOut, Settings, Zap,
  LayoutDashboard, Radar, Target, Building2 as Building2Icon, TrendingUp,
  Users, FileText, Sparkles, BarChart3, Settings as SettingsIcon,
  Loader2, CheckCircle,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { SearchBar } from '@/components/layout/search-bar'
import { mockSignals, mockOpportunities } from '@/lib/mock-data'
import { useSettings } from '@/lib/settings-context'
import { cn, getGreeting } from '@/lib/utils'

export function Header() {
  const { data: session } = useSession()
  const [showUserMenu, setShowUserMenu] = useState(false)
  const [isScanning, setIsScanning] = useState(false)
  const [scanDone, setScanDone] = useState(false)
  const pathname = usePathname()
  const { settings } = useSettings()

  const firstName = session?.user?.name?.split(' ')[0] || session?.user?.email?.split('@')[0] || 'there'
  const activeSignals = mockSignals.length
  const highProbability = mockOpportunities.filter((o) => o.opportunityScore >= 85).length

  const scopeParts = useMemo(() => [
    settings.sector || 'Biotech',
    settings.subsector || null,
    settings.regions.join(', ') || 'USA',
    settings.stages.length
      ? `${settings.stages[0]} – ${settings.stages[settings.stages.length - 1]}`
      : 'All stages',
  ].filter(Boolean), [settings])

  const handleScan = async () => {
    setIsScanning(true)
    try {
      await fetch('/api/intelligence/run', { method: 'POST', body: JSON.stringify({}) })
    } catch (e) {}
    setIsScanning(false)
    setScanDone(true)
    setTimeout(() => setScanDone(false), 3000)
  }

  return (
    <header
      className="border-b border-slate-800/60 bg-slate-950 sticky top-0 z-30"
      style={{ boxShadow: '0 1px 20px rgba(0,0,0,0.4)' }}
    >
      {/* Top row: greeting + actions */}
      <div className="flex h-14 items-center justify-between px-6 border-b border-slate-800/40">
        {/* Search */}
        <div className="flex items-center gap-3 flex-1 max-w-sm">
          <SearchBar />
        </div>

        {/* Right section */}
        <div className="flex items-center gap-3">
          {/* Scan Market Signals */}
          <Button
            size="sm"
            disabled={isScanning}
            className="gap-2 text-xs bg-indigo-600 hover:bg-indigo-500 text-white border-0"
            onClick={handleScan}
          >
            {isScanning ? (
              <><Loader2 className="h-3 w-3 animate-spin" /> Scanning...</>
            ) : scanDone ? (
              <><CheckCircle className="h-3 w-3 text-emerald-300" /> Done!</>
            ) : (
              <><Zap className="h-3 w-3" /> Scan Market Signals</>
            )}
          </Button>

          {/* Notifications */}
          <Link href="/radar">
            <Button variant="ghost" size="icon" className="relative h-8 w-8" title="View latest signals">
              <Bell className="h-4 w-4 text-slate-400" />
            </Button>
          </Link>

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
                  <Link
                    href="/settings"
                    className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm text-slate-400 hover:bg-slate-800 hover:text-white transition-colors"
                    onClick={() => setShowUserMenu(false)}
                  >
                    <Settings className="h-4 w-4" />
                    Settings
                  </Link>
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
            {scopeParts.map((part, i) => (
              <span key={i} className="flex items-center gap-1.5">
                {i > 0 && <span>·</span>}
                <span className="text-slate-400 font-medium">{part}</span>
              </span>
            ))}
          </div>
        </div>
        <div className="flex items-center gap-4 text-xs">
          <Link href="/radar" className="flex items-center gap-1.5 hover:opacity-80 transition-opacity">
            <div className="h-1.5 w-1.5 rounded-full bg-teal-400" />
            <span className="text-slate-400">Signals today:</span>
            <span className="font-bold text-white">{activeSignals}</span>
          </Link>
          <Link href="/opportunities" className="flex items-center gap-1.5 hover:opacity-80 transition-opacity">
            <div className="h-1.5 w-1.5 rounded-full bg-indigo-400" />
            <span className="text-slate-400">High probability:</span>
            <span className="font-bold text-white">{highProbability}</span>
          </Link>
        </div>
      </div>

      {/* Mobile Nav — visible only below lg */}
      <div className="lg:hidden border-t border-slate-800/40 px-3 py-2">
        <div className="mobile-nav-bar gap-1">
          {[
            { label: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
            { label: 'Radar', href: '/radar', icon: Radar },
            { label: 'Signals', href: '/opportunities', icon: Target },
            { label: 'Companies', href: '/companies', icon: Building2Icon },
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
