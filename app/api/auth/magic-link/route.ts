import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { encode } from "next-auth/jwt";
import { z } from "zod";

const magicLinkSchema = z.object({
  token: z.string().min(1, "Token is required"),
});

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const parsed = magicLinkSchema.safeParse(body);
    
    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid token" }, { status: 400 });
    }

    const { token } = parsed.data;

    // Find the SharedLink and associated portal/user
    const sharedLink = await prisma.sharedLink.findFirst({
      where: {
        token: token,
        is_revoked: false,
        expires_at: {
          gt: new Date(), // Not expired
        },
      },
      include: {
        portal: {
          include: {
            client: {
              select: {
                id: true,
                name: true,
                email: true,
                role: true,
                email_verified: true,
              },
            },
          },
        },
      },
    });

    if (!sharedLink) {
      return NextResponse.json({ 
        error: "Invalid or expired magic link. Please request a new invitation." 
      }, { status: 401 });
    }

    const user = sharedLink.portal.client;

    // Verify user exists and is a client
    if (!user || user.role !== "client") {
      return NextResponse.json({ 
        error: "Invalid user account" 
      }, { status: 401 });
    }

    // Check if user's email is verified (magic links should bypass this but let's be safe)
    if (!user.email_verified) {
      // Auto-verify since they have access to email
      await prisma.user.update({
        where: { id: user.id },
        data: { email_verified: true },
      });
    }

    // Update last viewed timestamp for the shared link
    await prisma.sharedLink.update({
      where: { id: sharedLink.id },
      data: { last_viewed_at: new Date() },
    });

    // Update user's last seen timestamp
    await prisma.user.update({
      where: { id: user.id },
      data: { last_seen_at: new Date() },
    });

    // Create a session token that matches NextAuth JWT structure exactly
    const currentTime = Math.floor(Date.now() / 1000);
    const jwtPayload = {
      name: user.name,
      email: user.email,
      sub: user.id,
      role: user.role, // Custom field that NextAuth JWT callback expects
      iat: currentTime,
      exp: currentTime + (30 * 24 * 60 * 60), // 30 days
      jti: crypto.randomUUID(), // JWT ID for uniqueness
    };

    const sessionToken = await encode({ 
      token: jwtPayload, 
      secret: process.env.NEXTAUTH_SECRET! 
    });

    // Set the session cookie (same format as NextAuth)
    const cookieName = process.env.NODE_ENV === "production" 
      ? "__Secure-next-auth.session-token" 
      : "next-auth.session-token";

    const cookieOptions = [
      `${cookieName}=${sessionToken}`,
      "Path=/",
      "HttpOnly",
      `Max-Age=${30 * 24 * 60 * 60}`, // 30 days
      "SameSite=lax",
    ];

    if (process.env.NODE_ENV === "production") {
      cookieOptions.push("Secure");
    }

    return NextResponse.json({ 
      success: true,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
      },
      portalId: sharedLink.portal.id,
    }, {
      status: 200,
      headers: {
        "Set-Cookie": cookieOptions.join("; "),
      },
    });

  } catch (error) {
    console.error("Magic link authentication error:", error);
    return NextResponse.json({ error: "Authentication failed" }, { status: 500 });
  }
} 