/**
 * Agent Execution Engine
 * Runs as a state-machine triggered by /api/cron every 30 min.
 * Each agent strategy fetches data, filters signals, and records trade decisions.
 */

import { db } from "@/db/client";
import { agents, agentTrades, agentLogs, signals, trades, whaleEvents, markets } from "@/db/schema";
import { eq, desc, gte, and } from "drizzle-orm";
import { randomUUID } from "crypto";
import type { Agent } from "@/db/schema";
import { executeAgentTrade, canAgentTrade, getUserBalance } from "./wallet-manager";
import { canExecuteTrade, shouldClosePosition, getUserPreferences, calculatePositionSize } from "./user-preferences";
import { notifyTradeExecuted, notifyAlert } from "./notification-system";

interface AgentConfig {
  maxPositionSize: number;   // max USDC per trade (default: 50)
  minConfidence: number;     // minimum signal confidence 0-100 (default: 70)
  maxMarketsPerRun: number;  // max trades per cron run (default: 3)
  riskLevel: "low" | "medium" | "high";
  simulateOnly?: boolean;    // NEW: If true, don't execute real trades (default: true)
  perTradeLimit?: number;    // NEW: Max $ per trade
  dailyLimit?: number;       // NEW: Max $ per day
}

function defaultConfig(): AgentConfig {
  return { maxPositionSize: 50, minConfidence: 70, maxMarketsPerRun: 3, riskLevel: "medium" };
}

async function log(
  agentId: string,
  level: "info" | "warn" | "error",
  message: string,
  metadata: Record<string, unknown> = {}
) {
  await db.insert(agentLogs).values({
    id: randomUUID(),
    agentId,
    level,
    message,
    metadata,
    createdAt: new Date(),
  }).catch(console.error);
}

