/**
 * Polymarket CLOB Trading Integration
 * 
 * This module handles:
 * - EIP-712 order signing
 * - Order submission to Polymarket CLOB API
 * - Order status tracking
 */

import { type WalletWithMetadata } from "@privy-io/react-auth";

// ─── Types ────────────────────────────────────────────────────────────────────

export interface OrderParams {
  tokenId: string;
  price: number;
  size: number; // Amount in USDC
  side: "BUY" | "SELL";
  feeRateBps?: number;
}

export interface SignedOrder {
  salt: number;
  maker: string;
  signer: string;
  taker: string;
  tokenId: string;
  makerAmount: string;
  takerAmount: string;
  expiration: string;
  nonce: string;
  feeRateBps: string;
  side: "BUY" | "SELL";
  signatureType: number;
  signature: string;
}

export interface OrderResponse {
  success: boolean;
  orderID?: string;
  transactionsHashes?: string[];
  error?: string;
  errorMsg?: string;
}

// ─── Constants ────────────────────────────────────────────────────────────────

const CLOB_API_BASE = "https://clob.polymarket.com";
const POLYGON_CHAIN_ID = 137;

// Polymarket CTF Exchange contract on Polygon
const CTF_EXCHANGE_ADDRESS = "0x4bFb41d5B3570DeFd03C39a9A4D8dE6Bd8B8982E";

// EIP-712 Domain for Polymarket orders
const EIP712_DOMAIN = {
  name: "Polymarket CTF Exchange",
  version: "1",
  chainId: POLYGON_CHAIN_ID,
  verifyingContract: CTF_EXCHANGE_ADDRESS,
};

// EIP-712 Order type
const ORDER_TYPE = {
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
};

// ─── Helper Functions ─────────────────────────────────────────────────────────

/**
 * Generate a random salt for order uniqueness
 */
function generateSalt(): number {
  return Math.floor(Math.random() * 1000000000);
}

/**
 * Get current timestamp + 30 days (order expiration)
 */
function getExpiration(): number {
  return Math.floor(Date.now() / 1000) + 30 * 24 * 60 * 60;
}

/**
 * Convert price (0-1) and size (USDC) to maker/taker amounts
 */
function calculateAmounts(price: number, size: number, side: "BUY" | "SELL") {
  // Polymarket uses 6 decimals for USDC amounts
  const sizeInWei = Math.floor(size * 1e6);
  
  if (side === "BUY") {
    // Buying outcome tokens with USDC
    // makerAmount = USDC to spend
    // takerAmount = shares to receive
    const shares = Math.floor((size / price) * 1e6);
    return {
      makerAmount: sizeInWei.toString(),
      takerAmount: shares.toString(),
    };
  } else {
    // Selling outcome tokens for USDC
    // makerAmount = shares to sell
    // takerAmount = USDC to receive
    const shares = Math.floor((size / (1 - price)) * 1e6);
    return {
      makerAmount: shares.toString(),
      takerAmount: sizeInWei.toString(),
    };
  }
}

// ─── Main Functions ───────────────────────────────────────────────────────────

/**
 * Ensure wallet is connected to Polygon network
 */
async function ensurePolygonNetwork(wallet: WalletWithMetadata): Promise<void> {
  try {
    const provider = await wallet.getEthereumProvider();
    
    // Check current chain ID
    const chainId = await provider.request({ method: "eth_chainId" });
    const currentChainId = typeof chainId === "string" 
      ? parseInt(chainId, 16) 
      : chainId;

    // If already on Polygon, we're good
    if (currentChainId === POLYGON_CHAIN_ID) {
      return;
    }

    console.log(`[ensurePolygonNetwork] Current chain: ${currentChainId}, switching to Polygon (${POLYGON_CHAIN_ID})`);

    // Try to switch to Polygon
    try {
      await provider.request({
        method: "wallet_switchEthereumChain",
        params: [{ chainId: `0x${POLYGON_CHAIN_ID.toString(16)}` }], // 0x89
      });
      console.log("[ensurePolygonNetwork] Successfully switched to Polygon");
    } catch (switchError: any) {
      // If chain not added (error code 4902), add it
      if (switchError.code === 4902) {
        console.log("[ensurePolygonNetwork] Polygon not found, adding network...");
        await provider.request({
          method: "wallet_addEthereumChain",
          params: [
            {
              chainId: `0x${POLYGON_CHAIN_ID.toString(16)}`,
              chainName: "Polygon Mainnet",
              nativeCurrency: {
                name: "MATIC",
                symbol: "MATIC",
                decimals: 18,
              },
              rpcUrls: [process.env.NEXT_PUBLIC_POLYGON_RPC || "https://polygon-rpc.com"],
              blockExplorerUrls: ["https://polygonscan.com"],
            },
          ],
        });
        console.log("[ensurePolygonNetwork] Polygon network added successfully");
      } else {
        throw switchError;
      }
    }
  } catch (error) {
    console.error("[ensurePolygonNetwork] Failed:", error);
    throw new Error(
      "Please switch your wallet to Polygon network to trade on Polymarket. " +
      "Polymarket operates on Polygon (MATIC) blockchain."
    );
  }
}

