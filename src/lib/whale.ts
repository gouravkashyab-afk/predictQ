// ─── Whale Tracker — Polygon USDC transfers via Alchemy ──────────────────────
// Tracks large USDC transfers (>$10K) to/from Polymarket contract addresses
// as a proxy for whale activity on the platform.

export interface WhaleEventData {
  id: string;
  txHash: string;
  wallet: string;
  amountUsd: number;
  direction: "IN" | "OUT";
  token: string;
  contractAddress: string;
  blockNumber: string;
  network: string;
  timestamp: string;
}

// Known Polymarket contract / proxy addresses on Polygon
const POLYMARKET_CONTRACTS = new Set([
  "0x4bfb41d5b3570defd03c39a9a4d8de6bd8b8982e", // CTF Exchange
  "0xd91e80cf2e7be2e162c6513ced06f1dd0da35296", // NegRisk CTF Exchange
  "0xc5d563a36ae78145c45a50134d48a1215220f80a", // USDC collateral proxy
]);

// USDC contract on Polygon
const USDC_CONTRACT = "0x2791bca1f2de4661ed88a30c99a7a9449aa84174";
const USDC_DECIMALS = 6;
const WHALE_THRESHOLD_USD = 10_000; // $10K minimum

interface AlchemyTransfer {
  uniqueId: string;
  hash: string;
  from: string;
  to: string;
  value: string; // hex string of raw amount
  asset: string;
  category: string;
  blockNum: string;
  metadata?: { blockTimestamp?: string };
}

interface AlchemyResponse {
  result?: {
    transfers: AlchemyTransfer[];
  };
  error?: { message: string };
}

// ─── Alchemy Asset Transfers API ──────────────────────────────────────────────

async function fetchAlchemyTransfers(
  toAddress?: string,
  fromAddress?: string
): Promise<AlchemyTransfer[]> {
  const apiKey = process.env.ALCHEMY_API_KEY;
  if (!apiKey) return [];

  const rpcUrl = `https://polygon-mainnet.g.alchemy.com/v2/${apiKey}`;

  const body = {
    id: 1,
    jsonrpc: "2.0",
    method: "alchemy_getAssetTransfers",
    params: [
      {
        fromBlock: "0x0",
        toBlock: "latest",
        contractAddresses: [USDC_CONTRACT],
        category: ["erc20"],
        withMetadata: true,
        excludeZeroValue: true,
        maxCount: "0x32", // 50 transfers
        ...(toAddress && { toAddress }),
        ...(fromAddress && { fromAddress }),
        order: "desc",
      },
    ],
  };

  try {
    const res = await fetch(rpcUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
      cache: "no-store",
    });
    if (!res.ok) return [];
    const data: AlchemyResponse = await res.json();
    return data.result?.transfers ?? [];
  } catch (err) {
    console.error("[whale] Alchemy fetch error:", err);
    return [];
  }
}

// ─── Parse raw hex value to USD amount ────────────────────────────────────────

function hexToAmount(hexValue: string): number {
  try {
    const raw = BigInt(hexValue);
    return Number(raw) / Math.pow(10, USDC_DECIMALS);
  } catch {
    return 0;
  }
}

// ─── Main export ──────────────────────────────────────────────────────────────

/**
 * Fetch recent whale events on Polymarket (Polygon USDC flows).
 * Returns mock data when ALCHEMY_API_KEY is not set.
 */
