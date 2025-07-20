import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import { z } from "zod";
import { hash } from "bcryptjs";

const prisma = new PrismaClient();

const registerSchema = z.object({
  name: z.string().min(2),
  email: z.string().email(),
  password: z.string().min(8),
  role: z.enum(["freelancer", "client"]),
});

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const parsed = registerSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.errors[0].message }, { status: 400 });
    }
    const { name, email, password, role } = parsed.data;
    
    // Check if user already exists
    const existing = await prisma.user.findUnique({ 
      where: { email },
      select: { 
        id: true, 
        password_hash: true,
        accounts: {
          where: { provider: "google" },
          select: { provider: true }
        }
      }
    });
    
    if (existing) {
      // Check if user has Google OAuth account
      const hasGoogleAccount = existing.accounts.some(account => account.provider === "google");
      
      if (hasGoogleAccount) {
        return NextResponse.json({ 
          error: "You are already signed up with Google. Please sign in using Google instead." 
        }, { status: 400 });
      } else {
        return NextResponse.json({ 
          error: "Email already in use. Please try signing in instead." 
        }, { status: 400 });
      }
    }
    
    // Hash password
    const password_hash = await hash(password, 10);
    // Create user (email_verified defaults to false)
    await prisma.user.create({
      data: {
        name,
        email,
        password_hash,
        role,
      },
    });
    return NextResponse.json({ message: "Registration successful" }, { status: 201 });
  } catch (err) {
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
} 