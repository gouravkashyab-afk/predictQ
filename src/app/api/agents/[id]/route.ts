import { NextRequest } from "next/server";
import { getIronSession } from "iron-session";
import { cookies } from "next/headers";
import { sessionOptions, type SiweSessionData } from "@/lib/session";
import { db } from "@/db/client";
import { agents } from "@/db/schema";
import { eq, and } from "drizzle-orm";

// PATCH /api/agents/[id] — update status (start/pause/stop) or config
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const cookieStore = await cookies();
    const session = await getIronSession<SiweSessionData>(cookieStore, sessionOptions);
    if (!session.address) return Response.json({ error: "Unauthorized" }, { status: 401 });

    const { id } = await params;
    const body = await request.json();
    const { status, config, name } = body;

    const VALID_STATUSES = ["active", "paused", "stopped"];
    if (status && !VALID_STATUSES.includes(status)) {
      return Response.json({ error: "Invalid status" }, { status: 400 });
    }

    const updates: Record<string, unknown> = { updatedAt: new Date() };
    if (status) updates.status = status;
    if (config) updates.config = config;
    if (name) updates.name = name;

    const updated = await db
      .update(agents)
      .set(updates)
      .where(
        and(
          eq(agents.id, id),
          eq(agents.userId, session.address.toLowerCase())
        )
      )
      .returning();

    if (!updated.length) {
      return Response.json({ error: "Agent not found" }, { status: 404 });
    }

    return Response.json({ ok: true, agent: updated[0] });
  } catch (error) {
    console.error("[PATCH /api/agents/[id]]", error);
    return Response.json({ error: "Failed to update agent" }, { status: 500 });
  }
}

// DELETE /api/agents/[id] — remove agent
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const cookieStore = await cookies();
    const session = await getIronSession<SiweSessionData>(cookieStore, sessionOptions);
    if (!session.address) return Response.json({ error: "Unauthorized" }, { status: 401 });

    const { id } = await params;

    await db.delete(agents).where(
      and(
        eq(agents.id, id),
        eq(agents.userId, session.address.toLowerCase())
      )
    );

    return Response.json({ ok: true });
  } catch (error) {
    console.error("[DELETE /api/agents/[id]]", error);
    return Response.json({ error: "Failed to delete agent" }, { status: 500 });
  }
}
