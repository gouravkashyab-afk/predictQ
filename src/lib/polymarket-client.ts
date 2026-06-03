/**
 * Polymarket CLOB Client
 * Interacts with Polymarket's Central Limit Order Book API
 * 
 * Documentation: https://docs.polymarket.com
 */

import { ethers } from "ethers";

const POLYMARKET_API_URL = "https://clob.polymarket.com";

export interface OrderParams {
  tokenId: string;
  price: number;
  size: number;
  side: "BUY" | "SELL";
  feeRateBps: number;
  nonce: number;
  expiration: number;
}

export interface SignedOrder {
  maker: string;
  taker: string;
  tokenId: string;
  makerAmount: string;
  takerAmount: string;
  side: string;
  feeRateBps: string;
  nonce: string;
  signer: string;
  expiration: string;
  signature: string;
}

/**
 * Create and sign an order using EIP-712
 */
export async function createAndSignOrder(
  params: OrderParams,
  privateKey: string
): Promise<SignedOrder> {
  const wallet = new ethers.Wallet(privateKey);

  // EIP-712 domain for Polymarket
  const domain = {
    name: "Polymarket CTF Exchange",
    version: "1",
    chainId: 137, // Polygon mainnet
    verifyingContract: "0x4bFb41d5B3570DeFd03C39a9A4D8dE6Bd8B8982E",
  };

  // EIP-712 types
  const types = {
    Order: [
      { name: "maker", type: "address" },
      { name: "taker", type: "address" },
      { name: "tokenId", type: "uint256" },
      { name: "makerAmount", type: "uint256" },
      { name: "takerAmount", type: "uint256" },
      { name: "side", type: "uint8" },
      { name: "feeRateBps", type: "uint256" },
      { name: "nonce", type: "uint256" },
      { name: "signer", type: "address" },
      { name: "expiration", type: "uint256" },
    ],
  };

  // Calculate amounts based on price
  const makerAmount = params.side === "BUY" 
    ? ethers.parseUnits((params.size * params.price).toString(), 6) // USDC has 6 decimals
    : ethers.parseUnits(params.size.toString(), 6);

  const takerAmount = params.side === "BUY"
    ? ethers.parseUnits(params.size.toString(), 6)
    : ethers.parseUnits((params.size * params.price).toString(), 6);

  // Order data
  const order = {
    maker: wallet.address,
    taker: ethers.ZeroAddress, // Any taker
    tokenId: params.tokenId,
    makerAmount: makerAmount.toString(),
    takerAmount: takerAmount.toString(),
    side: params.side === "BUY" ? 0 : 1,
    feeRateBps: params.feeRateBps.toString(),
    nonce: params.nonce.toString(),
    signer: wallet.address,
    expiration: params.expiration.toString(),
  };

  // Sign the order
  const signature = await wallet.signTypedData(domain, types, order);

  return {
    ...order,
    side: params.side,
    feeRateBps: order.feeRateBps,
    nonce: order.nonce,
    expiration: order.expiration,
    signature,
  };
}

/**
 * Submit a signed order to Polymarket
 */
export async function submitOrder(
  signedOrder: SignedOrder
): Promise<{ success: boolean; orderID: string }> {
  try {
    const response = await fetch(`${POLYMARKET_API_URL}/order`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(signedOrder),
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Failed to submit order: ${error}`);
    }

    const result = await response.json();

    return {
      success: true,
      orderID: result.orderID,
    };
  } catch (error) {
    console.error("Error submitting order:", error);
    throw error;
  }
}

/**
 * Get order status
 */
export async function getOrderStatus(
  orderHash: string
): Promise<{ status: string; fillAmount: string }> {
  try {
    const response = await fetch(
      `${POLYMARKET_API_URL}/order/${orderHash}`,
      {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
      }
    );

    if (!response.ok) {
      throw new Error("Failed to fetch order status");
    }

    const result = await response.json();

    return {
      status: result.status,
      fillAmount: result.fillAmount || "0",
    };
  } catch (error) {
    console.error("Error fetching order status:", error);
    throw error;
  }
}

/**
 * Cancel an order
 */
export async function cancelOrder(
  orderHash: string,
  privateKey: string
): Promise<{ success: boolean }> {
  try {
    const wallet = new ethers.Wallet(privateKey);

    const response = await fetch(`${POLYMARKET_API_URL}/order/${orderHash}`, {
      method: "DELETE",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${wallet.address}`,
      },
    });

    if (!response.ok) {
      throw new Error("Failed to cancel order");
    }

    return { success: true };
  } catch (error) {
    console.error("Error canceling order:", error);
    throw error;
  }
}

/**
 * Get market order book
 */
export async function getOrderBook(tokenId: string): Promise<{
  bids: Array<{ price: number; size: number }>;
  asks: Array<{ price: number; size: number }>;
}> {
  try {
    const response = await fetch(
      `${POLYMARKET_API_URL}/book?token_id=${tokenId}`,
      {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
      }
    );

    if (!response.ok) {
      throw new Error("Failed to fetch order book");
    }

    const result = await response.json();

    return {
      bids: result.bids || [],
      asks: result.asks || [],
    };
  } catch (error) {
    console.error("Error fetching order book:", error);
    throw error;
  }
}
