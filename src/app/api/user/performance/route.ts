/**
 * GET /api/user/performance
 * Get performance metrics for the current user (their personal P&L)
 */

import { NextRequest, NextResponse } from "next/server";
import { getUserAgentsPerformance } from "@/lib/performance-tracker";
import { db } from "@/db/client";
import { agents } from "@/db/schema";
import { eq } from "drizzle-orm";

export async function GET(req: NextRequest) {
  try {
    // Get user ID from header or session
    const userId = req.headers.get("x-user-id");

    if (!userId) {
      return NextResponse.json(
        { error: "User ID required" },
        { status: 401 }
      );
    }

    // Get user's agents performance (their personal P&L)
    const userAgentsPerformance = await getUserAgentsPerformance(userId);

    // Calculate user's total P&L across all their agents
    const totalPnL = userAgentsPerformance.reduce(
      (sum, agent) => sum + agent.metrics.totalPnL,
      0
    );

    const totalRealizedPnL = userAgentsPerformance.reduce(
      (sum, agent) => sum + agent.metrics.realizedPnL,
      0
    );

    const totalUnrealizedPnL = userAgentsPerformance.reduce(
      (sum, agent) => sum + agent.metrics.unrealizedPnL,
      0
    );

    const totalTrades = userAgentsPerformance.reduce(
      (sum, agent) => sum + agent.metrics.totalTrades,
      0
    );

    const totalWins = userAgentsPerformance.reduce(
      (sum, agent) => sum + agent.metrics.wins,
      0
    );

    const totalLosses = userAgentsPerformance.reduce(
      (sum, agent) => sum + agent.metrics.losses,
      0
    );

    const avgWinRate =
      userAgentsPerformance.length > 0
        ? userAgentsPerformance.reduce((sum, a) => sum + a.metrics.winRate, 0) /
          userAgentsPerformance.length
        : 0;

    // Get user's active agents count
    const activeAgents = await db
      .select()
      .from(agents)
      .where(eq(agents.userId, userId));

    return NextResponse.json({
      userId,
      summary: {
        totalPnL,
        realizedPnL: totalRealizedPnL,
        unrealizedPnL: totalUnrealizedPnL,
        totalTrades,
        wins: totalWins,
        losses: totalLosses,
        winRate: totalTrades > 0 ? (totalWins / totalTrades) * 100 : 0,
        avgWinRate,
        totalAgents: activeAgents.length,
        profitableAgents: userAgentsPerformance.filter(
          (a) => a.metrics.totalPnL > 0
        ).length,
      },
      agents: userAgentsPerformance,
    });
  } catch (error) {
    console.error("Error fetching user performance:", error);
    return NextResponse.json(
      { error: "Failed to fetch user performance" },
      { status: 500 }
    );
  }
}
