/**
 * Polymarket CLOB Trade Execution
 * Builds EIP-712 typed orders and submits them to the Polymarket CLOB API.
 * Reference: https://docs.polymarket.com/#order-structure
 */

// Polymarket CLOB endpoints
const CLOB_BASE = process.env.NEXT_PUBLIC_CLOB_BASE ?? "https://clob.polymarket.com";

// Contract addresses (Polygon mainnet)
export const CTF_EXCHANGE = "0x4bFb41d5B3570DeFd03C39a9A4D8dE6Bd8B8982E";
export const USDC_ADDRESS = "0x2791Bca1f2de4661ED88A30C99A7a9449Aa84174";

export interface OrderParams {
  tokenId: string;          // YES or NO conditional token ID
  side: "BUY" | "SELL";
  price: number;            // 0.01 – 0.99 (price per share in USDC)
  size: number;             // USDC amount
  feeRateBps?: number;      // fee rate in basis points (default: 0)
  nonce?: number;
  expiration?: number;      // unix timestamp, 0 = GTC
  maker?: string;           // wallet address (filled from session)
}

export interface BuiltOrder {
  salt: string;
  maker: string;
  signer: string;
  taker: string;
  tokenId: string;
  makerAmount: string;
  takerAmount: string;
  expiration: string;
  nonce: string;
  feeRateBps: string;
  side: "0" | "1";          // 0=BUY, 1=SELL
  signatureType: "0";       // EOA
}

// EIP-712 domain + types for Polymarket orders
export const EIP712_DOMAIN = {
  name: "CTFExchange",
  version: "1",
  chainId: 137, // Polygon mainnet
  verifyingContract: CTF_EXCHANGE as `0x${string}`,
} as const;

export const ORDER_TYPES = {
  Order: [
    { name: "salt", type: "uint256" },
    { name: "maker", type: "address" },
    { name: "signer", type: "address" },
    { name: "taker", type: "address" },
    { name: "tokenId", type: "uint256" },
    { name: "makerAmount", type: "uint256" },
    { name: "takerAmount", type: "uint256" },
    { name: "expiration", type: "uint256" },
    { name: "nonce", type: "uint256" },
    { name: "feeRateBps", type: "uint256" },
    { name: "side", type: "uint8" },
    { name: "signatureType", type: "uint8" },
  ],
} as const;

/**
 * Build an unsigned order struct (ready for EIP-712 signing via wagmi).
 * Call signTypedData({ domain: EIP712_DOMAIN, types: ORDER_TYPES, primaryType: 'Order', message: order })
 */
export function buildOrderMessage(params: OrderParams, maker: string): BuiltOrder {
  const salt = String(BigInt(Math.floor(Math.random() * 1e18)));
  const nonce = String(params.nonce ?? 0);
  const expiration = String(params.expiration ?? 0); // 0 = GTC

  // For a BUY: maker gives USDC, taker gives conditional tokens
  // makerAmount = USDC in (size)
  // takerAmount = shares out = size / price
  const makerAmountRaw = Math.round(params.size * 1e6); // USDC has 6 decimals
  const takerAmountRaw = Math.round((params.size / params.price) * 1e6);

  return {
    salt,
    maker,
    signer: maker,
    taker: "0x0000000000000000000000000000000000000000",
    tokenId: params.tokenId,
    makerAmount: String(makerAmountRaw),
    takerAmount: String(takerAmountRaw),
    expiration,
    nonce,
    feeRateBps: String(params.feeRateBps ?? 0),
    side: params.side === "BUY" ? "0" : "1",
    signatureType: "0",
  };
}

/**
 * POST a signed order to the Polymarket CLOB.
 * Returns the order hash on success.
 */
export async function submitOrder(
  orderMessage: BuiltOrder,
  signature: string
): Promise<{ orderHash: string; status: string }> {
  const body = {
    order: orderMessage,
    owner: orderMessage.maker,
    orderType: "GTC",
    signature,
  };

  const res = await fetch(`${CLOB_BASE}/order`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || `CLOB order failed: ${res.status}`);
  }

  const data = await res.json();
  return {
    orderHash: data.orderID || data.hash || data.orderHash || "unknown",
    status: data.status || "pending",
  };
}

/**
 * Get current mid-price for a token from the CLOB.
 */
export async function getTokenPrice(tokenId: string): Promise<number> {
  try {
    const res = await fetch(`${CLOB_BASE}/midpoint?token_id=${tokenId}`);
    if (!res.ok) return 0.5;
    const data = await res.json();
    return parseFloat(data.mid) || 0.5;
  } catch {
    return 0.5;
  }
}
