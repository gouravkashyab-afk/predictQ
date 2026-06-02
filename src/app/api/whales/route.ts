import { NextRequest } from "next/server";
import { db } from "@/db/client";
import { whaleEvents } from "@/db/schema";
import { cached } from "@/lib/redis";
import { desc, gte, and } from "drizzle-orm";
import { fetchWhaleEvents } from "@/lib/whale";

// GET /api/whales
// Returns recent whale events. Auto-fetches if DB is empty.
// Query params: limit, minAmount, direction (IN|OUT)
export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;
  const limit = Math.min(Number(searchParams.get("limit") || "20"), 50);
  const minAmount = Number(searchParams.get("minAmount") || "0");
  const direction = searchParams.get("direction")?.toUpperCase() || null;

  const cacheKey = `whales:${limit}:${minAmount}:${direction}`;

  try {
    const data = await cached(cacheKey, 60, async () => {
      const conditions = [];
      if (minAmount > 0) conditions.push(gte(whaleEvents.amountUsd, minAmount));

      const rows = await db
        .select()
        .from(whaleEvents)
        .where(conditions.length > 0 ? and(...conditions) : undefined)
        .orderBy(desc(whaleEvents.timestamp))
        .limit(limit);

      // Filter direction client-side (avoids complex type handling)
      const filtered =
        direction === "IN" || direction === "OUT"
          ? rows.filter((r) => r.direction === direction)
          : rows;

      // If empty, fall back to live fetch
      if (filtered.length === 0) {
        const live = await fetchWhaleEvents();
        return direction === "IN" || direction === "OUT"
          ? live.filter((e) => e.direction === direction)
          : live;
      }

      return filtered;
    });

    // Compute 24h stats
    const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
    const recent = Array.isArray(data)
      ? data.filter((e: { timestamp: string | Date }) =>
          new Date(e.timestamp) >= new Date(oneDayAgo)
        )
      : [];

    const volume24h = recent.reduce(
      (sum: number, e: { amountUsd: number }) => sum + e.amountUsd,
      0
    );
    const biggestTrade = recent.reduce(
      (max: number, e: { amountUsd: number }) => Math.max(max, e.amountUsd),
      0
    );

    return Response.json({
      events: data,
      count: Array.isArray(data) ? data.length : 0,
      stats: {
        volume24h,
        biggestTrade,
        eventCount24h: recent.length,
      },
    });
  } catch (error) {
    console.error("[GET /api/whales]", error);
    return Response.json({ error: "Failed to fetch whale events" }, { status: 500 });
  }
}
