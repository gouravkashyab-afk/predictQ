import { getIronSession } from "iron-session";
import { cookies } from "next/headers";
import { sessionOptions, type SiweSessionData } from "@/lib/session";
import { generateNonce } from "siwe";

// GET /api/auth/nonce  — generate + store a fresh nonce
export async function GET() {
  const cookieStore = await cookies();
  const session = await getIronSession<SiweSessionData & { nonce?: string }>(
    cookieStore,
    sessionOptions
  );

  session.nonce = generateNonce();
  await session.save();

  return Response.json({ nonce: session.nonce });
}
