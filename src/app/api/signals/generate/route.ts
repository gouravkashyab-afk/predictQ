import { NextRequest } from "next/server";
import { generateSignals } from "@/lib/signals";
import { db } from "@/db/client";
import { signals } from "@/db/schema";
import { cached } from "@/lib/redis";
import { randomUUID } from "crypto";

// POST /api/signals/generate
// Protected by x-sync-secret header. Generates AI signals and persists to DB.
export async function POST(request: NextRequest) {
  const authHeader = request.headers.get("x-sync-secret");
  if (
    process.env.SYNC_SECRET &&
    authHeader !== process.env.SYNC_SECRET
  ) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const results = await generateSignals(10);

    // Persist to DB
    const inserted = [];
    for (const signal of results) {
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
      inserted.push({ id, ...signal });
    }

    // Invalidate cache
    // (next GET will repopulate)
    return Response.json({ ok: true, generated: inserted.length, signals: inserted });
  } catch (error) {
    console.error("[POST /api/signals/generate]", error);
    return Response.json({ error: "Signal generation failed" }, { status: 500 });
  }
}
