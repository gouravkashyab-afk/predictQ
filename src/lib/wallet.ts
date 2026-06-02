import { createPublicClient, http, formatUnits, parseAbi } from "viem";
import { polygon } from "viem/chains";

// USDC contract on Polygon
const USDC_ADDRESS = "0x2791Bca1f2de4661ED88A30C99A7a9449Aa84174" as const;

// Alchemy RPC URL
const POLYGON_RPC = process.env.NEXT_PUBLIC_POLYGON_RPC || 
  `https://polygon-mainnet.g.alchemy.com/v2/${process.env.ALCHEMY_API_KEY}`;

// Create public client for reading blockchain data
const publicClient = createPublicClient({
  chain: polygon,
  transport: http(POLYGON_RPC),
});

// ERC20 ABI for balanceOf
const erc20Abi = parseAbi([
  "function balanceOf(address owner) view returns (uint256)",
  "function decimals() view returns (uint8)",
  "function symbol() view returns (string)",
]);

/**
 * Fetch USDC balance for a wallet address
 */
export async function getUSDCBalance(address: string): Promise<number> {
  try {
    const balance = await publicClient.readContract({
      address: USDC_ADDRESS,
      abi: erc20Abi,
      functionName: "balanceOf",
      args: [address as `0x${string}`],
    });

    // USDC has 6 decimals
    return parseFloat(formatUnits(balance, 6));
  } catch (error) {
    console.error("[getUSDCBalance]", error);
    return 0;
  }
}

/**
 * Fetch multiple token balances
 */
export async function getTokenBalances(address: string) {
  try {
    const [usdcBalance, maticBalance] = await Promise.all([
      getUSDCBalance(address),
      publicClient.getBalance({ address: address as `0x${string}` }),
    ]);

    return {
      usdc: usdcBalance,
      matic: parseFloat(formatUnits(maticBalance, 18)),
    };
  } catch (error) {
    console.error("[getTokenBalances]", error);
    return { usdc: 0, matic: 0 };
  }
}

/**
 * Format wallet address for display
 */
export function formatAddress(address: string): string {
  if (!address) return "";
  return `${address.slice(0, 6)}...${address.slice(-4)}`;
}

/**
 * Check if address is valid Ethereum address
 */
export function isValidAddress(address: string): boolean {
  return /^0x[a-fA-F0-9]{40}$/.test(address);
}