// ── Helper: Execute trade (simulated or real) with user preference checks ──
async function executeTrade(
  agent: Agent,
  signal: any,
  amount: number,
  direction: "YES" | "NO"
): Promise<string> {
  const config = agent.config as AgentConfig;
  
  // Get user preferences
  const userPrefs = await getUserPreferences(agent.userId);
  
  // Check if trade is allowed based on user preferences
  const canTrade = await canExecuteTrade(
    agent.userId,
    amount,
    signal.category || "Other",
    signal.confidence
  );

  if (!canTrade.allowed) {
    await log(agent.id, "warn", `Trade blocked: ${canTrade.reason}`);
    
    // Notify user
    await notifyAlert({
      userId: agent.userId,
      severity: "warning",
      title: "Trade Blocked",
      message: canTrade.reason || "Trade did not meet your risk preferences",
    });
    
    return "blocked";
  }

  // Calculate dynamic position size based on preferences
  const userBalance = await getUserBalance(agent.userId);
  const dynamicAmount = calculatePositionSize(
    userPrefs,
    signal.confidence,
    signal.metadata?.expectedValue || 0,
    userBalance
  );

  // Use the smaller of: calculated amount or original amount
  const finalAmount = Math.min(amount, dynamicAmount);

  const simulateOnly = userPrefs.paperTradingMode || config?.simulateOnly !== false;

  const tradeId = randomUUID();

  if (simulateOnly) {
    // Simulated trade
    await db.insert(agentTrades).values({
      id: tradeId,
      agentId: agent.id,
      conditionId: signal.conditionId,
      question: signal.question,
      direction,
      amountUsdc: finalAmount,
      confidence: signal.confidence,
      signalId: signal.id,
      status: "simulated",
      createdAt: new Date(),
    });

    // Notify user
    await notifyTradeExecuted({
      userId: agent.userId,
      agentName: agent.name,
      question: signal.question,
      direction,
      amount: finalAmount,
      confidence: signal.confidence,
      isSimulated: true,
    });

    return tradeId;
  }

  // REAL TRADE
  try {
    // Check if agent can trade
    const canTrade = await canAgentTrade(agent.id);
    if (!canTrade) {
      await log(agent.id, "warn", "Agent cannot trade (permissions)");
      // Fall back to simulated
      await db.insert(agentTrades).values({
        id: tradeId,
        agentId: agent.id,
        conditionId: signal.conditionId,
        question: signal.question,
        direction,
        amountUsdc: amount,
        confidence: signal.confidence,
        signalId: signal.id,
        status: "simulated",
        createdAt: new Date(),
      });
      return tradeId;
    }

    // Check balance
    const balance = await getUserBalance(agent.userId);
    if (balance < amount) {
      await log(agent.id, "warn", `Insufficient balance ($${balance.toFixed(2)} < $${amount})`);
      // Fall back to simulated
      await db.insert(agentTrades).values({
        id: tradeId,
        agentId: agent.id,
        conditionId: signal.conditionId,
        question: signal.question,
        direction,
        amountUsdc: amount,
        confidence: signal.confidence,
        signalId: signal.id,
        status: "simulated",
        createdAt: new Date(),
      });
      return tradeId;
    }

    // Get token ID from market
    const market = await db
      .select()
      .from(markets)
      .where(eq(markets.conditionId, signal.conditionId))
      .limit(1);

    if (!market || market.length === 0) {
      throw new Error('Market not found');
    }

    // Execute real trade
    const tokenId = direction === 'YES' ? market[0].yesTokenId : market[0].noTokenId;
    const price = direction === 'YES' ? signal.yesPrice : signal.noPrice;

    if (!tokenId) {
      throw new Error('Token ID not found');
    }

    const result = await executeAgentTrade({
      agentId: agent.id,
      userId: agent.userId,
      tokenId,
      price,
      size: amount,
      side: 'BUY', // Agents always buy (either YES or NO)
    });

    if (!result.success) {
      throw new Error(result.error || 'Trade execution failed');
    }

    // Store trade in database with order hash
    await db.insert(agentTrades).values({
      id: tradeId,
      agentId: agent.id,
      conditionId: signal.conditionId,
      question: signal.question,
      direction,
      amountUsdc: amount,
      confidence: signal.confidence,
      signalId: signal.id,
      status: "pending", // ← REAL TRADE
      orderHash: result.orderHash,
      createdAt: new Date(),
    });

    await log(agent.id, "info", `✅ REAL TRADE executed: ${direction}`, {
      amount,
      orderHash: result.orderHash,
      question: signal.question.slice(0, 60),
    });

    return tradeId;
  } catch (error) {
    await log(agent.id, "error", `Trade execution failed: ${String(error)}`);

    // Fall back to simulated on error
    await db.insert(agentTrades).values({
      id: tradeId,
      agentId: agent.id,
      conditionId: signal.conditionId,
      question: signal.question,
      direction,
      amountUsdc: amount,
      confidence: signal.confidence,
      signalId: signal.id,
      status: "failed",
      createdAt: new Date(),
    });

    return tradeId;
  }
}

