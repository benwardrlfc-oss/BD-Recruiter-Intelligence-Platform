import type { PlanId } from './permissions'

// ── Plan definitions ──────────────────────────────────────────────────────────

export interface Plan {
  id: PlanId
  label: string
  description: string
  monthlyPrice: number | null  // USD per seat/month
  annualPrice: number | null   // USD per seat/year (billed annually)
  isCustomPricing?: boolean
  seatsNote?: string
  maxSeats: number | null // null = unlimited
  trialDays: number
  stripePriceIdMonthly?: string
  stripePriceIdAnnual?: string
  features: string[]
}

export const PLANS: Record<PlanId, Plan> = {
  trial: {
    id: 'trial',
    label: 'Free Trial',
    description: '14-day free access with core modules',
    monthlyPrice: 0,
    annualPrice: 0,
    maxSeats: 1,
    trialDays: 14,
    stripePriceIdMonthly: undefined,
    stripePriceIdAnnual: undefined,
    features: ['Dashboard', 'Market Radar', 'Companies', 'Watchlist', 'BD Scripts (3/day)', 'Candidate Matcher (2/day)'],
  },
  core: {
    id: 'core',
    label: 'Core',
    description: 'Essential BD intelligence for solo recruiters',
    monthlyPrice: 99,
    annualPrice: 79,
    maxSeats: 1,
    trialDays: 0,
    stripePriceIdMonthly: process.env.STRIPE_PRICE_CORE_MONTHLY,
    stripePriceIdAnnual: process.env.STRIPE_PRICE_CORE_ANNUAL,
    features: ['All Trial features', 'Hiring Signals', 'Capital Intelligence', 'Content Studio', 'Unlimited BD Scripts'],
  },
  pro: {
    id: 'pro',
    label: 'Pro',
    description: 'Full intelligence suite for power users',
    monthlyPrice: 179,
    annualPrice: 149,
    seatsNote: 'Up to 3 seats',
    maxSeats: 3,
    trialDays: 0,
    stripePriceIdMonthly: process.env.STRIPE_PRICE_PRO_MONTHLY,
    stripePriceIdAnnual: process.env.STRIPE_PRICE_PRO_ANNUAL,
    features: ['All Core features', 'Market Intelligence', 'Trends', 'Targets', 'Priority support'],
  },
  team: {
    id: 'team',
    label: 'Team',
    description: 'Multi-seat access for recruitment firms',
    monthlyPrice: 249,
    annualPrice: 199,
    seatsNote: 'Unlimited seats · flat rate',
    maxSeats: null,
    trialDays: 0,
    stripePriceIdMonthly: process.env.STRIPE_PRICE_TEAM_MONTHLY,
    stripePriceIdAnnual: process.env.STRIPE_PRICE_TEAM_ANNUAL,
    features: ['All Pro features', 'Unlimited seats', 'Advanced Reporting', 'Org Admin panel', 'Team management'],
  },
  enterprise: {
    id: 'enterprise',
    label: 'Enterprise',
    description: 'Custom plans for large firms',
    monthlyPrice: null,
    annualPrice: null,
    isCustomPricing: true,
    maxSeats: null,
    trialDays: 0,
    features: ['Everything in Team', 'Custom seat pricing', 'SSO / SAML', 'Dedicated support', 'SLA', 'Custom modules'],
  },
}

// ── AI usage limits by plan ───────────────────────────────────────────────────

export interface AiLimits {
  // Daily limits per user
  bdScriptsPerDay: number
  contentStudioPerDay: number
  candidateMatcherPerDay: number
  eShotPerDay: number
  // Monthly limits per org
  totalTokensPerMonth: number | null // null = unlimited
}

export const PLAN_AI_LIMITS: Record<PlanId, AiLimits> = {
  trial: {
    bdScriptsPerDay: 3,
    contentStudioPerDay: 2,
    candidateMatcherPerDay: 2,
    eShotPerDay: 3,
    totalTokensPerMonth: 500_000,
  },
  core: {
    bdScriptsPerDay: 20,
    contentStudioPerDay: 10,
    candidateMatcherPerDay: 5,
    eShotPerDay: 20,
    totalTokensPerMonth: 2_000_000,
  },
  pro: {
    bdScriptsPerDay: 50,
    contentStudioPerDay: 25,
    candidateMatcherPerDay: 15,
    eShotPerDay: 50,
    totalTokensPerMonth: 5_000_000,
  },
  team: {
    bdScriptsPerDay: 100,
    contentStudioPerDay: 50,
    candidateMatcherPerDay: 30,
    eShotPerDay: 100,
    totalTokensPerMonth: null,
  },
  enterprise: {
    bdScriptsPerDay: 999,
    contentStudioPerDay: 999,
    candidateMatcherPerDay: 999,
    eShotPerDay: 999,
    totalTokensPerMonth: null,
  },
}

// ── Stripe helpers ────────────────────────────────────────────────────────────

export function getStripe() {
  const key = process.env.STRIPE_SECRET_KEY
  if (!key) return null
  try {
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const Stripe = require('stripe')
    return new Stripe(key, { apiVersion: '2024-11-20.acacia' })
  } catch {
    return null
  }
}

export async function createStripeCustomer(orgId: string, orgName: string, email: string) {
  const stripe = getStripe()
  if (!stripe) return null
  const customer = await stripe.customers.create({
    name: orgName,
    email,
    metadata: { orgId },
  })
  return customer.id
}

export async function createCheckoutSession({
  stripeCustomerId,
  priceId,
  successUrl,
  cancelUrl,
  trialDays,
}: {
  stripeCustomerId: string
  priceId: string
  successUrl: string
  cancelUrl: string
  trialDays?: number
}) {
  const stripe = getStripe()
  if (!stripe) return null
  const session = await stripe.checkout.sessions.create({
    customer: stripeCustomerId,
    mode: 'subscription',
    payment_method_types: ['card'],
    line_items: [{ price: priceId, quantity: 1 }],
    success_url: successUrl,
    cancel_url: cancelUrl,
    subscription_data: trialDays ? { trial_period_days: trialDays } : undefined,
  })
  return session.url
}

export async function createBillingPortalSession(stripeCustomerId: string, returnUrl: string) {
  const stripe = getStripe()
  if (!stripe) return null
  const session = await stripe.billingPortal.sessions.create({
    customer: stripeCustomerId,
    return_url: returnUrl,
  })
  return session.url
}

// ── Billing status messages ───────────────────────────────────────────────────

export const BILLING_STATUS_MESSAGES: Record<string, { title: string; description: string; severity: 'info' | 'warning' | 'error' }> = {
  trialing: {
    title: 'Free Trial Active',
    description: 'Your trial gives you access to core features. Upgrade before it ends to keep full access.',
    severity: 'info',
  },
  past_due: {
    title: 'Payment Failed',
    description: 'Your last payment failed. Please update your payment method to restore full access.',
    severity: 'warning',
  },
  unpaid: {
    title: 'Account Restricted',
    description: 'Your account has been restricted due to non-payment. Update your payment method to reactivate.',
    severity: 'error',
  },
  cancelled: {
    title: 'Subscription Cancelled',
    description: 'Your subscription has been cancelled. Reactivate to restore access.',
    severity: 'error',
  },
  suspended: {
    title: 'Account Suspended',
    description: 'Your account has been suspended. Contact support for assistance.',
    severity: 'error',
  },
}
