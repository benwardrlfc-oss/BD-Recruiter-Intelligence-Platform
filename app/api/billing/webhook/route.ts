import { NextRequest, NextResponse } from 'next/server'
import { headers } from 'next/headers'
import { getStripe } from '@/lib/billing'
import { prisma } from '@/lib/db'
import type Stripe from 'stripe'

// ── POST /api/billing/webhook ──────────────────────────────────────────────────
// Stripe sends signed events here. Verifies signature then updates billing state.

export async function POST(req: NextRequest) {
  const stripe = getStripe()
  if (!stripe) {
    return NextResponse.json({ error: 'Stripe not configured.' }, { status: 500 })
  }

  const body = await req.text()
  const sig = (await headers()).get('stripe-signature')
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET

  if (!sig || !webhookSecret) {
    return NextResponse.json({ error: 'Missing webhook signature.' }, { status: 400 })
  }

  let event: Stripe.Event
  try {
    event = stripe.webhooks.constructEvent(body, sig, webhookSecret)
  } catch (err) {
    console.error('[webhook] signature verification failed:', err)
    return NextResponse.json({ error: 'Webhook signature invalid.' }, { status: 400 })
  }

  if (!prisma) {
    return NextResponse.json({ error: 'Database unavailable.' }, { status: 503 })
  }

  // ── Event handlers ──────────────────────────────────────────────────────────

  try {
    switch (event.type) {

      // Subscription created or updated
      case 'customer.subscription.created':
      case 'customer.subscription.updated': {
        const sub = event.data.object as Stripe.Subscription
        const customerId = sub.customer as string
        const org = await prisma.organisation.findFirst({ where: { stripeCustomerId: customerId } })
        if (!org) break

        const billingStatus = mapSubStatus(sub.status)
        const priceId = sub.items.data[0]?.price.id ?? ''

        await prisma.organisation.update({
          where: { id: org.id },
          data: {
            billingStatus,
            stripeSubscriptionId: sub.id,
          },
        })

        await prisma.subscription.upsert({
          where: { orgId: org.id },
          create: {
            orgId: org.id,
            stripeSubId: sub.id,
            stripePriceId: priceId,
            status: sub.status,
            currentPeriodStart: new Date(sub.current_period_start * 1000),
            currentPeriodEnd: new Date(sub.current_period_end * 1000),
            cancelAtPeriodEnd: sub.cancel_at_period_end,
            trialEnd: sub.trial_end ? new Date(sub.trial_end * 1000) : null,
          },
          update: {
            stripeSubId: sub.id,
            stripePriceId: priceId,
            status: sub.status,
            currentPeriodStart: new Date(sub.current_period_start * 1000),
            currentPeriodEnd: new Date(sub.current_period_end * 1000),
            cancelAtPeriodEnd: sub.cancel_at_period_end,
            trialEnd: sub.trial_end ? new Date(sub.trial_end * 1000) : null,
          },
        })
        break
      }

      // Subscription deleted (cancelled)
      case 'customer.subscription.deleted': {
        const sub = event.data.object as Stripe.Subscription
        const customerId = sub.customer as string
        const org = await prisma.organisation.findFirst({ where: { stripeCustomerId: customerId } })
        if (!org) break

        await prisma.organisation.update({
          where: { id: org.id },
          data: { billingStatus: 'cancelled' },
        })
        await prisma.subscription.updateMany({
          where: { orgId: org.id },
          data: { status: 'canceled' },
        })
        break
      }

      // Payment succeeded
      case 'invoice.payment_succeeded': {
        const invoice = event.data.object as Stripe.Invoice
        const customerId = invoice.customer as string
        const org = await prisma.organisation.findFirst({ where: { stripeCustomerId: customerId } })
        if (!org) break

        await prisma.organisation.update({
          where: { id: org.id },
          data: { billingStatus: 'active' },
        })
        break
      }

      // Payment failed
      case 'invoice.payment_failed': {
        const invoice = event.data.object as Stripe.Invoice
        const customerId = invoice.customer as string
        const org = await prisma.organisation.findFirst({ where: { stripeCustomerId: customerId } })
        if (!org) break

        await prisma.organisation.update({
          where: { id: org.id },
          data: { billingStatus: 'past_due' },
        })
        break
      }

      // Trial ending soon (3 days before)
      case 'customer.subscription.trial_will_end': {
        const sub = event.data.object as Stripe.Subscription
        const customerId = sub.customer as string
        const org = await prisma.organisation.findFirst({ where: { stripeCustomerId: customerId } })
        if (!org) break
        // In production: send trial-ending-soon email to org admins
        console.log(`[webhook] trial ending soon for org ${org.id}`)
        break
      }

      default:
        // Unhandled event type — safe to ignore
        break
    }

    return NextResponse.json({ received: true })
  } catch (err) {
    console.error('[webhook] handler error:', err)
    return NextResponse.json({ error: 'Webhook handler failed.' }, { status: 500 })
  }
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function mapSubStatus(stripeStatus: string): string {
  const map: Record<string, string> = {
    active: 'active',
    trialing: 'trialing',
    past_due: 'past_due',
    unpaid: 'unpaid',
    canceled: 'cancelled',
    paused: 'suspended',
    incomplete: 'past_due',
    incomplete_expired: 'cancelled',
  }
  return map[stripeStatus] ?? 'active'
}
