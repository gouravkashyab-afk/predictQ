import { cookies } from "next/headers";
import { db } from "@/db/client";
import { users, sessions, userSettings } from "@/db/schema";
import { eq } from "drizzle-orm";

export async function GET() {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get("privy-token")?.value;

    if (!token) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    const session = await db.query.sessions.findFirst({
      where: eq(sessions.token, token),
    });

    if (!session) {
      return Response.json({ error: "Session not found" }, { status: 401 });
    }

    const user = await db.query.users.findFirst({
      where: eq(users.id, session.userId),
    });

    if (!user) {
      return Response.json({ error: "User not found" }, { status: 404 });
    }

    const settings = await db.query.userSettings.findFirst({
      where: eq(userSettings.userId, user.id),
    });

    return Response.json({
      id: user.id,
      privyId: user.privyId,
      walletAddress: user.walletAddress,
      email: user.email,
      createdAt: user.createdAt,
      lastSeenAt: user.lastSeenAt,
      settings: settings ?? null,
    });
  } catch (error) {
    console.error("[/api/users/me]", error);
    return Response.json({ error: "Internal server error" }, { status: 500 });
  }
}
