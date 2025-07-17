import { NextRequest, NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";

/**
 * API endpoint to manually trigger deadline notification checks
 * This endpoint is primarily for testing and administrative purposes
 */
export async function POST(req: NextRequest) {
  try {
    // Check authentication - only allow authenticated users to trigger this
    const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });
    if (!token || !token.sub) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Only allow freelancers to trigger this (since they're the ones who get the notifications)
    // Or you could restrict this to admins only
    const userRole = token.role;
    if (userRole !== "freelancer") {
      return NextResponse.json({ 
        error: "Only freelancers can trigger deadline checks" 
      }, { status: 403 });
    }

    // Dynamically import the cron job function
    const { triggerManualCheck } = require('@/cron/notify-upcoming-deadlines');
    
    // Trigger the deadline check
    await triggerManualCheck();
    
    return NextResponse.json({ 
      message: "Deadline notification check completed successfully",
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error("Error triggering deadline check:", error);
    return NextResponse.json({ 
      error: "Failed to trigger deadline check",
      details: error instanceof Error ? error.message : "Unknown error"
    }, { status: 500 });
  }
}

/**
 * GET endpoint to check the status of the cron job
 */
export async function GET(req: NextRequest) {
  try {
    // Check authentication
    const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });
    if (!token || !token.sub) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    return NextResponse.json({ 
      message: "Deadline notification cron job is available",
      endpoints: {
        trigger: "POST /api/cron/deadline-notifications",
        status: "GET /api/cron/deadline-notifications"
      },
      schedule: "Daily at 9:00 AM server time",
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error("Error checking cron job status:", error);
    return NextResponse.json({ 
      error: "Failed to check cron job status" 
    }, { status: 500 });
  }
} 