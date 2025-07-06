import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getToken } from "next-auth/jwt";

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
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
      return NextResponse.json({ error: "Only freelancers can view portals" }, { status: 403 });
    }

    const portalId = params.id;

    // Find portal and ensure it belongs to the current user
    const portal = await prisma.portal.findFirst({
      where: {
        id: portalId,
        created_by: user.id, // Only show portals created by the current user
      },
      include: {
        client: { 
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
      comments: portal.comments,
      shared_links: portal.shared_links,
      created_at: portal.created_at,
      updated_at: portal.updated_at,
      commentsCount: portal.comments.length,
      // Generate portal initials from name
      initials: portal.name.split(' ').map(word => word[0]).join('').toUpperCase() || 'P',
    };

    return NextResponse.json({ portal: portalData });
  } catch (err) {
    console.error("Error fetching portal:", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
} 