import { NextRequest, NextResponse } from "next/server";
import { updateAllUsersLastSeen } from "@/lib/utils/helpers";

export async function POST(req: NextRequest) {
  try {
    // This is a one-time fix endpoint - you can remove it after running
    await updateAllUsersLastSeen();
    
    return NextResponse.json({ 
      message: "Successfully updated all users' last_seen_at based on their most recent activity" 
    });
  } catch (error) {
    console.error("Error in fix-last-seen endpoint:", error);
    return NextResponse.json({ error: "Failed to update last_seen_at" }, { status: 500 });
  }
} 