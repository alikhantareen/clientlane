import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getToken } from "next-auth/jwt";
import { markNotificationAsRead, markAllNotificationsAsRead } from "@/lib/utils/notifications";

export async function GET(req: NextRequest) {
  try {
    // Check authentication
    const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });
    if (!token || !token.sub) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const page = parseInt(searchParams.get("page") || "1", 10);
    const limit = parseInt(searchParams.get("limit") || "20", 10);
    const unreadOnly = searchParams.get("unreadOnly") === "true";
    const skip = (page - 1) * limit;

    // Build where clause
    const where: any = {
      user_id: token.sub,
    };

    if (unreadOnly) {
      where.is_read = false;
    }

    // Fetch notifications with portal information
    const [notifications, total] = await Promise.all([
      prisma.notification.findMany({
        where,
        include: {
          portal: {
            select: {
              id: true,
              name: true,
              thumbnail_url: true,
            },
          },
          user: {
            select: {
              id: true,
              name: true,
            },
          },
        },
        orderBy: {
          created_at: "desc",
        },
        skip,
        take: limit,
      }),
      prisma.notification.count({ where }),
    ]);

    // Get unread count
    const unreadCount = await prisma.notification.count({
      where: {
        user_id: token.sub,
        is_read: false,
      },
    });

    const hasMore = skip + notifications.length < total;

    return NextResponse.json({
      notifications: notifications.map(notification => ({
        id: notification.id,
        type: notification.type,
        message: notification.message,
        link: notification.link,
        is_read: notification.is_read,
        created_at: notification.created_at,
        portal: notification.portal,
      })),
      total,
      unreadCount,
      page,
      limit,
      hasMore,
    });
  } catch (error) {
    console.error("Error fetching notifications:", error);
    // Add more detailed error logging for Vercel debugging
    if (process.env.NODE_ENV === 'production') {
      console.error("Notifications API Error Details:", {
        message: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : undefined,
        timestamp: new Date().toISOString(),
        userAgent: req.headers.get('user-agent'),
      });
    }
    return NextResponse.json({ 
      error: "Server error",
      message: process.env.NODE_ENV === 'development' ? error instanceof Error ? error.message : 'Unknown error' : 'Internal server error'
    }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  try {
    // Check authentication
    const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });
    if (!token || !token.sub) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { notificationId, markAllAsRead, markByLink } = body;

    if (markAllAsRead) {
      // Mark all notifications as read
      await markAllNotificationsAsRead(token.sub);
      return NextResponse.json({ message: "All notifications marked as read" });
    } else if (markByLink) {
      // Mark notifications by link pattern
      await prisma.notification.updateMany({
        where: {
          user_id: token.sub,
          link: {
            contains: markByLink
          },
          is_read: false
        },
        data: {
          is_read: true
        }
      });
      return NextResponse.json({ message: "Notifications marked as read" });
    } else if (notificationId) {
      // Mark specific notification as read
      await markNotificationAsRead(notificationId, token.sub);
      return NextResponse.json({ message: "Notification marked as read" });
    } else {
      return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
    }
  } catch (error) {
    console.error("Error updating notification:", error);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
} 