import { NextResponse } from "next/server";

export async function GET() {
  const privyAppId = process.env.NEXT_PUBLIC_PRIVY_APP_ID;
  
  return NextResponse.json({
    hasPrivyAppId: !!privyAppId,
    privyAppIdLength: privyAppId?.length || 0,
    privyAppIdPrefix: privyAppId?.substring(0, 5) || "missing",
    allPublicEnvKeys: Object.keys(process.env)
      .filter(key => key.startsWith('NEXT_PUBLIC_'))
      .map(key => key),
  });
}
