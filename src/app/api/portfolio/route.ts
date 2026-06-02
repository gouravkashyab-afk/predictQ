import { getIronSession } from "iron-session";
import { cookies } from "next/headers";
import { sessionOptions, type SiweSessionData } from "@/lib/session";
import { db } from "@/db/client";
import { trades, agents, agentTrades } from "@/db/schema";
import { eq, desc } from "drizzle-orm";

// GET /api/portfolio — returns user's portfolio summary
export async function GET() {
  try {
    const cookieStore = await cookies();
    const session = await getIronSession<SiweSessionData>(cookieStore, sessionOptions);
    if (!session.address) return Response.json({ error: "Unauthorized" }, { status: 401 });

    const userId = session.address.toLowerCase();

    // User's manual trades
    const userTrades = await db
      .select()
      .from(trades)
      .where(eq(trades.userId, userId))
      .orderBy(desc(trades.createdAt));

    // User's agents
    const userAgents = await db
      .select()
      .from(agents)
      .where(eq(agents.userId, userId));

    // Compute portfolio stats
    const filled = userTrades.filter((t) => t.status === "filled");
    const pending = userTrades.filter((t) => t.status === "pending");
    const failed = userTrades.filter((t) => t.status === "failed");

    const totalInvested = filled.reduce((s, t) => s + t.amountUsdc, 0);
    const totalShares = filled.reduce((s, t) => s + t.shares, 0);
    const totalPotentialPayout = filled.reduce((s, t) => s + t.potentialPayout, 0);
    const unrealizedPnl = totalPotentialPayout - totalInvested;

    // Group by market for open positions
    const positionMap = new Map<string, {
      conditionId: string;
      question: string;
      direction: string;
      totalInvested: number;
      totalShares: number;
      potentialPayout: number;
      tradeCount: number;
      latestPrice: number;
    }>();

    for (const trade of filled) {
      const key = `${trade.conditionId}-${trade.direction}`;
      const existing = positionMap.get(key);
      if (existing) {
        existing.totalInvested += trade.amountUsdc;
        existing.totalShares += trade.shares;
        existing.potentialPayout += trade.potentialPayout;
        existing.tradeCount++;
      } else {
        positionMap.set(key, {
          conditionId: trade.conditionId,
          question: trade.question,
          direction: trade.direction,
          totalInvested: trade.amountUsdc,
          totalShares: trade.shares,
          potentialPayout: trade.potentialPayout,
          tradeCount: 1,
          latestPrice: trade.pricePerShare,
        });
      }
    }

    const openPositions = Array.from(positionMap.values());

    // Build P&L history (cumulative, by trade date)
    let cumulative = 0;
    const pnlHistory = filled.map((t) => {
      cumulative += t.potentialPayout - t.amountUsdc;
      return {
        date: t.createdAt,
        pnl: Math.round(cumulative * 100) / 100,
        trade: {
          direction: t.direction,
          amount: t.amountUsdc,
          conditionId: t.conditionId,
        },
      };
    });

    // Agent summary
    const agentStats = userAgents.map((a) => ({
      id: a.id,
      name: a.name,
      strategy: a.strategy,
      status: a.status,
      totalTrades: a.totalTrades,
      totalPnl: a.totalPnl,
    }));

    return Response.json({
      summary: {
        totalTrades: userTrades.length,
        filledTrades: filled.length,
        pendingTrades: pending.length,
        failedTrades: failed.length,
        totalInvested: Math.round(totalInvested * 100) / 100,
        totalShares: Math.round(totalShares * 100) / 100,
        totalPotentialPayout: Math.round(totalPotentialPayout * 100) / 100,
        unrealizedPnl: Math.round(unrealizedPnl * 100) / 100,
        activeAgents: userAgents.filter((a) => a.status === "active").length,
        totalAgents: userAgents.length,
      },
      openPositions,
      recentTrades: userTrades.slice(0, 20),
      pnlHistory,
      agents: agentStats,
    });
  } catch (error) {
    console.error("[GET /api/portfolio]", error);
    return Response.json({ error: "Failed to fetch portfolio" }, { status: 500 });
  }
}
