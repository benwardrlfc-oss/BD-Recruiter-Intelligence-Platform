'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import {
  Users, UserPlus, Mail, Shield, Trash2, Crown, Eye, ChevronDown,
  Building2, CreditCard, AlertTriangle, CheckCircle, Loader2, Copy, ExternalLink,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { cn } from '@/lib/utils'
import { ROLE_LABELS, ROLE_OPTIONS, type UserRole } from '@/lib/permissions'

// ── Types ─────────────────────────────────────────────────────────────────────

interface Member {
  id: string
  userId: string
  name: string | null
  email: string | null
  role: UserRole
  seatAssigned: boolean
  joinedAt: string
}

interface PendingInvite {
  id: string
  email: string
  role: UserRole
  expiresAt: string
  invitedBy: string
}

interface OrgStats {
  orgName: string
  planId: string
  billingStatus: string
  seatCount: number
  seatsUsed: number
  trialEndsAt: string | null
  memberCount: number
}

// ── Billing status badge ───────────────────────────────────────────────────────

function BillingBadge({ status }: { status: string }) {
  const styles: Record<string, string> = {
    active: 'bg-emerald-900/30 text-emerald-400 border-emerald-700/40',
    trialing: 'bg-indigo-900/30 text-indigo-400 border-indigo-700/40',
    past_due: 'bg-amber-900/30 text-amber-400 border-amber-700/40',
    unpaid: 'bg-red-900/30 text-red-400 border-red-700/40',
    cancelled: 'bg-slate-700/30 text-slate-400 border-slate-600/40',
    suspended: 'bg-red-900/30 text-red-400 border-red-700/40',
  }
  const labels: Record<string, string> = {
    active: 'Active', trialing: 'Trial', past_due: 'Past Due',
    unpaid: 'Unpaid', cancelled: 'Cancelled', suspended: 'Suspended',
  }
  return (
    <span className={cn('text-xs px-2 py-0.5 rounded-full border font-medium', styles[status] ?? styles.active)}>
      {labels[status] ?? status}
    </span>
  )
}

// ── Role badge ────────────────────────────────────────────────────────────────

function RoleBadge({ role }: { role: UserRole }) {
  const color = role === 'org_admin' ? 'text-indigo-400' : role === 'team_manager' ? 'text-violet-400' : 'text-slate-400'
  return <span className={cn('text-xs font-medium', color)}>{ROLE_LABELS[role]}</span>
}

// ── Main page ─────────────────────────────────────────────────────────────────

