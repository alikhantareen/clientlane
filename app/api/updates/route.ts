import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getToken } from "next-auth/jwt";
import { z } from "zod";
import fs from "fs";
import path from "path";
import { createNotification } from "@/lib/utils/notifications";
import { canUserUploadFiles } from "@/lib/utils/subscription";
import { updateUserLastSeen } from "@/lib/utils/helpers";

const createUpdateSchema = z.object({
  title: z.string().min(1, "Title is required"),
  content: z.string().min(1, "Content is required"),
  portalId: z.string().uuid("Invalid portal ID"),
});

const getUpdatesSchema = z.object({
  portalId: z.string().uuid("Invalid portal ID"),
  page: z.string().optional().default("1"),
  limit: z.string().optional().default("10"),
  search: z.string().optional(),
});

export async function POST(req: NextRequest) {
  try {
    // Check authentication
    const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });
    if (!token || !token.sub) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Update last_seen_at for the user
    await updateUserLastSeen(token.sub);

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

        // Log file upload activities
        for (const file of uploadedFiles) {
          await tx.activity.create({
            data: {
              portal_id: portalId,
              user_id: token.sub!,
              type: "file_uploaded",
              meta: {
                file_name: file.file_name,
                file_size: file.file_size,
                file_type: file.file_type,
                update_id: newUpdate.id,
                update_title: title,
              },
            },
          });

          // Create notification for file upload
          await createNotification(
            tx,
            portalId,
            token.sub!,
            "file_uploaded",
            {
              updateId: newUpdate.id,
              fileName: file.file_name,
            }
          );
        }
      }

      // Log update creation activity
      await tx.activity.create({
        data: {
          portal_id: portalId,
          user_id: token.sub!,
          type: "update_created",
          meta: {
            update_title: title,
            update_id: newUpdate.id,
          },
        },
      });

      // Create notification for new update
      await createNotification(
        tx,
        portalId,
        token.sub!,
        "update_created",
        {
          updateId: newUpdate.id,
          updateTitle: title,
        }
      );

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
      search: searchParams.get("search") || "",
    };

    const parsed = getUpdatesSchema.safeParse(queryParams);
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.errors[0].message }, { status: 400 });
    }

    const { portalId, page, limit, search } = parsed.data;
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

    // Build where clause for search
    const whereClause: any = {
      portal_id: portalId,
      parent_update_id: null, // Only root updates
    };

    if (search) {
      whereClause.OR = [
        {
          title: {
            contains: search,
            mode: "insensitive",
          },
        },
        {
          content: {
            contains: search,
            mode: "insensitive",
          },
        },
      ];
    }

    // Fetch updates for this portal (only root updates, not replies)
    const [updates, total] = await Promise.all([
      prisma.update.findMany({
        where: whereClause,
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
      prisma.update.count({ where: whereClause }),
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