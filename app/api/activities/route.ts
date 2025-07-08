import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getToken } from "next-auth/jwt";
import { parseISO } from "date-fns";

export async function GET(req: NextRequest) {
  try {
    // Check authentication
    const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });
    if (!token || !token.sub) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const portalId = searchParams.get("portalId");
    const page = parseInt(searchParams.get("page") || "1", 10);
    const limit = parseInt(searchParams.get("limit") || "20", 10);
    const skip = (page - 1) * limit;
    const dateFrom = searchParams.get("dateFrom") || undefined;
    const dateTo = searchParams.get("dateTo") || undefined;

    if (!portalId) {
      return NextResponse.json({ error: "Portal ID is required" }, { status: 400 });
    }

    // Verify user has access to this portal
    const portal = await prisma.portal.findFirst({
      where: {
        id: portalId,
        OR: [
          { created_by: token.sub }, // Freelancer who created the portal
          { client_id: token.sub },   // Client who owns the portal
        ],
      },
    });

    if (!portal) {
      return NextResponse.json({ error: "Portal not found or access denied" }, { status: 404 });
    }

    // Build where clause for activities
    const where: any = {
      portal_id: portalId,
    };

    // Add date range filter if provided
    if (dateFrom || dateTo) {
      where.created_at = {};
      if (dateFrom) {
        where.created_at.gte = parseISO(dateFrom);
      }
      if (dateTo) {
        // Add 1 day to dateTo to include the entire day
        const endDate = parseISO(dateTo);
        endDate.setHours(23, 59, 59, 999);
        where.created_at.lte = endDate;
      }
    }

    // Fetch activities with user information
    const [activities, total] = await Promise.all([
      prisma.activity.findMany({
        where,
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true,
              image: true,
            },
          },
        },
        orderBy: {
          created_at: "desc",
        },
        skip,
        take: limit,
      }),
      prisma.activity.count({ where }),
    ]);

    const hasMore = skip + activities.length < total;

    return NextResponse.json({
      activities,
      total,
      page,
      limit,
      hasMore,
    });
  } catch (error) {
    console.error("Error fetching activities:", error);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
} 