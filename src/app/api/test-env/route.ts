import { NextResponse } from "next/server";

export async function GET() {
  const privyAppId = process.env.NEXT_PUBLIC_PRIVY_APP_ID;
  const appUrl = process.env.NEXT_PUBLIC_APP_URL;
  const polygonRpc = process.env.NEXT_PUBLIC_POLYGON_RPC;
  
  return NextResponse.json({
    privy: {
      hasAppId: !!privyAppId,
      appIdLength: privyAppId?.length || 0,
      appIdPrefix: privyAppId?.substring(0, 5) || "missing",
      fullAppId: privyAppId || "NOT SET",
    },
    app: {
      hasAppUrl: !!appUrl,
      appUrl: appUrl || "NOT SET",
    },
    blockchain: {
      hasPolygonRpc: !!polygonRpc,
      polygonRpcPrefix: polygonRpc?.substring(0, 30) || "NOT SET",
    },
    allPublicEnvKeys: Object.keys(process.env)
      .filter(key => key.startsWith('NEXT_PUBLIC_'))
      .sort(),
    timestamp: new Date().toISOString(),
  });
}
