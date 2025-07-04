import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getToken } from "next-auth/jwt";
import { z } from "zod";
import { compare } from "bcryptjs";

const verifyPasswordSchema = z.object({
  currentPassword: z.string().min(1, "Current password is required"),
});

export async function POST(req: NextRequest) {
  try {
    // Check authentication
    const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });
    if (!token || !token.sub) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Parse request body
    const body = await req.json();
    const parsed = verifyPasswordSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.errors[0].message }, { status: 400 });
    }

    // Get user
    const user = await prisma.user.findUnique({
      where: { id: token.sub },
      select: { id: true, password_hash: true }
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Verify password
    const isValid = await compare(parsed.data.currentPassword, user.password_hash);
    if (!isValid) {
      return NextResponse.json({ error: "Current password is incorrect" }, { status: 401 });
    }

    return NextResponse.json({ message: "Password verified successfully" });
  } catch (err) {
    console.error("Error verifying password:", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
} 