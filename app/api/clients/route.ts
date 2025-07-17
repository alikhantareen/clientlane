import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getToken } from "next-auth/jwt";
import { z } from "zod";
import { updateUserLastSeen } from "@/lib/utils/helpers";

const clientsQuerySchema = z.object({
  page: z.string().optional().default("1"),
  limit: z.string().optional().default("10"),
  search: z.string().optional(),
  status: z.enum(["all", "invited", "active", "inactive"]).optional().default("all"),
});

export async function GET(req: NextRequest) {
  try {
    // Check authentication
    const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });
    if (!token || !token.sub) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Verify user exists and is a freelancer
    const user = await prisma.user.findUnique({
      where: { id: token.sub },
      select: { id: true, role: true }
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    if (user.role !== "freelancer") {
      return NextResponse.json({ error: "Only freelancers can access client data" }, { status: 403 });
    }

    // Update last_seen_at for the freelancer
    await updateUserLastSeen(user.id);

    // Parse query parameters
    const { searchParams } = new URL(req.url);
    const queryParams = {
      page: searchParams.get("page") || "1",
      limit: searchParams.get("limit") || "10",
      search: searchParams.get("search") || undefined,
      status: searchParams.get("status") || "all",
    };

    const parsed = clientsQuerySchema.safeParse(queryParams);
    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid query parameters" }, { status: 400 });
    }

    const { page, limit, search, status } = parsed.data;
    const pageNum = parseInt(page);
    const limitNum = parseInt(limit);
    const skip = (pageNum - 1) * limitNum;

    // Build the where clause
    const where: any = {
      role: "client",
      client_portals: {
        some: {
          created_by: user.id, // Only clients of this freelancer
        },
      },
    };

    // Add search filter
    if (search) {
      where.OR = [
        { name: { contains: search, mode: "insensitive" } },
        { email: { contains: search, mode: "insensitive" } },
      ];
    }

    // Add status filter
    if (status !== "all") {
      if (status === "invited") {
        where.password_hash = null;
      } else if (status === "active") {
        where.password_hash = { not: null };
        where.last_seen_at = {
          gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), // Last 30 days
        };
      } else if (status === "inactive") {
        where.password_hash = { not: null };
        where.OR = [
          { last_seen_at: null },
          {
            last_seen_at: {
              lt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), // More than 30 days ago
            },
          },
        ];
      }
    }

    // Fetch clients with portal count
    const [clients, total] = await Promise.all([
      prisma.user.findMany({
        where,
        select: {
          id: true,
          name: true,
          email: true,
          image: true,
          password_hash: true,
          last_seen_at: true,
          invited_by_id: true,
          created_at: true,
          client_portals: {
            where: {
              created_by: user.id,
            },
            select: {
              id: true,
            },
          },
          activities: {
            where: {
              portal: {
                created_by: user.id,
              },
            },
            orderBy: {
              created_at: "desc",
            },
            take: 1,
            select: {
              created_at: true,
            },
          },
        },
        orderBy: {
          created_at: "desc",
        },
        skip,
        take: limitNum,
      }),
      prisma.user.count({ where }),
    ]);

    // Transform data with computed fields
    const transformedClients = clients.map((client) => {
      const isInvited = !client.password_hash;
      const latestActivity = client.activities[0]?.created_at;
      const lastActiveDate = client.last_seen_at || latestActivity;
      const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
      
      let clientStatus: 'invited' | 'active' | 'inactive' = 'invited';
      if (!isInvited) {
        // If last_seen_at is null but there's recent activity, consider them active
        if (!client.last_seen_at && latestActivity && latestActivity > thirtyDaysAgo) {
          clientStatus = 'active';
        } else if (lastActiveDate && lastActiveDate > thirtyDaysAgo) {
          clientStatus = 'active';
        } else {
          clientStatus = 'inactive';
        }
      }

      return {
        id: client.id,
        name: client.name,
        email: client.email,
        image: client.image,
        password_hash: client.password_hash,
        last_seen_at: client.last_seen_at,
        invited_by_id: client.invited_by_id,
        created_at: client.created_at,
        portal_count: client.client_portals.length,
        status: clientStatus,
        last_active: lastActiveDate,
        joined_on: client.created_at,
      };
    });

    const pages = Math.ceil(total / limitNum);

    return NextResponse.json({
      clients: transformedClients,
      total,
      page: pageNum,
      limit: limitNum,
      pages,
    });

  } catch (error) {
    console.error("Error fetching clients:", error);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
} 