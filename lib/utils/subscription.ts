import { prisma } from "@/lib/prisma";
import { PLAN_LIMITS, getPlanLimits, isWithinLimit, wouldExceedLimit, getUsagePercentage, formatStorageSize, bytesToMB } from "@/lib/config/plan-limits";
import type { PlanLimits } from "@/lib/config/plan-limits";

export interface UserPlanInfo {
  id: string;
  name: string;
  isActive: boolean;
  isFreePlan: boolean;
  endsAt?: Date;
  limits: PlanLimits;
}

export interface PlanUsage {
  clients: {
    current: number;
    limit: number | null;
    canCreate: boolean;
    isOverLimit: boolean;
    usagePercentage: number;
  };
  storage: {
    currentMB: number;
    limitMB: number | null;
    canUpload: boolean;
    isOverLimit: boolean;
    usagePercentage: number;
    formattedCurrent: string;
    formattedLimit: string;
  };
  team: {
    current: number;
    limit: number | null;
    canInvite: boolean;
    isOverLimit: boolean;
    usagePercentage: number;
  };
}

export interface PlanLimitCheckResult {
  allowed: boolean;
  reason?: string;
  upgradeRequired?: boolean;
  currentUsage?: number;
  limit?: number | null;
}

/**
 * Get user's current plan information with limits
 */
export async function getUserPlanInfo(userId: string): Promise<UserPlanInfo> {
  try {
    const subscription = await prisma.subscription.findFirst({
      where: {
        user_id: userId,
        is_active: true,
        ends_at: {
          gt: new Date()
        }
      },
      include: {
        plan: true
      },
      orderBy: {
        starts_at: 'desc'
      }
    });

    if (!subscription || !subscription.is_active) {
      return {
        id: 'free',
        name: 'Free Plan',
        isActive: true,
        isFreePlan: true,
        limits: getPlanLimits('free')
      };
    }

    const planName = subscription.plan.name.toLowerCase();
    let planId = 'free';
    
    if (planName.includes('pro')) {
      planId = 'pro';
    } else if (planName.includes('agency')) {
      planId = 'agency';
    }

    return {
      id: planId,
      name: subscription.plan.name,
      isActive: subscription.is_active,
      isFreePlan: planId === 'free',
      endsAt: subscription.ends_at,
      limits: getPlanLimits(planId)
    };

  } catch (error) {
    console.error('Error getting user plan info:', error);
    return {
      id: 'free',
      name: 'Free Plan',
      isActive: true,
      isFreePlan: true,
      limits: getPlanLimits('free')
    };
  }
}

/**
 * Get comprehensive usage information for a user
 */
