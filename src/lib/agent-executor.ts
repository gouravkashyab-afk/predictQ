/**
 * Agent Execution Engine
 * 
 * Runs trading agents automatically based on their strategy and configuration.
 * Agents can follow signals, track whale movements, or use contrarian strategies.
 */

import { db } from "@/db/client";
import { agents, agentLogs, agentTrades, trades, signals, whaleEvents } from "@/db/schema";
import { eq, desc, and, gte } from "drizzle-orm";
import { randomUUID } from "crypto";
import { fetchMarkets, normalizeMarkets, type Market } from "./polymarket";

// ─── Types ────────────────────────────────────────────────────────────────────

export interface AgentConfig {
  maxPositionSize: number;      // Max USDC per trade
  minConfidence: number;         // Min confidence score (0-100)
  maxMarketsPerRun: number;      // Max trades per execution
  riskLevel: "low" | "medium" | "high";
  notifyOnTrade?: boolean;
}

export interface ExecutionResult {
  agentId: string;
  success: boolean;
  tradesPlaced: number;
  errors: string[];
  logs: string[];
}

// ─── Helper Functions ─────────────────────────────────────────────────────────

/**
 * Log agent activity
 */
async function log(
  agentId: string,
  level: "info" | "warn" | "error",
  message: string,
  metadata: Record<string, unknown> = {}
) {
  try {
    await db.insert(agentLogs).values({
      id: randomUUID(),
      agentId,
      level,
      message,
      metadata,
    });
  } catch (error) {
    console.error("[agent-log]", error);
  }
}

/**
 * Get recent signals for signal_follower strategy
 */
async function getRecentSignals(minConfidence: number, limit: number) {
  const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
  
  return db
    .select()
    .from(signals)
    .where(
      and(
        gte(signals.confidence, minConfidence),
        gte(signals.createdAt, oneDayAgo)
      )
    )
    .orderBy(desc(signals.confidence))
    .limit(limit);
}

/**
 * Get recent whale events for whale_tracker strategy
 */
async function getRecentWhaleEvents(minAmount: number, limit: number) {
  const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
  
  return db
    .select()
    .from(whaleEvents)
    .where(
      and(
        gte(whaleEvents.amountUsd, minAmount),
        gte(whaleEvents.timestamp, oneHourAgo)
      )
    )
    .orderBy(desc(whaleEvents.amountUsd))
    .limit(limit);
}

/**
 * Get trending markets for contrarian strategy
 */
async function getTrendingMarkets(limit: number): Promise<Market[]> {
  try {
    const response = await fetchMarkets({
      closed: false,
      order: "volume24hr",
      ascending: false,
      limit,
    });
    
    return normalizeMarkets(response);
  } catch (error) {
    console.error("[getTrendingMarkets]", error);
    return [];
  }
}

/**
 * Calculate position size based on risk level and confidence
 */
function calculatePositionSize(
  config: AgentConfig,
  confidence: number
): number {
  const { maxPositionSize, riskLevel } = config;
  
  // Base multiplier by risk level
  const riskMultipliers = {
    low: 0.5,
    medium: 0.75,
    high: 1.0,
  };
  
  const baseMultiplier = riskMultipliers[riskLevel];
  
  // Confidence multiplier (70% confidence = 0.7x, 100% = 1.0x)
  const confidenceMultiplier = confidence / 100;
  
  // Calculate final position size
  const positionSize = maxPositionSize * baseMultiplier * confidenceMultiplier;
  
  // Ensure minimum of $10
  return Math.max(10, Math.round(positionSize));
}

// ─── Strategy Executors ───────────────────────────────────────────────────────

/**
 * Signal Follower Strategy
 * Follows AI-generated trading signals
 */
async function executeSignalFollower(
  agent: typeof agents.$inferSelect,
  config: AgentConfig
): Promise<{ trades: number; logs: string[] }> {
  const logs: string[] = [];
  let tradesPlaced = 0;

  logs.push(`Starting signal follower execution`);

  // Get recent high-confidence signals
  const recentSignals = await getRecentSignals(
    config.minConfidence,
    config.maxMarketsPerRun
  );

  logs.push(`Found ${recentSignals.length} signals above ${config.minConfidence}% confidence`);

  for (const signal of recentSignals) {
    try {
      // Calculate position size based on confidence
      const positionSize = calculatePositionSize(config, signal.confidence);

      // Record agent trade intent
      await db.insert(agentTrades).values({
        id: randomUUID(),
        agentId: agent.id,
        conditionId: signal.conditionId,
        question: signal.question,
        direction: signal.direction,
        amountUsdc: positionSize,
        confidence: signal.confidence,
        signalId: signal.id,
        status: "pending",
      });

      logs.push(
        `Placed ${signal.direction} trade on "${signal.question.slice(0, 50)}..." ` +
        `for $${positionSize} (confidence: ${signal.confidence}%)`
      );

      tradesPlaced++;
    } catch (error) {
      logs.push(`Failed to place trade: ${error instanceof Error ? error.message : "Unknown error"}`);
    }
  }

  return { trades: tradesPlaced, logs };
}

/**
 * Whale Tracker Strategy
 * Follows large wallet movements
 */
