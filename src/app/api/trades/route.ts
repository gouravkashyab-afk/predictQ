import { NextRequest } from "next/server";
import { getIronSession } from "iron-session";
import { cookies } from "next/headers";
import { sessionOptions, type SiweSessionData } from "@/lib/session";
import { db } from "@/db/client";
import { trades } from "@/db/schema";
import { randomUUID } from "crypto";

// POST /api/trades
// Records a completed/submitted trade in the DB.
// The EIP-712 signing and CLOB submission happen client-side via TradePanel.
export async function POST(request: NextRequest) {
  try {
    const cookieStore = await cookies();
    const session = await getIronSession<SiweSessionData>(cookieStore, sessionOptions);

    if (!session.address) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userId = session.address.toLowerCase();
    const body = await request.json();

    const {
      conditionId,
      question,
      tokenId,
      direction,
      amountUsdc,
      pricePerShare,
      shares,
      potentialPayout,
      orderHash,
      txHash,
      agentId,
    } = body;

    if (!conditionId || !direction || !amountUsdc || !pricePerShare) {
      return Response.json({ error: "Missing required fields" }, { status: 400 });
    }

    const trade = await db
      .insert(trades)
      .values({
        id: randomUUID(),
        userId,
        conditionId,
        question: question || "",
        tokenId: tokenId || "",
        direction,
        amountUsdc: Number(amountUsdc),
        pricePerShare: Number(pricePerShare),
        shares: Number(shares || amountUsdc / pricePerShare),
        potentialPayout: Number(potentialPayout || amountUsdc / pricePerShare),
        status: orderHash ? "filled" : "pending",
        orderHash: orderHash || null,
        txHash: txHash || null,
        agentId: agentId || null,
        filledAt: orderHash ? new Date() : null,
      })
      .returning();

    return Response.json({ ok: true, trade: trade[0] });
  } catch (error) {
    console.error("[POST /api/trades]", error);
    return Response.json({ error: "Failed to record trade" }, { status: 500 });
  }
}
