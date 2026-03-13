'use client'

import { Suspense, useEffect } from 'react'
import { usePathname, useSearchParams } from 'next/navigation'
import { useSession } from 'next-auth/react'
import { analyticsEnabled, POSTHOG_KEY, POSTHOG_HOST } from '@/lib/posthog'

function PostHogTracking({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const { data: session } = useSession()

  useEffect(() => {
    if (!analyticsEnabled) return

    // Dynamically import posthog-js to avoid breaking if not installed
    import('posthog-js').then(({ default: posthog }) => {
      if (!posthog.__loaded) {
        posthog.init(POSTHOG_KEY, {
          api_host: POSTHOG_HOST,
          capture_pageview: false, // manual pageview below
          persistence: 'localStorage',
        })
      }
      // Identify user if logged in
      if (session?.user?.id) {
        posthog.identify(session.user.id, {
          email: session.user.email,
          orgId: (session.user as Record<string, unknown>).orgId,
          planId: (session.user as Record<string, unknown>).planId,
        })
      }
      // Track pageview
      posthog.capture('$pageview', { $current_url: window.location.href })
    }).catch(() => {
      // posthog-js not installed yet — analytics disabled
    })
  }, [pathname, searchParams, session])

  return <>{children}</>
}

export function PostHogProvider({ children }: { children: React.ReactNode }) {
  return (
    <Suspense fallback={<>{children}</>}>
      <PostHogTracking>{children}</PostHogTracking>
    </Suspense>
  )
}
