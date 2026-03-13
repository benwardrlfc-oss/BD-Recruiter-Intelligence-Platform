'use client'

import Link from 'next/link'
import { Lock } from 'lucide-react'
import { useSession } from 'next-auth/react'
import { canAccessModule, ModuleId } from '@/lib/permissions'
import { Button } from '@/components/ui/button'

interface UpgradeGateProps {
  moduleId: string
  moduleName: string
  description: string
  minPlan: string
  ctaDetail?: string
  children: React.ReactNode
}

export function UpgradeGate({
  moduleId,
  moduleName,
  description,
  minPlan,
  ctaDetail,
  children,
}: UpgradeGateProps) {
  const { data: session, status } = useSession()

  // During session load, show a minimal skeleton rather than unguarded content
  if (status === 'loading') {
    return (
      <div className="animate-pulse space-y-4 p-6">
        <div className="h-8 bg-slate-800 rounded-lg w-1/3" />
        <div className="h-40 bg-slate-800/50 rounded-xl" />
        <div className="h-40 bg-slate-800/50 rounded-xl" />
      </div>
    )
  }
  // No session = demo/dev mode, render normally
  if (!session) return <>{children}</>

  const enabledModules: string[] =
    (session.user?.enabledModules as string[] | undefined) ?? []
  const role =
    (session.user?.orgRole as Parameters<typeof canAccessModule>[2] | undefined) ?? 'member'
  const billingStatus =
    (session.user?.billingStatus as Parameters<typeof canAccessModule>[3] | undefined) ?? 'trialing'

  const hasAccess = canAccessModule(
    moduleId as ModuleId,
    enabledModules,
    role,
    billingStatus,
  )

  if (hasAccess) {
    return <>{children}</>
  }

  return (
    <div className="flex items-center justify-center min-h-[60vh]">
      <div className="w-full max-w-md mx-auto text-center">
        <div className="rounded-2xl border border-slate-800 bg-slate-900 p-10 shadow-2xl">
          {/* Lock icon */}
          <div className="flex items-center justify-center mb-6">
            <div className="h-16 w-16 rounded-2xl bg-slate-800 border border-slate-700 flex items-center justify-center">
              <Lock className="h-8 w-8 text-slate-400" />
            </div>
          </div>

          {/* Module name */}
          <h2 className="text-xl font-bold text-white mb-3">{moduleName}</h2>

          {/* Description */}
          <p className="text-sm text-slate-400 leading-relaxed mb-5">{description}</p>
          {ctaDetail && (
            <p className="text-xs text-indigo-300/70 leading-relaxed mb-5 -mt-2">{ctaDetail}</p>
          )}

          {/* Plan requirement */}
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-indigo-600/15 border border-indigo-500/20 mb-8">
            <Lock className="h-3 w-3 text-indigo-400" />
            <span className="text-xs font-medium text-indigo-300">
              Available on {minPlan} plan and above
            </span>
          </div>

          {/* Actions */}
          <div className="space-y-3">
            <Button asChild className="w-full" size="lg">
              <Link href="/org-admin?tab=billing">Upgrade Plan</Link>
            </Button>
            <Link
              href="/org-admin?tab=billing"
              className="block text-sm text-slate-400 hover:text-slate-300 transition-colors"
            >
              View Plans
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
