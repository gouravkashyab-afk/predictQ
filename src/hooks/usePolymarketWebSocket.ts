import { useEffect, useRef, useCallback, useState } from "react";
import { PolymarketWebSocket, type MarketEvent } from "@/lib/polymarket-websocket";

interface UsePolymarketWebSocketOptions {
  assetIds: string[];
  onPriceUpdate?: (assetId: string, price: number) => void;
  enabled?: boolean;
}

/**
 * React hook for Polymarket WebSocket connection
 * Automatically connects/disconnects based on component lifecycle
 * 
 * FIXED: Memory leak caused by:
 * 1. Not properly cleaning up WebSocket instance
 * 2. Creating new instances on every render
 * 3. handleMessage callback changing on every render
 */
export function usePolymarketWebSocket({
  assetIds,
  onPriceUpdate,
  enabled = true,
}: UsePolymarketWebSocketOptions) {
  const wsRef = useRef<PolymarketWebSocket | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const mountedRef = useRef(true);

  // Stable callback that doesn't change on every render
  const handleMessage = useCallback((event: MarketEvent) => {
    if (!mountedRef.current || !onPriceUpdate) return;

    // Handle price updates
    if (event.event_type === "last_trade_price") {
      const price = parseFloat(event.price);
      onPriceUpdate(event.asset_id, price);
    } else if (event.event_type === "price_change") {
      const price = parseFloat(event.price);
      onPriceUpdate(event.asset_id, price);
    } else if (event.event_type === "book") {
      // Use best bid/ask as price
      if (event.asks.length > 0) {
        const bestAsk = parseFloat(event.asks[0].price);
        onPriceUpdate(event.asset_id, bestAsk);
      }
    }
  }, [onPriceUpdate]);

  useEffect(() => {
    mountedRef.current = true;

    if (!enabled || assetIds.length === 0) {
      // Clean up if disabled
      if (wsRef.current) {
        wsRef.current.disconnect();
        wsRef.current = null;
        setIsConnected(false);
      }
      return;
    }

    // Create WebSocket instance only once
    if (!wsRef.current) {
      wsRef.current = new PolymarketWebSocket({
        onMessage: handleMessage,
        onConnect: () => {
          if (mountedRef.current) {
            console.log("[usePolymarketWebSocket] Connected");
            setIsConnected(true);
          }
        },
        onDisconnect: () => {
          if (mountedRef.current) {
            console.log("[usePolymarketWebSocket] Disconnected");
            setIsConnected(false);
          }
        },
        onError: (error) => {
          console.error("[usePolymarketWebSocket] Error:", error);
        },
      });

      // Connect with asset IDs
      wsRef.current.connect(assetIds);
    }

    // Cleanup on unmount
    return () => {
      mountedRef.current = false;
      if (wsRef.current) {
        console.log("[usePolymarketWebSocket] Cleaning up WebSocket");
        wsRef.current.disconnect();
        wsRef.current = null;
      }
      setIsConnected(false);
    };
  }, [assetIds, enabled, handleMessage]);

  return {
    isConnected,
  };
}
