import { NextRequest } from "next/server";

/**
 * Cron job endpoint to automatically sync markets from Polymarket
 * Call this endpoint every 5-15 minutes to keep data fresh
 * 
 * Usage:
 * - Vercel Cron: Add to vercel.json
 * - External Cron: Call with Authorization header
 */
export async function GET(request: NextRequest) {
  try {
    // Verify authorization
    const authHeader = request.headers.get("authorization");
    const expectedAuth = `Bearer ${process.env.CRON_SECRET}`;
    
    if (!process.env.CRON_SECRET || authHeader !== expectedAuth) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    console.log("[CRON] Starting market sync...");

    // Call the sync endpoint
    const syncUrl = process.env.NEXT_PUBLIC_APP_URL 
      ? `${process.env.NEXT_PUBLIC_APP_URL}/api/markets/sync`
      : `http://localhost:3000/api/markets/sync`;

    const response = await fetch(syncUrl, {
      method: "POST",
      headers: {
        "x-sync-secret": process.env.SYNC_SECRET || "",
      },
    });

    if (!response.ok) {
      throw new Error(`Sync failed: ${response.status}`);
    }

    const data = await response.json();
    console.log("[CRON] Market sync completed:", data);

    return Response.json({
      success: true,
      timestamp: new Date().toISOString(),
      ...data,
    });
  } catch (error) {
    console.error("[CRON] Market sync error:", error);
    return Response.json(
      { 
        error: "Sync failed", 
        message: (error as Error).message 
      }, 
      { status: 500 }
    );
  }
}
