'use client'

import { useSession, signOut } from 'next-auth/react'
import { AlertTriangle, CreditCard, Mail, LogOut } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { BILLING_STATUS_MESSAGES } from '@/lib/billing'

export default function BillingRestrictedPage() {
  const { data: session } = useSession()
  const status = (session?.user?.billingStatus ?? 'suspended') as string
  const msg = BILLING_STATUS_MESSAGES[status] ?? BILLING_STATUS_MESSAGES['suspended']

  const openPortal = async () => {
    const res = await fetch('/api/billing/portal', { method: 'POST' })
    const data = await res.json()
    if (data.url) window.open(data.url, '_blank')
  }

  const isAdmin = session?.user?.orgRole === 'org_admin' || session?.user?.isSuperAdmin

  return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="rounded-2xl border border-slate-800 bg-slate-900 p-8 shadow-2xl shadow-slate-950/50 text-center">

          <div className={`inline-flex h-14 w-14 items-center justify-center rounded-2xl mb-4 ${
            msg.severity === 'error'
              ? 'bg-red-900/20 border border-red-800/60'
              : 'bg-amber-900/20 border border-amber-800/60'
          }`}>
            <AlertTriangle className={`h-7 w-7 ${msg.severity === 'error' ? 'text-red-400' : 'text-amber-400'}`} />
          </div>

          <h1 className="text-lg font-bold text-white mb-2">{msg.title}</h1>
          <p className="text-sm text-slate-400 mb-6">{msg.description}</p>

          <div className="space-y-3">
            {isAdmin ? (
              <Button onClick={openPortal} className="w-full gap-2">
                <CreditCard className="h-4 w-4" />
                Manage billing
              </Button>
            ) : (
              <div className="rounded-xl border border-slate-800 bg-slate-800/40 px-4 py-3 text-sm text-slate-400 flex items-center gap-2">
                <Mail className="h-4 w-4 text-slate-500 shrink-0" />
                Contact your organisation admin to restore access.
              </div>
            )}

            <Button
              variant="secondary"
              className="w-full gap-2"
              onClick={() => signOut({ callbackUrl: '/login' })}
            >
              <LogOut className="h-4 w-4" />
              Sign out
            </Button>
          </div>

          {session?.user?.orgName && (
            <p className="text-xs text-slate-600 mt-5">
              Organisation: {session.user.orgName}
            </p>
          )}
        </div>
      </div>
    </div>
  )
}
