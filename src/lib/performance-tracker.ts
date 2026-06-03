/**
 * Performance Tracker
 * Calculates P&L, win rate, and performance metrics for agents
 */

import { db } from "@/db/client";
import { agentTrades, agents, trades, markets } from "@/db/schema";
import { eq, and, gte, sql, desc } from "drizzle-orm";

export interface PerformanceMetrics {
  totalTrades: number;
  realTrades: number;
  simulatedTrades: number;
  wins: number;
  losses: number;
  winRate: number;
  totalPnL: number;
  realizedPnL: number;
  unrealizedPnL: number;
  avgWin: number;
  avgLoss: number;
  largestWin: number;
  largestLoss: number;
  profitFactor: number; // Total wins / Total losses
  sharpeRatio: number;
  maxDrawdown: number;
  roi: number; // Return on Investment %
}

export interface TradePerformance {
  tradeId: string;
  agentId: string;
  question: string;
  direction: "YES" | "NO";
  entryPrice: number;
  exitPrice: number | null;
  currentPrice: number;
  amountUsdc: number;
  shares: number;
  realizedPnL: number | null;
  unrealizedPnL: number;
  status: "open" | "closed" | "simulated";
  entryDate: Date;
  exitDate: Date | null;
  holdingPeriod: number; // hours
}

/**
 * Calculate P&L for a single trade
 */
export function calculateTradePnL(
  direction: "YES" | "NO",
  entryPrice: number,
  exitPrice: number,
  amountUsdc: number
): number {
  const shares = amountUsdc / entryPrice;
  
  if (direction === "YES") {
    // Bought YES tokens at entryPrice, sold at exitPrice
    return shares * exitPrice - amountUsdc;
  } else {
    // Bought NO tokens at entryPrice, sold at exitPrice
    // NO tokens pay out (1 - probability), so invert prices
    const entryNoValue = 1 - entryPrice;
    const exitNoValue = 1 - exitPrice;
    const noShares = amountUsdc / entryNoValue;
    return noShares * exitNoValue - amountUsdc;
  }
}

/**
 * Calculate unrealized P&L for open positions
 */
export function calculateUnrealizedPnL(
  direction: "YES" | "NO",
  entryPrice: number,
  currentPrice: number,
  amountUsdc: number
): number {
  return calculateTradePnL(direction, entryPrice, currentPrice, amountUsdc);
}

/**
 * Get performance metrics for an agent
 */
