import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getToken } from "next-auth/jwt";
import { z } from "zod";
import { hash } from "bcryptjs";

const updatePasswordSchema = z.object({
  newPassword: z.string().min(8, "New password must be at least 8 characters"),
  confirmPassword: z.string().min(8, "Confirm password must be at least 8 characters"),
}).refine((data) => data.newPassword === data.confirmPassword, {
  message: "Passwords do not match",
  path: ["confirmPassword"],
});

export async function PATCH(req: NextRequest) {
  try {
    // Check authentication
    const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });
    if (!token || !token.sub) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Parse request body
    const body = await req.json();
    const parsed = updatePasswordSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.errors[0].message }, { status: 400 });
    }

    // Hash new password
    const password_hash = await hash(parsed.data.newPassword, 10);

    // Update user password
    await prisma.user.update({
      where: { id: token.sub },
      data: { password_hash }
    });

    return NextResponse.json({ message: "Password updated successfully" });
  } catch (err) {
    console.error("Error updating password:", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
} 