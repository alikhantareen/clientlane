import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { parseISO } from "date-fns";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const page = parseInt(searchParams.get("page") || "1", 10);
    const limit = parseInt(searchParams.get("limit") || "10", 10);
    const skip = (page - 1) * limit;

    const search = searchParams.get("search")?.trim() || "";
    const statusParam = searchParams.get("status") || undefined;
    const dateFrom = searchParams.get("dateFrom") || undefined;
    const dateTo = searchParams.get("dateTo") || undefined;

    // Support multiple statuses (comma-separated)
    let status: string[] | string | undefined = statusParam;
    if (statusParam && statusParam.includes(",")) {
      status = statusParam.split(",").map((s) => s.trim()).filter(Boolean);
    }

    // Build where clause
    const where: any = {};
    if (status) {
      if (Array.isArray(status)) {
        where.status = { in: status };
      } else {
        where.status = status;
      }
    }
    if (dateFrom || dateTo) {
      where.updated_at = {};
      if (dateFrom) where.updated_at.gte = parseISO(dateFrom);
      if (dateTo) where.updated_at.lte = parseISO(dateTo);
    }
    if (search) {
      const searchLower = search.toLowerCase();
      const statusOptions = ["active", "pending", "archived"];
      const matchingStatuses = statusOptions.filter(status => 
        status.toLowerCase().includes(searchLower)
      );

      where.OR = [
        { name: { contains: search, mode: "insensitive" } },
        { client: { is: { name: { contains: search, mode: "insensitive" } } } },
        { client: { is: { email: { contains: search, mode: "insensitive" } } } },
      ];

      // Add status matching only if there are matching statuses
      if (matchingStatuses.length > 0) {
        where.OR.push({ status: { in: matchingStatuses } });
      }
    }

    const [portals, total] = await Promise.all([
      prisma.portal.findMany({
        skip,
        take: limit,
        orderBy: { updated_at: "desc" },
        where,
        include: {
          client: { select: { name: true, email: true } },
          comments: { select: { id: true } },
        },
      }),
      prisma.portal.count({ where }),
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