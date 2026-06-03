/**
 * POST /api/agents/[id]/toggle-trading
 * Enable/disable real trading for an agent
 */

import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db/client";
import { agents } from "@/db/schema";
import { eq } from "drizzle-orm";

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { enabled } = await req.json();
    const agentId = params.id;

    if (typeof enabled !== "boolean") {
      return NextResponse.json(
        { error: "enabled must be a boolean" },
        { status: 400 }
      );
    }

    // Get current agent
    const agent = await db
      .select()
      .from(agents)
      .where(eq(agents.id, agentId))
      .limit(1);

    if (!agent || agent.length === 0) {
      return NextResponse.json({ error: "Agent not found" }, { status: 404 });
    }

    const currentConfig = (agent[0].config as any) || {};

    // Update config
    await db
      .update(agents)
      .set({
        config: {
          ...currentConfig,
          simulateOnly: !enabled, // If enabled=true, simulateOnly=false
        },
        updatedAt: new Date(),
      })
      .where(eq(agents.id, agentId));

    return NextResponse.json({
      success: true,
      agentId,
      realTradingEnabled: enabled,
      message: enabled
        ? "⚠️ Real trading ENABLED. Agent will execute real trades."
        : "✅ Simulation mode. Agent will only simulate trades.",
    });
  } catch (error) {
    console.error("Error toggling trading:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
