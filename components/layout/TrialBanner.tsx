'use client'

import { useState } from 'react'
import { useSession } from 'next-auth/react'
import { X } from 'lucide-react'
import Link from 'next/link'

export function TrialBanner() {
  const { data: session } = useSession()
  const [dismissed, setDismissed] = useState(false)

  if (dismissed) return null

  const billingStatus = session?.user?.billingStatus

  if (!billingStatus || billingStatus === 'active') return null
  if (billingStatus !== 'trialing' && billingStatus !== 'past_due') return null

  const isTrialing = billingStatus === 'trialing'
  const isPastDue = billingStatus === 'past_due'

  return (
    <div
      className={`relative flex items-center justify-between gap-4 px-4 py-2.5 text-sm ${
        isPastDue
          ? 'bg-red-600/90 text-white'
          : 'bg-amber-500/90 text-amber-950'
      }`}
    >
      <div className="flex items-center gap-2 min-w-0">
        {isTrialing && (
          <span>
            Your trial is active &mdash; upgrade to keep full access.
          </span>
        )}
        {isPastDue && (
          <span>
            Payment failed &mdash; please update your billing details.
          </span>
        )}
        <Link
          href="/org-admin?tab=billing"
          className={`shrink-0 font-semibold underline underline-offset-2 hover:no-underline ${
            isPastDue ? 'text-white' : 'text-amber-950'
          }`}
        >
          Upgrade
        </Link>
      </div>
      <button
        onClick={() => setDismissed(true)}
        aria-label="Dismiss banner"
        className={`shrink-0 rounded p-0.5 transition-opacity hover:opacity-70 ${
          isPastDue ? 'text-white' : 'text-amber-950'
        }`}
      >
        <X className="h-4 w-4" />
      </button>
    </div>
  )
}
