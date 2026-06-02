import { NextRequest } from "next/server";
import { getIronSession } from "iron-session";
import { cookies } from "next/headers";
import { sessionOptions, type SiweSessionData } from "@/lib/session";
import { db } from "@/db/client";
import { agents, agentLogs } from "@/db/schema";
import { eq, and, desc } from "drizzle-orm";

// GET /api/agents/[id]/logs — return recent agent logs
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const cookieStore = await cookies();
    const session = await getIronSession<SiweSessionData>(cookieStore, sessionOptions);
    if (!session.address) return Response.json({ error: "Unauthorized" }, { status: 401 });

    const { id } = await params;

    // Verify ownership
    const agent = await db.query.agents.findFirst({
      where: and(
        eq(agents.id, id),
        eq(agents.userId, session.address.toLowerCase())
      ),
    });

    if (!agent) return Response.json({ error: "Agent not found" }, { status: 404 });

    const logs = await db
      .select()
      .from(agentLogs)
      .where(eq(agentLogs.agentId, id))
      .orderBy(desc(agentLogs.createdAt))
      .limit(100);

    return Response.json({ logs });
  } catch (error) {
    console.error("[GET /api/agents/[id]/logs]", error);
    return Response.json({ error: "Failed to fetch logs" }, { status: 500 });
  }
}
