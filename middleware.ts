import { withAuth } from 'next-auth/middleware'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

// ── Route groups ──────────────────────────────────────────────────────────────

const PUBLIC_ROUTES = [
  '/login', '/register', '/invite', '/forgot-password', '/reset-password',
  '/api/auth', '/api/register', '/api/invite',
]

const ADMIN_ROUTES = ['/admin']
const ORG_ADMIN_ROUTES = ['/org-admin']

// ── Middleware ────────────────────────────────────────────────────────────────

export default withAuth(
  function middleware(req: NextRequest & { nextauth: { token: Record<string, unknown> | null } }) {
    const { pathname } = req.nextUrl
    const token = req.nextauth.token

    // Allow public routes
    if (PUBLIC_ROUTES.some((r) => pathname.startsWith(r))) {
      return NextResponse.next()
    }

    // Require authentication for all other routes
    if (!token) {
      const loginUrl = new URL('/login', req.url)
      loginUrl.searchParams.set('callbackUrl', pathname)
      return NextResponse.redirect(loginUrl)
    }

    // Platform admin panel — requires super_admin
    if (ADMIN_ROUTES.some((r) => pathname.startsWith(r))) {
      if (!token.isSuperAdmin) {
        return NextResponse.redirect(new URL('/dashboard', req.url))
      }
      return NextResponse.next()
    }

    // Org admin — requires org_admin or super_admin
    if (ORG_ADMIN_ROUTES.some((r) => pathname.startsWith(r))) {
      const role = token.orgRole as string | undefined
      if (role !== 'org_admin' && !token.isSuperAdmin) {
        return NextResponse.redirect(new URL('/dashboard', req.url))
      }
      return NextResponse.next()
    }

    // Billing gate — restricted/suspended accounts
    const billingStatus = token.billingStatus as string | undefined
    if (billingStatus && ['cancelled', 'suspended'].includes(billingStatus)) {
      // Allow org admins to reach settings/billing, block everyone else
      const role = token.orgRole as string | undefined
      const isAdminRoute = pathname.includes('/settings') || pathname.includes('/org-admin')
      if (!isAdminRoute && role !== 'org_admin') {
        return NextResponse.redirect(new URL('/billing-restricted', req.url))
      }
    }

    // Onboarding gate — redirect incomplete users to onboarding
    if (!token.hasCompletedOnboarding && !pathname.startsWith('/onboarding') && !pathname.startsWith('/api')) {
      return NextResponse.redirect(new URL('/onboarding', req.url))
    }

    return NextResponse.next()
  },
  {
    callbacks: {
      // Allow the middleware function to run for all matched routes
      authorized: () => true,
    },
  }
)

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.png|.*\\.jpg|.*\\.svg).*)',
  ],
}
