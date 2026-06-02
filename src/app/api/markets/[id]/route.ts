import type { NextRequest } from "next/server";
import { db } from "@/db/client";
import { markets } from "@/db/schema";
import { eq } from "drizzle-orm";
import { fetchOrderbook } from "@/lib/polymarket";
import type { Market } from "@/lib/polymarket";

// GET /api/markets/[id]
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    // Fetch market from database
    const rows = await db
      .select()
      .from(markets)
      .where(eq(markets.conditionId, id))
      .limit(1);

    if (rows.length === 0) {
      return Response.json({ error: "Market not found" }, { status: 404 });
    }

    const row = rows[0];

    // Convert database row to Market format
    const market: Market = {
      conditionId: row.conditionId,
      question: row.question,
      description: row.description,
      slug: row.slug,
      endDate: row.endDate?.toISOString() ?? "",
      category: row.category,
      tags: Array.isArray(row.tags) ? row.tags as string[] : [],
      icon: row.icon ?? undefined,
      image: row.image ?? undefined,
      yesPrice: row.yesPrice,
      noPrice: row.noPrice,
      volume: row.volume,
      volume24h: row.volume24h,
      liquidity: row.liquidity,
      lastTradePrice: row.lastTradePrice,
      active: row.active,
      closed: row.closed,
      featured: row.featured,
      new: row.new,
      yesTokenId: row.yesTokenId,
      noTokenId: row.noTokenId,
      groupItemTitle: row.groupItemTitle ?? undefined,
      groupItemThreshold: row.groupItemThreshold ?? undefined,
      eventId: row.eventId ?? undefined,
      eventTitle: row.eventTitle ?? undefined,
      eventSlug: row.eventSlug ?? undefined,
    };

    // Fetch orderbook for YES token if available
    let orderbook = null;
    if (market.yesTokenId) {
      try {
        orderbook = await fetchOrderbook(market.yesTokenId);
      } catch (error) {
        console.warn(`[GET /api/markets/${id}] Orderbook fetch failed:`, error);
        // Continue without orderbook
      }
    }

    return Response.json({ market, orderbook });
  } catch (error) {
    console.error("[GET /api/markets/[id]]", error);
    return Response.json({ error: "Market not found" }, { status: 404 });
  }
}
