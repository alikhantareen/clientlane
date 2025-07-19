import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getToken } from "next-auth/jwt";
import { z } from "zod";
import { updateUserLastSeen } from "@/lib/utils/helpers";
import { canUserUploadFiles, canUserUploadFilesToPortal } from "@/lib/utils/subscription";
import { uploadToBlob, deleteFromBlob, isBlobUrl } from "@/lib/utils/blob";
import { createReplySchema } from "@/lib/validations/auth";
import { createNotification } from "@/lib/utils/notifications";

interface RouteParams {
  replyId: string;
}

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<RouteParams> }
) {
  try {
    // Check authentication
    const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });
    if (!token || !token.sub) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { replyId } = await params;

    // Parse form data
    const formData = await req.formData();
    
    // Extract fields from formData
    const fields: any = {};
    const files: File[] = [];
    const filesToRemove: string[] = [];
    
    for (const [key, value] of formData.entries()) {
      if (value instanceof File) {
        files.push(value);
      } else if (key === 'filesToRemove') {
        try {
          const parsed = JSON.parse(value as string);
          filesToRemove.push(...parsed);
        } catch (e) {
          // Handle individual file ID
          filesToRemove.push(value as string);
        }
      } else {
        fields[key] = value;
      }
    }

    // Validate required fields
    const parsed = createReplySchema.safeParse(fields);
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.errors[0].message }, { status: 400 });
    }

    const { content } = parsed.data;

    // Find the reply and verify ownership
    const existingReply = await prisma.update.findFirst({
      where: { 
        id: replyId,
        user_id: token.sub, // Only allow editing own replies
        parent_update_id: { not: null }, // Must be a reply
      },
      include: {
        files: true,
        portal: {
          select: {
            id: true,
            created_by: true,
            client_id: true,
          },
        },
      },
    });

    if (!existingReply) {
      return NextResponse.json({ error: "Reply not found or you don't have permission to edit it" }, { status: 404 });
    }

    // Check file upload limits if there are files
    if (files.length > 0) {
      const totalFileSize = files.reduce((sum, file) => sum + file.size, 0);
      
      // Determine if user is freelancer or client
      const isFreelancer = existingReply.portal.created_by === token.sub;
      
      let uploadCheck;
      if (isFreelancer) {
        // Freelancer uploading - use their own plan limits
        uploadCheck = await canUserUploadFiles(token.sub!, totalFileSize);
      } else {
        // Client uploading - use portal's freelancer plan limits
        uploadCheck = await canUserUploadFilesToPortal(token.sub!, totalFileSize, existingReply.portal.id);
      }
      
      if (!uploadCheck.allowed) {
        return NextResponse.json({ 
          error: uploadCheck.reason,
          upgradeRequired: uploadCheck.upgradeRequired 
        }, { status: 403 });
      }
    }

    // Handle file uploads
    const uploadedFiles: Array<{
      file_name: string;
      file_url: string;
      file_type: string;
      file_size: number;
    }> = [];
    for (const file of files) {
      // Upload file to Vercel Blob Storage
      const blobResult = await uploadToBlob(file, 'uploads');
      
      uploadedFiles.push({
        file_name: file.name,
        file_url: blobResult.url,
        file_type: file.type,
        file_size: file.size,
      });
    }

    // Update reply in database transaction
    const updatedReply = await prisma.$transaction(async (tx) => {
      // Remove files that user requested to remove
      if (filesToRemove.length > 0) {
        const filesToDelete = await tx.file.findMany({
          where: {
            id: { in: filesToRemove },
            update_id: replyId,
          },
        });

        // Delete files from blob storage
        for (const file of filesToDelete) {
          if (isBlobUrl(file.file_url)) {
            await deleteFromBlob(file.file_url);
          }
        }

        // Delete file records
        await tx.file.deleteMany({
          where: {
            id: { in: filesToRemove },
            update_id: replyId,
          },
        });
      }

      // Update the reply
      const updated = await tx.update.update({
        where: { id: replyId },
        data: {
          content,
          updated_at: new Date(),
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
          files: true,
        },
      });

      // Create file records for new files
      if (uploadedFiles.length > 0) {
        await tx.file.createMany({
          data: uploadedFiles.map(file => ({
            portal_id: existingReply.portal.id,
            user_id: token.sub!,
            update_id: replyId,
            file_name: file.file_name,
            file_url: file.file_url,
            file_type: file.file_type,
            file_size: file.file_size,
          })),
        });
      }

      return updated;
    });

    // Get updated files list
    const allFiles = await prisma.file.findMany({
      where: { update_id: replyId },
      select: {
        id: true,
        file_name: true,
        file_url: true,
        file_type: true,
        file_size: true,
      },
    });

    return NextResponse.json({
      reply: {
        ...updatedReply,
        files: allFiles,
      },
    });

  } catch (error) {
    console.error("Error updating reply:", error);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<RouteParams> }
) {
  try {
    // Check authentication
    const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });
    if (!token || !token.sub) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { replyId } = await params;

    // Find the reply and verify ownership
    const reply = await prisma.update.findFirst({
      where: { 
        id: replyId,
        user_id: token.sub, // Only allow deleting own replies
        parent_update_id: { not: null }, // Ensure it's a reply, not a main update
      },
      include: {
        files: true,
        portal: {
          select: {
            id: true,
          },
        },
        parent_update: {
          select: {
            id: true,
            title: true,
          },
        },
      },
    });

    if (!reply) {
      return NextResponse.json({ error: "Reply not found or unauthorized" }, { status: 404 });
    }

    // Delete reply and associated files in transaction
    await prisma.$transaction(async (tx) => {
      // Delete file records from database
      await tx.file.deleteMany({
        where: { update_id: replyId },
      });

      // Delete the reply itself
      await tx.update.delete({
        where: { id: replyId },
      });

      // Log reply deletion activity
      await tx.activity.create({
        data: {
          portal_id: reply.portal.id,
          user_id: token.sub!,
          type: "reply_deleted",
          meta: {
            update_id: reply.id,
            parent_update_id: reply.parent_update_id,
            parent_update_title: reply.parent_update?.title,
          },
        },
      });
    });

    // Delete files from blob storage
    for (const file of reply.files) {
      if (isBlobUrl(file.file_url)) {
        try {
          await deleteFromBlob(file.file_url);
        } catch (error) {
          console.error("Error deleting file from blob:", error);
        }
      }
    }

    return NextResponse.json({ message: "Reply deleted successfully" });

  } catch (error) {
    console.error("Error deleting reply:", error);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
} 