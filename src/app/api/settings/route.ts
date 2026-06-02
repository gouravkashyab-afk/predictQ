import { NextRequest } from "next/server";
import { getIronSession } from "iron-session";
import { cookies } from "next/headers";
import { sessionOptions, type SiweSessionData } from "@/lib/session";
import { db } from "@/db/client";
import { userSettings, users } from "@/db/schema";
import { eq } from "drizzle-orm";

// GET /api/settings — return current user settings
export async function GET() {
  try {
    const cookieStore = await cookies();
    const session = await getIronSession<SiweSessionData>(cookieStore, sessionOptions);
    if (!session.address) return Response.json({ error: "Unauthorized" }, { status: 401 });

    const userId = session.address.toLowerCase();

    let settings = await db.query.userSettings.findFirst({
      where: eq(userSettings.userId, userId),
    });

    // Auto-create settings row if it doesn't exist
    if (!settings) {
      const inserted = await db.insert(userSettings).values({ userId }).returning();
      settings = inserted[0];
    }

    return Response.json({ settings });
  } catch (error) {
    console.error("[GET /api/settings]", error);
    return Response.json({ error: "Failed to fetch settings" }, { status: 500 });
  }
}

// PATCH /api/settings — update user settings
export async function PATCH(request: NextRequest) {
  try {
    const cookieStore = await cookies();
    const session = await getIronSession<SiweSessionData>(cookieStore, sessionOptions);
    if (!session.address) return Response.json({ error: "Unauthorized" }, { status: 401 });

    const userId = session.address.toLowerCase();
    const body = await request.json();

    const ALLOWED_FIELDS = [
      "riskLevel",
      "maxPositionSize",
      "autoTrade",
      "notificationsEnabled",
      "telegramChatId",
      "preferredChain",
      "preferences",
    ];

    const VALID_RISK = ["low", "medium", "high"];
    const VALID_CHAINS = ["polygon", "ethereum"];

    const updates: Record<string, unknown> = { updatedAt: new Date() };

    for (const key of ALLOWED_FIELDS) {
      if (key in body) {
        if (key === "riskLevel" && !VALID_RISK.includes(body[key])) continue;
        if (key === "preferredChain" && !VALID_CHAINS.includes(body[key])) continue;
        if (key === "maxPositionSize") {
          const val = Number(body[key]);
          if (val < 1 || val > 10000) continue;
          updates[key] = String(val);
          continue;
        }
        updates[key] = body[key];
      }
    }

    const updated = await db
      .update(userSettings)
      .set(updates)
      .where(eq(userSettings.userId, userId))
      .returning();

    if (!updated.length) {
      // Insert if not exists
      await db.insert(userSettings).values({ userId, ...updates });
    }

    return Response.json({ ok: true, settings: updated[0] });
  } catch (error) {
    console.error("[PATCH /api/settings]", error);
    return Response.json({ error: "Failed to update settings" }, { status: 500 });
  }
}
