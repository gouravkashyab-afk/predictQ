import { NextRequest } from "next/server";
import { fetchWhaleEvents } from "@/lib/whale";
import { db } from "@/db/client";
import { whaleEvents } from "@/db/schema";
import { randomUUID } from "crypto";

// POST /api/whales/sync
// Fetches recent whale events from Alchemy and persists to DB.
export async function POST(request: NextRequest) {
  const authHeader = request.headers.get("x-sync-secret");
  if (
    process.env.SYNC_SECRET &&
    authHeader !== process.env.SYNC_SECRET
  ) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const events = await fetchWhaleEvents();
    let saved = 0;

    for (const event of events) {
      try {
        await db.insert(whaleEvents).values({
          id: event.id.startsWith("mock-") ? randomUUID() : event.id,
          txHash: event.txHash,
          wallet: event.wallet,
          amountUsd: event.amountUsd,
          direction: event.direction,
          token: event.token,
          contractAddress: event.contractAddress,
          blockNumber: event.blockNumber,
          network: event.network,
          timestamp: new Date(event.timestamp),
        }).onConflictDoNothing();
        saved++;
      } catch {
        // skip duplicates
      }
    }

    return Response.json({ ok: true, saved, total: events.length });
  } catch (error) {
    console.error("[POST /api/whales/sync]", error);
    return Response.json({ error: "Whale sync failed" }, { status: 500 });
  }
}
