import type { NextRequest } from "next/server";
import { fetchPriceHistory } from "@/lib/polymarket";
import { cached } from "@/lib/redis";

// GET /api/markets/[id]/history?interval=1w&tokenId=xxx
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: _id } = await params;
    const { searchParams } = request.nextUrl;
    const tokenId = searchParams.get("tokenId");
    const interval =
      (searchParams.get("interval") as "1m" | "1h" | "1d" | "1w" | "all") ||
      "1w";

    if (!tokenId) {
      return Response.json({ error: "tokenId required" }, { status: 400 });
    }

    const ttl = interval === "1m" ? 60 : interval === "1h" ? 300 : 900;
    const history = await cached(
      `history:${tokenId}:${interval}`,
      ttl,
      () => fetchPriceHistory(tokenId, interval)
    );

    return Response.json({ history });
  } catch (error) {
    console.error("[GET /api/markets/[id]/history]", error);
    return Response.json({ error: "Failed to fetch history" }, { status: 500 });
  }
}
