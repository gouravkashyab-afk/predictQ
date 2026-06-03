/**
 * Wallet Manager - Handles wallet signing for autonomous agent trades
 * 
 * SECURITY NOTE: This is a development implementation.
 * In production, integrate with Privy for secure wallet management.
 */

import { db } from "@/db/client";
import { agents, agentTrades, userSettings } from "@/db/schema";
import { eq, and, gte, sql } from "drizzle-orm";
import { createAndSignOrder, submitOrder } from "./polymarket-client";

/**
 * Execute a trade for an agent (real or simulated based on agent config)
 */
export async function executeAgentTrade(params: {
  agentId: string;
  userId: string;
  tokenId: string;
  price: number;
  size: number;
  side: "BUY" | "SELL";
}): Promise<{ success: boolean; orderHash?: string; error?: string }> {
  const { agentId, userId, tokenId, price, size, side } = params;

  try {
    // Check if agent can trade
    const canTrade = await canAgentTrade(agentId);
    if (!canTrade) {
      return { success: false, error: "Agent not authorized for real trading" };
    }

    // Check spending limits
    const limitsOk = await checkSpendingLimits(agentId, size);
    if (!limitsOk.allowed) {
      return { success: false, error: limitsOk.reason };
    }

    // Check user balance
    const balance = await getUserBalance(userId);
    if (balance < size) {
      return { success: false, error: `Insufficient balance: $${balance.toFixed(2)}` };
    }

    // Get user's private key (in production, use Privy)
    const privateKey = await getUserWalletKey(userId);
    if (!privateKey) {
      return { success: false, error: "Wallet key not found" };
    }

    // Create and sign order
    const signedOrder = await createAndSignOrder(
      {
        tokenId,
        price,
        size,
        side,
        feeRateBps: 0, // No fees for maker orders
        nonce: Date.now(),
        expiration: Math.floor(Date.now() / 1000) + 86400, // 24 hours
      },
      privateKey
    );

    // Submit to Polymarket
    const result = await submitOrder(signedOrder);

    return {
      success: true,
      orderHash: result.orderID,
    };
  } catch (error) {
    console.error("Trade execution failed:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

/**
 * Check if agent is authorized for real trading
 */
export async function canAgentTrade(agentId: string): Promise<boolean> {
  const agent = await db
    .select()
    .from(agents)
    .where(eq(agents.id, agentId))
    .limit(1);

  if (!agent || agent.length === 0) return false;

  const config = agent[0].config as any;

  // Agent must be active and not in simulation-only mode
  return agent[0].status === "active" && config?.simulateOnly === false;
}

/**
 * Check if trade is within spending limits
 */
export async function checkSpendingLimits(
  agentId: string,
  tradeAmount: number
): Promise<{ allowed: boolean; reason?: string }> {
  const agent = await db
    .select()
    .from(agents)
    .where(eq(agents.id, agentId))
    .limit(1);

  if (!agent || agent.length === 0) {
    return { allowed: false, reason: "Agent not found" };
  }

  const config = agent[0].config as any;

  // Check per-trade limit
  if (config.perTradeLimit && tradeAmount > config.perTradeLimit) {
    return {
      allowed: false,
      reason: `Trade exceeds per-trade limit of $${config.perTradeLimit}`,
    };
  }

  // Check daily limit
  if (config.dailyLimit) {
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);

    const todayTrades = await db
      .select()
      .from(agentTrades)
      .where(
        and(
          eq(agentTrades.agentId, agentId),
          gte(agentTrades.createdAt, todayStart),
          eq(agentTrades.status, "filled")
        )
      );

    const todayTotal = todayTrades.reduce((sum, t) => sum + t.amountUsdc, 0);

    if (todayTotal + tradeAmount > config.dailyLimit) {
      return {
        allowed: false,
        reason: `Daily limit of $${config.dailyLimit} would be exceeded`,
      };
    }
  }

  return { allowed: true };
}

/**
 * Get user's USDC balance
 * 
 * TODO: In production, query actual blockchain balance
 */
export async function getUserBalance(userId: string): Promise<number> {
  // For now, return a placeholder
  // In production, query user's actual USDC balance on Polygon
  return 1000; // $1000 placeholder
}

/**
 * Get user's wallet private key
 * 
 * SECURITY WARNING: This is a development stub.
 * In production, use Privy SDK to access embedded wallets securely.
 * NEVER store raw private keys in your database.
 */
export async function getUserWalletKey(userId: string): Promise<string | null> {
  // Development stub - returns null (no real trading)
  // In production, integrate with Privy:
  // const privy = new PrivyClient(...);
  // const wallet = await privy.getUserEmbeddedWallet(userId);
  // return wallet.getSigningKey();
  
  return null; // Forces simulation mode for safety
}

/**
 * Toggle real trading for an agent
 */
export async function toggleAgentRealTrading(
  agentId: string,
  enabled: boolean
): Promise<void> {
  const agent = await db
    .select()
    .from(agents)
    .where(eq(agents.id, agentId))
    .limit(1);

  if (!agent || agent.length === 0) {
    throw new Error("Agent not found");
  }

  const config = agent[0].config as any;

  await db
    .update(agents)
    .set({
      config: {
        ...config,
        simulateOnly: !enabled,
      },
      updatedAt: new Date(),
    })
    .where(eq(agents.id, agentId));
}

/**
 * Emergency stop - pause all agents for a user
 */
export async function emergencyStopAllAgents(userId: string): Promise<void> {
  await db
    .update(agents)
    .set({
      status: "paused",
      updatedAt: new Date(),
    })
    .where(eq(agents.userId, userId));
}
