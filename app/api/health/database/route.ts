import { NextResponse } from "next/server";
import { checkDatabaseHealth, getConnectionMetrics } from "@/lib/utils/database";

export async function GET() {
  try {
    const isHealthy = await checkDatabaseHealth();
    const metrics = await getConnectionMetrics();
    
    if (isHealthy) {
      return NextResponse.json({
        status: "healthy",
        message: "Database connection is working properly",
        metrics,
        timestamp: new Date().toISOString()
      });
    } else {
      return NextResponse.json({
        status: "unhealthy",
        message: "Database connection issues detected",
        metrics,
        timestamp: new Date().toISOString()
      }, { status: 503 });
    }
  } catch (error) {
    console.error('Health check failed:', error);
    return NextResponse.json({
      status: "error",
      message: "Health check failed",
      error: error instanceof Error ? error.message : "Unknown error",
      timestamp: new Date().toISOString()
    }, { status: 500 });
  }
} 