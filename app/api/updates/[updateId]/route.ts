import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getToken } from "next-auth/jwt";
import { z } from "zod";
import fs from "fs";
import path from "path";

const createReplySchema = z.object({
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

    // Ensure uploads directory exists
    const uploadDir = path.join(process.cwd(), "public/uploads");
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }

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

    // Handle file uploads
    const uploadedFiles: Array<{
      file_name: string;
      file_url: string;
      file_type: string;
      file_size: number;
    }> = [];
    for (const file of files) {
      const buffer = await file.arrayBuffer();
      const filename = `${Date.now()}_${file.name}`;
      const filepath = path.join(uploadDir, filename);
      
      // Write file to disk
      fs.writeFileSync(filepath, Buffer.from(buffer));
      
      uploadedFiles.push({
        file_name: file.name,
        file_url: `/uploads/${filename}`,
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
        }
      }

      // Log reply creation activity
      await tx.activity.create({
        data: {
          portal_id: parentUpdate.portal.id,
          user_id: token.sub!,
          type: "reply_created",
          meta: {
            update_id: newReply.id,
            parent_update_id: updateId,
            parent_update_title: parentUpdate.title,
          },
        },
      });

      return newReply;
    });

    // Return the created reply
    return NextResponse.json({ 
      reply: {
        id: reply.id,
        content: reply.content,
        created_at: reply.created_at,
        user: reply.user,
        files: uploadedFiles,
      }
    }, { status: 201 });

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

    // Ensure uploads directory exists
    const uploadDir = path.join(process.cwd(), "public/uploads");
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }

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
          filesToRemove.push(...JSON.parse(value as string));
        } catch (e) {
          // If it's not JSON, treat as single file ID
          filesToRemove.push(value as string);
        }
      } else {
        fields[key] = value;
      }
    }

    // Validate required fields
    const updateSchema = z.object({
      title: z.string().min(1, "Title is required"),
      content: z.string().min(1, "Content is required"),
    });

    const parsed = updateSchema.safeParse(fields);
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.errors[0].message }, { status: 400 });
    }

    const { title, content } = parsed.data;

    // Verify the update exists and user is the creator
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

    // Handle file uploads
    const uploadedFiles: Array<{
      file_name: string;
      file_url: string;
      file_type: string;
      file_size: number;
    }> = [];
    
    for (const file of files) {
      const buffer = await file.arrayBuffer();
      const filename = `${Date.now()}_${file.name}`;
      const filepath = path.join(uploadDir, filename);
      
      // Write file to disk
      fs.writeFileSync(filepath, Buffer.from(buffer));
      
      uploadedFiles.push({
        file_name: file.name,
        file_url: `/uploads/${filename}`,
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

        // Delete files from filesystem
        for (const file of filesToDelete) {
          const filePath = path.join(process.cwd(), "public", file.file_url);
          if (fs.existsSync(filePath)) {
            fs.unlinkSync(filePath);
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

    // Return the updated update
    return NextResponse.json({ 
      update: {
        id: updatedUpdate.id,
        title: updatedUpdate.title,
        content: updatedUpdate.content,
        created_at: updatedUpdate.created_at,
        updated_at: updatedUpdate.updated_at,
        user: updatedUpdate.user,
        files: allFiles,
      }
    }, { status: 200 });

  } catch (error) {
    console.error("Error updating update:", error);
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

    const { updateId } = await params;

    // Verify the update exists and user is the creator
    const existingUpdate = await prisma.update.findFirst({
      where: { 
        id: updateId,
        user_id: token.sub, // Only allow deleting own updates
      },
      include: {
        files: {
          select: {
            id: true,
            file_url: true,
          },
        },
        replies: {
          select: {
            id: true,
          },
        },
        portal: {
          select: {
            id: true,
          },
        },
      },
    });

    if (!existingUpdate) {
      return NextResponse.json({ error: "Update not found or you don't have permission to delete it" }, { status: 404 });
    }

    // Delete in database transaction
    await prisma.$transaction(async (tx) => {
      // Get all files from replies
      const replyFiles = await tx.file.findMany({
        where: {
          update_id: { in: existingUpdate.replies.map(r => r.id) },
        },
        select: {
          file_url: true,
        },
      });

      // Collect all files to delete (from update and its replies)
      const allFiles = [
        ...existingUpdate.files,
        ...replyFiles,
      ];

      // Delete files from filesystem
      for (const file of allFiles) {
        const filePath = path.join(process.cwd(), "public", file.file_url);
        if (fs.existsSync(filePath)) {
          fs.unlinkSync(filePath);
        }
      }

      // Delete file records for replies
      await tx.file.deleteMany({
        where: {
          update_id: { in: existingUpdate.replies.map(r => r.id) },
        },
      });

      // Delete file records for main update
      await tx.file.deleteMany({
        where: {
          update_id: updateId,
        },
      });

      // Delete reply records
      await tx.update.deleteMany({
        where: {
          parent_update_id: updateId,
        },
      });

      // Delete the main update
      await tx.update.delete({
        where: { id: updateId },
      });

      // Log update deletion activity
      await tx.activity.create({
        data: {
          portal_id: existingUpdate.portal.id,
          user_id: token.sub!,
          type: "update_deleted",
          meta: {
            update_title: existingUpdate.title,
            update_id: existingUpdate.id,
          },
        },
      });
    });

    return NextResponse.json({ message: "Update deleted successfully" }, { status: 200 });

  } catch (error) {
    console.error("Error deleting update:", error);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
} 