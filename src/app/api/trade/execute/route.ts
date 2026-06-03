/**
 * POST /api/trade/execute
 * Execute a manual trade (not from agent)
 */

import { NextRequest, NextResponse } from "next/server";
import { createAndSignOrder, submitOrder } from "@/lib/polymarket-client";
import { getUserWalletKey } from "@/lib/wallet-manager";
import { db } from "@/db/client";
import { trades } from "@/db/schema";
import { randomUUID } from "crypto";

export async function POST(req: NextRequest) {
  try {
    const userId = req.headers.get("x-user-id");

    if (!userId) {
      return NextResponse.json(
        { error: "User ID required" },
        { status: 401 }
      );
    }

    const body = await req.json();
    const { conditionId, question, tokenId, direction, price, size } = body;

    // Validate inputs
    if (!conditionId || !question || !tokenId || !direction || !price || !size) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    if (direction !== "YES" && direction !== "NO") {
      return NextResponse.json(
        { error: "Direction must be YES or NO" },
        { status: 400 }
      );
    }

    if (price < 0.01 || price > 0.99) {
      return NextResponse.json(
        { error: "Price must be between 0.01 and 0.99" },
        { status: 400 }
      );
    }

    if (size < 1) {
      return NextResponse.json(
        { error: "Size must be at least $1" },
        { status: 400 }
      );
    }

    // Get user's wallet key
    const privateKey = await getUserWalletKey(userId);
    if (!privateKey) {
      return NextResponse.json(
        { error: "Could not access wallet" },
        { status: 500 }
      );
    }

    // Create and sign order
    const signedOrder = await createAndSignOrder(
      {
        tokenId,
        price,
        size,
        side: "BUY",
      },
      privateKey
    );

    // Submit to Polymarket
    const result = await submitOrder(signedOrder);

    if (!result.success) {
      return NextResponse.json(
        { error: result.error || "Order submission failed" },
        { status: 500 }
      );
    }

    // Store in database
    const tradeId = randomUUID();
    const shares = size / price;
    const potentialPayout = size / price;

    await db.insert(trades).values({
      id: tradeId,
      userId,
      conditionId,
      question,
      tokenId,
      direction,
      amountUsdc: size,
      pricePerShare: price,
      shares,
      potentialPayout,
      status: "pending",
      orderHash: result.orderID,
      createdAt: new Date(),
    });

    return NextResponse.json({
      success: true,
      tradeId,
      orderHash: result.orderID,
      message: "Trade submitted successfully",
    });
  } catch (error) {
    console.error("Error executing trade:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Internal server error" },
      { status: 500 }
    );
  }
}
