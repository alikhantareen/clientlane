import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const page = parseInt(searchParams.get("page") || "1", 10);
    const limit = parseInt(searchParams.get("limit") || "10", 10);
    const skip = (page - 1) * limit;

    const [portals, total] = await Promise.all([
      prisma.portal.findMany({
        skip,
        take: limit,
        orderBy: { updated_at: "desc" },
        include: {
          client: { select: { name: true } },
          comments: { select: { id: true } },
        },
      }),
      prisma.portal.count(),
    ]);

    // Map to minimal card data
    const data = portals.map((portal) => ({
      id: portal.id,
      name: portal.name,
      description: portal.description,
      status: portal.status,
      thumbnail_url: portal.thumbnail_url,
      clientName: portal.client?.name || "",
      updated_at: portal.updated_at,
      commentsCount: portal.comments.length,
    }));

    return NextResponse.json({ portals: data, total });
  } catch (err) {
    console.error("Error fetching portals:", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
} 