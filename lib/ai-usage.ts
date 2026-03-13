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

// ── Feature → billing limit field mapping ─────────────────────────────────────

const FEATURE_LIMIT_KEY: Record<AiFeature, string> = {
  bd_scripts: 'bdScriptsPerDay',
  content_studio: 'contentStudioPerDay',
  candidate_matcher: 'candidateMatcherPerDay',
  eshot: 'eShotPerDay',
  market_briefing: 'bdScriptsPerDay',  // shares BD script limit
  signal_explain: 'contentStudioPerDay',
}

// ── Public API ────────────────────────────────────────────────────────────────

export interface UsageCheckResult {
  allowed: boolean
  remaining: number
  limit: number
  reason?: string
}

/**
 * Check whether a user is within their AI usage limit for today.
 * Reads from the AiUsageLog DB table so limits survive serverless restarts.
 * Falls back to allowing the request when the DB is unavailable.
 */
export async function checkAiUsage(
  userId: string,
  feature: AiFeature,
  planId: PlanId,
): Promise<UsageCheckResult> {
  const limits = PLAN_AI_LIMITS[planId]
  const limitKey = FEATURE_LIMIT_KEY[feature]
  const limit = (limits as Record<string, number | null>)[limitKey] ?? 0

  // null = unlimited (enterprise plan)
  if (limit === null) return { allowed: true, remaining: 999, limit: 999 }

  try {
    if (prisma) {
      const startOfDay = new Date()
      startOfDay.setHours(0, 0, 0, 0)

      const used = await prisma.aiUsageLog.count({
        where: { userId, feature, createdAt: { gte: startOfDay } },
      })

      const remaining = Math.max(0, limit - used)

      if (used >= limit) {
        return {
          allowed: false,
          remaining: 0,
          limit,
          reason: `Daily limit of ${limit} reached for ${feature.replace(/_/g, ' ')}. Resets at midnight.`,
        }
      }

      return { allowed: true, remaining, limit }
    }
  } catch {
    // DB unavailable — allow request rather than block users
  }

  return { allowed: true, remaining: limit, limit }
}

/**
 * Record an AI usage event. Fire-and-forget.
 */
export function recordAiUsage(
  userId: string,
  feature: AiFeature,
  planId: PlanId,
  meta?: { inputTokens?: number; outputTokens?: number; cacheHit?: boolean; model?: string },
  orgId?: string,
) {
  const estimatedCost = ((meta?.inputTokens || 0) * 3 + (meta?.outputTokens || 0) * 15) / 1_000_000

  if (process.env.NODE_ENV === 'development') {
    console.log(
      `[AI Usage] user=${userId} feature=${feature} ` +
      `tokens=${meta?.inputTokens}/${meta?.outputTokens} ` +
      `cost=$${estimatedCost.toFixed(4)} cache=${meta?.cacheHit}`,
    )
  }

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
    }).catch(() => {})
  }
}

/**
 * Get usage summary for all AI features for a user today.
 */
export async function getRemainingUsage(
  userId: string,
  planId: PlanId,
): Promise<Record<AiFeature, { used: number; limit: number }>> {
  const limits = PLAN_AI_LIMITS[planId]
  const features: AiFeature[] = ['bd_scripts', 'content_studio', 'candidate_matcher', 'eshot', 'market_briefing', 'signal_explain']
  const result: Record<string, { used: number; limit: number }> = {}

  try {
    if (prisma) {
      const startOfDay = new Date()
      startOfDay.setHours(0, 0, 0, 0)

      const counts = await prisma.aiUsageLog.groupBy({
        by: ['feature'],
        where: { userId, createdAt: { gte: startOfDay } },
        _count: { feature: true },
      })

      const countMap: Record<string, number> = {}
      for (const c of counts) countMap[c.feature] = c._count.feature

      for (const feature of features) {
        const limitKey = FEATURE_LIMIT_KEY[feature]
        const limit = (limits as Record<string, number | null>)[limitKey] ?? 0
        result[feature] = { used: countMap[feature] ?? 0, limit: limit ?? 999 }
      }
      return result as Record<AiFeature, { used: number; limit: number }>
    }
  } catch {}

  // Fallback: assume 0 used
  for (const feature of features) {
    const limitKey = FEATURE_LIMIT_KEY[feature]
    const limit = (limits as Record<string, number | null>)[limitKey] ?? 0
    result[feature] = { used: 0, limit: limit ?? 999 }
  }
  return result as Record<AiFeature, { used: number; limit: number }>
}

// ── In-process response cache ─────────────────────────────────────────────────
// Per-execution caching only; use Redis for cross-request deduplication.

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
