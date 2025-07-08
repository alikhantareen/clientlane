import { prisma } from "@/lib/prisma";
import { ActivityType } from "@prisma/client";
import { 
  Upload, 
  MessageCircle, 
  Settings, 
  FileText, 
  Reply, 
  FolderPlus, 
  Share2,
  Trash2,
  type LucideIcon 
} from "lucide-react";

export interface ActivityMeta {
  // For file uploads
  file_name?: string;
  file_size?: number;
  file_type?: string;
  
  // For updates and replies
  update_title?: string;
  update_id?: string;
  parent_update_id?: string;
  
  // For comments
  comment_content?: string;
  
  // For status changes
  old_status?: string;
  new_status?: string;
  
  // For portal creation
  portal_name?: string;
  
  // For shared links
  shared_link_token?: string;
  expires_at?: string;
}

export interface Activity {
  id: string;
  portal_id: string;
  user_id: string;
  type: ActivityType;
  meta: ActivityMeta;
  created_at: Date;
  user: {
    id: string;
    name: string;
    email: string;
    image?: string | null;
  };
}

/**
 * Create a new activity record
 */
export async function createActivity(
  portalId: string,
  userId: string,
  type: ActivityType,
  meta: ActivityMeta = {}
) {
  try {
    const activity = await prisma.activity.create({
      data: {
        portal_id: portalId,
        user_id: userId,
        type,
        meta: meta as any, // Prisma Json type
      },
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
    });

    return activity;
  } catch (error) {
    console.error("Error creating activity:", error);
    throw error;
  }
}

/**
 * Get activity icon based on type
 */
export function getActivityIcon(type: ActivityType): LucideIcon {
  switch (type) {
    case "upload":
    case "file_uploaded":
      return Upload;
    case "comment":
      return MessageCircle;
    case "status_change":
      return Settings;
    case "update_created":
      return FileText;
    case "reply_created":
      return Reply;
    case "file_deleted":
    case "update_deleted":
    case "reply_deleted":
      return Trash2;
    case "portal_created":
      return FolderPlus;
    case "shared_link_created":
      return Share2;
    default:
      return FileText;
  }
}

/**
 * Get activity color based on type
 */
export function getActivityColor(type: ActivityType): string {
  switch (type) {
    case "upload":
    case "file_uploaded":
      return "text-blue-600";
    case "comment":
      return "text-green-600";
    case "status_change":
      return "text-orange-600";
    case "update_created":
      return "text-purple-600";
    case "reply_created":
      return "text-indigo-600";
    case "file_deleted":
    case "update_deleted":
    case "reply_deleted":
      return "text-red-600";
    case "portal_created":
      return "text-emerald-600";
    case "shared_link_created":
      return "text-cyan-600";
    default:
      return "text-gray-600";
  }
}

/**
 * Format activity message based on type and meta
 */
export function formatActivityMessage(activity: Activity): string {
  const { type, meta, user } = activity;

  switch (type) {
    case "upload":
    case "file_uploaded":
      if (meta.file_name) {
        return `uploaded ${meta.file_name}`;
      }
      return "uploaded a file";

    case "comment":
      return "added a comment";

    case "status_change":
      if (meta.old_status && meta.new_status) {
        return `changed portal status from ${meta.old_status} to ${meta.new_status}`;
      }
      return "changed portal status";

    case "update_created":
      if (meta.update_title) {
        return `created update "${meta.update_title}"`;
      }
      return "created a new update";

    case "reply_created":
      return "replied to an update";

    case "portal_created":
      if (meta.portal_name) {
        return `created portal "${meta.portal_name}"`;
      }
      return "created the portal";

    case "shared_link_created":
      return "created a shared link";

    case "file_deleted":
      if (meta.file_name) {
        return `deleted ${meta.file_name}`;
      }
      return "deleted a file";

    case "update_deleted":
      if (meta.update_title) {
        return `deleted update "${meta.update_title}"`;
      }
      return "deleted an update";

    case "reply_deleted":
      return "deleted a reply";

    default:
      return "performed an action";
  }
}

/**
 * Format file size for display
 */
export function formatFileSize(bytes: number): string {
  if (bytes === 0) return "0 Bytes";
  
  const k = 1024;
  const sizes = ["Bytes", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
}

/**
 * Get activity background color for timeline
 */
export function getActivityBgColor(type: ActivityType): string {
  switch (type) {
    case "upload":
    case "file_uploaded":
      return "bg-blue-100";
    case "comment":
      return "bg-green-100";
    case "status_change":
      return "bg-orange-100";
    case "update_created":
      return "bg-purple-100";
    case "reply_created":
      return "bg-indigo-100";
    case "file_deleted":
    case "update_deleted":
    case "reply_deleted":
      return "bg-red-100";
    case "portal_created":
      return "bg-emerald-100";
    case "shared_link_created":
      return "bg-cyan-100";
    default:
      return "bg-gray-100";
  }
} 