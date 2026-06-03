/**
 * GET/POST /api/user/preferences
 * Manage user trading preferences and risk settings
 */

import { NextRequest, NextResponse } from "next/server";
import { getUserPreferences, updateUserPreferences } from "@/lib/user-preferences";

export async function GET(req: NextRequest) {
  try {
    const userId = req.headers.get("x-user-id");

    if (!userId) {
      return NextResponse.json(
        { error: "User ID required" },
        { status: 401 }
      );
    }

    const preferences = await getUserPreferences(userId);

    return NextResponse.json({ preferences });
  } catch (error) {
    console.error("Error fetching preferences:", error);
    return NextResponse.json(
      { error: "Failed to fetch preferences" },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const userId = req.headers.get("x-user-id");

    if (!userId) {
      return NextResponse.json(
        { error: "User ID required" },
        { status: 401 }
      );
    }

    const body = await req.json();
    const { preferences } = body;

    if (!preferences) {
      return NextResponse.json(
        { error: "Preferences required" },
        { status: 400 }
      );
    }

    await updateUserPreferences(userId, preferences);

    const updated = await getUserPreferences(userId);

    return NextResponse.json({
      success: true,
      preferences: updated,
      message: "Preferences updated successfully",
    });
  } catch (error) {
    console.error("Error updating preferences:", error);
    return NextResponse.json(
      { error: "Failed to update preferences" },
      { status: 500 }
    );
  }
}
