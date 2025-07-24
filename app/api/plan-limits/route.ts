import { NextRequest, NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";
import { getUserPlanInfo, getUserPlanUsage, getUpgradeRecommendation, getPortalPlanLimits } from "@/lib/utils/subscription";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  try {
    // Check authentication
    const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });
    if (!token || !token.sub) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get user role to check if limits apply
    const user = await prisma.user.findUnique({
      where: { id: token.sub },
      select: { role: true }
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Check if this is a portal-specific request
    const url = new URL(req.url);
    const portalId = url.searchParams.get("portalId");

    if (portalId) {
      // Portal-specific limits - get the freelancer's plan limits for this portal
      const portalLimits = await getPortalPlanLimits(portalId);
      
      if (!portalLimits) {
        return NextResponse.json({ error: "Portal not found" }, { status: 404 });
      }

      return NextResponse.json({
        plan: {
          id: 'portal-specific',
          name: 'Portal Limits',
          isActive: true,
          isFreePlan: false,
          limits: portalLimits
        },
        isPortalSpecific: true
      });
    }

    // Regular user plan limits (only for freelancers)
    if (user.role !== "freelancer") {
      return NextResponse.json({ 
        error: "Plan limits only apply to freelancers" 
      }, { status: 403 });
    }

    // Get comprehensive plan and usage information
    const [planInfo, usage, upgradeRecommendation] = await Promise.all([
      getUserPlanInfo(token.sub),
      getUserPlanUsage(token.sub),
      getUpgradeRecommendation(token.sub)
    ]);

    const response = {
      plan: {
        id: planInfo.id,
        name: planInfo.name,
        isActive: planInfo.isActive,
        isFreePlan: planInfo.isFreePlan,
        endsAt: planInfo.endsAt,
        limits: planInfo.limits
      },
      usage: {
        clients: {
          current: usage.clients.current,
          limit: usage.clients.limit,
          canCreate: usage.clients.canCreate,
          isOverLimit: usage.clients.isOverLimit,
          usagePercentage: usage.clients.usagePercentage
        },
        storage: {
          currentMB: usage.storage.currentMB,
          limitMB: usage.storage.limitMB,
          canUpload: usage.storage.canUpload,
          isOverLimit: usage.storage.isOverLimit,
          usagePercentage: usage.storage.usagePercentage,
          formattedCurrent: usage.storage.formattedCurrent,
          formattedLimit: usage.storage.formattedLimit
        },
        team: {
          current: usage.team.current,
          limit: usage.team.limit,
          canInvite: usage.team.canInvite,
          isOverLimit: usage.team.isOverLimit,
          usagePercentage: usage.team.usagePercentage
        }
      },
      upgrade: upgradeRecommendation,
      isPortalSpecific: false
    };

    return NextResponse.json(response);

  } catch (error) {
    console.error('Error getting plan limits:', error);
    // Add more detailed error logging for Vercel debugging
    if (process.env.NODE_ENV === 'production') {
      console.error("Plan Limits API Error Details:", {
        message: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : undefined,
        timestamp: new Date().toISOString(),
        userAgent: req.headers.get('user-agent'),
      });
    }
    return NextResponse.json({ 
      error: "Internal server error",
      message: process.env.NODE_ENV === 'development' ? error instanceof Error ? error.message : 'Unknown error' : 'Internal server error'
    }, { status: 500 });
  }
} 