import { getIronSession } from "iron-session";
import { cookies } from "next/headers";
import { SiweMessage } from "siwe";
import { sessionOptions, type SiweSessionData } from "@/lib/session";
import { db } from "@/db/client";
import { users, userSettings } from "@/db/schema";
import { eq } from "drizzle-orm";
import type { NextRequest } from "next/server";

// POST /api/auth/verify  — verify SIWE signature and create session
export async function POST(request: NextRequest) {
  try {
    const { message, signature } = await request.json();

    const cookieStore = await cookies();
    const session = await getIronSession<SiweSessionData & { nonce?: string }>(
      cookieStore,
      sessionOptions
    );

    const siweMessage = new SiweMessage(message);
    const { data: fields } = await siweMessage.verify({ signature });

    if (fields.nonce !== session.nonce) {
      return Response.json({ error: "Invalid nonce" }, { status: 422 });
    }

    // Save address to session
    session.address = fields.address;
    session.chainId = fields.chainId;
    await session.save();

    // Upsert user in NeonDB
    const existing = await db.query.users.findFirst({
      where: eq(users.walletAddress, fields.address.toLowerCase()),
    });

    if (!existing) {
      await db.insert(users).values({
        id: fields.address.toLowerCase(),
        privyId: fields.address.toLowerCase(), // reuse for wallet-based auth
        walletAddress: fields.address.toLowerCase(),
      });
      await db.insert(userSettings).values({
        userId: fields.address.toLowerCase(),
      });
    } else {
      await db
        .update(users)
        .set({ lastSeenAt: new Date(), updatedAt: new Date() })
        .where(eq(users.walletAddress, fields.address.toLowerCase()));
    }

    return Response.json({ ok: true, address: fields.address });
  } catch (error) {
    console.error("[/api/auth/verify]", error);
    return Response.json({ error: "Verification failed" }, { status: 400 });
  }
}

// DELETE /api/auth/verify  — logout / clear session
export async function DELETE() {
  const cookieStore = await cookies();
  const session = await getIronSession<SiweSessionData>(
    cookieStore,
    sessionOptions
  );
  session.destroy();
  return Response.json({ ok: true });
}
