import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getToken } from "next-auth/jwt";
import fs from "fs";
import path from "path";

interface RouteParams {
  fileId: string;
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

    const { fileId } = await params;

    // Find the file and verify access
    const file = await prisma.file.findFirst({
      where: { id: fileId },
      include: {
        portal: {
          select: {
            id: true,
            created_by: true,
            client_id: true,
          },
        },
        user: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    if (!file) {
      return NextResponse.json({ error: "File not found" }, { status: 404 });
    }

    // Check if user has access to this portal
    const hasAccess = 
      file.portal.created_by === token.sub || 
      file.portal.client_id === token.sub;

    if (!hasAccess) {
      return NextResponse.json({ error: "Access denied" }, { status: 403 });
    }

    // Delete file record from database and log activity in transaction
    await prisma.$transaction(async (tx) => {
      // Delete file record
      await tx.file.delete({
        where: { id: fileId },
      });

      // Log file deletion activity
      await tx.activity.create({
        data: {
          portal_id: file.portal.id,
          user_id: token.sub!,
          type: "file_deleted",
          meta: {
            file_name: file.file_name,
            file_size: file.file_size || 0,
            file_type: file.file_type || "",
          },
        },
      });
    });

    // Delete physical file from filesystem
    const uploadDir = path.join(process.cwd(), "public");
    const filePath = path.join(uploadDir, file.file_url);
    
    if (fs.existsSync(filePath)) {
      try {
        fs.unlinkSync(filePath);
      } catch (error) {
        console.error("Error deleting physical file:", filePath, error);
        // Don't fail the request if physical file deletion fails
      }
    }

    return NextResponse.json({ 
      message: "File deleted successfully",
      file: {
        id: file.id,
        file_name: file.file_name,
        user: file.user,
      }
    });

  } catch (error) {
    console.error("Error deleting file:", error);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
} 