export async function getUserPlanUsage(userId: string): Promise<PlanUsage> {
  try {
    const planInfo = await getUserPlanInfo(userId);
    
    // Get current client count
    const clientCount = await prisma.portal.count({
      where: {
        created_by: userId
      }
    });

    // Get current storage usage
    const storageResult = await prisma.file.aggregate({
      where: {
        user_id: userId
      },
      _sum: {
        file_size: true
      }
    });

    const currentStorageBytes = storageResult._sum.file_size || 0;
    const currentStorageMB = bytesToMB(currentStorageBytes);

    // Get team member count (currently just the user, but ready for future expansion)
    const teamCount = 1; // Just the freelancer for now

    return {
      clients: {
        current: clientCount,
        limit: planInfo.limits.maxClients,
        canCreate: !wouldExceedLimit(clientCount, 1, planInfo.limits.maxClients),
        isOverLimit: !isWithinLimit(clientCount, planInfo.limits.maxClients),
        usagePercentage: getUsagePercentage(clientCount, planInfo.limits.maxClients)
      },
      storage: {
        currentMB: currentStorageMB,
        limitMB: planInfo.limits.maxStorageMB,
        canUpload: isWithinLimit(currentStorageMB, planInfo.limits.maxStorageMB),
        isOverLimit: !isWithinLimit(currentStorageMB, planInfo.limits.maxStorageMB),
        usagePercentage: getUsagePercentage(currentStorageMB, planInfo.limits.maxStorageMB),
        formattedCurrent: formatStorageSize(currentStorageMB),
        formattedLimit: planInfo.limits.maxStorageMB ? formatStorageSize(planInfo.limits.maxStorageMB) : 'Unlimited'
      },
      team: {
        current: teamCount,
        limit: planInfo.limits.maxTeamMembers,
        canInvite: !wouldExceedLimit(teamCount, 1, planInfo.limits.maxTeamMembers),
        isOverLimit: !isWithinLimit(teamCount, planInfo.limits.maxTeamMembers),
        usagePercentage: getUsagePercentage(teamCount, planInfo.limits.maxTeamMembers)
      }
    };

  } catch (error) {
    console.error('Error getting user plan usage:', error);
    // Return default/safe values on error
    const freeLimits = getPlanLimits('free');
    return {
      clients: {
        current: 0,
        limit: freeLimits.maxClients,
        canCreate: !wouldExceedLimit(0, 1, freeLimits.maxClients),
        isOverLimit: false,
        usagePercentage: 0
      },
      storage: {
        currentMB: 0,
        limitMB: freeLimits.maxStorageMB,
        canUpload: isWithinLimit(0, freeLimits.maxStorageMB),
        isOverLimit: false,
        usagePercentage: 0,
        formattedCurrent: '0 MB',
        formattedLimit: formatStorageSize(freeLimits.maxStorageMB!)
      },
      team: {
        current: 0,
        limit: freeLimits.maxTeamMembers,
        canInvite: !wouldExceedLimit(0, 1, freeLimits.maxTeamMembers),
        isOverLimit: false,
        usagePercentage: 0
      }
    };
  }
}

/**
 * Check if user can create a new portal
 */
export async function canUserCreatePortal(userId: string): Promise<PlanLimitCheckResult> {
  try {
    const usage = await getUserPlanUsage(userId);
    
    if (usage.clients.canCreate) {
      return { allowed: true };
    }

    return {
      allowed: false,
      reason: `You've reached your plan's client limit (${usage.clients.limit}). ${usage.clients.isOverLimit ? 'You are currently over your limit.' : 'Creating another portal would exceed your limit.'}`,
      upgradeRequired: true,
      currentUsage: usage.clients.current,
      limit: usage.clients.limit
    };

  } catch (error) {
    console.error('Error checking portal creation limit:', error);
    return {
      allowed: false,
      reason: 'Unable to verify plan limits. Please try again.',
      upgradeRequired: false
    };
  }
}

/**
 * Check if user can upload files with given total size
 */
export async function canUserUploadFiles(userId: string, fileSizeBytes: number): Promise<PlanLimitCheckResult> {
  try {
    const usage = await getUserPlanUsage(userId);
    const fileSizeMB = bytesToMB(fileSizeBytes);
    
    // Check if storage would exceed limit
    if (usage.storage.limitMB !== null && wouldExceedLimit(usage.storage.currentMB, fileSizeMB, usage.storage.limitMB)) {
      return {
        allowed: false,
        reason: `This upload would exceed your storage limit. You're using ${usage.storage.formattedCurrent} of ${usage.storage.formattedLimit}.`,
        upgradeRequired: true,
        currentUsage: usage.storage.currentMB,
        limit: usage.storage.limitMB
      };
    }

    // Check individual file size limit
    const planInfo = await getUserPlanInfo(userId);
    if (fileSizeMB > planInfo.limits.maxFileSizeMB) {
      return {
        allowed: false,
        reason: `File size (${formatStorageSize(fileSizeMB)}) exceeds your plan's limit of ${formatStorageSize(planInfo.limits.maxFileSizeMB)}.`,
        upgradeRequired: true,
        currentUsage: fileSizeMB,
        limit: planInfo.limits.maxFileSizeMB
      };
    }

    return { allowed: true };

  } catch (error) {
    console.error('Error checking file upload limit:', error);
    return {
      allowed: false,
      reason: 'Unable to verify storage limits. Please try again.',
      upgradeRequired: false
    };
  }
}

/**
 * Check if user can upload files with given total size based on portal context
 * This is used when clients upload to portals - they inherit the portal's freelancer plan limits
 */
