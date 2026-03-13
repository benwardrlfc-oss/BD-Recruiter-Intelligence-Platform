// ── Role definitions ──────────────────────────────────────────────────────────

export type UserRole = 'super_admin' | 'org_admin' | 'team_manager' | 'member' | 'read_only'

export type BillingStatus = 'trialing' | 'active' | 'past_due' | 'unpaid' | 'cancelled' | 'suspended'

export type PlanId = 'trial' | 'core' | 'pro' | 'team' | 'enterprise'

// ── Module IDs ────────────────────────────────────────────────────────────────

export type ModuleId =
  | 'dashboard'
  | 'radar'
  | 'hiring_signals'
  | 'companies'
  | 'capital_intelligence'
  | 'watchlist'
  | 'candidate_matcher'
  | 'bd_scripts'
  | 'content_studio'
  | 'market_intelligence'
  | 'trends'
  | 'targets'
  | 'reporting'
  | 'org_admin'

// ── Plan → module entitlements ────────────────────────────────────────────────

export const PLAN_MODULES: Record<PlanId, ModuleId[]> = {
  trial: [
    'dashboard', 'radar', 'companies', 'watchlist',
    'bd_scripts', 'candidate_matcher',
  ],
  core: [
    'dashboard', 'radar', 'hiring_signals', 'companies',
    'capital_intelligence', 'watchlist', 'candidate_matcher',
    'bd_scripts', 'content_studio',
  ],
  pro: [
    'dashboard', 'radar', 'hiring_signals', 'companies',
    'capital_intelligence', 'watchlist', 'candidate_matcher',
    'bd_scripts', 'content_studio', 'market_intelligence',
    'trends', 'targets',
  ],
  team: [
    'dashboard', 'radar', 'hiring_signals', 'companies',
    'capital_intelligence', 'watchlist', 'candidate_matcher',
    'bd_scripts', 'content_studio', 'market_intelligence',
    'trends', 'targets', 'reporting', 'org_admin',
  ],
  enterprise: [
    'dashboard', 'radar', 'hiring_signals', 'companies',
    'capital_intelligence', 'watchlist', 'candidate_matcher',
    'bd_scripts', 'content_studio', 'market_intelligence',
    'trends', 'targets', 'reporting', 'org_admin',
  ],
}

// ── Role → capability matrix ──────────────────────────────────────────────────

export interface RoleCapabilities {
  canInviteUsers: boolean
  canRemoveUsers: boolean
  canAssignSeats: boolean
  canAssignRoles: boolean
  canViewBilling: boolean
  canManageBilling: boolean
  canViewOrgSettings: boolean
  canManageOrgSettings: boolean
  canViewTeamUsage: boolean
  canManageTeam: boolean
  canAccessOrgAdmin: boolean
  canAccessPlatformAdmin: boolean
}

export const ROLE_CAPABILITIES: Record<UserRole, RoleCapabilities> = {
  super_admin: {
    canInviteUsers: true, canRemoveUsers: true, canAssignSeats: true, canAssignRoles: true,
    canViewBilling: true, canManageBilling: true, canViewOrgSettings: true, canManageOrgSettings: true,
    canViewTeamUsage: true, canManageTeam: true, canAccessOrgAdmin: true, canAccessPlatformAdmin: true,
  },
  org_admin: {
    canInviteUsers: true, canRemoveUsers: true, canAssignSeats: true, canAssignRoles: true,
    canViewBilling: true, canManageBilling: true, canViewOrgSettings: true, canManageOrgSettings: true,
    canViewTeamUsage: true, canManageTeam: false, canAccessOrgAdmin: true, canAccessPlatformAdmin: false,
  },
  team_manager: {
    canInviteUsers: false, canRemoveUsers: false, canAssignSeats: false, canAssignRoles: false,
    canViewBilling: false, canManageBilling: false, canViewOrgSettings: false, canManageOrgSettings: false,
    canViewTeamUsage: true, canManageTeam: true, canAccessOrgAdmin: false, canAccessPlatformAdmin: false,
  },
  member: {
    canInviteUsers: false, canRemoveUsers: false, canAssignSeats: false, canAssignRoles: false,
    canViewBilling: false, canManageBilling: false, canViewOrgSettings: false, canManageOrgSettings: false,
    canViewTeamUsage: false, canManageTeam: false, canAccessOrgAdmin: false, canAccessPlatformAdmin: false,
  },
  read_only: {
    canInviteUsers: false, canRemoveUsers: false, canAssignSeats: false, canAssignRoles: false,
    canViewBilling: false, canManageBilling: false, canViewOrgSettings: false, canManageOrgSettings: false,
    canViewTeamUsage: false, canManageTeam: false, canAccessOrgAdmin: false, canAccessPlatformAdmin: false,
  },
}

// ── Billing status → access rules ─────────────────────────────────────────────

export function isAccountActive(billingStatus: BillingStatus): boolean {
  return billingStatus === 'active' || billingStatus === 'trialing'
}

export function isAccountRestricted(billingStatus: BillingStatus): boolean {
  return billingStatus === 'past_due' || billingStatus === 'unpaid'
}

export function isAccountSuspended(billingStatus: BillingStatus): boolean {
  return billingStatus === 'cancelled' || billingStatus === 'suspended'
}

// ── Module access check ────────────────────────────────────────────────────────

export function canAccessModule(
  moduleId: ModuleId,
  enabledModules: string[],
  role: UserRole,
  billingStatus: BillingStatus,
): boolean {
  // Suspended/cancelled accounts lose all access except org_admin viewing billing
  if (isAccountSuspended(billingStatus) && moduleId !== 'org_admin') return false
  // Past due — restrict non-essential modules but allow admins to see billing
  if (isAccountRestricted(billingStatus) && role !== 'org_admin' && role !== 'super_admin') {
    return moduleId === 'dashboard' // minimal access
  }
  // read_only: no write-heavy modules
  if (role === 'read_only' && ['candidate_matcher', 'bd_scripts', 'content_studio'].includes(moduleId)) return false
  return enabledModules.includes(moduleId)
}

// ── Role label helpers ────────────────────────────────────────────────────────

export const ROLE_LABELS: Record<UserRole, string> = {
  super_admin: 'Platform Admin',
  org_admin: 'Admin',
  team_manager: 'Team Manager',
  member: 'Member',
  read_only: 'Viewer',
}

export const ROLE_OPTIONS: { value: UserRole; label: string }[] = [
  { value: 'org_admin', label: 'Admin' },
  { value: 'team_manager', label: 'Team Manager' },
  { value: 'member', label: 'Member' },
  { value: 'read_only', label: 'Viewer' },
]
