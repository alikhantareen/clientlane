import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    // Test database connection
    await prisma.$connect();
    
    // Test a simple query
    const userCount = await prisma.user.count();
    
    return NextResponse.json({ 
      success: true, 
      message: "Database connection successful",
      userCount,
      env: {
        hasPrismaUrl: !!process.env.POSTGRES_PRISMA_URL,
        hasDirectUrl: !!process.env.POSTGRES_URL_NON_POOLING,
        hasNextAuthUrl: !!process.env.NEXTAUTH_URL,
        hasNextAuthSecret: !!process.env.NEXTAUTH_SECRET,
      }
    });
  } catch (error) {
    console.error("Database test error:", error);
    return NextResponse.json({ 
      success: false, 
      error: error instanceof Error ? error.message : "Unknown error",
      env: {
        hasPrismaUrl: !!process.env.POSTGRES_PRISMA_URL,
        hasDirectUrl: !!process.env.POSTGRES_URL_NON_POOLING,
        hasNextAuthUrl: !!process.env.NEXTAUTH_URL,
        hasNextAuthSecret: !!process.env.NEXTAUTH_SECRET,
      }
    }, { status: 500 });
  } finally {
    await prisma.$disconnect();
  }
} 