export async function fetchWhaleEvents(): Promise<WhaleEventData[]> {
  const apiKey = process.env.ALCHEMY_API_KEY;

  if (!apiKey) {
    console.log("[whale] No ALCHEMY_API_KEY — returning mock whale events");
    return getMockWhaleEvents();
  }

  const events: WhaleEventData[] = [];
  const seen = new Set<string>();

  // Fetch transfers TO Polymarket contracts (buys)
  for (const contract of POLYMARKET_CONTRACTS) {
    const inbound = await fetchAlchemyTransfers(contract, undefined);
    for (const t of inbound) {
      if (seen.has(t.hash)) continue;
      const amount = hexToAmount(t.value);
      if (amount < WHALE_THRESHOLD_USD) continue;
      seen.add(t.hash);
      events.push({
        id: t.uniqueId,
        txHash: t.hash,
        wallet: t.from,
        amountUsd: amount,
        direction: "IN",
        token: t.asset ?? "USDC",
        contractAddress: contract,
        blockNumber: t.blockNum,
        network: "polygon",
        timestamp: t.metadata?.blockTimestamp ?? new Date().toISOString(),
      });
    }

    // Fetch transfers FROM Polymarket contracts (withdrawals)
    const outbound = await fetchAlchemyTransfers(undefined, contract);
    for (const t of outbound) {
      if (seen.has(t.hash)) continue;
      const amount = hexToAmount(t.value);
      if (amount < WHALE_THRESHOLD_USD) continue;
      seen.add(t.hash);
      events.push({
        id: t.uniqueId,
        txHash: t.hash,
        wallet: t.to,
        amountUsd: amount,
        direction: "OUT",
        token: t.asset ?? "USDC",
        contractAddress: contract,
        blockNumber: t.blockNum,
        network: "polygon",
        timestamp: t.metadata?.blockTimestamp ?? new Date().toISOString(),
      });
    }
  }

  // Sort by descending amount
  return events.sort((a, b) => b.amountUsd - a.amountUsd).slice(0, 50);
}

// ─── Mock whale events ─────────────────────────────────────────────────────────

function getMockWhaleEvents(): WhaleEventData[] {
  const now = Date.now();
  return [
    {
      id: "mock-1",
      txHash: "0xabc123def456aaa111bbb222ccc333ddd444eee555fff666000111222333444555",
      wallet: "0x7a250d5630B4cF539739dF2C5dAcb4c659F2488D",
      amountUsd: 485_000,
      direction: "IN",
      token: "USDC",
      contractAddress: "0x4bfb41d5b3570defd03c39a9a4d8de6bd8b8982e",
      blockNumber: "0x3a1b2c",
      network: "polygon",
      timestamp: new Date(now - 5 * 60 * 1000).toISOString(),
    },
    {
      id: "mock-2",
      txHash: "0xdef789abc123bbb222ccc333ddd444eee555fff666000111222333444555666777",
      wallet: "0x3fC91A3afd70395Cd496C647d5a6CC9D4B2b7FAD",
      amountUsd: 210_000,
      direction: "IN",
      token: "USDC",
      contractAddress: "0xd91e80cf2e7be2e162c6513ced06f1dd0da35296",
      blockNumber: "0x3a1b1f",
      network: "polygon",
      timestamp: new Date(now - 23 * 60 * 1000).toISOString(),
    },
    {
      id: "mock-3",
      txHash: "0x111aaa222bbb333ccc444ddd555eee666fff777000888999aaabbbcccdddeee",
      wallet: "0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2",
      amountUsd: 750_000,
      direction: "OUT",
      token: "USDC",
      contractAddress: "0x4bfb41d5b3570defd03c39a9a4d8de6bd8b8982e",
      blockNumber: "0x3a1a8e",
      network: "polygon",
      timestamp: new Date(now - 47 * 60 * 1000).toISOString(),
    },
    {
      id: "mock-4",
      txHash: "0x222bbb333ccc444ddd555eee666fff777000888999aaabbbcccdddeeefffaaa",
      wallet: "0xAbCdEf1234567890AbCdEf1234567890AbCdEf12",
      amountUsd: 95_000,
      direction: "IN",
      token: "USDC",
      contractAddress: "0xc5d563a36ae78145c45a50134d48a1215220f80a",
      blockNumber: "0x3a1a10",
      network: "polygon",
      timestamp: new Date(now - 82 * 60 * 1000).toISOString(),
    },
    {
      id: "mock-5",
      txHash: "0x333ccc444ddd555eee666fff777000888999aaabbbcccdddeeefffaaabbb111",
      wallet: "0x1234567890123456789012345678901234567890",
      amountUsd: 1_200_000,
      direction: "IN",
      token: "USDC",
      contractAddress: "0x4bfb41d5b3570defd03c39a9a4d8de6bd8b8982e",
      blockNumber: "0x3a194c",
      network: "polygon",
      timestamp: new Date(now - 3 * 60 * 60 * 1000).toISOString(),
    },
  ];
}
