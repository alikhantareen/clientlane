/**
 * Centralized plan limits configuration
 * 
 * This configuration defines all limits for each subscription plan.
 * All limits should be dynamic and configurable - never hardcode limits in business logic.
 */

export interface PlanLimits {
  /** Maximum number of client portals. null means unlimited */
  maxClients: number | null;
  
  /** Maximum storage in MB. null means unlimited */
  maxStorageMB: number | null;
  
  /** Whether team invites are allowed (future feature) */
  canAddTeam: boolean;
  
  /** Maximum number of team members. null means unlimited */
  maxTeamMembers: number | null;
  
  /** Maximum file size per upload in MB */
  maxFileSizeMB: number;
  
  /** Maximum number of files per portal. null means unlimited */
  maxFilesPerPortal: number | null;
  
  /** Maximum number of updates per portal. null means unlimited */
  maxUpdatesPerPortal: number | null;
  
  /** Whether custom branding is allowed */
  canCustomBrand: boolean;
  
  /** Whether API access is allowed */
  canUseAPI: boolean;
  
  /** Whether advanced analytics are available */
  canUseAdvancedAnalytics: boolean;
  
  /** Whether white-label solution is available */
  canUseWhiteLabel: boolean;
  
  /** Support level available */
  supportLevel: 'basic' | 'priority' | '24/7';
}

export const PLAN_LIMITS: Record<string, PlanLimits> = {
  free: {
    maxClients: 1,
    maxStorageMB: 100, // 100MB total storage
    canAddTeam: false,
    maxTeamMembers: 1, // Just the freelancer
    maxFileSizeMB: 5, // 5MB per file
    maxFilesPerPortal: 50,
    maxUpdatesPerPortal: null, // Unlimited updates
    canCustomBrand: false,
    canUseAPI: false,
    canUseAdvancedAnalytics: false,
    canUseWhiteLabel: false,
    supportLevel: 'basic'
  },
  
  pro: {
    maxClients: 5,
    maxStorageMB: 1000, // 1GB total storage
    canAddTeam: true,
    maxTeamMembers: 3, // Freelancer + 2 team members
    maxFileSizeMB: 25, // 25MB per file
    maxFilesPerPortal: 200,
    maxUpdatesPerPortal: null, // Unlimited updates
    canCustomBrand: true,
    canUseAPI: false,
    canUseAdvancedAnalytics: true,
    canUseWhiteLabel: false,
    supportLevel: 'priority'
  },
  
  agency: {
    maxClients: null, // Unlimited clients
    maxStorageMB: null, // Unlimited storage
    canAddTeam: true,
    maxTeamMembers: null, // Unlimited team members
    maxFileSizeMB: 100, // 100MB per file
    maxFilesPerPortal: null, // Unlimited files
    maxUpdatesPerPortal: null, // Unlimited updates
    canCustomBrand: true,
    canUseAPI: true,
    canUseAdvancedAnalytics: true,
    canUseWhiteLabel: true,
    supportLevel: '24/7'
  }
} as const;

/**
 * Get plan limits for a specific plan
 */
export function getPlanLimits(planId: string): PlanLimits {
  return PLAN_LIMITS[planId] || PLAN_LIMITS.free;
}

/**
 * Check if a value is within the limit
 */
export function isWithinLimit(currentValue: number, limit: number | null): boolean {
  if (limit === null) return true; // Unlimited
  return currentValue <= limit;
}

/**
 * Check if a value would exceed the limit if incremented
 */
export function wouldExceedLimit(currentValue: number, increment: number, limit: number | null): boolean {
  if (limit === null) return false; // Unlimited
  return (currentValue + increment) > limit;
}

/**
 * Calculate percentage of limit used
 */
export function getUsagePercentage(currentValue: number, limit: number | null): number {
  if (limit === null) return 0; // Unlimited
  return Math.min(100, (currentValue / limit) * 100);
}

/**
 * Get user-friendly limit description
 */
export function getLimitDescription(limit: number | null, unit: string = ''): string {
  if (limit === null) return 'Unlimited';
  return `${limit}${unit ? ` ${unit}` : ''}`;
}

/**
 * Format storage in human-readable format
 */
export function formatStorageSize(sizeInMB: number): string {
  if (sizeInMB < 1) {
    return `${Math.round(sizeInMB * 1024)} KB`;
  } else if (sizeInMB < 1024) {
    return `${Math.round(sizeInMB)} MB`;
  } else {
    return `${Math.round(sizeInMB / 1024 * 10) / 10} GB`;
  }
}

/**
 * Convert bytes to MB
 */
export function bytesToMB(bytes: number): number {
  return bytes / (1024 * 1024);
}

/**
 * Convert MB to bytes
 */
export function mbToBytes(mb: number): number {
  return mb * 1024 * 1024;
} 