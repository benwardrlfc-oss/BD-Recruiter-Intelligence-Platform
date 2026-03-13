import { PLAN_AI_LIMITS } from './billing'
import type { PlanId } from './permissions'
import { prisma } from '@/lib/db'

export type AiFeature =
  | 'bd_scripts'
  | 'content_studio'
  | 'candidate_matcher'
  | 'eshot'
  | 'market_briefing'
  | 'signal_explain'

// ── In-memory rate limit store (replace with Redis in production) ──────────────

const usageStore = new Map<string, { count: number; resetAt: number }>()

function getKey(userId: string, feature: AiFeature, window: 'day' | 'month') {
  const now = new Date()
  const period = window === 'day'
    ? `${now.getFullYear()}-${now.getMonth()}-${now.getDate()}`
    : `${now.getFullYear()}-${now.getMonth()}`
  return `${userId}:${feature}:${period}`
}

function getCount(key: string): number {
  const entry = usageStore.get(key)
  if (!entry) return 0
  if (Date.now() > entry.resetAt) {
    usageStore.delete(key)
    return 0
  }
  return entry.count
}

function increment(key: string, window: 'day' | 'month') {
  const resetAt = window === 'day'
    ? new Date().setHours(24, 0, 0, 0)
    : new Date(new Date().getFullYear(), new Date().getMonth() + 1, 1).getTime()
  const current = getCount(key)
  usageStore.set(key, { count: current + 1, resetAt })
}

// ── Feature → limit field mapping ─────────────────────────────────────────────

const FEATURE_LIMIT_KEY: Record<AiFeature, keyof ReturnType<typeof PLAN_AI_LIMITS[PlanId]['bdScriptsPerDay' extends string ? 'bdScriptsPerDay' : never]> | string> = {
  bd_scripts: 'bdScriptsPerDay',
  content_studio: 'contentStudioPerDay',
  candidate_matcher: 'candidateMatcherPerDay',
  eshot: 'eShotPerDay',
  market_briefing: 'bdScriptsPerDay', // shares BD script limit
  signal_explain: 'contentStudioPerDay',
}

// ── Public API ────────────────────────────────────────────────────────────────

export interface UsageCheckResult {
  allowed: boolean
  remaining: number
  limit: number
  reason?: string
}

export function checkAiUsage(
  userId: string,
  feature: AiFeature,
  planId: PlanId,
): UsageCheckResult {
  const limits = PLAN_AI_LIMITS[planId]
  const limitKey = FEATURE_LIMIT_KEY[feature]
  const limit = (limits as Record<string, number | null>)[limitKey] ?? 0

  if (limit === null) return { allowed: true, remaining: 999, limit: 999 }

  const key = getKey(userId, feature, 'day')
  const used = getCount(key)
  const remaining = Math.max(0, limit - used)

  if (used >= limit) {
    return {
      allowed: false,
      remaining: 0,
      limit,
      reason: `Daily limit reached for ${feature.replace('_', ' ')}. Resets at midnight.`,
    }
  }

  return { allowed: true, remaining, limit }
}

export function recordAiUsage(
  userId: string,
  feature: AiFeature,
  planId: PlanId,
  meta?: { inputTokens?: number; outputTokens?: number; cacheHit?: boolean; model?: string },
  orgId?: string,
) {
  const key = getKey(userId, feature, 'day')
  increment(key, 'day')

  const estimatedCost = ((meta?.inputTokens || 0) * 3 + (meta?.outputTokens || 0) * 15) / 1_000_000

  if (process.env.NODE_ENV === 'development') {
    console.log(`[AI Usage] user=${userId} feature=${feature} tokens=${meta?.inputTokens}/${meta?.outputTokens} cost=$${estimatedCost.toFixed(4)} cache=${meta?.cacheHit}`)
  }

  // Fire-and-forget DB persistence (in-memory store is fallback when DB unavailable)
  if (prisma) {
    prisma.aiUsageLog.create({
      data: {
        userId,
        orgId: orgId || 'unknown',
        feature,
        model: meta?.model || 'claude-sonnet-4-6',
        inputTokens: meta?.inputTokens || 0,
        outputTokens: meta?.outputTokens || 0,
        estimatedCost,
        cacheHit: meta?.cacheHit || false,
      },
    }).catch(() => {}) // don't block the response
  }
}

export function getRemainingUsage(userId: string, planId: PlanId): Record<AiFeature, { used: number; limit: number }> {
  const limits = PLAN_AI_LIMITS[planId]
  const features: AiFeature[] = ['bd_scripts', 'content_studio', 'candidate_matcher', 'eshot', 'market_briefing', 'signal_explain']
  const result: Record<string, { used: number; limit: number }> = {}
  for (const feature of features) {
    const limitKey = FEATURE_LIMIT_KEY[feature]
    const limit = (limits as Record<string, number | null>)[limitKey] ?? 0
    const used = getCount(getKey(userId, feature, 'day'))
    result[feature] = { used, limit: limit ?? 999 }
  }
  return result as Record<AiFeature, { used: number; limit: number }>
}

// ── Simple response cache (in-memory, production should use Redis) ─────────────

const responseCache = new Map<string, { data: string; cachedAt: number; ttlMs: number }>()

export function getCachedResponse(cacheKey: string): string | null {
  const entry = responseCache.get(cacheKey)
  if (!entry) return null
  if (Date.now() - entry.cachedAt > entry.ttlMs) {
    responseCache.delete(cacheKey)
    return null
  }
  return entry.data
}

export function setCachedResponse(cacheKey: string, data: string, ttlMs = 3_600_000) {
  responseCache.set(cacheKey, { data, cachedAt: Date.now(), ttlMs })
}

export function buildCacheKey(feature: AiFeature, ...parts: string[]): string {
  return `${feature}:${parts.join(':')}`.substring(0, 200)
}
