import { prisma } from "@/lib/prisma";
import { NotificationType } from "@prisma/client";

// Type definitions for notification metadata
interface NotificationMeta {
  updateId?: string;
  replyId?: string;
  fileName?: string;
  [key: string]: any;
}

// Generate appropriate link based on notification type and metadata
export function generateNotificationLink(
  portalId: string,
  type: NotificationType,
  meta: NotificationMeta = {}
): string {
  const basePortalUrl = `/portal/${portalId}`;

  switch (type) {
    case "new_comment":
      // Link to the specific update with comment highlighting
      if (meta.updateId && meta.replyId) {
        return `${basePortalUrl}/update/${meta.updateId}#reply-${meta.replyId}`;
      } else if (meta.updateId) {
        return `${basePortalUrl}/update/${meta.updateId}`;
      }
      return basePortalUrl;

    case "file_uploaded":
      // Link to files tab if uploaded independently, or to specific update if attached
      if (meta.updateId) {
        return `${basePortalUrl}/update/${meta.updateId}`;
      }
      return `${basePortalUrl}/files`;

    case "portal_updated":
      // Link to portal overview or settings
      return basePortalUrl;

    case "new_update":
      // Link to the specific update
      if (meta.updateId) {
        return `${basePortalUrl}/update/${meta.updateId}`;
      }
      return basePortalUrl;

    case "deadline_reminder":
      // Link to portal overview for deadline reminders
      return basePortalUrl;

    default:
      // Fallback to portal overview
      return basePortalUrl;
  }
}

// Generate notification message based on activity type and metadata
export function generateNotificationMessage(
  type: NotificationType,
  meta: NotificationMeta = {},
  actorName: string = "Someone"
): string {
  switch (type) {
    case "new_comment":
      if (meta.parentUpdateTitle) {
        return `${actorName} replied to "${meta.parentUpdateTitle}"`;
      }
      return `${actorName} left a new comment`;

    case "file_uploaded":
      if (meta.fileName) {
        return `${actorName} uploaded "${meta.fileName}"`;
      }
      return `${actorName} uploaded a new file`;

    case "portal_updated":
      if (meta.portalName) {
        return `Portal "${meta.portalName}" was updated`;
      }
      return `Portal was updated`;

    case "new_update":
      if (meta.updateTitle) {
        return `${actorName} posted "${meta.updateTitle}"`;
      }
      return `${actorName} posted a new update`;

    case "deadline_reminder":
      if (meta.portalName) {
        return `Reminder: The deadline for project '${meta.portalName}' is in 7 days.`;
      }
      return `Project deadline reminder: 7 days remaining`;

    default:
      return `New activity from ${actorName}`;
  }
}

// Map activity types to notification types
function mapActivityToNotificationType(activityType: string): NotificationType | null {
  switch (activityType) {
    case "reply_created":
      return "new_comment";
    case "file_uploaded":
      return "file_uploaded";
    case "portal_updated":
      return "portal_updated";
    case "update_created":
      return "new_update";
    default:
      return null;
  }
}

// Create notification for relevant users
export async function createNotification(
  tx: any, // Prisma transaction client
  portalId: string,
  actorUserId: string,
  activityType: string,
  meta: NotificationMeta = {}
): Promise<void> {
  const notificationType = mapActivityToNotificationType(activityType);
  
  if (!notificationType) {
    // No notification needed for this activity type
    return;
  }

  // Get portal information to determine who should receive the notification
  const portal = await tx.portal.findUnique({
    where: { id: portalId },
    include: {
      freelancer: { select: { id: true, name: true } },
      client: { select: { id: true, name: true } },
    },
  });

  if (!portal) {
    return;
  }

  // Get actor's information
  const actor = await tx.user.findUnique({
    where: { id: actorUserId },
    select: { id: true, name: true },
  });

  if (!actor) {
    return;
  }

  // Determine who should receive the notification (everyone except the actor)
  const recipientIds: string[] = [];
  
  if (portal.freelancer.id !== actorUserId) {
    recipientIds.push(portal.freelancer.id);
  }
  
  if (portal.client.id !== actorUserId) {
    recipientIds.push(portal.client.id);
  }

  // Create notifications for each recipient
  for (const recipientId of recipientIds) {
    const link = generateNotificationLink(portalId, notificationType, meta);
    const message = generateNotificationMessage(notificationType, meta, actor.name);

    await tx.notification.create({
      data: {
        user_id: recipientId,
        portal_id: portalId,
        type: notificationType,
        message,
        link,
        is_read: false,
      },
    });
  }
}

// Mark notification as read
export async function markNotificationAsRead(notificationId: string, userId: string): Promise<void> {
  await prisma.notification.updateMany({
    where: {
      id: notificationId,
      user_id: userId, // Ensure user can only mark their own notifications as read
    },
    data: {
      is_read: true,
    },
  });
}

// Mark all notifications as read for a user
export async function markAllNotificationsAsRead(userId: string): Promise<void> {
  await prisma.notification.updateMany({
    where: {
      user_id: userId,
      is_read: false,
    },
    data: {
      is_read: true,
    },
  });
}

// Clean up orphaned notifications (notifications pointing to deleted updates)
export async function cleanupOrphanedNotifications(): Promise<void> {
  // Find notifications that point to updates that no longer exist
  const notifications = await prisma.notification.findMany({
    where: {
      link: {
        contains: '/update/'
      }
    },
    select: {
      id: true,
      link: true
    }
  });

  for (const notification of notifications) {
    // Extract update ID from link
    const updateIdMatch = notification.link.match(/\/update\/([^\/\?#]+)/);
    if (updateIdMatch) {
      const updateId = updateIdMatch[1];
      
      // Check if update exists
      const update = await prisma.update.findUnique({
        where: { id: updateId },
        select: { id: true }
      });
      
      // If update doesn't exist, delete the notification
      if (!update) {
        await prisma.notification.delete({
          where: { id: notification.id }
        });
      }
    }
  }
}

// Get unread notification count for a user
export async function getUnreadNotificationCount(userId: string): Promise<number> {
  return await prisma.notification.count({
    where: {
      user_id: userId,
      is_read: false,
    },
  });
} 