/**
 * Create and sign a Polymarket order using Privy wallet
 */
export async function createAndSignOrder(
  wallet: WalletWithMetadata,
  params: OrderParams
): Promise<SignedOrder> {
  const address = wallet.address;
  
  // Ensure wallet is on Polygon network
  await ensurePolygonNetwork(wallet);
  
  // Build order object
  const { makerAmount, takerAmount } = calculateAmounts(
    params.price,
    params.size,
    params.side
  );

  const order = {
    salt: generateSalt(),
    maker: address,
    signer: address,
    taker: "0x0000000000000000000000000000000000000000", // Anyone can fill
    tokenId: params.tokenId,
    makerAmount,
    takerAmount,
    expiration: getExpiration().toString(),
    nonce: "0", // Polymarket handles nonce management
    feeRateBps: (params.feeRateBps || 0).toString(),
    side: params.side === "BUY" ? 0 : 1, // 0 = BUY, 1 = SELL
    signatureType: 0, // EOA signature
  };

  // Sign with EIP-712
  try {
    const provider = await wallet.getEthereumProvider();
    
    // Request signature using eth_signTypedData_v4
    const signature = await provider.request({
      method: "eth_signTypedData_v4",
      params: [
        address,
        JSON.stringify({
          types: {
            EIP712Domain: [
              { name: "name", type: "string" },
              { name: "version", type: "string" },
              { name: "chainId", type: "uint256" },
              { name: "verifyingContract", type: "address" },
            ],
            Order: ORDER_TYPE.Order,
          },
          primaryType: "Order",
          domain: EIP712_DOMAIN,
          message: order,
        }),
      ],
    });

    return {
      ...order,
      side: params.side,
      signature: signature as string,
    };
  } catch (error) {
    console.error("[createAndSignOrder] Signing failed:", error);
    throw new Error("Failed to sign order. User may have rejected the signature request.");
  }
}

/**
 * Submit signed order to Polymarket CLOB API
 */
export async function submitOrder(signedOrder: SignedOrder): Promise<OrderResponse> {
  try {
    const response = await fetch(`${CLOB_API_BASE}/order`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(signedOrder),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error || `HTTP ${response.status}`);
    }

    const data = await response.json();
    return {
      success: true,
      orderID: data.orderID,
      transactionsHashes: data.transactionsHashes,
    };
  } catch (error) {
    console.error("[submitOrder] Submission failed:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
      errorMsg: "Failed to submit order to Polymarket",
    };
  }
}

/**
 * Get order status from Polymarket CLOB
 */
export async function getOrderStatus(orderID: string): Promise<{
  status: "open" | "matched" | "cancelled";
  fillAmount?: string;
}> {
  try {
    const response = await fetch(`${CLOB_API_BASE}/order/${orderID}`);
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    
    const data = await response.json();
    return {
      status: data.status,
      fillAmount: data.fillAmount,
    };
  } catch (error) {
    console.error("[getOrderStatus]", error);
    throw error;
  }
}

/**
 * Cancel an open order
 */
export async function cancelOrder(
  wallet: WalletWithMetadata,
  orderID: string
): Promise<{ success: boolean; error?: string }> {
  try {
    // Get order details first
    const orderResponse = await fetch(`${CLOB_API_BASE}/order/${orderID}`);
    if (!orderResponse.ok) throw new Error("Order not found");
    
    const orderData = await orderResponse.json();
    
    // Sign cancellation message
    const provider = await wallet.getEthereumProvider();
    const message = `Cancel order: ${orderID}`;
    const signature = await provider.request({
      method: "personal_sign",
      params: [message, wallet.address],
    });

    // Submit cancellation
    const cancelResponse = await fetch(`${CLOB_API_BASE}/order/${orderID}`, {
      method: "DELETE",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        orderID,
        signature,
      }),
    });

    if (!cancelResponse.ok) {
      throw new Error("Failed to cancel order");
    }

    return { success: true };
  } catch (error) {
    console.error("[cancelOrder]", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

/**
 * Get best available price for a token (from orderbook)
 */
export async function getBestPrice(
  tokenId: string,
  side: "BUY" | "SELL"
): Promise<number | null> {
  try {
    const response = await fetch(`${CLOB_API_BASE}/book?token_id=${tokenId}`);
    if (!response.ok) return null;
    
    const orderbook = await response.json();
    
    if (side === "BUY") {
      // Best ask price (lowest sell price)
      const bestAsk = orderbook.asks?.[0];
      return bestAsk ? parseFloat(bestAsk.price) : null;
    } else {
      // Best bid price (highest buy price)
      const bestBid = orderbook.bids?.[0];
      return bestBid ? parseFloat(bestBid.price) : null;
    }
  } catch (error) {
    console.error("[getBestPrice]", error);
    return null;
  }
}
