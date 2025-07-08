import { NextRequest, NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";
import { canUserCreatePortal } from "@/lib/utils/subscription";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  try {
    // Check authentication
    const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });
    if (!token || !token.sub) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get user role to check if limits apply
    const user = await prisma.user.findUnique({
      where: { id: token.sub },
      select: { role: true }
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Plan limits only apply to freelancers, not clients
    if (user.role !== "freelancer") {
      return NextResponse.json({
        allowed: true,
        reason: "Plan limits do not apply to clients"
      });
    }

    // Check if user can create a portal
    const result = await canUserCreatePortal(token.sub);
    
    return NextResponse.json(result);

  } catch (error) {
    console.error('Error checking portal creation limits:', error);
    return NextResponse.json({ 
      allowed: false,
      reason: "Unable to verify plan limits. Please try again."
    }, { status: 500 });
  }
} 