export default function OrgAdminPage() {
  const { data: session } = useSession()
  const [tab, setTab] = useState<'members' | 'invites' | 'billing'>('members')

  const [members, setMembers] = useState<Member[]>([])
  const [invites, setInvites] = useState<PendingInvite[]>([])
  const [stats, setStats] = useState<OrgStats | null>(null)
  const [loading, setLoading] = useState(true)

  const [inviteEmail, setInviteEmail] = useState('')
  const [inviteRole, setInviteRole] = useState<UserRole>('member')
  const [inviteLoading, setInviteLoading] = useState(false)
  const [inviteResult, setInviteResult] = useState<{ url?: string; error?: string } | null>(null)

  const [actionLoading, setActionLoading] = useState<string | null>(null)

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    setLoading(true)
    try {
      const [membersRes, invitesRes, statsRes] = await Promise.all([
        fetch('/api/org/members'),
        fetch('/api/org/invites'),
        fetch('/api/org/stats'),
      ])
      if (membersRes.ok) setMembers(await membersRes.json())
      if (invitesRes.ok) setInvites(await invitesRes.json())
      if (statsRes.ok) setStats(await statsRes.json())
    } catch {
      // ignore
    } finally {
      setLoading(false)
    }
  }

  const handleInvite = async (e: React.FormEvent) => {
    e.preventDefault()
    setInviteLoading(true)
    setInviteResult(null)
    try {
      const res = await fetch('/api/invite', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: inviteEmail, role: inviteRole }),
      })
      const data = await res.json()
      if (!res.ok) {
        setInviteResult({ error: data.error })
      } else {
        setInviteResult({ url: data.inviteUrl })
        setInviteEmail('')
        loadData()
      }
    } catch {
      setInviteResult({ error: 'Failed to send invite.' })
    } finally {
      setInviteLoading(false)
    }
  }

  const handleRemoveMember = async (userId: string) => {
    if (!confirm('Remove this member from the organisation?')) return
    setActionLoading(userId)
    try {
      await fetch(`/api/org/members/${userId}`, { method: 'DELETE' })
      setMembers((m) => m.filter((x) => x.userId !== userId))
    } finally {
      setActionLoading(null)
    }
  }

  const handleChangeRole = async (userId: string, role: UserRole) => {
    setActionLoading(userId + role)
    try {
      await fetch(`/api/org/members/${userId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ role }),
      })
      setMembers((m) => m.map((x) => (x.userId === userId ? { ...x, role } : x)))
    } finally {
      setActionLoading(null)
    }
  }

  const openBillingPortal = async () => {
    const res = await fetch('/api/billing/portal', { method: 'POST' })
    const data = await res.json()
    if (data.url) window.open(data.url, '_blank')
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="h-6 w-6 animate-spin text-indigo-400" />
      </div>
    )
  }

  const seatPct = stats ? Math.round((stats.seatsUsed / Math.max(stats.seatCount, 1)) * 100) : 0

  return (
    <div className="max-w-5xl mx-auto px-6 py-8 space-y-6">

      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-xl font-bold text-white flex items-center gap-2">
            <Building2 className="h-5 w-5 text-indigo-400" />
            Organisation Admin
          </h1>
          {stats && (
            <p className="text-sm text-slate-400 mt-0.5">
              {stats.orgName} · {stats.memberCount} member{stats.memberCount !== 1 ? 's' : ''}
            </p>
          )}
        </div>
        {stats && <BillingBadge status={stats.billingStatus} />}
      </div>

      {/* Seat bar */}
      {stats && (
        <div className="rounded-xl border border-slate-800 bg-slate-900 p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-slate-300 font-medium">Seat usage</span>
            <span className="text-sm text-slate-400">{stats.seatsUsed} / {stats.seatCount} seats</span>
          </div>
          <div className="h-2 rounded-full bg-slate-800">
            <div
              className={cn('h-2 rounded-full transition-all', seatPct >= 90 ? 'bg-red-500' : seatPct >= 70 ? 'bg-amber-500' : 'bg-indigo-500')}
              style={{ width: `${Math.min(seatPct, 100)}%` }}
            />
          </div>
          {stats.trialEndsAt && (
            <p className="text-xs text-amber-400 mt-2 flex items-center gap-1.5">
              <AlertTriangle className="h-3.5 w-3.5" />
              Trial ends {new Date(stats.trialEndsAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
            </p>
          )}
        </div>
      )}

      {/* Tabs */}
      <div className="flex gap-1 border-b border-slate-800">
        {(['members', 'invites', 'billing'] as const).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={cn(
              'px-4 py-2 text-sm font-medium border-b-2 -mb-px transition-colors capitalize',
              tab === t
                ? 'border-indigo-500 text-indigo-400'
                : 'border-transparent text-slate-500 hover:text-slate-300',
            )}
          >
            {t === 'invites' ? `Pending invites (${invites.length})` : t.charAt(0).toUpperCase() + t.slice(1)}
          </button>
        ))}
      </div>

      {/* ── Members tab ──────────────────────────────────────────────────────── */}
      {tab === 'members' && (
        <div className="space-y-4">

          {/* Invite form */}
          <div className="rounded-xl border border-slate-800 bg-slate-900 p-5">
            <h2 className="text-sm font-semibold text-white mb-3 flex items-center gap-2">
              <UserPlus className="h-4 w-4 text-indigo-400" />
              Invite a team member
            </h2>
            <form onSubmit={handleInvite} className="flex gap-3 flex-wrap">
              <div className="flex-1 min-w-[220px]">
                <Input
                  type="email"
                  placeholder="colleague@firm.com"
                  value={inviteEmail}
                  onChange={(e) => setInviteEmail(e.target.value)}
                  required
                />
              </div>
              <select
                value={inviteRole}
                onChange={(e) => setInviteRole(e.target.value as UserRole)}
                className="px-3 py-2 rounded-lg border border-slate-700 bg-slate-800 text-sm text-slate-300 focus:outline-none focus:border-indigo-500"
              >
                {ROLE_OPTIONS.map((o) => (
                  <option key={o.value} value={o.value}>{o.label}</option>
                ))}
              </select>
              <Button type="submit" disabled={inviteLoading} className="gap-2">
                {inviteLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Mail className="h-4 w-4" />}
                Send invite
              </Button>
            </form>

            {inviteResult?.url && (
              <div className="mt-3 flex items-center gap-2 p-3 rounded-lg bg-emerald-900/20 border border-emerald-800/60">
                <CheckCircle className="h-4 w-4 text-emerald-400 shrink-0" />
                <span className="text-xs text-emerald-400 flex-1 truncate">Invite link: {inviteResult.url}</span>
                <button
                  onClick={() => navigator.clipboard.writeText(inviteResult.url!)}
                  className="text-emerald-400 hover:text-emerald-300"
                  title="Copy link"
                >
                  <Copy className="h-3.5 w-3.5" />
                </button>
              </div>
            )}
            {inviteResult?.error && (
              <p className="mt-3 text-xs text-red-400 flex items-center gap-1.5">
                <AlertTriangle className="h-3.5 w-3.5" />{inviteResult.error}
              </p>
            )}
          </div>

          {/* Members list */}
          <div className="rounded-xl border border-slate-800 bg-slate-900 overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-800">
                  <th className="text-left px-4 py-3 text-xs font-medium text-slate-500 uppercase tracking-wide">Member</th>
                  <th className="text-left px-4 py-3 text-xs font-medium text-slate-500 uppercase tracking-wide">Role</th>
                  <th className="text-left px-4 py-3 text-xs font-medium text-slate-500 uppercase tracking-wide hidden md:table-cell">Joined</th>
                  <th className="px-4 py-3" />
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {members.map((m) => (
                  <tr key={m.id} className="hover:bg-slate-800/30 transition-colors">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <div className="h-8 w-8 rounded-full bg-indigo-600/20 flex items-center justify-center text-xs font-medium text-indigo-400">
                          {(m.name || m.email || '?')[0].toUpperCase()}
                        </div>
                        <div>
                          <p className="font-medium text-white text-sm">{m.name || '—'}</p>
                          <p className="text-xs text-slate-500">{m.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <select
                        value={m.role}
                        onChange={(e) => handleChangeRole(m.userId, e.target.value as UserRole)}
                        disabled={m.userId === session?.user?.id || !!actionLoading}
                        className="px-2 py-1 rounded-md border border-slate-700 bg-slate-800 text-xs text-slate-300 focus:outline-none focus:border-indigo-500 disabled:opacity-50"
                      >
                        {ROLE_OPTIONS.map((o) => (
                          <option key={o.value} value={o.value}>{o.label}</option>
                        ))}
                      </select>
                    </td>
                    <td className="px-4 py-3 text-xs text-slate-500 hidden md:table-cell">
                      {new Date(m.joinedAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
                    </td>
                    <td className="px-4 py-3 text-right">
                      {m.userId !== session?.user?.id && (
                        <button
                          onClick={() => handleRemoveMember(m.userId)}
                          disabled={!!actionLoading}
                          className="text-slate-600 hover:text-red-400 transition-colors disabled:opacity-40"
                          title="Remove member"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
                {members.length === 0 && (
                  <tr>
                    <td colSpan={4} className="px-4 py-8 text-center text-sm text-slate-500">No members yet.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ── Invites tab ───────────────────────────────────────────────────────── */}
      {tab === 'invites' && (
        <div className="rounded-xl border border-slate-800 bg-slate-900 overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-800">
                <th className="text-left px-4 py-3 text-xs font-medium text-slate-500 uppercase tracking-wide">Email</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-slate-500 uppercase tracking-wide">Role</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-slate-500 uppercase tracking-wide hidden md:table-cell">Expires</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {invites.map((inv) => (
                <tr key={inv.id} className="hover:bg-slate-800/30 transition-colors">
                  <td className="px-4 py-3">
                    <p className="text-white">{inv.email}</p>
                  </td>
                  <td className="px-4 py-3">
                    <RoleBadge role={inv.role} />
                  </td>
                  <td className="px-4 py-3 text-xs text-slate-500 hidden md:table-cell">
                    {new Date(inv.expiresAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}
                  </td>
                </tr>
              ))}
              {invites.length === 0 && (
                <tr>
                  <td colSpan={3} className="px-4 py-8 text-center text-sm text-slate-500">No pending invites.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* ── Billing tab ───────────────────────────────────────────────────────── */}
      {tab === 'billing' && (
        <div className="space-y-4">
          {stats && (
            <div className="rounded-xl border border-slate-800 bg-slate-900 p-6 space-y-4">
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                <div>
                  <p className="text-xs text-slate-500 mb-0.5">Plan</p>
                  <p className="text-sm font-semibold text-white capitalize">{stats.planId}</p>
                </div>
                <div>
                  <p className="text-xs text-slate-500 mb-0.5">Status</p>
                  <BillingBadge status={stats.billingStatus} />
                </div>
                <div>
                  <p className="text-xs text-slate-500 mb-0.5">Seats</p>
                  <p className="text-sm font-semibold text-white">{stats.seatsUsed} / {stats.seatCount}</p>
                </div>
                {stats.trialEndsAt && (
                  <div>
                    <p className="text-xs text-slate-500 mb-0.5">Trial ends</p>
                    <p className="text-sm font-semibold text-amber-400">
                      {new Date(stats.trialEndsAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
                    </p>
                  </div>
                )}
              </div>

              <div className="pt-4 border-t border-slate-800">
                <Button onClick={openBillingPortal} className="gap-2">
                  <CreditCard className="h-4 w-4" />
                  Manage billing &amp; subscription
                  <ExternalLink className="h-3.5 w-3.5" />
                </Button>
                <p className="text-xs text-slate-500 mt-2">
                  Opens the Stripe billing portal in a new tab. You can upgrade, downgrade, or cancel your plan, and download invoices.
                </p>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
