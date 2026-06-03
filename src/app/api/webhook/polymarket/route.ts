/**
 * POST /api/webhook/polymarket
 * Webhook handler for Polymarket order status updates
 */

import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db/client";
import { agentTrades, trades, positions } from "@/db/schema";
import { eq } from "drizzle-orm";
import { calculateTradePnL } from "@/lib/performance-tracker";
import { updateAgentStats } from "@/lib/performance-tracker";

interface PolymarketWebhookPayload {
  eventType: "ORDER_FILLED" | "ORDER_CANCELLED" | "ORDER_EXPIRED";
  orderHash: string;
  tokenId: string;
  side: "BUY" | "SELL";
  price: number;
  size: number;
  filledAmount: number;
  status: "FILLED" | "CANCELLED" | "EXPIRED" | "PARTIALLY_FILLED";
  timestamp: number;
}

export async function POST(req: NextRequest) {
  try {
    // TODO: Verify webhook signature from Polymarket
    // const signature = req.headers.get("x-polymarket-signature");
    // if (!verifySignature(signature, body)) {
    //   return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
    // }

    const payload: PolymarketWebhookPayload = await req.json();

    console.log("Received Polymarket webhook:", payload);

    // Find the trade by orderHash
    const agentTrade = await db
      .select()
      .from(agentTrades)
      .where(eq(agentTrades.orderHash, payload.orderHash))
      .limit(1);

    if (!agentTrade || agentTrade.length === 0) {
      console.warn("Trade not found for orderHash:", payload.orderHash);
      return NextResponse.json({ message: "Trade not found" }, { status: 404 });
    }

    const trade = agentTrade[0];

    // Update trade status based on event type
    switch (payload.eventType) {
      case "ORDER_FILLED":
        await handleOrderFilled(trade, payload);
        break;

      case "ORDER_CANCELLED":
        await handleOrderCancelled(trade, payload);
        break;

      case "ORDER_EXPIRED":
        await handleOrderExpired(trade, payload);
        break;
    }

    // Update agent stats
    await updateAgentStats(trade.agentId);

    return NextResponse.json({
      success: true,
      message: `Order ${payload.eventType} processed`,
    });
  } catch (error) {
    console.error("Error processing Polymarket webhook:", error);
    return NextResponse.json(
      { error: "Failed to process webhook" },
      { status: 500 }
    );
  }
}

async function handleOrderFilled(
  trade: any,
  payload: PolymarketWebhookPayload
) {
  // Update agent_trades status
  await db
    .update(agentTrades)
    .set({
      status: "filled",
    })
    .where(eq(agentTrades.id, trade.id));

  // Update linked trade if exists
  if (trade.tradeId) {
    await db
      .update(trades)
      .set({
        status: "filled",
        pricePerShare: payload.price,
        filledAt: new Date(payload.timestamp),
      })
      .where(eq(trades.id, trade.tradeId));
  }

  // Create position record
  const positionId = `pos-${trade.id}`;
  await db.insert(positions).values({
    id: positionId,
    agentId: trade.agentId,
    tradeId: trade.tradeId,
    conditionId: trade.conditionId,
    question: trade.question,
    direction: trade.direction,
    tokenId: payload.tokenId,
    entryPrice: payload.price,
    currentPrice: payload.price,
    shares: payload.size / payload.price,
    amountUsdc: payload.size,
    unrealizedPnl: 0,
    status: "open",
    openedAt: new Date(payload.timestamp),
    createdAt: new Date(),
    updatedAt: new Date(),
  });

  console.log(`✅ Order filled: ${trade.question} - ${trade.direction}`);
}

async function handleOrderCancelled(
  trade: any,
  payload: PolymarketWebhookPayload
) {
  // Update status to cancelled
  await db
    .update(agentTrades)
    .set({
      status: "cancelled",
    })
    .where(eq(agentTrades.id, trade.id));

  if (trade.tradeId) {
    await db
      .update(trades)
      .set({
        status: "cancelled",
      })
      .where(eq(trades.id, trade.tradeId));
  }

  console.log(`⚠️ Order cancelled: ${trade.question}`);
}

async function handleOrderExpired(
  trade: any,
  payload: PolymarketWebhookPayload
) {
  // Update status to expired (similar to cancelled)
  await db
    .update(agentTrades)
    .set({
      status: "cancelled", // Use cancelled status for expired orders
    })
    .where(eq(agentTrades.id, trade.id));

  if (trade.tradeId) {
    await db
      .update(trades)
      .set({
        status: "cancelled",
      })
      .where(eq(trades.id, trade.tradeId));
  }

  console.log(`⏰ Order expired: ${trade.question}`);
}

/**
 * Close a position and calculate realized P&L
 */
export async function closePosition(
  positionId: string,
  exitPrice: number,
  exitTime: Date
): Promise<number> {
  // Get position
  const position = await db
    .select()
    .from(positions)
    .where(eq(positions.id, positionId))
    .limit(1);

  if (!position || position.length === 0) {
    throw new Error("Position not found");
  }

  const pos = position[0];

  // Calculate realized P&L
  const realizedPnL = calculateTradePnL(
    pos.direction as "YES" | "NO",
    pos.entryPrice,
    exitPrice,
    pos.amountUsdc
  );

  // Update position
  await db
    .update(positions)
    .set({
      status: "closed",
      currentPrice: exitPrice,
      unrealizedPnl: 0,
      closedAt: exitTime,
      updatedAt: new Date(),
    })
    .where(eq(positions.id, positionId));

  // Update linked trade
  if (pos.tradeId) {
    await db
      .update(trades)
      .set({
        status: "filled",
        exitPrice,
        realizedPnl: realizedPnL,
        closedAt: exitTime,
      })
      .where(eq(trades.id, pos.tradeId));
  }

  console.log(
    `🔒 Position closed: ${pos.question} - P&L: $${realizedPnL.toFixed(2)}`
  );

  return realizedPnL;
}