export async function getAgentPerformance(
  agentId: string,
  timeframe?: { start: Date; end?: Date }
): Promise<PerformanceMetrics> {
  // Build query conditions
  const conditions = [eq(agentTrades.agentId, agentId)];
  if (timeframe?.start) {
    conditions.push(gte(agentTrades.createdAt, timeframe.start));
  }
  if (timeframe?.end) {
    conditions.push(sql`${agentTrades.createdAt} <= ${timeframe.end}`);
  }

  // Get all trades for this agent
  const allTrades = await db
    .select()
    .from(agentTrades)
    .where(and(...conditions))
    .orderBy(desc(agentTrades.createdAt));

  if (allTrades.length === 0) {
    return {
      totalTrades: 0,
      realTrades: 0,
      simulatedTrades: 0,
      wins: 0,
      losses: 0,
      winRate: 0,
      totalPnL: 0,
      realizedPnL: 0,
      unrealizedPnL: 0,
      avgWin: 0,
      avgLoss: 0,
      largestWin: 0,
      largestLoss: 0,
      profitFactor: 0,
      sharpeRatio: 0,
      maxDrawdown: 0,
      roi: 0,
    };
  }

  // Separate real vs simulated trades
  const realTrades = allTrades.filter(
    (t) => t.status !== "simulated" && t.orderHash
  );
  const simulatedTrades = allTrades.filter((t) => t.status === "simulated");

  // Calculate P&L for each trade
  const tradeResults: number[] = [];
  let totalRealizedPnL = 0;
  let totalUnrealizedPnL = 0;
  let wins = 0;
  let losses = 0;
  let totalWinAmount = 0;
  let totalLossAmount = 0;
  let largestWin = 0;
  let largestLoss = 0;

  for (const trade of realTrades) {
    // Get market data for current price
    const market = await db
      .select()
      .from(markets)
      .where(eq(markets.conditionId, trade.conditionId))
      .limit(1);

    if (!market || market.length === 0) continue;

    const currentPrice =
      trade.direction === "YES" ? market[0].yesPrice : market[0].noPrice;

    // Check if position is closed
    const linkedTrade = trade.tradeId
      ? await db
          .select()
          .from(trades)
          .where(eq(trades.id, trade.tradeId))
          .limit(1)
      : null;

    if (linkedTrade && linkedTrade[0]?.status === "filled") {
      // Position is closed - calculate realized P&L
      const entryPrice = linkedTrade[0].pricePerShare;
      const exitPrice = currentPrice; // In real system, get actual exit price

      const pnl = calculateTradePnL(
        trade.direction as "YES" | "NO",
        entryPrice,
        exitPrice,
        trade.amountUsdc
      );

      totalRealizedPnL += pnl;
      tradeResults.push(pnl);

      if (pnl > 0) {
        wins++;
        totalWinAmount += pnl;
        largestWin = Math.max(largestWin, pnl);
      } else {
        losses++;
        totalLossAmount += Math.abs(pnl);
        largestLoss = Math.min(largestLoss, pnl);
      }
    } else {
      // Position is open - calculate unrealized P&L
      const entryPrice =
        trade.direction === "YES" ? market[0].yesPrice : market[0].noPrice;

      const unrealizedPnL = calculateUnrealizedPnL(
        trade.direction as "YES" | "NO",
        entryPrice,
        currentPrice,
        trade.amountUsdc
      );

      totalUnrealizedPnL += unrealizedPnL;
    }
  }

  // Calculate metrics
  const winRate = wins + losses > 0 ? (wins / (wins + losses)) * 100 : 0;
  const avgWin = wins > 0 ? totalWinAmount / wins : 0;
  const avgLoss = losses > 0 ? totalLossAmount / losses : 0;
  const profitFactor =
    totalLossAmount > 0 ? totalWinAmount / totalLossAmount : 0;

  // Calculate Sharpe Ratio (simplified)
  const avgReturn =
    tradeResults.length > 0
      ? tradeResults.reduce((a, b) => a + b, 0) / tradeResults.length
      : 0;
  const variance =
    tradeResults.length > 0
      ? tradeResults.reduce((sum, r) => sum + Math.pow(r - avgReturn, 2), 0) /
        tradeResults.length
      : 0;
  const stdDev = Math.sqrt(variance);
  const sharpeRatio = stdDev > 0 ? avgReturn / stdDev : 0;

  // Calculate max drawdown
  let maxDrawdown = 0;
  let peak = 0;
  let cumulative = 0;

  for (const result of tradeResults) {
    cumulative += result;
    peak = Math.max(peak, cumulative);
    const drawdown = peak - cumulative;
    maxDrawdown = Math.max(maxDrawdown, drawdown);
  }

  // Calculate ROI
  const totalInvested = allTrades.reduce(
    (sum, t) => sum + t.amountUsdc,
    0
  );
  const roi =
    totalInvested > 0 ? ((totalRealizedPnL + totalUnrealizedPnL) / totalInvested) * 100 : 0;

  return {
    totalTrades: allTrades.length,
    realTrades: realTrades.length,
    simulatedTrades: simulatedTrades.length,
    wins,
    losses,
    winRate,
    totalPnL: totalRealizedPnL + totalUnrealizedPnL,
    realizedPnL: totalRealizedPnL,
    unrealizedPnL: totalUnrealizedPnL,
    avgWin,
    avgLoss,
    largestWin,
    largestLoss: Math.abs(largestLoss),
    profitFactor,
    sharpeRatio,
    maxDrawdown,
    roi,
  };
}

/**
 * Get detailed trade performance
 */
export async function getTradePerformance(
  agentId: string
): Promise<TradePerformance[]> {
  const allTrades = await db
    .select()
    .from(agentTrades)
    .where(eq(agentTrades.agentId, agentId))
    .orderBy(desc(agentTrades.createdAt));

  const tradePerformances: TradePerformance[] = [];

  for (const trade of allTrades) {
    // Get market data
    const market = await db
      .select()
      .from(markets)
      .where(eq(markets.conditionId, trade.conditionId))
      .limit(1);

    if (!market || market.length === 0) continue;

    const currentPrice =
      trade.direction === "YES" ? market[0].yesPrice : market[0].noPrice;

    // Get linked trade for entry price
    const linkedTrade = trade.tradeId
      ? await db
          .select()
          .from(trades)
          .where(eq(trades.id, trade.tradeId))
          .limit(1)
      : null;

    const entryPrice = linkedTrade?.[0]?.pricePerShare || currentPrice;
    const exitPrice = linkedTrade?.[0]?.status === "filled" ? currentPrice : null;
    const shares = trade.amountUsdc / entryPrice;

    const realizedPnL = exitPrice
      ? calculateTradePnL(
          trade.direction as "YES" | "NO",
          entryPrice,
          exitPrice,
          trade.amountUsdc
        )
      : null;

    const unrealizedPnL = calculateUnrealizedPnL(
      trade.direction as "YES" | "NO",
      entryPrice,
      currentPrice,
      trade.amountUsdc
    );

    const exitDate = linkedTrade?.[0]?.filledAt || null;
    const holdingPeriod = exitDate
      ? (exitDate.getTime() - trade.createdAt.getTime()) / (1000 * 60 * 60)
      : (Date.now() - trade.createdAt.getTime()) / (1000 * 60 * 60);

    tradePerformances.push({
      tradeId: trade.id,
      agentId: trade.agentId,
      question: trade.question,
      direction: trade.direction as "YES" | "NO",
      entryPrice,
      exitPrice,
      currentPrice,
      amountUsdc: trade.amountUsdc,
      shares,
      realizedPnL,
      unrealizedPnL,
      status: trade.status === "simulated" ? "simulated" : exitPrice ? "closed" : "open",
      entryDate: trade.createdAt,
      exitDate,
      holdingPeriod,
    });
  }

  return tradePerformances;
}

