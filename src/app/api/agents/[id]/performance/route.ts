/**
 * GET /api/agents/[id]/performance
 * Get performance metrics for a specific agent
 */

import { NextRequest, NextResponse } from "next/server";
import { getAgentPerformance, getTradePerformance } from "@/lib/performance-tracker";

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const agentId = params.id;
    const searchParams = req.nextUrl.searchParams;
    const includeTrades = searchParams.get("includeTrades") === "true";
    const startDate = searchParams.get("startDate");
    const endDate = searchParams.get("endDate");

    // Build timeframe if provided
    const timeframe = startDate
      ? {
          start: new Date(startDate),
          end: endDate ? new Date(endDate) : undefined,
        }
      : undefined;

    // Get performance metrics
    const metrics = await getAgentPerformance(agentId, timeframe);

    // Optionally include detailed trade performance
    const trades = includeTrades ? await getTradePerformance(agentId) : null;

    return NextResponse.json({
      agentId,
      timeframe: timeframe
        ? {
            start: timeframe.start.toISOString(),
            end: timeframe.end?.toISOString(),
          }
        : null,
      metrics,
      trades,
    });
  } catch (error) {
    console.error("Error fetching agent performance:", error);
    return NextResponse.json(
      { error: "Failed to fetch performance metrics" },
      { status: 500 }
    );
  }
}
