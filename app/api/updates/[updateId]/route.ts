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
      }

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