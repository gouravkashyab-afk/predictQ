/**
 * GET /api/wallet/balance
 * Get user's USDC balance on Polygon
 */

import { NextRequest, NextResponse } from "next/server";
import { getUserBalance } from "@/lib/wallet-manager";

export async function GET(req: NextRequest) {
  try {
    const userId = req.headers.get("x-user-id");

    if (!userId) {
      return NextResponse.json(
        { error: "User ID required" },
        { status: 401 }
      );
    }

    const balance = await getUserBalance(userId);

    return NextResponse.json({
      balance,
      currency: "USDC",
      network: "Polygon",
    });
  } catch (error) {
    console.error("Error fetching balance:", error);
    return NextResponse.json(
      { error: "Failed to fetch balance" },
      { status: 500 }
    );
  }
}
