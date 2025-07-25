import { NextRequest, NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";
import { prisma } from "@/lib/prisma";
import { startOfMonth, endOfMonth, subMonths, format } from "date-fns";
import { updateUserLastSeen } from "@/lib/utils/helpers";
import { withDatabaseOperation, optimizedDatabaseQuery } from "@/lib/utils/database";

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
      return NextResponse.json({ error: "Only freelancers can access this dashboard" }, { status: 403 });
    }

    // Update last_seen_at for the user
    await updateUserLastSeen(user.id);

    // Parse query parameters for pagination
    const { searchParams } = new URL(req.url);
    const topPortalsLimit = parseInt(searchParams.get("topPortalsLimit") || "5");
    const activityLimit = parseInt(searchParams.get("activityLimit") || "10");
    const activityPage = parseInt(searchParams.get("activityPage") || "1");
    
    // Calculate offset for activity pagination
    const activityOffset = (activityPage - 1) * activityLimit;

    // Get overview statistics with optimized database operations
    const [totalPortals, uniqueClients, totalUpdates, storageData, currentSubscription] = await withDatabaseOperation(async () => {
      return await Promise.all([
        // Total portals created
        prisma.portal.count({
          where: { created_by: user.id }
        }),

        // Total unique clients
        prisma.portal.findMany({
          where: { created_by: user.id },
          select: { client_id: true },
          distinct: ['client_id']
        }),

        // Total updates posted
        prisma.update.count({
          where: {
            portal: {
              created_by: user.id
            }
          }
        }),

        // Storage used calculation
        prisma.file.aggregate({
          where: {
            portal: {
              created_by: user.id
            }
          },
          _sum: {
            file_size: true
          }
        }),

        // Current subscription
        prisma.subscription.findFirst({
          where: {
            user_id: user.id,
            is_active: true,
            ends_at: {
              gt: new Date()
            }
          },
          include: {
            plan: {
              select: {
                id: true,
                name: true,
                price: true,
                currency: true,
                billing_cycle: true
              }
            }
          },
          orderBy: {
            starts_at: 'desc'
          }
        })
      ])
    }, [0, [], 0, { _sum: { file_size: 0 } }, null]);

    // Calculate storage in MB/GB
    const storageBytes = storageData._sum.file_size || 0;
    const storageMB = storageBytes / (1024 * 1024);
    const storageGB = storageMB / 1024;
    
    const storageUsed = storageGB >= 1 
      ? `${storageGB.toFixed(2)} GB`
      : `${storageMB.toFixed(2)} MB`;

    // Get monthly activity data for the last 12 months - OPTIMIZED
    const months = [];
    const currentDate = new Date();
    
    // Generate date ranges for the last 12 months
    const monthRanges: Array<{
      monthStart: Date;
      monthEnd: Date;
      monthLabel: string;
    }> = [];
    for (let i = 11; i >= 0; i--) {
      const monthStart = startOfMonth(subMonths(currentDate, i));
      const monthEnd = endOfMonth(subMonths(currentDate, i));
      monthRanges.push({
        monthStart,
        monthEnd,
        monthLabel: format(monthStart, 'MMM yyyy')
      });
    }

    // Batch query for all monthly data in a single database operation with optimized connection management
    const monthlyData = await optimizedDatabaseQuery(async () => {
      return await prisma.$transaction(async (tx) => {
        const results = [];
        
        for (const range of monthRanges) {
          const [updatesCount, clientsCount] = await Promise.all([
            tx.update.count({
              where: {
                portal: {
                  created_by: user.id
                },
                created_at: {
                  gte: range.monthStart,
                  lte: range.monthEnd
                }
              }
            }),
            tx.portal.count({
              where: {
                created_by: user.id,
                created_at: {
                  gte: range.monthStart,
                  lte: range.monthEnd
                }
              }
            })
          ]);
          
          results.push({
            month: range.monthLabel,
            updates: updatesCount,
            clients: clientsCount
          });
        }
        
        return results;
      });
    }, { timeout: 45000, retries: 2, fallback: [] });

    months.push(...monthlyData);

    // Get top portals (most active by updates) with configurable limit
    const topPortals = await withDatabaseOperation(async () => {
      return await prisma.portal.findMany({
        where: { created_by: user.id },
        include: {
          client: {
            select: {
              name: true,
              email: true
            }
          },
          _count: {
            select: {
              updates: true
            }
          }
        },
        orderBy: {
          updates: {
            _count: 'desc'
          }
        },
        take: topPortalsLimit
      });
    }, []);

    // Get recent activity with pagination
    const [recentActivity, totalActivityCount] = await withDatabaseOperation(async () => {
      return await Promise.all([
        prisma.activity.findMany({
          where: {
            portal: {
              created_by: user.id
            }
          },
          include: {
            user: {
              select: {
                name: true,
                email: true
              }
            },
            portal: {
              select: {
                name: true
              }
            }
          },
          orderBy: {
            created_at: 'desc'
          },
          take: activityLimit,
          skip: activityOffset
        }),
        prisma.activity.count({
          where: {
            portal: {
              created_by: user.id
            }
          }
        })
      ]);
    }, [[], 0]);

    return NextResponse.json({
      overview: {
        totalPortals,
        totalClients: uniqueClients.length,
        totalUpdates,
        storageUsed
      },
      monthlyActivity: months,
      topPortals: topPortals.map(portal => ({
        id: portal.id,
        name: portal.name,
        clientName: portal.client.name,
        updateCount: portal._count.updates,
        lastUpdated: portal.updated_at,
        status: portal.status
      })),
      planUsage: {
        currentPlan: currentSubscription?.plan?.name || "Free",
        planId: currentSubscription?.plan?.id || "free",
        isActive: !!currentSubscription,
        endsAt: currentSubscription?.ends_at
      },
      recentActivity: recentActivity.map(activity => ({
        id: activity.id,
        type: activity.type,
        message: getActivityMessage(activity),
        portalName: activity.portal.name,
        userName: activity.user.name,
        createdAt: activity.created_at
      })),
      // Pagination metadata
      pagination: {
        activity: {
          currentPage: activityPage,
          totalItems: totalActivityCount,
          totalPages: Math.ceil(totalActivityCount / activityLimit),
          itemsPerPage: activityLimit,
          hasNext: activityPage < Math.ceil(totalActivityCount / activityLimit),
          hasPrev: activityPage > 1
        }
      }
    });

  } catch (error) {
    console.error('Freelancer dashboard API error:', error);
    return NextResponse.json({ 
      error: "Internal server error" 
    }, { status: 500 });
  }
}

function getActivityMessage(activity: any): string {
  switch (activity.type) {
    case 'portal_created':
      return `Created portal`;
    case 'portal_updated':
      return `Updated portal`;
    case 'update_created':
      return `Posted an update`;
    case 'file_uploaded':
      return `Uploaded a file`;
    case 'file_deleted':
      return `Deleted a file`;
    case 'comment':
      return `Added a comment`;
    case 'status_change':
      return `Changed status`;
    case 'shared_link_created':
      return `Created a shared link`;
    default:
      return `Performed an action`;
  }
} 