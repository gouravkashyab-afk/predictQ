import { fetchMarkets, normalizeMarkets } from "@/lib/polymarket";
import { db } from "@/db/client";
import { markets } from "@/db/schema";
import { sql } from "drizzle-orm";
import { NextRequest } from "next/server";

// POST /api/markets/sync — syncs top markets from Polymarket into NeonDB
export async function POST(request: NextRequest) {
  // Simple auth: require a secret header to prevent abuse
  const authHeader = request.headers.get("x-sync-secret");
  if (
    process.env.SYNC_SECRET &&
    authHeader !== process.env.SYNC_SECRET
  ) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    let totalSynced = 0;
    const limit = 50;
    const maxPages = 4; // Sync up to 200 markets (50 * 4)

    // Paginate through Polymarket using offset-based pagination
    for (let page = 0; page < maxPages; page++) {
      const offset = page * limit;
      
      const response = await fetchMarkets({
        limit,
        offset,
        closed: false,
        order: "volumeNum",
        ascending: false,
      });

      if (!response || response.length === 0) break;

      const normalized = normalizeMarkets(response);

      // Upsert all markets into NeonDB
      for (const market of normalized) {
        await db
          .insert(markets)
          .values({
            conditionId: market.conditionId,
            question: market.question,
            description: market.description,
            slug: market.slug,
            endDate: market.endDate ? new Date(market.endDate) : null,
            category: market.category,
            tags: market.tags,
            icon: market.icon,
            image: market.image,
            yesTokenId: market.yesTokenId,
            noTokenId: market.noTokenId,
            yesPrice: market.yesPrice,
            noPrice: market.noPrice,
            volume: market.volume,
            volume24h: market.volume24h,
            liquidity: market.liquidity,
            lastTradePrice: market.lastTradePrice,
            active: market.active,
            closed: market.closed,
            featured: market.featured,
            new: market.new,
            groupItemTitle: market.groupItemTitle,
            groupItemThreshold: market.groupItemThreshold,
            eventId: market.eventId,
            eventTitle: market.eventTitle,
            eventSlug: market.eventSlug,
            syncedAt: new Date(),
          })
          .onConflictDoUpdate({
            target: markets.conditionId,
            set: {
              yesPrice: sql`excluded.yes_price`,
              noPrice: sql`excluded.no_price`,
              volume: sql`excluded.volume`,
              volume24h: sql`excluded.volume_24h`,
              liquidity: sql`excluded.liquidity`,
              lastTradePrice: sql`excluded.last_trade_price`,
              active: sql`excluded.active`,
              closed: sql`excluded.closed`,
              new: sql`excluded.new`,
              groupItemTitle: sql`excluded.group_item_title`,
              groupItemThreshold: sql`excluded.group_item_threshold`,
              eventId: sql`excluded.event_id`,
              eventTitle: sql`excluded.event_title`,
              eventSlug: sql`excluded.event_slug`,
              syncedAt: sql`now()`,
            },
          });
        totalSynced++;
      }

      // If we got fewer results than the limit, we've reached the end
      if (response.length < limit) break;
    }

    return Response.json({ ok: true, synced: totalSynced });
  } catch (error) {
    console.error("[POST /api/markets/sync]", error);
    return Response.json({ error: "Sync failed" }, { status: 500 });
  }
}
