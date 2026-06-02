"use client";

import type { Orderbook as OrderbookType } from "@/lib/polymarket";

interface OrderbookProps {
  orderbook: OrderbookType;
}

function pct(price: string): number {
  return Math.round(parseFloat(price) * 100);
}

function formatSize(size: string): string {
  const n = parseFloat(size);
  if (n >= 1000) return `${(n / 1000).toFixed(1)}K`;
  return n.toFixed(0);
}

export default function Orderbook({ orderbook }: OrderbookProps) {
  // Take top 8 levels for both sides
  const asks = orderbook.asks.slice(0, 8);
  const bids = orderbook.bids.slice(0, 8);

  const maxAskSize = Math.max(...asks.map((a) => parseFloat(a.size)), 1);
  const maxBidSize = Math.max(...bids.map((b) => parseFloat(b.size)), 1);

  return (
    <div className="orderbook">
      <div className="orderbook-header">
        <span>Price</span>
        <span>Size</span>
        <span>Total</span>
      </div>

      {/* Asks (sellers of YES = NO side) */}
      <div className="orderbook-side asks">
        {asks.reverse().map((level, i) => {
          const sizePct = (parseFloat(level.size) / maxAskSize) * 100;
          return (
            <div key={i} className="orderbook-row ask">
              <div
                className="orderbook-bg ask-bg"
                style={{ width: `${sizePct}%` }}
              />
              <span className="ob-price ask-price">{pct(level.price)}¢</span>
              <span className="ob-size">{formatSize(level.size)}</span>
              <span className="ob-total">
                ${(parseFloat(level.price) * parseFloat(level.size)).toFixed(0)}
              </span>
            </div>
          );
        })}
      </div>

      {/* Spread */}
      <div className="orderbook-spread">
        <span>Spread</span>
        {asks.length > 0 && bids.length > 0 && (
          <span>
            {Math.abs(
              pct(asks[0]?.price || "0") - pct(bids[0]?.price || "0")
            )}
            ¢
          </span>
        )}
      </div>

      {/* Bids (buyers of YES) */}
      <div className="orderbook-side bids">
        {bids.map((level, i) => {
          const sizePct = (parseFloat(level.size) / maxBidSize) * 100;
          return (
            <div key={i} className="orderbook-row bid">
              <div
                className="orderbook-bg bid-bg"
                style={{ width: `${sizePct}%` }}
              />
              <span className="ob-price bid-price">{pct(level.price)}¢</span>
              <span className="ob-size">{formatSize(level.size)}</span>
              <span className="ob-total">
                ${(parseFloat(level.price) * parseFloat(level.size)).toFixed(0)}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