async function executeWhaleTracker(
  agent: typeof agents.$inferSelect,
  config: AgentConfig
): Promise<{ trades: number; logs: string[] }> {
  const logs: string[] = [];
  let tradesPlaced = 0;

  logs.push(`Starting whale tracker execution`);

  // Get recent large transactions (>$10k)
  const whaleActivity = await getRecentWhaleEvents(10000, config.maxMarketsPerRun);

  logs.push(`Found ${whaleActivity.length} whale transactions`);

  // In a real implementation, you'd:
  // 1. Map whale wallets to Polymarket positions
  // 2. Identify which markets they're trading
  // 3. Follow their positions with smaller size

  // For now, log the activity
  for (const whale of whaleActivity) {
    logs.push(
      `Whale ${whale.wallet.slice(0, 8)}... moved $${whale.amountUsd.toFixed(0)} ${whale.direction}`
    );
  }

  return { trades: tradesPlaced, logs };
}

/**
 * Contrarian Strategy
 * Takes opposite positions on highly skewed markets
 */
async function executeContrarian(
  agent: typeof agents.$inferSelect,
  config: AgentConfig
): Promise<{ trades: number; logs: string[] }> {
  const logs: string[] = [];
  let tradesPlaced = 0;

  logs.push(`Starting contrarian execution`);

  // Get trending markets
  const markets = await getTrendingMarkets(config.maxMarketsPerRun * 2);

  logs.push(`Analyzing ${markets.length} trending markets`);

  // Find highly skewed markets (>80% or <20%)
  const skewedMarkets = markets.filter(
    (m) => m.yesPrice > 0.8 || m.yesPrice < 0.2
  );

  logs.push(`Found ${skewedMarkets.length} skewed markets`);

  for (const market of skewedMarkets.slice(0, config.maxMarketsPerRun)) {
    try {
      // Take contrarian position
      const direction = market.yesPrice > 0.8 ? "NO" : "YES";
      const confidence = Math.round(Math.abs(market.yesPrice - 0.5) * 100);
      const positionSize = calculatePositionSize(config, confidence);

      // Record agent trade intent
      await db.insert(agentTrades).values({
        id: randomUUID(),
        agentId: agent.id,
        conditionId: market.conditionId,
        question: market.question,
        direction,
        amountUsdc: positionSize,
        confidence,
        status: "pending",
      });

      logs.push(
        `Contrarian ${direction} on "${market.question.slice(0, 50)}..." ` +
        `for $${positionSize} (price: ${Math.round(market.yesPrice * 100)}¢)`
      );

      tradesPlaced++;
    } catch (error) {
      logs.push(`Failed to place trade: ${error instanceof Error ? error.message : "Unknown error"}`);
    }
  }

  return { trades: tradesPlaced, logs };
}

// ─── Main Executor ────────────────────────────────────────────────────────────

/**
 * Execute a single agent
 */
export async function executeAgent(agentId: string): Promise<ExecutionResult> {
  const errors: string[] = [];
  const logs: string[] = [];

  try {
    // Get agent details
    const [agent] = await db
      .select()
      .from(agents)
      .where(eq(agents.id, agentId))
      .limit(1);

    if (!agent) {
      throw new Error(`Agent ${agentId} not found`);
    }

    if (agent.status !== "active") {
      throw new Error(`Agent ${agent.name} is not active (status: ${agent.status})`);
    }

    await log(agentId, "info", `Starting execution for ${agent.name}`);

    // Parse config
    const config = agent.config as AgentConfig;

    // Execute based on strategy
    let result: { trades: number; logs: string[] };

    switch (agent.strategy) {
      case "signal_follower":
        result = await executeSignalFollower(agent, config);
        break;
      case "whale_tracker":
        result = await executeWhaleTracker(agent, config);
        break;
      case "contrarian":
        result = await executeContrarian(agent, config);
        break;
      default:
        throw new Error(`Unknown strategy: ${agent.strategy}`);
    }

    logs.push(...result.logs);

    // Update agent stats
    await db
      .update(agents)
      .set({
        totalTrades: agent.totalTrades + result.trades,
        lastRunAt: new Date(),
        updatedAt: new Date(),
      })
      .where(eq(agents.id, agentId));

    await log(
      agentId,
      "info",
      `Execution complete: ${result.trades} trades placed`,
      { trades: result.trades }
    );

    return {
      agentId,
      success: true,
      tradesPlaced: result.trades,
      errors,
      logs,
    };
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : "Unknown error";
    errors.push(errorMsg);
    
    await log(agentId, "error", `Execution failed: ${errorMsg}`);

    return {
      agentId,
      success: false,
      tradesPlaced: 0,
      errors,
      logs,
    };
  }
}

/**
 * Execute all active agents
 */
export async function executeAllActiveAgents(): Promise<ExecutionResult[]> {
  try {
    // Get all active agents
    const activeAgents = await db
      .select()
      .from(agents)
      .where(eq(agents.status, "active"));

    console.log(`[agent-executor] Found ${activeAgents.length} active agents`);

    // Execute each agent
    const results = await Promise.all(
      activeAgents.map((agent) => executeAgent(agent.id))
    );

    return results;
  } catch (error) {
    console.error("[executeAllActiveAgents]", error);
    return [];
  }
}
