import { NextRequest } from "next/server";
import { db } from "@/db/client";
import { markets, signals } from "@/db/schema";
import { eq, desc, gte } from "drizzle-orm";
import { getIronSession } from "iron-session";
import { cookies } from "next/headers";
import { sessionOptions, type SiweSessionData } from "@/lib/session";

/**
 * MCP (Model Context Protocol) JSON-RPC 2.0 endpoint.
 * Allows AI systems to interact with PredictIQ data programmatically.
 *
 * Tools:
 *  - get_markets          — list active prediction markets
 *  - get_signal           — get AI signal for a specific market
 *  - get_portfolio        — return portfolio stats (requires auth)
 *  - get_top_signals      — return top confidence signals
 */

interface JsonRpcRequest {
  jsonrpc: "2.0";
  id: string | number;
  method: string;
  params?: Record<string, unknown>;
}

function ok(id: string | number, result: unknown) {
  return Response.json({ jsonrpc: "2.0", id, result });
}

function err(id: string | number, code: number, message: string) {
  return Response.json({ jsonrpc: "2.0", id, error: { code, message } });
}

// Tool: get_markets
async function getMarkets(params: Record<string, unknown>) {
  const limit = Math.min(Number(params?.limit ?? 20), 50);
  const category = params?.category as string | undefined;

  const query = db.select().from(markets);
  const rows = await db.select().from(markets)
    .orderBy(desc(markets.volume))
    .limit(limit);

  const filtered = category
    ? rows.filter((m) => m.category.toLowerCase() === category.toLowerCase())
    : rows;

  return {
    markets: filtered.map((m) => ({
      conditionId: m.conditionId,
      question: m.question,
      category: m.category,
      yesPrice: m.yesPrice,
      noPrice: m.noPrice,
      volume: m.volume,
      liquidity: m.liquidity,
      endDate: m.endDate,
    })),
    total: filtered.length,
  };
}

// Tool: get_signal
async function getSignal(params: Record<string, unknown>) {
  const conditionId = params?.conditionId as string;
  if (!conditionId) throw new Error("conditionId is required");

  const signal = await db.query.signals.findFirst({
    where: eq(signals.conditionId, conditionId),
    orderBy: [desc(signals.createdAt)],
  });

  if (!signal) return { signal: null, message: "No signal found for this market" };

  return {
    signal: {
      direction: signal.direction,
      confidence: signal.confidence,
      reasoning: signal.reasoning,
      model: signal.model,
      yesPrice: signal.yesPrice,
      noPrice: signal.noPrice,
      createdAt: signal.createdAt,
    },
  };
}

// Tool: get_top_signals
async function getTopSignals(params: Record<string, unknown>) {
  const limit = Math.min(Number(params?.limit ?? 10), 20);
  const minConfidence = Number(params?.minConfidence ?? 60);
  const cutoff = new Date(Date.now() - 24 * 60 * 60 * 1000);

  const topSignals = await db
    .select()
    .from(signals)
    .where(gte(signals.createdAt, cutoff))
    .orderBy(desc(signals.confidence))
    .limit(limit);

  return {
    signals: topSignals
      .filter((s) => s.confidence >= minConfidence)
      .map((s) => ({
        conditionId: s.conditionId,
        question: s.question,
        direction: s.direction,
        confidence: s.confidence,
        category: s.category,
        yesPrice: s.yesPrice,
        noPrice: s.noPrice,
      })),
  };
}

// Tool: get_portfolio (requires auth)
async function getPortfolio() {
  const cookieStore = await cookies();
  const session = await getIronSession<SiweSessionData>(cookieStore, sessionOptions);
  if (!session.address) throw new Error("Authentication required");

  // Re-use portfolio API logic
  const res = await fetch(
    `${process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000"}/api/portfolio`,
    { headers: { cookie: `siwe=${cookieStore.get("siwe")?.value}` } }
  );
  return await res.json();
}

// ── Main handler ──────────────────────────────────────────────────────────────
export async function POST(request: NextRequest) {
  let body: JsonRpcRequest;

  try {
    body = await request.json();
  } catch {
    return err(0, -32700, "Parse error");
  }

  if (body.jsonrpc !== "2.0" || !body.method) {
    return err(body.id ?? 0, -32600, "Invalid Request");
  }

  const params = body.params ?? {};

  try {
    switch (body.method) {
      case "get_markets":
        return ok(body.id, await getMarkets(params));
      case "get_signal":
        return ok(body.id, await getSignal(params));
      case "get_top_signals":
        return ok(body.id, await getTopSignals(params));
      case "get_portfolio":
        return ok(body.id, await getPortfolio());
      default:
        return err(body.id, -32601, `Method not found: ${body.method}`);
    }
  } catch (e: unknown) {
    return err(body.id, -32603, e instanceof Error ? e.message : "Internal error");
  }
}

// GET returns tool manifest
export async function GET() {
  return Response.json({
    name: "PredictIQ MCP",
    version: "1.0.0",
    description: "AI-powered prediction market intelligence server",
    tools: [
      {
        name: "get_markets",
        description: "List active prediction markets, optionally filtered by category",
        parameters: {
          limit: { type: "number", description: "Max results (default 20, max 50)" },
          category: { type: "string", description: "Filter by category" },
        },
      },
      {
        name: "get_signal",
        description: "Get the latest AI signal for a specific market",
        parameters: {
          conditionId: { type: "string", required: true, description: "Market condition ID" },
        },
      },
      {
        name: "get_top_signals",
        description: "Get top confidence AI signals from the last 24 hours",
        parameters: {
          limit: { type: "number", description: "Max results (default 10)" },
          minConfidence: { type: "number", description: "Min confidence 0-100 (default 60)" },
        },
      },
      {
        name: "get_portfolio",
        description: "Get authenticated user's portfolio summary (requires SIWE session)",
        parameters: {},
      },
    ],
  });
}
