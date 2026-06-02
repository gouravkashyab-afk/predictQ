import { NextRequest, NextResponse } from "next/server";

// In-memory storage for demo (replace with database in production)
const agentSettings: Record<string, any> = {};

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const settings = agentSettings[id] || {
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
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();

    // Store settings (in production, save to database)
    agentSettings[id] = {
      enabled: body.enabled || false,
      minPosition: body.minPosition || 5,
      avgPosition: body.avgPosition || 5,
      maxPosition: body.maxPosition || 5,
      notifyOnTrade: body.notifyOnTrade !== false,
      updatedAt: new Date().toISOString(),
    };

    return NextResponse.json({
      success: true,
      settings: agentSettings[id],
    });
  } catch (error) {
    console.error("[POST /api/agents/[id]/settings]", error);
    return NextResponse.json(
      { error: "Failed to save settings" },
      { status: 500 }
    );
  }
}