/**
 * Get performance comparison across all agents for a specific user
 * This shows the user's personal P&L from their agents
 */
export async function getUserAgentsPerformance(
  userId: string
): Promise<
  Array<{ agentId: string; agentName: string; metrics: PerformanceMetrics }>
> {
  // Get only this user's agents
  const userAgents = await db
    .select()
    .from(agents)
    .where(eq(agents.userId, userId));

  const performances = await Promise.all(
    userAgents.map(async (agent) => {
      const metrics = await getAgentPerformance(agent.id);
      return {
        agentId: agent.id,
        agentName: agent.name,
        metrics,
      };
    })
  );

  // Sort by total P&L descending
  return performances.sort((a, b) => b.metrics.totalPnL - a.metrics.totalPnL);
}

/**
 * Get performance comparison across all agents (GLOBAL - for admin/stats)
 * This shows how agent strategies perform collectively across all users
 */
export async function getAllAgentsPerformance(): Promise<
  Array<{ agentId: string; agentName: string; metrics: PerformanceMetrics }>
> {
  const allAgents = await db.select().from(agents);

  const performances = await Promise.all(
    allAgents.map(async (agent) => {
      const metrics = await getAgentPerformance(agent.id);
      return {
        agentId: agent.id,
        agentName: agent.name,
        metrics,
      };
    })
  );

  // Sort by total P&L descending
  return performances.sort((a, b) => b.metrics.totalPnL - a.metrics.totalPnL);
}

/**
 * Get performance by strategy type (GLOBAL - across all users)
 * Shows how each strategy performs collectively
 */
export async function getStrategyPerformance(): Promise<
  Record<string, PerformanceMetrics>
> {
  const allAgents = await db.select().from(agents);

  const strategyGroups: Record<string, string[]> = {};

  // Group agents by strategy
  for (const agent of allAgents) {
    if (!strategyGroups[agent.strategy]) {
      strategyGroups[agent.strategy] = [];
    }
    strategyGroups[agent.strategy].push(agent.id);
  }

  // Calculate aggregate metrics per strategy
  const strategyMetrics: Record<string, PerformanceMetrics> = {};

  for (const [strategy, agentIds] of Object.entries(strategyGroups)) {
    const allMetrics = await Promise.all(
      agentIds.map((id) => getAgentPerformance(id))
    );

    // Aggregate metrics
    strategyMetrics[strategy] = {
      totalTrades: allMetrics.reduce((sum, m) => sum + m.totalTrades, 0),
      realTrades: allMetrics.reduce((sum, m) => sum + m.realTrades, 0),
      simulatedTrades: allMetrics.reduce((sum, m) => sum + m.simulatedTrades, 0),
      wins: allMetrics.reduce((sum, m) => sum + m.wins, 0),
      losses: allMetrics.reduce((sum, m) => sum + m.losses, 0),
      winRate:
        allMetrics.reduce((sum, m) => sum + m.winRate, 0) / allMetrics.length,
      totalPnL: allMetrics.reduce((sum, m) => sum + m.totalPnL, 0),
      realizedPnL: allMetrics.reduce((sum, m) => sum + m.realizedPnL, 0),
      unrealizedPnL: allMetrics.reduce((sum, m) => sum + m.unrealizedPnL, 0),
      avgWin:
        allMetrics.reduce((sum, m) => sum + m.avgWin, 0) / allMetrics.length,
      avgLoss:
        allMetrics.reduce((sum, m) => sum + m.avgLoss, 0) / allMetrics.length,
      largestWin: Math.max(...allMetrics.map((m) => m.largestWin)),
      largestLoss: Math.max(...allMetrics.map((m) => m.largestLoss)),
      profitFactor:
        allMetrics.reduce((sum, m) => sum + m.profitFactor, 0) /
        allMetrics.length,
      sharpeRatio:
        allMetrics.reduce((sum, m) => sum + m.sharpeRatio, 0) /
        allMetrics.length,
      maxDrawdown: Math.max(...allMetrics.map((m) => m.maxDrawdown)),
      roi: allMetrics.reduce((sum, m) => sum + m.roi, 0) / allMetrics.length,
    };
  }

  return strategyMetrics;
}

/**
 * Update agent's total P&L and stats
 */
export async function updateAgentStats(agentId: string): Promise<void> {
  const metrics = await getAgentPerformance(agentId);

  await db
    .update(agents)
    .set({
      totalTrades: metrics.realTrades,
      totalPnl: metrics.totalPnL,
      updatedAt: new Date(),
    })
    .where(eq(agents.id, agentId));
}
