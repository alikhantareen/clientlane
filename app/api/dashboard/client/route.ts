import { NextRequest, NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";
import { prisma } from "@/lib/prisma";
import { updateUserLastSeen } from "@/lib/utils/helpers";

export async function GET(req: NextRequest) {
  try {
    // Check authentication
    const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });
    if (!token || !token.sub) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Verify user exists and is a client
    const user = await prisma.user.findUnique({
      where: { id: token.sub },
      select: { id: true, role: true }
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    if (user.role !== "client") {
      return NextResponse.json({ error: "Only clients can access this dashboard" }, { status: 403 });
    }

    // Update last_seen_at for the user
    await updateUserLastSeen(user.id);

    // Parse query parameters for pagination
    const { searchParams } = new URL(req.url);
    const filesLimit = parseInt(searchParams.get("filesLimit") || "20");
    const filesPage = parseInt(searchParams.get("filesPage") || "1");
    const updatesLimit = parseInt(searchParams.get("updatesLimit") || "10");
    const updatesPage = parseInt(searchParams.get("updatesPage") || "1");
    const activityLimit = parseInt(searchParams.get("activityLimit") || "10");
    const activityPage = parseInt(searchParams.get("activityPage") || "1");
    
    // Calculate offsets for pagination
    const filesOffset = (filesPage - 1) * filesLimit;
    const updatesOffset = (updatesPage - 1) * updatesLimit;
    const activityOffset = (activityPage - 1) * activityLimit;

    // Get assigned portals
    const assignedPortals = await prisma.portal.findMany({
      where: { client_id: user.id },
      include: {
        freelancer: {
          select: {
            name: true,
            email: true,
            image: true
          }
        },
        _count: {
          select: {
            updates: true,
            files: true
          }
        }
      },
      orderBy: {
        updated_at: 'desc'
      }
    });

    // Get files shared across all portals with pagination
    const [sharedFiles, totalFilesCount] = await Promise.all([
      prisma.file.findMany({
        where: {
          portal: {
            client_id: user.id
          }
        },
        include: {
          portal: {
            select: {
              name: true
            }
          },
          user: {
            select: {
              name: true,
              email: true
            }
          }
        },
        orderBy: {
          uploaded_at: 'desc'
        },
        take: filesLimit,
        skip: filesOffset
      }),
      prisma.file.count({
        where: {
          portal: {
            client_id: user.id
          }
        }
      })
    ]);

    // Get unread updates summary with pagination
    const [unreadUpdates, totalUpdatesCount] = await Promise.all([
      prisma.update.findMany({
        where: {
          portal: {
            client_id: user.id
          }
        },
        include: {
          portal: {
            select: {
              name: true
            }
          },
          user: {
            select: {
              name: true,
              email: true
            }
          }
        },
        orderBy: {
          created_at: 'desc'
        },
        take: updatesLimit,
        skip: updatesOffset
      }),
      prisma.update.count({
        where: {
          portal: {
            client_id: user.id
          }
        }
      })
    ]);

    // Get recent activity in client's portals with pagination
    const [recentActivity, totalActivityCount] = await Promise.all([
      prisma.activity.findMany({
        where: {
          portal: {
            client_id: user.id
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
            client_id: user.id
          }
        }
      })
    ]);

    return NextResponse.json({
      assignedPortals: assignedPortals.map(portal => ({
        id: portal.id,
        name: portal.name,
        description: portal.description,
        status: portal.status,
        thumbnailUrl: portal.thumbnail_url,
        freelancerName: portal.freelancer.name,
        freelancerEmail: portal.freelancer.email,
        freelancerImage: portal.freelancer.image,
        updateCount: portal._count.updates,
        fileCount: portal._count.files,
        lastUpdated: portal.updated_at,
        createdAt: portal.created_at
      })),
      sharedFiles: sharedFiles.map(file => ({
        id: file.id,
        fileName: file.file_name,
        fileUrl: file.file_url,
        fileType: file.file_type,
        fileSize: file.file_size,
        uploadedAt: file.uploaded_at,
        portalName: file.portal.name,
        uploaderName: file.user?.name || 'Unknown',
        uploaderEmail: file.user?.email || ''
      })),
      unreadUpdates: unreadUpdates.map(update => ({
        id: update.id,
        title: update.title,
        content: update.content,
        portalName: update.portal.name,
        authorName: update.user.name,
        authorEmail: update.user.email,
        createdAt: update.created_at
      })),
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
        files: {
          currentPage: filesPage,
          totalItems: totalFilesCount,
          totalPages: Math.ceil(totalFilesCount / filesLimit),
          itemsPerPage: filesLimit,
          hasNext: filesPage < Math.ceil(totalFilesCount / filesLimit),
          hasPrev: filesPage > 1
        },
        updates: {
          currentPage: updatesPage,
          totalItems: totalUpdatesCount,
          totalPages: Math.ceil(totalUpdatesCount / updatesLimit),
          itemsPerPage: updatesLimit,
          hasNext: updatesPage < Math.ceil(totalUpdatesCount / updatesLimit),
          hasPrev: updatesPage > 1
        },
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
    console.error('Client dashboard API error:', error);
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