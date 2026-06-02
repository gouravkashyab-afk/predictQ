import { NextRequest } from "next/server";
import { db } from "@/db/client";
import { newsArticles, newsMarketMap } from "@/db/schema";
import { cached } from "@/lib/redis";
import { desc, eq } from "drizzle-orm";
import {
  fetchTopHeadlines,
  normalizeArticle,
  scoreRelevance,
} from "@/lib/news";
import { fetchMarkets, normalizeMarkets } from "@/lib/polymarket";
import { randomUUID } from "crypto";

// GET /api/news
// Returns news articles, optionally filtered by marketId.
// Falls back to live NewsAPI fetch if DB is empty.
export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;
  const limit = Math.min(Number(searchParams.get("limit") || "20"), 50);
  const marketId = searchParams.get("marketId") || null;
  const sentiment = searchParams.get("sentiment") || null;

  const cacheKey = `news:${limit}:${marketId}:${sentiment}`;

  try {
    const data = await cached(cacheKey, 60 * 5, async () => {
      let rows = await db
        .select()
        .from(newsArticles)
        .orderBy(desc(newsArticles.publishedAt))
        .limit(limit);

      // Filter by sentiment if provided
      if (sentiment && ["positive", "negative", "neutral"].includes(sentiment)) {
        rows = rows.filter((r) => r.sentiment === sentiment);
      }

      // If DB is empty, fetch live and return without persisting
      if (rows.length === 0) {
        const raw = await fetchTopHeadlines(limit);
        const marketsRaw = await fetchMarkets({ limit: 30, closed: false });
        const markets = normalizeMarkets(marketsRaw);

        return raw.map((r, i) => {
          const article = normalizeArticle(r, `live-${i}`);
          const relatedMarkets = markets
            .map((m) => ({
              conditionId: m.conditionId,
              question: m.question,
              score: scoreRelevance(article.keywords, m.question),
            }))
            .filter((m) => m.score > 15)
            .sort((a, b) => b.score - a.score)
            .slice(0, 3);
          return { ...article, relatedMarkets };
        });
      }

      return rows;
    });

    return Response.json({ articles: data, count: data.length });
  } catch (error) {
    console.error("[GET /api/news]", error);
    return Response.json({ error: "Failed to fetch news" }, { status: 500 });
  }
}
