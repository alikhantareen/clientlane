import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getToken } from "next-auth/jwt";
import { z } from "zod";
import fs from "fs";
import path from "path";

const createUpdateSchema = z.object({
  title: z.string().min(1, "Title is required"),
  content: z.string().min(1, "Content is required"),
  portalId: z.string().uuid("Invalid portal ID"),
});

const getUpdatesSchema = z.object({
  portalId: z.string().uuid("Invalid portal ID"),
  page: z.string().optional().default("1"),
  limit: z.string().optional().default("10"),
});

export async function POST(req: NextRequest) {
  try {
    // Check authentication
    const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });
    if (!token || !token.sub) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

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
    const parsed = createUpdateSchema.safeParse(fields);
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.errors[0].message }, { status: 400 });
    }

    const { title, content, portalId } = parsed.data;

    // Verify portal exists and user has access
    const portal = await prisma.portal.findFirst({
      where: {
        id: portalId,
        OR: [
          { created_by: token.sub }, // Freelancer who created the portal
          { client_id: token.sub },   // Client who owns the portal
        ],
      },
    });

    if (!portal) {
      return NextResponse.json({ error: "Portal not found or access denied" }, { status: 404 });
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

    // Create update in database transaction
    const update = await prisma.$transaction(async (tx) => {
      // Create the update
      const newUpdate = await tx.update.create({
        data: {
          title,
          content,
          portal_id: portalId,
          user_id: token.sub!,
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
            portal_id: portalId,
            user_id: token.sub!,
            update_id: newUpdate.id,
            file_name: file.file_name,
            file_url: file.file_url,
            file_type: file.file_type,
            file_size: file.file_size,
          })),
        });
      }

      return newUpdate;
    });

    // Return the created update
    return NextResponse.json({ 
      update: {
        id: update.id,
        title: update.title,
        content: update.content,
        created_at: update.created_at,
        user: update.user,
        files: uploadedFiles,
      }
    }, { status: 201 });

  } catch (error) {
    console.error("Error creating update:", error);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}

export async function GET(req: NextRequest) {
  try {
    // Check authentication
    const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });
    if (!token || !token.sub) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Parse query parameters
    const { searchParams } = new URL(req.url);
    const queryParams = {
      portalId: searchParams.get("portalId") || "",
      page: searchParams.get("page") || "1",
      limit: searchParams.get("limit") || "10",
    };

    const parsed = getUpdatesSchema.safeParse(queryParams);
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.errors[0].message }, { status: 400 });
    }

    const { portalId, page, limit } = parsed.data;
    const pageNum = parseInt(page);
    const limitNum = parseInt(limit);
    const skip = (pageNum - 1) * limitNum;

    // Verify portal exists and user has access
    const portal = await prisma.portal.findFirst({
      where: {
        id: portalId,
        OR: [
          { created_by: token.sub }, // Freelancer who created the portal
          { client_id: token.sub },   // Client who owns the portal
        ],
      },
    });

    if (!portal) {
      return NextResponse.json({ error: "Portal not found or access denied" }, { status: 404 });
    }

    // Fetch updates for this portal
    const [updates, total] = await Promise.all([
      prisma.update.findMany({
        where: { portal_id: portalId },
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
        orderBy: { created_at: "desc" },
        skip,
        take: limitNum,
      }),
      prisma.update.count({ where: { portal_id: portalId } }),
    ]);

    return NextResponse.json({
      updates: updates.map(update => ({
        id: update.id,
        title: update.title,
        content: update.content,
        created_at: update.created_at,
        updated_at: update.updated_at,
        user: update.user,
        files: update.files,
      })),
      total,
      page: pageNum,
      limit: limitNum,
      pages: Math.ceil(total / limitNum),
    });

  } catch (error) {
    console.error("Error fetching updates:", error);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
} 