import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getToken } from "next-auth/jwt";
import { z } from "zod";
import { canUserUploadFiles } from "@/lib/utils/subscription";
import { createNotification } from "@/lib/utils/notifications";
import { updateUserLastSeen } from "@/lib/utils/helpers";
import { uploadToBlob, deleteFromBlob, isBlobUrl } from "@/lib/utils/blob";

const updatePortalSchema = z.object({
  name: z.string().min(2).optional(),
  clientEmail: z.string().email().optional(),
  clientName: z.string().optional(),
  description: z.string().optional(),
  status: z.enum(["active", "pending", "archived"]).optional(),
  tags: z.string().optional(),
  dueDate: z.string().optional(),
  welcomeNote: z.string().optional(),
});

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Check authentication
    const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });
    if (!token || !token.sub) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id: portalId } = await params;

    // Update last_seen_at for the user
    await updateUserLastSeen(token.sub);

    // Verify user exists
    const user = await prisma.user.findUnique({
      where: { id: token.sub },
      select: { id: true, role: true }
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    if (user.role !== "freelancer" && user.role !== "client") {
      return NextResponse.json({ error: "Access denied" }, { status: 403 });
    }

    // Find portal and ensure user has access to it
    const where: any = { id: portalId };
    
    if (user.role === "freelancer") {
      // Freelancers can view portals they created
      where.created_by = user.id;
    } else if (user.role === "client") {
      // Clients can view portals they are assigned to
      where.client_id = user.id;
    }
    
    const portal = await prisma.portal.findFirst({
      where,
      include: {
        client: { 
          select: { 
            id: true, 
            name: true, 
            email: true, 
            image: true 
          } 
        },
        freelancer: { 
          select: { 
            id: true, 
            name: true, 
            email: true, 
            image: true 
          } 
        },
        comments: { 
          select: { 
            id: true, 
            content: true, 
            created_at: true 
          } 
        },
        updates: {
          select: {
            id: true,
            title: true,
            created_at: true,
            parent_update_id: true
          },
          where: {
            parent_update_id: null // Only root updates, not replies
          }
        },
        shared_links: {
          select: {
            id: true,
            token: true,
            is_revoked: true,
            expires_at: true,
            last_viewed_at: true,
            created_at: true
          }
        }
      },
    });

    if (!portal) {
      return NextResponse.json({ error: "Portal not found" }, { status: 404 });
    }

    // Return detailed portal data
    const portalData = {
      id: portal.id,
      name: portal.name,
      description: portal.description,
      status: portal.status,
      thumbnail_url: portal.thumbnail_url,
      client: portal.client,
      freelancer: portal.freelancer,
      comments: portal.comments,
      updates: portal.updates,
      shared_links: portal.shared_links,
      created_at: portal.created_at,
      updated_at: portal.updated_at,
      commentsCount: portal.comments.length,
      // Generate initials based on user role - client initials for freelancers, freelancer initials for clients
      initials: user.role === "freelancer" 
        ? portal.client.name.split(' ').map(word => word[0]).join('').toUpperCase() || 'C'
        : portal.freelancer.name.split(' ').map(word => word[0]).join('').toUpperCase() || 'F',
      tags: portal.tags || "",
      dueDate: portal.dueDate || "",
      welcomeNote: portal.welcomeNote || "",
    };

    return NextResponse.json({ portal: portalData });
  } catch (err) {
    console.error("Error fetching portal:", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
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
      return NextResponse.json({ error: "Only freelancers can update portals" }, { status: 403 });
    }

    const { id: portalId } = await params;

    // Find portal and ensure it belongs to the current user
    const existingPortal = await prisma.portal.findFirst({
      where: {
        id: portalId,
        created_by: user.id,
      },
      include: {
        client: true,
      },
    });

    if (!existingPortal) {
      return NextResponse.json({ error: "Portal not found" }, { status: 404 });
    }



    // Parse form data
    const formData = await req.formData();
    
    // Extract fields from formData
    const fields: any = {};
    const files: any = {};
    
    for (const [key, value] of formData.entries()) {
      if (value instanceof File) {
        files[key] = value;
      } else {
        fields[key] = value;
      }
    }

    // Validate update data
    const parsed = updatePortalSchema.safeParse(fields);
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.errors[0].message }, { status: 400 });
    }

    const updateData = parsed.data;

    // Handle thumbnail upload if provided
    let thumbnail_url = existingPortal.thumbnail_url;
    if (files.thumbnail) {
      const file = files.thumbnail as File;
      
      // Check file upload limits for thumbnail
      const uploadCheck = await canUserUploadFiles(user.id, file.size);
      if (!uploadCheck.allowed) {
        return NextResponse.json({ 
          error: uploadCheck.reason,
          upgradeRequired: uploadCheck.upgradeRequired 
        }, { status: 403 });
      }
      
      // Upload file to Vercel Blob Storage
      const blobResult = await uploadToBlob(file, 'portal-thumbnails');
      thumbnail_url = blobResult.url;
      
      // Remove old thumbnail if it exists and is a blob URL
      if (existingPortal.thumbnail_url && isBlobUrl(existingPortal.thumbnail_url)) {
        await deleteFromBlob(existingPortal.thumbnail_url);
      }
    }

    // Prepare update object
    const portalUpdateData: any = {
      updated_at: new Date(),
    };

    if (updateData.name) portalUpdateData.name = updateData.name;
    if (updateData.description !== undefined) portalUpdateData.description = updateData.description;
    if (updateData.status) portalUpdateData.status = updateData.status;
    if (thumbnail_url !== existingPortal.thumbnail_url) portalUpdateData.thumbnail_url = thumbnail_url;
    if (updateData.tags !== undefined) portalUpdateData.tags = Array.isArray(updateData.tags) ? updateData.tags.join(',') : updateData.tags;
    if (updateData.dueDate !== undefined) portalUpdateData.dueDate = updateData.dueDate;
    if (updateData.welcomeNote !== undefined) portalUpdateData.welcomeNote = updateData.welcomeNote;

    // Handle client update if email changed
    let updatedClient = existingPortal.client;
    if (updateData.clientEmail && updateData.clientEmail !== existingPortal.client.email) {
      // Check if new email already exists
      const existingUser = await prisma.user.findUnique({
        where: { email: updateData.clientEmail }
      });

      if (existingUser && existingUser.id !== existingPortal.client_id) {
        return NextResponse.json({ error: "A user with this email already exists" }, { status: 400 });
      }

      // Update client email and name
      updatedClient = await prisma.user.update({
        where: { id: existingPortal.client_id },
        data: {
          email: updateData.clientEmail,
          name: updateData.clientName || existingPortal.client.name,
        },
      });
    } else if (updateData.clientName && updateData.clientName !== existingPortal.client.name) {
      // Update only client name
      updatedClient = await prisma.user.update({
        where: { id: existingPortal.client_id },
        data: {
          name: updateData.clientName,
        },
      });
    }

    // Update portal
    const updatedPortal = await prisma.portal.update({
      where: { id: portalId },
      data: portalUpdateData,
      include: {
        client: {
          select: {
            id: true,
            name: true,
            email: true,
            image: true
          }
        }
      }
    });

    // Log portal update activity
    await prisma.activity.create({
      data: {
        portal_id: portalId,
        user_id: user.id,
        type: "portal_updated",
        meta: {
          portal_name: updatedPortal.name,
          updated_fields: Object.keys(updateData),
        },
      },
    });

    // Create notification for portal update
    await createNotification(
      prisma,
      portalId,
      user.id,
      "portal_updated",
      {
        portalName: updatedPortal.name,
      }
    );

    return NextResponse.json({ 
      portal: {
        ...updatedPortal,
        commentsCount: 0, // We could calculate this if needed
        initials: updatedPortal.name.split(' ').map(word => word[0]).join('').toUpperCase() || 'P',
        tags: (updatedPortal as any).tags || '',
        dueDate: (updatedPortal as any).dueDate || '',
        welcomeNote: (updatedPortal as any).welcomeNote || '',
      }
    });

  } catch (err) {
    console.error("Portal update error:", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
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
      return NextResponse.json({ error: "Only freelancers can delete portals" }, { status: 403 });
    }

    const { id: portalId } = await params;

    // Find portal and ensure it belongs to the current user
    const portal = await prisma.portal.findFirst({
      where: {
        id: portalId,
        created_by: user.id,
      },
      include: {
        files: {
          select: {
            file_url: true,
          },
        },
        client: {
          select: {
            id: true,
            role: true,
          },
        },
      },
    });

    if (!portal) {
      return NextResponse.json({ error: "Portal not found" }, { status: 404 });
    }

    // Check if client has other portals (excluding the one being deleted)
    const clientOtherPortals = await prisma.portal.findMany({
      where: {
        client_id: portal.client.id,
        id: { not: portalId }, // Exclude current portal
      },
      select: { id: true },
    });

    const clientHasOtherPortals = clientOtherPortals.length > 0;

    // Use a transaction to delete everything atomically
    await prisma.$transaction(async (tx) => {
      // Delete all related data in the correct order (respecting foreign key constraints)
      
      // Delete activities first
      await tx.activity.deleteMany({
        where: { portal_id: portalId },
      });

      // Delete comments
      await tx.comment.deleteMany({
        where: { portal_id: portalId },
      });

      // Delete files (database records)
      await tx.file.deleteMany({
        where: { portal_id: portalId },
      });

      // Delete updates and their replies
      const updates = await tx.update.findMany({
        where: { portal_id: portalId },
        select: { id: true },
      });

      for (const update of updates) {
        // Delete replies first
        await tx.update.deleteMany({
          where: { parent_update_id: update.id },
        });
      }

      // Delete main updates
      await tx.update.deleteMany({
        where: { portal_id: portalId },
      });

      // Delete shared links
      await tx.sharedLink.deleteMany({
        where: { portal_id: portalId },
      });

      // Delete portal tags
      await tx.portalTag.deleteMany({
        where: { portal_id: portalId },
      });

      // Delete notifications related to this portal
      await tx.notification.deleteMany({
        where: { portal_id: portalId },
      });

      // Finally, delete the portal
      await tx.portal.delete({
        where: { id: portalId },
      });

      // Handle client deletion/deactivation based on whether they have other portals
      if (!clientHasOtherPortals && portal.client.role === "client") {
        // Client has no other portals, so clean them up
        
        // Option 1: Soft delete - mark as inactive (recommended for data retention)
        await tx.user.update({
          where: { id: portal.client.id },
          data: { is_active: false },
        });

        // Option 2: Hard delete - uncomment below if you prefer complete removal
        // Note: This will cascade delete their comments, activities, etc. on other portals if any exist
        /*
        // Delete client's remaining data that's not portal-specific
        await tx.comment.deleteMany({
          where: { user_id: portal.client.id },
        });
        
        await tx.activity.deleteMany({
          where: { user_id: portal.client.id },
        });
        
        await tx.notification.deleteMany({
          where: { user_id: portal.client.id },
        });
        
        await tx.file.updateMany({
          where: { user_id: portal.client.id },
          data: { user_id: null }, // Set to null instead of deleting to preserve file records
        });
        
        await tx.update.deleteMany({
          where: { user_id: portal.client.id },
        });
        
        await tx.subscription.deleteMany({
          where: { user_id: portal.client.id },
        });

        // Finally delete the client user
        await tx.user.delete({
          where: { id: portal.client.id },
        });
        */
      } else if (clientHasOtherPortals) {
        // Client has other portals, ensure they remain active
        await tx.user.update({
          where: { id: portal.client.id },
          data: { is_active: true },
        });
      }
      // If client is not a "client" role, we don't modify their status
    });

    // Delete files from blob storage
    for (const file of portal.files) {
      if (file.file_url && isBlobUrl(file.file_url)) {
        try {
          await deleteFromBlob(file.file_url);
        } catch (err) {
          console.error("Error deleting file from blob:", err);
        }
      }
    }

    // Delete portal thumbnail if it exists and is a blob URL
    if (portal.thumbnail_url && isBlobUrl(portal.thumbnail_url)) {
      try {
        await deleteFromBlob(portal.thumbnail_url);
      } catch (err) {
        console.error("Error deleting thumbnail from blob:", err);
      }
    }

    // Return appropriate message based on what was deleted
    const message = !clientHasOtherPortals && portal.client.role === "client" 
      ? "Portal deleted successfully. Client has been deactivated as they have no other portals." 
      : "Portal deleted successfully.";

    return NextResponse.json({ message });

  } catch (err) {
    console.error("Portal deletion error:", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
} 