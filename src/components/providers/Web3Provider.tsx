"use client";

import { PrivyProvider } from "@privy-io/react-auth";
import { polygon, mainnet, base, arbitrum, optimism } from "viem/chains";
import { useEffect } from "react";

export default function Web3Provider({
  children,
}: {
  children: React.ReactNode;
}) {
  // Debug: Log Privy App ID on mount
  useEffect(() => {
    const appId = process.env.NEXT_PUBLIC_PRIVY_APP_ID;
    console.log("[Privy Debug] App ID:", appId);
    console.log("[Privy Debug] App ID length:", appId?.length);
    console.log("[Privy Debug] Current URL:", window.location.href);
  }, []);

  return (
    <PrivyProvider
      appId={process.env.NEXT_PUBLIC_PRIVY_APP_ID || ""}
      config={{
        // Appearance
        appearance: {
          theme: "dark",
          accentColor: "#5542ff",
          logo: "/logo.png",
          showWalletLoginFirst: false, // Show email/social first like Cobot.gg
        },
        // Login methods
        loginMethods: ["email", "google", "twitter", "wallet"],
        // Embedded wallets - Multi-chain like Cobot.gg
        embeddedWallets: {
          createOnLogin: "users-without-wallets", // Auto-create wallet for email/social users
          requireUserPasswordOnCreate: false, // Passwordless like Cobot.gg
          // This will create wallets that work across all supported chains
        },
        // Default chain for Polymarket
        defaultChain: polygon,
        // Support multiple chains like Cobot.gg (Polygon, Ethereum, Base, Arbitrum, Optimism)
        supportedChains: [polygon, mainnet, base, arbitrum, optimism],
        // MFA
        mfa: {
          noPromptOnMfaRequired: false,
        },
      }}
    >
      {children}
    </PrivyProvider>
  );
}
