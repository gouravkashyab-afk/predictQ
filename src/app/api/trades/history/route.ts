import { getIronSession } from "iron-session";
import { cookies } from "next/headers";
import { sessionOptions, type SiweSessionData } from "@/lib/session";
import { db } from "@/db/client";
import { trades } from "@/db/schema";
import { eq, desc } from "drizzle-orm";

// GET /api/trades/history
// Returns the authenticated user's trade history.
export async function GET() {
  try {
    const cookieStore = await cookies();
    const session = await getIronSession<SiweSessionData>(cookieStore, sessionOptions);

    if (!session.address) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userId = session.address.toLowerCase();

    const history = await db
      .select()
      .from(trades)
      .where(eq(trades.userId, userId))
      .orderBy(desc(trades.createdAt))
      .limit(100);

    // Compute summary stats
    const filled = history.filter((t) => t.status === "filled");
    const totalInvested = filled.reduce((s, t) => s + t.amountUsdc, 0);
    const totalPayout = filled.reduce((s, t) => s + t.potentialPayout, 0);

    return Response.json({
      trades: history,
      stats: {
        totalTrades: history.length,
        filledTrades: filled.length,
        totalInvested,
        totalPayout,
        unrealizedPnl: totalPayout - totalInvested,
      },
    });
  } catch (error) {
    console.error("[GET /api/trades/history]", error);
    return Response.json({ error: "Failed to fetch trade history" }, { status: 500 });
  }
}
