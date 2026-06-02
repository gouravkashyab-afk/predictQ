import { getIronSession } from "iron-session";
import { cookies } from "next/headers";
import { sessionOptions, type SiweSessionData } from "@/lib/session";
import { db } from "@/db/client";
import { users, userSettings } from "@/db/schema";
import { eq } from "drizzle-orm";

// GET /api/auth/session  — return current session info
export async function GET() {
  try {
    const cookieStore = await cookies();
    const session = await getIronSession<SiweSessionData>(
      cookieStore,
      sessionOptions
    );

    if (!session.address) {
      return Response.json({ authenticated: false }, { status: 200 });
    }

    const user = await db.query.users.findFirst({
      where: eq(users.walletAddress, session.address.toLowerCase()),
    });

    return Response.json({
      authenticated: true,
      address: session.address,
      chainId: session.chainId,
      user: user ?? null,
    });
  } catch (error) {
    console.error("[/api/auth/session]", error);
    return Response.json({ error: "Internal server error" }, { status: 500 });
  }
}
