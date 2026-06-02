import type { NextRequest } from "next/server";
import { db } from "@/db/client";
import { markets } from "@/db/schema";
import { desc, asc, and, eq, ilike, or } from "drizzle-orm";
import type { Market } from "@/lib/polymarket";

// Cache for 10 seconds to reduce database load
export const revalidate = 10;

// GET /api/markets
// Query params: offset, limit, active, closed, order, ascending, search
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = request.nextUrl;

    const offset = Number(searchParams.get("offset") || "0");
    const limit = Math.min(Number(searchParams.get("limit") || "50"), 100);
    const active = searchParams.get("active") !== "false"; // default true
    const closed = searchParams.get("closed") === "true"; // default false
    const order = searchParams.get("order") || "volumeNum";
    const ascending = searchParams.get("ascending") === "true";
    const search = searchParams.get("search")?.toLowerCase() || "";

    // Build query conditions
    const conditions = [];
    if (active !== undefined) conditions.push(eq(markets.active, active));
    if (closed !== undefined) conditions.push(eq(markets.closed, closed));
    if (search) {
      conditions.push(
        or(
          ilike(markets.question, `%${search}%`),
          ilike(markets.category, `%${search}%`)
        )
      );
    }

    // Determine sort order
    let orderBy;
    switch (order) {
      case "volumeNum":
        orderBy = ascending ? asc(markets.volume) : desc(markets.volume);
        break;
      case "volume24h":
        orderBy = ascending ? asc(markets.volume24h) : desc(markets.volume24h);
        break;
      case "liquidityNum":
        orderBy = ascending ? asc(markets.liquidity) : desc(markets.liquidity);
        break;
      case "endDateIso":
        orderBy = ascending ? asc(markets.endDate) : desc(markets.endDate);
        break;
      default:
        orderBy = desc(markets.volume);
    }

    // Query database
    const rows = await db
      .select()
      .from(markets)
      .where(conditions.length > 0 ? and(...conditions) : undefined)
      .orderBy(orderBy)
      .limit(limit)
      .offset(offset);

    // Convert database rows to Market format
    const marketsList: Market[] = rows.map(row => ({
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
    }));

    return Response.json({
      markets: marketsList,
      offset,
      limit,
      count: marketsList.length,
      hasMore: marketsList.length === limit,
    });
  } catch (error) {
    console.error("[GET /api/markets]", error);
    return Response.json({ error: "Failed to fetch markets" }, { status: 500 });
  }
}
