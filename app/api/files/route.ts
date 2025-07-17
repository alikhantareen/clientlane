import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getToken } from "next-auth/jwt";
import { z } from "zod";
import fs from "fs";
import path from "path";
import { createNotification } from "@/lib/utils/notifications";
import { canUserUploadFiles } from "@/lib/utils/subscription";
import { updateUserLastSeen } from "@/lib/utils/helpers";

const getFilesSchema = z.object({
  portalId: z.string().uuid("Invalid portal ID"),
  page: z.string().optional().default("1"),
  limit: z.string().optional().default("10"),
  search: z.string().optional(),
});

export async function GET(req: NextRequest) {
  try {
    // Check authentication
    const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });
    if (!token || !token.sub) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Update last_seen_at for the user
    await updateUserLastSeen(token.sub);

    // Parse query parameters
    const url = new URL(req.url);
    const portalId = url.searchParams.get("portalId");
    const page = url.searchParams.get("page") || "1";
    const limit = url.searchParams.get("limit") || "10";
    const search = url.searchParams.get("search") || "";

    // Validate parameters
    const parsed = getFilesSchema.safeParse({
      portalId,
      page,
      limit,
      search,
    });

    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.errors[0].message }, { status: 400 });
    }

    const { portalId: validPortalId, page: pageStr, limit: limitStr, search: searchQuery } = parsed.data;

    // Convert to numbers
    const pageNum = parseInt(pageStr);
    const limitNum = parseInt(limitStr);
    const skip = (pageNum - 1) * limitNum;

    // Verify portal exists and user has access
    const portal = await prisma.portal.findFirst({
      where: {
        id: validPortalId,
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
      portal_id: validPortalId,
    };

    if (searchQuery) {
      whereClause.file_name = {
        contains: searchQuery,
        mode: "insensitive",
      };
    }

    // Fetch files for this portal with pagination
    const [files, total] = await Promise.all([
      prisma.file.findMany({
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
        },
        orderBy: { uploaded_at: "desc" },
        skip,
        take: limitNum,
      }),
      prisma.file.count({ where: whereClause }),
    ]);

    return NextResponse.json({
      files: files.map(file => ({
        id: file.id,
        file_name: file.file_name,
        file_url: file.file_url,
        file_type: file.file_type,
        file_size: file.file_size,
        uploaded_at: file.uploaded_at,
        user: file.user,
      })),
      total,
      page: pageNum,
      limit: limitNum,
      pages: Math.ceil(total / limitNum),
    });

  } catch (error) {
    console.error("Error fetching files:", error);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}

 