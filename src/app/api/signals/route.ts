import { NextRequest } from "next/server";
import { db } from "@/db/client";
import { signals } from "@/db/schema";
import { cached } from "@/lib/redis";
import { desc, eq, gte, and } from "drizzle-orm";
import { generateSignals } from "@/lib/signals";
import { randomUUID } from "crypto";

// GET /api/signals
// Returns latest AI signals. Generates fresh ones if DB is empty.
// Query params: limit, direction (YES|NO), minConfidence (0-100)
export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;
  const limit = Math.min(Number(searchParams.get("limit") || "20"), 50);
  const direction = searchParams.get("direction")?.toUpperCase() || null;
  const minConfidence = Number(searchParams.get("minConfidence") || "0");

  const cacheKey = `signals:${limit}:${direction}:${minConfidence}`;

  try {
    const data = await cached(cacheKey, 60 * 5, async () => {
      // Build query conditions
      const conditions = [];
      if (direction === "YES" || direction === "NO") {
        conditions.push(eq(signals.direction, direction));
      }
      if (minConfidence > 0) {
        conditions.push(gte(signals.confidence, minConfidence));
      }

      const rows = await db
        .select()
        .from(signals)
        .where(conditions.length > 0 ? and(...conditions) : undefined)
        .orderBy(desc(signals.createdAt))
        .limit(limit);

      // If DB is empty, generate fresh signals on-demand
      if (rows.length === 0) {
        const fresh = await generateSignals(10);
        const inserted = [];
        for (const signal of fresh) {
          const id = randomUUID();
          await db.insert(signals).values({
            id,
            conditionId: signal.conditionId,
            question: signal.question,
            direction: signal.direction,
            confidence: signal.confidence,
            reasoning: signal.reasoning,
            model: signal.model,
            yesPrice: signal.yesPrice,
            noPrice: signal.noPrice,
            volume: signal.volume,
            category: signal.category,
          });
          inserted.push({ id, ...signal, createdAt: new Date().toISOString() });
        }
        return inserted;
      }

      return rows;
    });

    return Response.json({ signals: data, count: data.length });
  } catch (error) {
    console.error("[GET /api/signals]", error);
    return Response.json({ error: "Failed to fetch signals" }, { status: 500 });
  }
}
