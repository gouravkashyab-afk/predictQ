import { NextRequest } from "next/server";
import { getIronSession } from "iron-session";
import { cookies } from "next/headers";
import { sessionOptions, type SiweSessionData } from "@/lib/session";
import { db } from "@/db/client";
import { agents } from "@/db/schema";
import { eq } from "drizzle-orm";
import { randomUUID } from "crypto";

// GET /api/agents — list current user's agents
export async function GET() {
  try {
    const cookieStore = await cookies();
    const session = await getIronSession<SiweSessionData>(cookieStore, sessionOptions);
    if (!session.address) return Response.json({ error: "Unauthorized" }, { status: 401 });

    const userAgents = await db
      .select()
      .from(agents)
      .where(eq(agents.userId, session.address.toLowerCase()))
      .orderBy(agents.createdAt);

    return Response.json({ agents: userAgents });
  } catch (error) {
    console.error("[GET /api/agents]", error);
    return Response.json({ error: "Failed to fetch agents" }, { status: 500 });
  }
}

// POST /api/agents — create a new agent
export async function POST(request: NextRequest) {
  try {
    const cookieStore = await cookies();
    const session = await getIronSession<SiweSessionData>(cookieStore, sessionOptions);
    if (!session.address) return Response.json({ error: "Unauthorized" }, { status: 401 });

    const { name, strategy, config } = await request.json();

    const VALID_STRATEGIES = ["signal_follower", "whale_tracker", "contrarian"];
    if (!name || !strategy || !VALID_STRATEGIES.includes(strategy)) {
      return Response.json({ error: "Invalid agent config" }, { status: 400 });
    }

    // Limit to 5 agents per user
    const existing = await db
      .select()
      .from(agents)
      .where(eq(agents.userId, session.address.toLowerCase()));

    if (existing.length >= 5) {
      return Response.json({ error: "Max 5 agents per account" }, { status: 429 });
    }

    const agent = await db.insert(agents).values({
      id: randomUUID(),
      userId: session.address.toLowerCase(),
      name,
      strategy,
      status: "stopped",
      config: config ?? {
        maxPositionSize: 50,
        minConfidence: 70,
        maxMarketsPerRun: 3,
        riskLevel: "medium",
      },
    }).returning();

    return Response.json({ ok: true, agent: agent[0] }, { status: 201 });
  } catch (error) {
    console.error("[POST /api/agents]", error);
    return Response.json({ error: "Failed to create agent" }, { status: 500 });
  }
}