// ── Strategy: Signal Follower ──────────────────────────────────────────────────
async function runSignalFollower(agent: Agent, config: AgentConfig) {
  await log(agent.id, "info", "Running signal_follower strategy", { config });

  const cutoff = new Date(Date.now() - 2 * 60 * 60 * 1000); // signals from last 2h
  const freshSignals = await db
    .select()
    .from(signals)
    .where(
      and(
        gte(signals.confidence, config.minConfidence),
        gte(signals.createdAt, cutoff)
      )
    )
    .orderBy(desc(signals.confidence))
    .limit(config.maxMarketsPerRun);

  if (freshSignals.length === 0) {
    await log(agent.id, "info", `No signals above ${config.minConfidence}% confidence`);
    return 0;
  }

  await log(agent.id, "info", `Found ${freshSignals.length} signals to evaluate`, {
    sources: freshSignals.reduce((acc: any, s: any) => {
      acc[s.source || 'gpt4o'] = (acc[s.source || 'gpt4o'] || 0) + 1;
      return acc;
    }, {}),
  });

  let tradesPlaced = 0;
  for (const signal of freshSignals) {
    // Enhanced position sizing based on EV and edge
    let amount = config.maxPositionSize;
    
    // If signal has EV data, adjust position size
    const signalMetadata = signal.metadata as any;
    if (signalMetadata?.expectedValue && signalMetadata?.edgePercentage) {
      const ev = signalMetadata.expectedValue;
      const edge = signalMetadata.edgePercentage;
      
      // Only trade positive EV signals
      if (ev <= 0) {
        await log(agent.id, "info", `Skipping negative EV signal: ${signal.question.slice(0, 60)}...`, {
          ev,
          confidence: signal.confidence,
        });
        continue;
      }
      
      // Scale position size by EV and confidence
      // High EV (>15%) + high confidence (>80%) = max position
      // Lower EV or confidence = reduced position
      const evMultiplier = Math.min(1.5, ev / 10); // Max 1.5x for EV > 15%
      const edgeMultiplier = Math.min(1.2, edge / 15); // Max 1.2x for edge > 15%
      
      amount = Math.min(
        config.maxPositionSize,
        config.maxPositionSize * evMultiplier * edgeMultiplier * (signal.confidence / 100)
      );
    } else {
      // Legacy: scale by confidence only
      amount = Math.min(config.maxPositionSize, config.maxPositionSize * (signal.confidence / 100));
    }

    // Execute trade (simulated or real based on config)
    await executeTrade(agent, signal, Math.round(amount * 100) / 100, signal.direction);

    await log(agent.id, "info", `Signal: ${signal.direction} on "${signal.question.slice(0, 60)}..."`, {
      confidence: signal.confidence,
      amount,
      ev: signalMetadata?.expectedValue,
      edge: signalMetadata?.edgePercentage,
      conditionId: signal.conditionId,
    });

    tradesPlaced++;
  }

  return tradesPlaced;
}

// ── Strategy: Whale Tracker ────────────────────────────────────────────────────
async function runWhaleTracker(agent: Agent, config: AgentConfig) {
  await log(agent.id, "info", "Running whale_tracker strategy");

  const cutoff = new Date(Date.now() - 60 * 60 * 1000); // last 1h
  const bigWhales = await db
    .select()
    .from(whaleEvents)
    .where(
      and(
        gte(whaleEvents.amountUsd, 100_000),
        gte(whaleEvents.timestamp, cutoff)
      )
    )
    .orderBy(desc(whaleEvents.amountUsd))
    .limit(config.maxMarketsPerRun);

  if (bigWhales.length === 0) {
    await log(agent.id, "info", "No large whale events in last hour");
    return 0;
  }

  // Mirror whale direction: IN = buy YES (bullish), OUT = buy NO (bearish)
  let tradesPlaced = 0;
  for (const whale of bigWhales) {
    const direction = whale.direction === "IN" ? "YES" : "NO";
    await db.insert(agentTrades).values({
      id: randomUUID(),
      agentId: agent.id,
      conditionId: `whale-${whale.id}`,
      question: `Whale move: ${whale.direction} $${(whale.amountUsd / 1000).toFixed(0)}K`,
      direction,
      amountUsdc: Math.min(config.maxPositionSize, 50),
      confidence: 65,
      status: "simulated",
      createdAt: new Date(),
    });

    await log(agent.id, "info", `Mirroring whale: ${direction}`, {
      wallet: whale.wallet,
      amount: whale.amountUsd,
    });

    tradesPlaced++;
  }

  return tradesPlaced;
}

