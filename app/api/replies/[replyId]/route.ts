import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getToken } from "next-auth/jwt";
import { z } from "zod";
import fs from "fs";
import path from "path";

const updateReplySchema = z.object({
  content: z.string().min(1, "Content is required"),
});

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
    const parsed = updateReplySchema.safeParse(fields);
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.errors[0].message }, { status: 400 });
    }

    const { content } = parsed.data;
    
    // Parse files to remove if provided
    const filesToRemove: string[] = fields.filesToRemove ? JSON.parse(fields.filesToRemove) : [];

    // Find the reply and verify ownership
    const reply = await prisma.update.findFirst({
      where: { 
        id: replyId,
        user_id: token.sub, // Only allow editing own replies
        parent_update_id: { not: null }, // Ensure it's a reply, not a main update
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

    if (!reply) {
      return NextResponse.json({ error: "Reply not found or unauthorized" }, { status: 404 });
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

    // Update reply in database transaction
    const updatedReply = await prisma.$transaction(async (tx) => {
      // Remove files that were marked for removal
      if (filesToRemove.length > 0) {
        await tx.file.deleteMany({
          where: {
            id: { in: filesToRemove },
            update_id: replyId,
          },
        });
      }

      // Update the reply content
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

      // If new files were uploaded, add them
      if (uploadedFiles.length > 0) {
        await tx.file.createMany({
          data: uploadedFiles.map(file => ({
            portal_id: reply.portal.id,
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

    // Delete removed files from filesystem
    if (filesToRemove.length > 0) {
      const removedFiles = reply.files.filter(file => filesToRemove.includes(file.id));
      const uploadDir = path.join(process.cwd(), "public");
      
      for (const file of removedFiles) {
        const filePath = path.join(uploadDir, file.file_url);
        if (fs.existsSync(filePath)) {
          try {
            fs.unlinkSync(filePath);
          } catch (error) {
            console.error("Error deleting file:", filePath, error);
          }
        }
      }
    }

    // Return the updated reply
    return NextResponse.json({ 
      reply: {
        id: updatedReply.id,
        content: updatedReply.content,
        created_at: updatedReply.created_at,
        updated_at: updatedReply.updated_at,
        user: updatedReply.user,
        files: [...updatedReply.files, ...uploadedFiles],
      }
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
    });

    // Delete physical files from filesystem
    const uploadDir = path.join(process.cwd(), "public");
    for (const file of reply.files) {
      const filePath = path.join(uploadDir, file.file_url);
      if (fs.existsSync(filePath)) {
        try {
          fs.unlinkSync(filePath);
        } catch (error) {
          console.error("Error deleting file:", filePath, error);
        }
      }
    }

    return NextResponse.json({ message: "Reply deleted successfully" });

  } catch (error) {
    console.error("Error deleting reply:", error);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
} 