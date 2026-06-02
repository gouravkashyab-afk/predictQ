/**
 * Polymarket WebSocket Client
 * Connects to Polymarket's real-time market data feed
 * Documentation: https://docs.polymarket.com/market-data/websocket/overview
 */

export interface PriceChangeEvent {
  event_type: "price_change";
  asset_id: string;
  price: string;
  side: "BUY" | "SELL";
  size: string;
  timestamp: number;
}

export interface LastTradePriceEvent {
  event_type: "last_trade_price";
  asset_id: string;
  price: string;
  timestamp: number;
}

export interface BookEvent {
  event_type: "book";
  asset_id: string;
  market: string;
  bids: Array<{ price: string; size: string }>;
  asks: Array<{ price: string; size: string }>;
  timestamp: number;
}

export type MarketEvent = PriceChangeEvent | LastTradePriceEvent | BookEvent;

export interface PolymarketWebSocketOptions {
  onMessage?: (event: MarketEvent) => void;
  onError?: (error: Error) => void;
  onConnect?: () => void;
  onDisconnect?: () => void;
}

export class PolymarketWebSocket {
  private ws: WebSocket | null = null;
  private assetIds: string[] = [];
  private options: PolymarketWebSocketOptions;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private reconnectDelay = 1000;
  private pingInterval: NodeJS.Timeout | null = null;
  private isIntentionallyClosed = false;

  constructor(options: PolymarketWebSocketOptions = {}) {
    this.options = options;
  }

  /**
   * Connect to Polymarket WebSocket and subscribe to asset IDs
   */
  connect(assetIds: string[]) {
    if (this.ws?.readyState === WebSocket.OPEN) {
      // Already connected, just update subscription
      this.subscribe(assetIds);
      return;
    }

    this.assetIds = assetIds;
    this.isIntentionallyClosed = false;

    try {
      this.ws = new WebSocket("wss://ws-subscriptions-clob.polymarket.com/ws/market");

      this.ws.onopen = () => {
        console.log("[Polymarket WS] Connected");
        this.reconnectAttempts = 0;
        this.options.onConnect?.();

        // Subscribe to markets
        this.subscribe(this.assetIds);

        // Start heartbeat
        this.startHeartbeat();
      };

      this.ws.onmessage = (event) => {
        if (event.data === "PONG") {
          // Heartbeat response
          return;
        }

        try {
          const data = JSON.parse(event.data);
          this.options.onMessage?.(data);
        } catch (error) {
          console.error("[Polymarket WS] Failed to parse message:", error);
        }
      };

      this.ws.onerror = (error) => {
        console.error("[Polymarket WS] Error:", error);
        this.options.onError?.(new Error("WebSocket error"));
      };

      this.ws.onclose = () => {
        console.log("[Polymarket WS] Disconnected");
        this.stopHeartbeat();
        this.options.onDisconnect?.();

        // Attempt to reconnect unless intentionally closed
        if (!this.isIntentionallyClosed && this.reconnectAttempts < this.maxReconnectAttempts) {
          this.reconnectAttempts++;
          const delay = this.reconnectDelay * Math.pow(2, this.reconnectAttempts - 1);
          console.log(`[Polymarket WS] Reconnecting in ${delay}ms (attempt ${this.reconnectAttempts}/${this.maxReconnectAttempts})`);
          
          setTimeout(() => {
            this.connect(this.assetIds);
          }, delay);
        }
      };
    } catch (error) {
      console.error("[Polymarket WS] Connection failed:", error);
      this.options.onError?.(error as Error);
    }
  }

  /**
   * Subscribe to asset IDs
   */
  private subscribe(assetIds: string[]) {
    if (!this.ws || this.ws.readyState !== WebSocket.OPEN) {
      console.warn("[Polymarket WS] Cannot subscribe - not connected");
      return;
    }

    const message = {
      assets_ids: assetIds,
      type: "market",
    };

    this.ws.send(JSON.stringify(message));
    console.log(`[Polymarket WS] Subscribed to ${assetIds.length} assets`);
  }

  /**
   * Add more asset IDs to subscription
   */
  addAssets(assetIds: string[]) {
    if (!this.ws || this.ws.readyState !== WebSocket.OPEN) {
      console.warn("[Polymarket WS] Cannot add assets - not connected");
      return;
    }

    const message = {
      assets_ids: assetIds,
      operation: "subscribe",
    };

    this.ws.send(JSON.stringify(message));
    this.assetIds.push(...assetIds);
  }

  /**
   * Remove asset IDs from subscription
   */
  removeAssets(assetIds: string[]) {
    if (!this.ws || this.ws.readyState !== WebSocket.OPEN) {
      console.warn("[Polymarket WS] Cannot remove assets - not connected");
      return;
    }

    const message = {
      assets_ids: assetIds,
      operation: "unsubscribe",
    };

    this.ws.send(JSON.stringify(message));
    this.assetIds = this.assetIds.filter(id => !assetIds.includes(id));
  }

  /**
   * Start heartbeat (PING every 10 seconds)
   */
  private startHeartbeat() {
    this.stopHeartbeat();
    
    this.pingInterval = setInterval(() => {
      if (this.ws?.readyState === WebSocket.OPEN) {
        this.ws.send("PING");
      }
    }, 10000);
  }

  /**
   * Stop heartbeat
   */
  private stopHeartbeat() {
    if (this.pingInterval) {
      clearInterval(this.pingInterval);
      this.pingInterval = null;
    }
  }

  /**
   * Disconnect from WebSocket
   */
  disconnect() {
    this.isIntentionallyClosed = true;
    this.stopHeartbeat();
    
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
  }

  /**
   * Check if connected
   */
  isConnected(): boolean {
    return this.ws?.readyState === WebSocket.OPEN;
  }
}