// ── Strategy: Contrarian ───────────────────────────────────────────────────────
async function runContrarian(agent: Agent, config: AgentConfig) {
  await log(agent.id, "info", "Running contrarian strategy");

  const freshSignals = await db
    .select()
    .from(signals)
    .where(gte(signals.confidence, config.minConfidence))
    .orderBy(desc(signals.createdAt))
    .limit(config.maxMarketsPerRun);

  // Contrarian: trade OPPOSITE to AI signals
  let tradesPlaced = 0;
  for (const signal of freshSignals) {
    const direction = signal.direction === "YES" ? "NO" : "YES";
    await db.insert(agentTrades).values({
      id: randomUUID(),
      agentId: agent.id,
      conditionId: signal.conditionId,
      question: signal.question,
      direction,
      amountUsdc: Math.min(config.maxPositionSize, 30),
      confidence: 100 - signal.confidence, // inverse confidence
      signalId: signal.id,
      status: "simulated",
      createdAt: new Date(),
    });

    await log(agent.id, "info", `Contrarian: ${direction} (against ${signal.direction} signal)`, {
      originalConfidence: signal.confidence,
    });

    tradesPlaced++;
  }

  return tradesPlaced;
}

// ── Strategy: Allora Follower ──────────────────────────────────────────────────
async function runAlloraFollower(agent: Agent, config: AgentConfig) {
  await log(agent.id, "info", "Running allora_follower strategy - Using Allora Network predictions");

  const cutoff = new Date(Date.now() - 2 * 60 * 60 * 1000);
  const alloraSignals = await db
    .select()
    .from(signals)
    .where(
      and(
        eq(signals.source, "allora"), // ONLY Allora signals
        gte(signals.confidence, config.minConfidence),
        gte(signals.createdAt, cutoff)
      )
    )
    .orderBy(desc(signals.confidence))
    .limit(config.maxMarketsPerRun);

  if (alloraSignals.length === 0) {
    await log(agent.id, "info", "No Allora signals found. Run /api/allora/signals first.");
    return 0;
  }

  await log(agent.id, "info", `Found ${alloraSignals.length} Allora-powered signals`, {
    avgConfidence: Math.round(alloraSignals.reduce((sum, s) => sum + s.confidence, 0) / alloraSignals.length),
  });

  let tradesPlaced = 0;
  for (const signal of alloraSignals) {
    const metadata = signal.metadata as any;
    
    // Allora signals have enhanced metadata
    const ev = metadata?.ev || 0;
    const edge = metadata?.edge || 0;
    const alloraPrediction = metadata?.alloraPrediction || 0;
    const asset = metadata?.asset || 'Unknown';

    // Only trade positive EV with significant edge
    if (ev <= 0) {
      await log(agent.id, "info", `Skipping negative EV Allora signal`, {
        question: signal.question.slice(0, 50),
        ev,
      });
      continue;
    }

    if (edge < 5) {
      await log(agent.id, "info", `Skipping low edge Allora signal`, {
        question: signal.question.slice(0, 50),
        edge,
      });
      continue;
    }

    // Smart position sizing based on Allora confidence + EV + edge
    const evMultiplier = Math.min(1.5, ev / 10);
    const edgeMultiplier = Math.min(1.2, edge / 15);
    const confidenceMultiplier = signal.confidence / 100;

    const amount = Math.round(
      config.maxPositionSize * evMultiplier * edgeMultiplier * confidenceMultiplier * 100
    ) / 100;

    await db.insert(agentTrades).values({
      id: randomUUID(),
      agentId: agent.id,
      conditionId: signal.conditionId,
      question: signal.question,
      direction: signal.direction,
      amountUsdc: amount,
      confidence: signal.confidence,
      signalId: signal.id,
      status: "simulated",
      createdAt: new Date(),
    });

    await log(agent.id, "info", `Allora signal executed: ${signal.direction}`, {
      question: signal.question.slice(0, 60),
      asset,
      alloraPrediction,
      confidence: signal.confidence,
      ev: ev.toFixed(2),
      edge: edge.toFixed(2),
      amount,
      technicalSignal: metadata?.technicalSignal,
    });

    tradesPlaced++;
  }

  return tradesPlaced;
}

