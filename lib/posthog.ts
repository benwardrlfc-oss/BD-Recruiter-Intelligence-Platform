// Product analytics — PostHog
// Set NEXT_PUBLIC_POSTHOG_KEY in .env to enable
export const POSTHOG_KEY = process.env.NEXT_PUBLIC_POSTHOG_KEY || ''
export const POSTHOG_HOST = process.env.NEXT_PUBLIC_POSTHOG_HOST || 'https://app.posthog.com'
export const analyticsEnabled = Boolean(POSTHOG_KEY)