export async function canUserUploadFilesToPortal(userId: string, fileSizeBytes: number, portalId: string): Promise<PlanLimitCheckResult> {
  try {
    // Get the portal and its freelancer
    const portal = await prisma.portal.findUnique({
      where: { id: portalId },
      include: {
        freelancer: {
          select: { id: true }
        }
      }
    });

    if (!portal) {
      return {
        allowed: false,
        reason: 'Portal not found.',
        upgradeRequired: false
      };
    }

    // Get the freelancer's plan info (this is what determines the portal's limits)
    const freelancerPlanInfo = await getUserPlanInfo(portal.freelancer.id);
    const freelancerUsage = await getUserPlanUsage(portal.freelancer.id);
    
    const fileSizeMB = bytesToMB(fileSizeBytes);
    
    // Check if storage would exceed freelancer's limit
    if (freelancerUsage.storage.limitMB !== null && wouldExceedLimit(freelancerUsage.storage.currentMB, fileSizeMB, freelancerUsage.storage.limitMB)) {
      return {
        allowed: false,
        reason: `This upload would exceed the portal's storage limit. The portal is using ${freelancerUsage.storage.formattedCurrent} of ${freelancerUsage.storage.formattedLimit}.`,
        upgradeRequired: true,
        currentUsage: freelancerUsage.storage.currentMB,
        limit: freelancerUsage.storage.limitMB
      };
    }

    // Check individual file size limit based on freelancer's plan
    if (fileSizeMB > freelancerPlanInfo.limits.maxFileSizeMB) {
      return {
        allowed: false,
        reason: `File size (${formatStorageSize(fileSizeMB)}) exceeds this portal's limit of ${formatStorageSize(freelancerPlanInfo.limits.maxFileSizeMB)}.`,
        upgradeRequired: true,
        currentUsage: fileSizeMB,
        limit: freelancerPlanInfo.limits.maxFileSizeMB
      };
    }

    return { allowed: true };

  } catch (error) {
    console.error('Error checking portal file upload limit:', error);
    return {
      allowed: false,
      reason: 'Unable to verify portal upload limits. Please try again.',
      upgradeRequired: false
    };
  }
}

/**
 * Check if user can invite team members (future feature)
 */
export async function canUserInviteTeamMember(userId: string): Promise<PlanLimitCheckResult> {
  try {
    const planInfo = await getUserPlanInfo(userId);
    
    if (!planInfo.limits.canAddTeam) {
      return {
        allowed: false,
        reason: 'Team invites are not available on your current plan.',
        upgradeRequired: true
      };
    }

    const usage = await getUserPlanUsage(userId);
    
    if (usage.team.canInvite) {
      return { allowed: true };
    }

    return {
      allowed: false,
      reason: `You've reached your plan's team member limit (${usage.team.limit}).`,
      upgradeRequired: true,
      currentUsage: usage.team.current,
      limit: usage.team.limit
    };

  } catch (error) {
    console.error('Error checking team invite limit:', error);
    return {
      allowed: false,
      reason: 'Unable to verify team limits. Please try again.',
      upgradeRequired: false
    };
  }
}

/**
 * Check if user has access to a specific feature
 */
export async function canUserAccessFeature(userId: string, feature: keyof PlanLimits): Promise<PlanLimitCheckResult> {
  try {
    const planInfo = await getUserPlanInfo(userId);
    const featureValue = planInfo.limits[feature];
    
    if (typeof featureValue === 'boolean') {
      return {
        allowed: featureValue,
        reason: featureValue ? undefined : `This feature is not available on your current plan.`,
        upgradeRequired: !featureValue
      };
    }

    return { allowed: true };

  } catch (error) {
    console.error('Error checking feature access:', error);
    return {
      allowed: false,
      reason: 'Unable to verify feature access. Please try again.',
      upgradeRequired: false
    };
  }
}

/**
 * Get upgrade recommendation based on current usage
 */