// ── Strategy: Hybrid (Allora + GPT) ────────────────────────────────────────────
async function runHybrid(agent: Agent, config: AgentConfig) {
  await log(agent.id, "info", "Running hybrid strategy - Combining Allora + GPT-4o");

  const cutoff = new Date(Date.now() - 2 * 60 * 60 * 1000);
  const hybridSignals = await db
    .select()
    .from(signals)
    .where(
      and(
        eq(signals.source, "hybrid"),
        gte(signals.confidence, config.minConfidence),
        gte(signals.createdAt, cutoff)
      )
    )
    .orderBy(desc(signals.confidence))
    .limit(config.maxMarketsPerRun);

  if (hybridSignals.length === 0) {
    await log(agent.id, "info", "No hybrid signals available");
    return 0;
  }

  let tradesPlaced = 0;
  for (const signal of hybridSignals) {
    const metadata = signal.metadata as any;
    
    // Hybrid signals should have both Allora and GPT data
    const alloraEV = metadata?.alloraEV || 0;
    const gptEV = metadata?.gptEV || 0;
    const combinedEV = metadata?.combinedEV || 0;

    // Both sources must agree (positive EV)
    if (alloraEV <= 0 || gptEV <= 0) {
      await log(agent.id, "info", "Skipping: Allora and GPT disagree", {
        question: signal.question.slice(0, 50),
        alloraEV,
        gptEV,
      });
      continue;
    }

    // High confidence required for hybrid
    if (signal.confidence < 75) {
      continue;
    }

    const amount = Math.round(
      config.maxPositionSize * (signal.confidence / 100) * 100
    ) / 100;

    await db.insert(agentTrades).values({
      id: randomUUID(),
      agentId: agent.id,
      conditionId: signal.conditionId,
      question: signal.question,
      direction: signal.direction,
      amountUsdc: amount,
      confidence: signal.confidence,
      signalId: signal.id,
      status: "simulated",
      createdAt: new Date(),
    });

    await log(agent.id, "info", `Hybrid consensus: ${signal.direction}`, {
      question: signal.question.slice(0, 60),
      alloraEV,
      gptEV,
      combinedEV,
      confidence: signal.confidence,
      amount,
    });

    tradesPlaced++;
  }

  return tradesPlaced;
}

// ── Main runner (called by /api/cron) ─────────────────────────────────────────
export async function runAllActiveAgents(): Promise<{ agentId: string; trades: number }[]> {
  const activeAgents = await db
    .select()
    .from(agents)
    .where(eq(agents.status, "active"));

  const results: { agentId: string; trades: number }[] = [];

  for (const agent of activeAgents) {
    const config: AgentConfig = { ...defaultConfig(), ...(agent.config as Partial<AgentConfig>) };

    try {
      let tradesPlaced = 0;

      if (agent.strategy === "signal_follower") {
        tradesPlaced = await runSignalFollower(agent, config);
      } else if (agent.strategy === "whale_tracker") {
        tradesPlaced = await runWhaleTracker(agent, config);
      } else if (agent.strategy === "contrarian") {
        tradesPlaced = await runContrarian(agent, config);
      } else if (agent.strategy === "allora_follower") {
        tradesPlaced = await runAlloraFollower(agent, config);
      } else if (agent.strategy === "hybrid") {
        tradesPlaced = await runHybrid(agent, config);
      } else {
        await log(agent.id, "warn", `Unknown strategy: ${agent.strategy}`);
      }

      // Update agent last run + trade count
      await db.update(agents).set({
        lastRunAt: new Date(),
        totalTrades: agent.totalTrades + tradesPlaced,
        updatedAt: new Date(),
      }).where(eq(agents.id, agent.id));

      results.push({ agentId: agent.id, trades: tradesPlaced });
    } catch (err) {
      await log(agent.id, "error", `Agent run failed: ${String(err)}`);
      results.push({ agentId: agent.id, trades: 0 });
    }
  }

  return results;
}
