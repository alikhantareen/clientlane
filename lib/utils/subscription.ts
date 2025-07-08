import { prisma } from "@/lib/prisma";
import { SUBSCRIPTION_PLANS } from "@/lib/config/stripe";

export interface SubscriptionLimits {
  clientLimit: number | null; // null means unlimited
  currentClientCount: number;
  canCreatePortal: boolean;
  isFreePlan: boolean;
}

/**
 * Get subscription limits for a user
 */
export async function getSubscriptionLimits(userId: string): Promise<SubscriptionLimits> {
  try {
    // Get user's current subscription
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

    // Get current client count
    const currentClientCount = await prisma.portal.count({
      where: {
        created_by: userId
      }
    });

    // Default to free plan if no active subscription
    if (!subscription || !subscription.is_active) {
      const freePlan = SUBSCRIPTION_PLANS.FREE;
      return {
        clientLimit: freePlan.clientLimit,
        currentClientCount,
        canCreatePortal: currentClientCount < freePlan.clientLimit!,
        isFreePlan: true
      };
    }

    // Map plan name to our configuration
    const planName = subscription.plan.name.toLowerCase();
    let plan: typeof SUBSCRIPTION_PLANS.FREE | typeof SUBSCRIPTION_PLANS.PRO | typeof SUBSCRIPTION_PLANS.AGENCY = SUBSCRIPTION_PLANS.FREE; // default
    
    if (planName.includes('pro')) {
      plan = SUBSCRIPTION_PLANS.PRO;
    } else if (planName.includes('agency')) {
      plan = SUBSCRIPTION_PLANS.AGENCY;
    }

    const canCreatePortal = plan.clientLimit === null || currentClientCount < plan.clientLimit;

    return {
      clientLimit: plan.clientLimit,
      currentClientCount,
      canCreatePortal,
      isFreePlan: plan.id === 'free'
    };

  } catch (error) {
    console.error('Error getting subscription limits:', error);
    // Default to free plan on error
    const freePlan = SUBSCRIPTION_PLANS.FREE;
    const currentClientCount = 0; // fallback
    
    return {
      clientLimit: freePlan.clientLimit,
      currentClientCount,
      canCreatePortal: false,
      isFreePlan: true
    };
  }
}

/**
 * Check if user can create a new portal
 */
export async function canUserCreatePortal(userId: string): Promise<boolean> {
  const limits = await getSubscriptionLimits(userId);
  return limits.canCreatePortal;
}

/**
 * Get upgrade recommendation based on current usage
 */
export async function getUpgradeRecommendation(userId: string): Promise<{
  shouldUpgrade: boolean;
  recommendedPlan: string | null;
  reason: string;
}> {
  const limits = await getSubscriptionLimits(userId);

  if (!limits.isFreePlan) {
    return {
      shouldUpgrade: false,
      recommendedPlan: null,
      reason: "User is already on a paid plan"
    };
  }

  if (limits.currentClientCount >= 1) {
    return {
      shouldUpgrade: true,
      recommendedPlan: 'pro',
      reason: "You've reached your free plan limit. Upgrade to Pro for up to 5 clients!"
    };
  }

  return {
    shouldUpgrade: false,
    recommendedPlan: null,
    reason: "User is within free plan limits"
  };
}

/**
 * Get user's current plan information
 */
export async function getCurrentPlan(userId: string) {
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
        isFreePlan: true
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
      endsAt: subscription.ends_at
    };

  } catch (error) {
    console.error('Error getting current plan:', error);
    return {
      id: 'free',
      name: 'Free Plan',
      isActive: true,
      isFreePlan: true
    };
  }
} 