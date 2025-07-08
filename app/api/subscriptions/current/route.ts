import { NextRequest, NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  try {
    // Check authentication
    const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });
    if (!token || !token.sub) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get user from database
    const user = await prisma.user.findUnique({
      where: { id: token.sub },
      select: { id: true, role: true }
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    if (user.role !== "freelancer") {
      return NextResponse.json({ error: "Only freelancers have subscriptions" }, { status: 403 });
    }

    // Get current active subscription
    const subscription = await prisma.subscription.findFirst({
      where: {
        user_id: user.id,
        is_active: true,
        ends_at: {
          gt: new Date()
        }
      },
      include: {
        plan: {
          select: {
            id: true,
            name: true,
            price: true,
            currency: true,
            billing_cycle: true
          }
        }
      },
      orderBy: {
        starts_at: 'desc'
      }
    });

    return NextResponse.json({
      subscription: subscription || null
    });

  } catch (error) {
    console.error('Current subscription API error:', error);
    return NextResponse.json({ 
      error: "Internal server error" 
    }, { status: 500 });
  }
} 