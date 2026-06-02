import { NextRequest } from "next/server";
import { runAllActiveAgents } from "@/lib/agent-engine";

// GET /api/cron
// Master cron handler — runs all sync jobs sequentially.
// Protected by CRON_SECRET env var.
// Configure in vercel.json:
//   { "crons": [{ "path": "/api/cron", "schedule": "*/30 * * * *" }] }
export async function GET(request: NextRequest) {
  const authHeader =
    request.headers.get("authorization") ||
    request.headers.get("x-cron-secret");
  const expected = process.env.CRON_SECRET;

  if (expected && authHeader !== `Bearer ${expected}` && authHeader !== expected) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const secret = process.env.SYNC_SECRET ?? "";
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
  const headers = {
    "Content-Type": "application/json",
    "x-sync-secret": secret,
  };

  const results: Record<string, unknown> = {};
  const errors: Record<string, string> = {};

  // 1. Market sync
  try {
    const res = await fetch(`${baseUrl}/api/markets/sync`, {
      method: "POST",
      headers,
    });
    results.markets = await res.json();
  } catch (e) {
    errors.markets = String(e);
  }

  // 2. News sync
  try {
    const res = await fetch(`${baseUrl}/api/news/sync`, {
      method: "POST",
      headers,
    });
    results.news = await res.json();
  } catch (e) {
    errors.news = String(e);
  }

  // 3. Whale sync
  try {
    const res = await fetch(`${baseUrl}/api/whales/sync`, {
      method: "POST",
      headers,
    });
    results.whales = await res.json();
  } catch (e) {
    errors.whales = String(e);
  }

  // 4. Signal generation
  try {
    const res = await fetch(`${baseUrl}/api/signals/generate`, {
      method: "POST",
      headers,
    });
    results.signals = await res.json();
  } catch (e) {
    errors.signals = String(e);
  }

  // 5. Run active agents
  try {
    const agentResults = await runAllActiveAgents();
    results.agents = agentResults;
  } catch (e) {
    errors.agents = String(e);
  }

  return Response.json({
    ok: Object.keys(errors).length === 0,
    timestamp: new Date().toISOString(),
    results,
    errors: Object.keys(errors).length > 0 ? errors : undefined,
  });
}
