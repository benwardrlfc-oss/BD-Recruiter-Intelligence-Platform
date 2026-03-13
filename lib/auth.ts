import { NextAuthOptions } from 'next-auth'
import CredentialsProvider from 'next-auth/providers/credentials'
import GoogleProvider from 'next-auth/providers/google'
import AzureADProvider from 'next-auth/providers/azure-ad'
import bcrypt from 'bcryptjs'
import { prisma } from '@/lib/db'
import { PLAN_MODULES } from '@/lib/permissions'
import type { PlanId } from '@/lib/permissions'

// ── Type augmentation ─────────────────────────────────────────────────────────

declare module 'next-auth' {
  interface Session {
    user: {
      id: string
      name?: string | null
      email?: string | null
      image?: string | null
      // Org context
      orgId?: string
      orgName?: string
      orgRole?: string
      billingStatus?: string
      planId?: string
      enabledModules?: string[]
      // User state
      hasCompletedOnboarding?: boolean
      isSuperAdmin?: boolean
      colorPalette?: string
    }
  }
}

declare module 'next-auth/jwt' {
  interface JWT {
    id?: string
    orgId?: string
    orgName?: string
    orgRole?: string
    billingStatus?: string
    planId?: string
    enabledModules?: string[]
    hasCompletedOnboarding?: boolean
    isSuperAdmin?: boolean
    colorPalette?: string
  }
}

// ── Demo session (no DB required) ─────────────────────────────────────────────

const DEMO_USER = {
  id: 'demo-user',
  email: 'demo@bdintelligence.ai',
  name: 'Demo User',
  image: null,
  isSuperAdmin: false,
  hasCompletedOnboarding: true,
  orgId: 'demo-org',
  orgName: 'Demo Organisation',
  orgRole: 'org_admin',
  billingStatus: 'trialing',
  planId: 'trial' as PlanId,
  enabledModules: PLAN_MODULES['trial'],
  colorPalette: 'dark',
}

// ── Auth config ───────────────────────────────────────────────────────────────

export const authOptions: NextAuthOptions = {
  session: { strategy: 'jwt' },
  pages: { signIn: '/login' },

  providers: [
    // Google OAuth
    ...(process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET
      ? [GoogleProvider({
          clientId: process.env.GOOGLE_CLIENT_ID,
          clientSecret: process.env.GOOGLE_CLIENT_SECRET,
        })]
      : []),

    // Microsoft / Azure AD
    ...(process.env.AZURE_AD_CLIENT_ID && process.env.AZURE_AD_CLIENT_SECRET && process.env.AZURE_AD_TENANT_ID
      ? [AzureADProvider({
          clientId: process.env.AZURE_AD_CLIENT_ID,
          clientSecret: process.env.AZURE_AD_CLIENT_SECRET,
          tenantId: process.env.AZURE_AD_TENANT_ID,
        })]
      : []),

    // Email + password
    CredentialsProvider({
      name: 'credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) return null

        // Demo bypass
        if (credentials.email === 'demo@bdintelligence.ai' && credentials.password === 'demo1234') {
          return { id: DEMO_USER.id, email: DEMO_USER.email, name: DEMO_USER.name, image: null }
        }

        if (!prisma) return null

        try {
          const user = await prisma.user.findUnique({ where: { email: credentials.email } })
          if (!user || !user.password) return null
          const isValid = await bcrypt.compare(credentials.password, user.password)
          if (!isValid) return null
          return { id: user.id, email: user.email, name: user.name, image: user.image }
        } catch {
          return null
        }
      },
    }),
  ],

  callbacks: {
    async jwt({ token, user, trigger, session }) {
      // On initial sign-in, attach user ID
      if (user) {
        token.id = user.id

        // Demo user shortcut
        if (user.id === 'demo-user') {
          Object.assign(token, {
            orgId: DEMO_USER.orgId,
            orgName: DEMO_USER.orgName,
            orgRole: DEMO_USER.orgRole,
            billingStatus: DEMO_USER.billingStatus,
            planId: DEMO_USER.planId,
            enabledModules: DEMO_USER.enabledModules,
            hasCompletedOnboarding: DEMO_USER.hasCompletedOnboarding,
            isSuperAdmin: DEMO_USER.isSuperAdmin,
            colorPalette: DEMO_USER.colorPalette,
          })
          return token
        }

        // Load org membership from DB
        if (prisma) {
          try {
            const dbUser = await prisma.user.findUnique({
              where: { id: user.id },
              include: {
                memberships: {
                  include: { org: { select: { id: true, name: true, billingStatus: true, planId: true, enabledModules: true } } },
                  take: 1,
                  orderBy: { createdAt: 'asc' },
                },
              },
            })

            if (dbUser) {
              token.hasCompletedOnboarding = dbUser.hasCompletedOnboarding
              token.isSuperAdmin = dbUser.isSuperAdmin
              token.colorPalette = dbUser.colorPalette

              const membership = dbUser.memberships[0]
              if (membership) {
                const planId = (membership.org.planId as PlanId) || 'trial'
                token.orgId = membership.org.id
                token.orgName = membership.org.name
                token.orgRole = membership.role
                token.billingStatus = membership.org.billingStatus
                token.planId = planId
                token.enabledModules = membership.org.enabledModules.length
                  ? membership.org.enabledModules
                  : PLAN_MODULES[planId]
              }
            }
          } catch {
            // DB unavailable — use minimal defaults
          }
        }
      }

      // Handle session update (e.g. after settings change)
      if (trigger === 'update' && session) {
        if (session.colorPalette) token.colorPalette = session.colorPalette
        if (session.hasCompletedOnboarding !== undefined) token.hasCompletedOnboarding = session.hasCompletedOnboarding
      }

      return token
    },

    async session({ session, token }) {
      if (token && session.user) {
        session.user.id = token.id as string
        session.user.orgId = token.orgId
        session.user.orgName = token.orgName
        session.user.orgRole = token.orgRole
        session.user.billingStatus = token.billingStatus
        session.user.planId = token.planId
        session.user.enabledModules = token.enabledModules
        session.user.hasCompletedOnboarding = token.hasCompletedOnboarding
        session.user.isSuperAdmin = token.isSuperAdmin
        session.user.colorPalette = token.colorPalette
      }
      return session
    },
  },
}
