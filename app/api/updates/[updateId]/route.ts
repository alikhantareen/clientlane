import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getToken } from "next-auth/jwt";
import { z } from "zod";
import { createNotification } from "@/lib/utils/notifications";
import { canUserUploadFiles } from "@/lib/utils/subscription";
import { uploadToBlob, deleteFromBlob, isBlobUrl } from "@/lib/utils/blob";

const createReplySchema = z.object({
  content: z.string().min(1, "Content is required"),
});

const updateSchema = z.object({
  title: z.string().min(1, "Title is required"),
  content: z.string().min(1, "Content is required"),
});

interface RouteParams {
  updateId: string;
}

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<RouteParams> }
) {
  try {
    // Check authentication
    const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });
    if (!token || !token.sub) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { updateId } = await params;

    // Fetch the update with its replies
    const update = await prisma.update.findFirst({
      where: { id: updateId },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            image: true,
          },
        },
        files: {
          select: {
            id: true,
            file_name: true,
            file_url: true,
            file_type: true,
            file_size: true,
          },
        },
        portal: {
          select: {
            id: true,
            name: true,
            created_by: true,
            client_id: true,
          },
        },
        replies: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                email: true,
                image: true,
              },
            },
            files: {
              select: {
                id: true,
                file_name: true,
                file_url: true,
                file_type: true,
                file_size: true,
              },
            },
          },
          orderBy: { created_at: "asc" },
        },
      },
    });

    if (!update) {
      return NextResponse.json({ error: "Update not found" }, { status: 404 });
    }

    // Check if user has access to this portal
    const hasAccess = 
      update.portal.created_by === token.sub || 
      update.portal.client_id === token.sub;

    if (!hasAccess) {
      return NextResponse.json({ error: "Access denied" }, { status: 403 });
    }

    // Return the update with its replies
    return NextResponse.json({
      update: {
        id: update.id,
        title: update.title,
        content: update.content,
        created_at: update.created_at,
        updated_at: update.updated_at,
        user: update.user,
        files: update.files,
        portal: update.portal,
        replies: update.replies.map(reply => ({
          id: reply.id,
          content: reply.content,
          created_at: reply.created_at,
          updated_at: reply.updated_at,
          user: reply.user,
          files: reply.files,
        })),
      },
    });

  } catch (error) {
    console.error("Error fetching update:", error);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<RouteParams> }
) {
  try {
    // Check authentication
    const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });
    if (!token || !token.sub) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { updateId } = await params;

    // Parse form data
    const formData = await req.formData();
    
    // Extract fields from formData
    const fields: any = {};
    const files: File[] = [];
    
    for (const [key, value] of formData.entries()) {
      if (value instanceof File) {
        files.push(value);
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

    // Verify the parent update exists and user has access
    const parentUpdate = await prisma.update.findFirst({
      where: { id: updateId },
      include: {
        portal: {
          select: {
            id: true,
            created_by: true,
            client_id: true,
          },
        },
      },
    });

    if (!parentUpdate) {
      return NextResponse.json({ error: "Update not found" }, { status: 404 });
    }

    // Check if user has access to this portal
    const hasAccess = 
      parentUpdate.portal.created_by === token.sub || 
      parentUpdate.portal.client_id === token.sub;

    if (!hasAccess) {
      return NextResponse.json({ error: "Access denied" }, { status: 403 });
    }

    // Check file upload limits if there are files
    if (files.length > 0) {
      const totalFileSize = files.reduce((sum, file) => sum + file.size, 0);
      const uploadCheck = await canUserUploadFiles(token.sub!, totalFileSize);
      
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

    // Create reply in database transaction
    const reply = await prisma.$transaction(async (tx) => {
      // Create the reply
      const newReply = await tx.update.create({
        data: {
          title: "", // Replies don't have titles
          content,
          portal_id: parentUpdate.portal.id,
          user_id: token.sub!,
          parent_update_id: updateId,
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

      // Create file records if any files were uploaded
      if (uploadedFiles.length > 0) {
        await tx.file.createMany({
          data: uploadedFiles.map(file => ({
            portal_id: parentUpdate.portal.id,
            user_id: token.sub!,
            update_id: newReply.id,
            file_name: file.file_name,
            file_url: file.file_url,
            file_type: file.file_type,
            file_size: file.file_size,
          })),
        });

        // Log file upload activities for reply
        for (const file of uploadedFiles) {
          await tx.activity.create({
            data: {
              portal_id: parentUpdate.portal.id,
              user_id: token.sub!,
              type: "file_uploaded",
              meta: {
                file_name: file.file_name,
                file_size: file.file_size,
                file_type: file.file_type,
                update_id: newReply.id,
                parent_update_id: updateId,
              },
            },
          });

          // Create notification for file upload
          await createNotification(
            tx,
            parentUpdate.portal.id,
            token.sub!,
            "file_uploaded",
            {
              updateId: newReply.id,
              fileName: file.file_name,
            }
          );
        }
      }

      // Log reply creation activity
      await tx.activity.create({
        data: {
          portal_id: parentUpdate.portal.id,
          user_id: token.sub!,
          type: "reply_created",
          meta: {
            reply_id: newReply.id,
            parent_update_id: updateId,
          },
        },
      });

      // Create notification for new reply
      await createNotification(
        tx,
        parentUpdate.portal.id,
        token.sub!,
        "reply_created",
        {
          updateId: newReply.id,
          parentUpdateId: updateId,
        }
      );

      return newReply;
    });

    // Fetch the complete reply with files
    const completeReply = await prisma.update.findUnique({
      where: { id: reply.id },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            image: true,
          },
        },
        files: {
          select: {
            id: true,
            file_name: true,
            file_url: true,
            file_type: true,
            file_size: true,
          },
        },
      },
    });

    return NextResponse.json({ reply: completeReply });

  } catch (error) {
    console.error("Error creating reply:", error);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
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

    const { updateId } = await params;

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
    const parsed = updateSchema.safeParse(fields);
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.errors[0].message }, { status: 400 });
    }

    const { title, content } = parsed.data;

    // Find the update and verify ownership
    const existingUpdate = await prisma.update.findFirst({
      where: { 
        id: updateId,
        user_id: token.sub, // Only allow editing own updates
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

    if (!existingUpdate) {
      return NextResponse.json({ error: "Update not found or you don't have permission to edit it" }, { status: 404 });
    }

    // Check file upload limits if there are files
    if (files.length > 0) {
      const totalFileSize = files.reduce((sum, file) => sum + file.size, 0);
      const uploadCheck = await canUserUploadFiles(token.sub!, totalFileSize);
      
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

    // Update in database transaction
    const updatedUpdate = await prisma.$transaction(async (tx) => {
      // Remove files that user requested to remove
      if (filesToRemove.length > 0) {
        const filesToDelete = await tx.file.findMany({
          where: {
            id: { in: filesToRemove },
            update_id: updateId,
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
            update_id: updateId,
          },
        });
      }

      // Update the update
      const updated = await tx.update.update({
        where: { id: updateId },
        data: {
          title,
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
            portal_id: existingUpdate.portal.id,
            user_id: token.sub!,
            update_id: updateId,
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
      where: { update_id: updateId },
      select: {
        id: true,
        file_name: true,
        file_url: true,
        file_type: true,
        file_size: true,
      },
    });

    return NextResponse.json({ 
      update: {
        ...updatedUpdate,
        files: allFiles,
      }
    });

  } catch (error) {
    console.error("Error updating update:", error);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
} 