import { NextRequest, NextResponse } from "next/server";

// In-memory storage for demo (replace with database in production)
const agentSettings: Record<string, any> = {};

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const agentId = params.id;
    const settings = agentSettings[agentId] || {
      enabled: false,
      minPosition: 5,
      avgPosition: 5,
      maxPosition: 5,
      notifyOnTrade: true,
    };

    return NextResponse.json({ settings });
  } catch (error) {
    console.error("[GET /api/agents/[id]/settings]", error);
    return NextResponse.json(
      { error: "Failed to fetch settings" },
      { status: 500 }
    );
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const agentId = params.id;
    const body = await request.json();

    // Store settings (in production, save to database)
    agentSettings[agentId] = {
      enabled: body.enabled || false,
      minPosition: body.minPosition || 5,
      avgPosition: body.avgPosition || 5,
      maxPosition: body.maxPosition || 5,
      notifyOnTrade: body.notifyOnTrade !== false,
      updatedAt: new Date().toISOString(),
    };

    return NextResponse.json({
      success: true,
      settings: agentSettings[agentId],
    });
  } catch (error) {
    console.error("[POST /api/agents/[id]/settings]", error);
    return NextResponse.json(
      { error: "Failed to save settings" },
      { status: 500 }
    );
  }
}
