/**
 * GET /api/performance/leaderboard
 * Get strategy performance comparison (GLOBAL - across all users)
 * Does NOT show individual user P&L (privacy protected)
 */

import { NextResponse } from "next/server";
import { getStrategyPerformance } from "@/lib/performance-tracker";
import { db } from "@/db/client";
import { agents } from "@/db/schema";

export async function GET() {
  try {
    // Get strategy-level performance (collective across all users)
    const strategyPerformance = await getStrategyPerformance();

    // Get total agents count (without exposing individual user data)
    const allAgents = await db.select().from(agents);
    const totalAgents = allAgents.length;
    const activeAgents = allAgents.filter((a) => a.status === "active").length;

    // Calculate aggregate stats (without exposing individual P&L)
    const strategies = Object.entries(strategyPerformance).map(
      ([strategy, metrics]) => ({
        strategy,
        totalTrades: metrics.totalTrades,
        winRate: metrics.winRate,
        totalPnL: metrics.totalPnL,
        sharpeRatio: metrics.sharpeRatio,
        roi: metrics.roi,
      })
    );

    // Sort by total P&L
    strategies.sort((a, b) => b.totalPnL - a.totalPnL);

    return NextResponse.json({
      strategies,
      summary: {
        totalAgents,
        activeAgents,
        bestStrategy: strategies[0]?.strategy || null,
        avgWinRate:
          strategies.reduce((sum, s) => sum + s.winRate, 0) / strategies.length,
      },
    });
  } catch (error) {
    console.error("Error fetching leaderboard:", error);
    return NextResponse.json(
      { error: "Failed to fetch leaderboard" },
      { status: 500 }
    );
  }
}