export async function getUpgradeRecommendation(userId: string): Promise<{
  shouldUpgrade: boolean;
  recommendedPlan: string | null;
  reason: string;
  currentPlan: string;
}> {
  try {
    const planInfo = await getUserPlanInfo(userId);
    const usage = await getUserPlanUsage(userId);

    if (planInfo.id === 'agency') {
      return {
        shouldUpgrade: false,
        recommendedPlan: null,
        reason: "You're on our highest plan with unlimited features.",
        currentPlan: planInfo.id
      };
    }

    // Check if over any limits
    if (usage.clients.isOverLimit || usage.storage.isOverLimit || usage.team.isOverLimit) {
      const nextPlan = planInfo.id === 'free' ? 'pro' : 'agency';
      return {
        shouldUpgrade: true,
        recommendedPlan: nextPlan,
        reason: `You're over your current plan's limits. Upgrade to ${nextPlan} for ${nextPlan === 'pro' ? 'higher limits' : 'unlimited access'}.`,
        currentPlan: planInfo.id
      };
    }

    // Check if approaching limits (>80% usage)
    if (usage.clients.usagePercentage > 80 || usage.storage.usagePercentage > 80) {
      const nextPlan = planInfo.id === 'free' ? 'pro' : 'agency';
      return {
        shouldUpgrade: true,
        recommendedPlan: nextPlan,
        reason: `You're approaching your plan's limits. Consider upgrading to ${nextPlan} for more capacity.`,
        currentPlan: planInfo.id
      };
    }

    return {
      shouldUpgrade: false,
      recommendedPlan: null,
      reason: "You're within your plan's limits.",
      currentPlan: planInfo.id
    };

  } catch (error) {
    console.error('Error getting upgrade recommendation:', error);
    return {
      shouldUpgrade: false,
      recommendedPlan: null,
      reason: "Unable to analyze your usage.",
      currentPlan: 'free'
    };
  }
}

/**
 * Check if user is over any plan limits (for warning banners)
 */
export async function isUserOverLimits(userId: string): Promise<{
  isOverLimit: boolean;
  overLimitTypes: string[];
  message: string;
}> {
  try {
    const usage = await getUserPlanUsage(userId);
    const overLimitTypes: string[] = [];
    
    if (usage.clients.isOverLimit) {
      overLimitTypes.push('clients');
    }
    if (usage.storage.isOverLimit) {
      overLimitTypes.push('storage');
    }
    if (usage.team.isOverLimit) {
      overLimitTypes.push('team');
    }

    const isOverLimit = overLimitTypes.length > 0;
    let message = '';

    if (isOverLimit) {
      if (overLimitTypes.length === 1) {
        message = `You're over your plan's ${overLimitTypes[0]} limit.`;
      } else {
        message = `You're over your plan's ${overLimitTypes.join(' and ')} limits.`;
      }
      message += ' Upgrade to restore full access.';
    }

    return {
      isOverLimit,
      overLimitTypes,
      message
    };

  } catch (error) {
    console.error('Error checking if user is over limits:', error);
    return {
      isOverLimit: false,
      overLimitTypes: [],
      message: ''
    };
  }
}

/**
 * Get portal-specific plan limits for uploads
 * This returns the freelancer's plan limits that apply to the portal
 */
export async function getPortalPlanLimits(portalId: string): Promise<PlanLimits | null> {
  try {
    const portal = await prisma.portal.findUnique({
      where: { id: portalId },
      include: {
        freelancer: {
          select: { id: true }
        }
      }
    });

    if (!portal) {
      return null;
    }

    const freelancerPlanInfo = await getUserPlanInfo(portal.freelancer.id);
    return freelancerPlanInfo.limits;

  } catch (error) {
    console.error('Error getting portal plan limits:', error);
    return null;
  }
}

// Legacy function for backwards compatibility
export async function getSubscriptionLimits(userId: string) {
  const usage = await getUserPlanUsage(userId);
  
  return {
    clientLimit: usage.clients.limit,
    currentClientCount: usage.clients.current,
    canCreatePortal: usage.clients.canCreate,
    isFreePlan: (await getUserPlanInfo(userId)).isFreePlan
  };
}

// Legacy function for backwards compatibility
export async function getCurrentPlan(userId: string) {
  const planInfo = await getUserPlanInfo(userId);
  
  return {
    id: planInfo.id,
    name: planInfo.name,
    isActive: planInfo.isActive,
    isFreePlan: planInfo.isFreePlan,
    endsAt: planInfo.endsAt
  };
} 