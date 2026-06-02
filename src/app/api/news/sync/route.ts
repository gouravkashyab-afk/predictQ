import { NextRequest } from "next/server";
import {
  fetchTopHeadlines,
  normalizeArticle,
  scoreRelevance,
} from "@/lib/news";
import { fetchMarkets, normalizeMarkets } from "@/lib/polymarket";
import { db } from "@/db/client";
import { newsArticles, newsMarketMap } from "@/db/schema";
import { randomUUID } from "crypto";

// POST /api/news/sync
// Fetches latest headlines, runs NLP matcher, persists to DB.
export async function POST(request: NextRequest) {
  const authHeader = request.headers.get("x-sync-secret");
  if (
    process.env.SYNC_SECRET &&
    authHeader !== process.env.SYNC_SECRET
  ) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    // 1. Fetch raw articles
    const rawArticles = await fetchTopHeadlines(30);

    // 2. Fetch top markets for matching
    const marketsRaw = await fetchMarkets({ limit: 50, closed: false });
    const markets = normalizeMarkets(marketsRaw);

    let articlesSaved = 0;
    let mappingsSaved = 0;

    for (const raw of rawArticles) {
      if (!raw.url || !raw.title) continue;

      const id = randomUUID();
      const article = normalizeArticle(raw, id);

      // Upsert article (skip if URL already exists)
      try {
        await db.insert(newsArticles).values({
          id: article.id,
          title: article.title,
          description: article.description,
          url: article.url,
          source: article.source,
          imageUrl: article.imageUrl ?? null,
          publishedAt: new Date(article.publishedAt),
          sentiment: article.sentiment,
          keywords: article.keywords,
        }).onConflictDoNothing();
        articlesSaved++;
      } catch {
        continue; // skip duplicates
      }

      // Score against each market and save high-relevance matches
      for (const market of markets) {
        const score = scoreRelevance(article.keywords, market.question);
        if (score < 20) continue; // relevance threshold

        try {
          await db.insert(newsMarketMap).values({
            id: randomUUID(),
            articleId: article.id,
            conditionId: market.conditionId,
            relevanceScore: score,
          }).onConflictDoNothing();
          mappingsSaved++;
        } catch {
          // skip on conflict
        }
      }
    }

    return Response.json({ ok: true, articlesSaved, mappingsSaved });
  } catch (error) {
    console.error("[POST /api/news/sync]", error);
    return Response.json({ error: "News sync failed" }, { status: 500 });
  }
}
