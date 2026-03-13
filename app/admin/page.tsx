import { getServerSession } from 'next-auth'
import { redirect } from 'next/navigation'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/db'
import {
  Building2, Users, CreditCard, TrendingUp, AlertTriangle, CheckCircle,
  Clock, XCircle,
} from 'lucide-react'

// ── Stat card ──────────────────────────────────────────────────────────────────

function StatCard({ label, value, sub, icon: Icon, color = 'indigo' }: {
  label: string
  value: string | number
  sub?: string
  icon: React.ElementType
  color?: 'indigo' | 'emerald' | 'amber' | 'red'
}) {
  const bg: Record<string, string> = {
    indigo: 'bg-indigo-600/15 text-indigo-400',
    emerald: 'bg-emerald-600/15 text-emerald-400',
    amber: 'bg-amber-600/15 text-amber-400',
    red: 'bg-red-600/15 text-red-400',
  }
  return (
    <div className="rounded-xl border border-slate-800 bg-slate-900 p-5">
      <div className="flex items-start justify-between mb-3">
        <p className="text-xs font-medium text-slate-500 uppercase tracking-wide">{label}</p>
        <div className={`h-8 w-8 rounded-lg flex items-center justify-center ${bg[color]}`}>
          <Icon className="h-4 w-4" />
        </div>
      </div>
      <p className="text-2xl font-bold text-white">{value}</p>
      {sub && <p className="text-xs text-slate-500 mt-1">{sub}</p>}
    </div>
  )
}

// ── Status badge ───────────────────────────────────────────────────────────────

function StatusBadge({ status }: { status: string }) {
  const cfg: Record<string, { cls: string; icon: React.ElementType }> = {
    active:    { cls: 'bg-emerald-900/30 text-emerald-400 border-emerald-700/40', icon: CheckCircle },
    trialing:  { cls: 'bg-indigo-900/30  text-indigo-400  border-indigo-700/40',  icon: Clock },
    past_due:  { cls: 'bg-amber-900/30   text-amber-400   border-amber-700/40',   icon: AlertTriangle },
    unpaid:    { cls: 'bg-red-900/30     text-red-400     border-red-700/40',     icon: AlertTriangle },
    cancelled: { cls: 'bg-slate-700/30   text-slate-400   border-slate-600/40',   icon: XCircle },
    suspended: { cls: 'bg-red-900/30     text-red-400     border-red-700/40',     icon: XCircle },
  }
  const { cls, icon: Icon } = cfg[status] ?? cfg.active
  return (
    <span className={`inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full border font-medium ${cls}`}>
      <Icon className="h-3 w-3" />
      {status.replace('_', ' ')}
    </span>
  )
}

// ── Page (server component) ───────────────────────────────────────────────────

export default async function AdminOverviewPage() {
  const session = await getServerSession(authOptions)
  if (!session?.user?.isSuperAdmin) redirect('/dashboard')

  // ── Load stats from DB (graceful fallback if prisma unavailable) ──────────
  let orgs: Array<{
    id: string
    name: string
    billingStatus: string
    planId: string
    seatsUsed: number
    seatCount: number
    createdAt: Date
    _count: { members: number }
  }> = []

  let totalUsers = 0

  if (prisma) {
    try {
      [orgs, totalUsers] = await Promise.all([
        prisma.organisation.findMany({
          orderBy: { createdAt: 'desc' },
          take: 50,
          select: {
            id: true,
            name: true,
            billingStatus: true,
            planId: true,
            seatsUsed: true,
            seatCount: true,
            createdAt: true,
            _count: { select: { members: true } },
          },
        }),
        prisma.user.count(),
      ])
    } catch {
      // DB unavailable
    }
  }

  const activeOrgs = orgs.filter((o) => o.billingStatus === 'active').length
  const trialingOrgs = orgs.filter((o) => o.billingStatus === 'trialing').length
  const atRiskOrgs = orgs.filter((o) => ['past_due', 'unpaid'].includes(o.billingStatus)).length

  return (
    <div className="max-w-6xl mx-auto px-6 py-8 space-y-8">

      {/* Header */}
      <div>
        <h1 className="text-xl font-bold text-white">Platform Overview</h1>
        <p className="text-sm text-slate-400 mt-0.5">Logged in as {session.user.email}</p>
      </div>

      {/* Stats grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard label="Total orgs" value={orgs.length} icon={Building2} />
        <StatCard label="Total users" value={totalUsers} icon={Users} />
        <StatCard label="Active" value={activeOrgs} sub={`${trialingOrgs} trialing`} icon={CheckCircle} color="emerald" />
        <StatCard label="At risk" value={atRiskOrgs} sub="Past due or unpaid" icon={AlertTriangle} color="amber" />
      </div>

      {/* Organisations table */}
      <div>
        <h2 className="text-base font-semibold text-white mb-3">Organisations</h2>
        <div className="rounded-xl border border-slate-800 bg-slate-900 overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-800">
                <th className="text-left px-4 py-3 text-xs font-medium text-slate-500 uppercase tracking-wide">Organisation</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-slate-500 uppercase tracking-wide">Status</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-slate-500 uppercase tracking-wide hidden sm:table-cell">Plan</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-slate-500 uppercase tracking-wide hidden md:table-cell">Members</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-slate-500 uppercase tracking-wide hidden lg:table-cell">Seats</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-slate-500 uppercase tracking-wide hidden lg:table-cell">Created</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {orgs.map((org) => (
                <tr key={org.id} className="hover:bg-slate-800/30 transition-colors">
                  <td className="px-4 py-3">
                    <p className="font-medium text-white">{org.name}</p>
                    <p className="text-xs text-slate-500 mt-0.5 truncate max-w-[200px]">{org.id}</p>
                  </td>
                  <td className="px-4 py-3">
                    <StatusBadge status={org.billingStatus} />
                  </td>
                  <td className="px-4 py-3 text-xs text-slate-400 capitalize hidden sm:table-cell">{org.planId}</td>
                  <td className="px-4 py-3 text-xs text-slate-400 hidden md:table-cell">{org._count.members}</td>
                  <td className="px-4 py-3 text-xs text-slate-400 hidden lg:table-cell">{org.seatsUsed}/{org.seatCount}</td>
                  <td className="px-4 py-3 text-xs text-slate-500 hidden lg:table-cell">
                    {org.createdAt.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
                  </td>
                </tr>
              ))}
              {orgs.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-4 py-12 text-center text-sm text-slate-500">
                    {prisma ? 'No organisations yet.' : 'Database unavailable — connect DATABASE_URL to see live data.'}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
