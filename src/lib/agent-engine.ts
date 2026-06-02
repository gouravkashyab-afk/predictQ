/**
 * Agent Execution Engine
 * Runs as a state-machine triggered by /api/cron every 30 min.
 * Each agent strategy fetches data, filters signals, and records trade decisions.
 */

import { db } from "@/db/client";
import { agents, agentTrades, agentLogs, signals, trades, whaleEvents } from "@/db/schema";
import { eq, desc, gte, and } from "drizzle-orm";
import { randomUUID } from "crypto";
import type { Agent } from "@/db/schema";

interface AgentConfig {
  maxPositionSize: number;   // max USDC per trade (default: 50)
  minConfidence: number;     // minimum signal confidence 0-100 (default: 70)
  maxMarketsPerRun: number;  // max trades per cron run (default: 3)
  riskLevel: "low" | "medium" | "high";
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

  let tradesPlaced = 0;
  for (const signal of freshSignals) {
    const amount = Math.min(config.maxPositionSize, config.maxPositionSize * (signal.confidence / 100));

    const tradeId = randomUUID();
    await db.insert(agentTrades).values({
      id: randomUUID(),
      agentId: agent.id,
      tradeId,
      conditionId: signal.conditionId,
      question: signal.question,
      direction: signal.direction,
      amountUsdc: Math.round(amount * 100) / 100,
      confidence: signal.confidence,
      signalId: signal.id,
      status: "simulated", // agents simulate until real wallet signing is wired
      createdAt: new Date(),
    });

    await log(agent.id, "info", `Signal: ${signal.direction} on "${signal.question.slice(0, 60)}..."`, {
      confidence: signal.confidence,
      amount,
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
