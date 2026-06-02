"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  ArrowLeft,
  Clock,
  BarChart2,
  Droplets,
  ExternalLink,
} from "lucide-react";
import PriceChart from "@/components/app/PriceChart";
import Orderbook from "@/components/app/Orderbook";
import TradePanel from "@/components/app/TradePanel";
import type { Market, Orderbook as OrderbookType, PricePoint } from "@/lib/polymarket";

type Interval = "1m" | "1h" | "1d" | "1w" | "all";

const INTERVALS: { value: Interval; label: string }[] = [
  { value: "1h", label: "1H" },
  { value: "1d", label: "1D" },
  { value: "1w", label: "1W" },
  { value: "all", label: "All" },
];

function formatVolume(n: number): string {
  if (n >= 1_000_000) return `$${(n / 1_000_000).toFixed(2)}M`;
  if (n >= 1_000) return `$${(n / 1_000).toFixed(1)}K`;
  return `$${n.toFixed(2)}`;
}

function formatDate(iso: string): string {
  if (!iso) return "No expiry";
  try {
    return new Date(iso).toLocaleDateString("en-US", {
      month: "long",
      day: "numeric",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return "—";
  }
}

export default function MarketDetailPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const id = params.id;

  const [market, setMarket] = useState<Market | null>(null);
  const [orderbook, setOrderbook] = useState<OrderbookType | null>(null);
  const [history, setHistory] = useState<PricePoint[]>([]);
  const [interval, setInterval] = useState<Interval>("1w");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const fetchMarketData = useCallback(async () => {
    if (!id) return;
    try {
      const res = await fetch(`/api/markets/${id}`);
      if (!res.ok) throw new Error("Market not found");
      const data = await res.json();
      setMarket(data.market);
      setOrderbook(data.orderbook);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    setLoading(true);
    setError(null);
    fetchMarketData();
    // 30-second polling for live price updates
    const intervalId = setInterval(() => {
      fetchMarketData();
    }, 30_000);
    pollRef.current = intervalId;
    return () => {
      if (pollRef.current) clearInterval(pollRef.current);
    };
  }, [fetchMarketData]);


  const loadHistory = useCallback(
    (iv: Interval) => {
      if (!market) return;
      fetch(`/api/markets/${id}/history?tokenId=${market.yesTokenId}&interval=${iv}`)
        .then((r) => r.json())
        .then((data) => setHistory(data.history ?? []))
        .catch(console.error);
    },
    [market, id]
  );

  useEffect(() => {
    if (market) loadHistory(interval);
  }, [market, interval, loadHistory]);

  if (loading) {
    return (
      <div className="market-detail-loading">
        <div className="market-detail-skeleton" />
        <div className="market-detail-skeleton short" />
        <div className="market-detail-skeleton tall" />
      </div>
    );
  }

  if (error || !market) {
    return (
      <div className="markets-error">
        <p>{error || "Market not found"}</p>
        <button onClick={() => router.push("/app/markets")} className="markets-retry-btn">
          ← Back to Markets
        </button>
      </div>
    );
  }

  const yesPercent = Math.round(market.yesPrice * 100);
  const noPercent = Math.round(market.noPrice * 100);

  return (
    <div className="market-detail">
      {/* Back nav */}
      <button
        id="market-detail-back-btn"
        className="market-detail-back"
        onClick={() => router.push("/app/markets")}
      >
        <ArrowLeft size={16} />
        All Markets
      </button>

      {/* Header */}
      <div className="market-detail-header">
        <div className="market-detail-meta">
          <span className="market-card-category">{market.category}</span>
          {market.featured && (
            <span className="market-card-featured">Featured</span>
          )}
        </div>
        <h1 className="market-detail-question">{market.question}</h1>

        {/* Quick stats row */}
        <div className="market-detail-stats">
          <div className="market-detail-stat">
            <BarChart2 size={14} />
            <span>{formatVolume(market.volume)}</span>
            <span className="mds-label">Volume</span>
          </div>
          <div className="market-detail-stat">
            <Droplets size={14} />
            <span>{formatVolume(market.liquidity)}</span>
            <span className="mds-label">Liquidity</span>
          </div>
          <div className="market-detail-stat">
            <Clock size={14} />
            <span>{formatDate(market.endDate)}</span>
            <span className="mds-label">Expires</span>
          </div>
        </div>
      </div>

      {/* Price cards */}
      <div className="market-outcome-cards">
        <div className="market-outcome-card yes">
          <div className="outcome-label">YES</div>
          <div className="outcome-price">{yesPercent}¢</div>
          <div className="outcome-prob">Probability</div>
        </div>
        <div className="market-outcome-card no">
          <div className="outcome-label">NO</div>
          <div className="outcome-price">{noPercent}¢</div>
          <div className="outcome-prob">Probability</div>
        </div>
      </div>

      {/* Main 2-col grid */}
      <div className="market-detail-grid">
        {/* Left: Chart */}
        <div className="market-detail-chart-panel">
          <div className="panel-header">
            <span className="panel-title">Price History (YES)</span>
            <div className="chart-interval-tabs">
              {INTERVALS.map((iv) => (
                <button
                  key={iv.value}
                  id={`chart-interval-${iv.value}`}
                  className={`chart-interval-btn ${interval === iv.value ? "active" : ""}`}
                  onClick={() => {
                    setInterval(iv.value);
                  }}
                >
                  {iv.label}
                </button>
              ))}
            </div>
          </div>
          <PriceChart data={history} interval={interval} />
        </div>

        {/* Right: Trade Panel + Orderbook */}
        <div className="market-detail-right-col">
          <TradePanel market={market} />
          <div className="market-detail-ob-panel">
            <div className="panel-header">
              <span className="panel-title">Orderbook (YES)</span>
            </div>
            {orderbook ? (
              <Orderbook orderbook={orderbook} />
            ) : (
              <div className="orderbook-empty">No orderbook data</div>
            )}
          </div>
        </div>
      </div>

      {/* Description */}
      {market.description && (
        <div className="market-description-panel">
          <div className="panel-header">
            <span className="panel-title">About This Market</span>
          </div>
          <p className="market-description-text">{market.description}</p>
        </div>
      )}

      {/* Polymarket link */}
      <a
        id="view-on-polymarket-link"
        href={`https://polymarket.com/event/${market.slug}`}
        target="_blank"
        rel="noopener noreferrer"
        className="polymarket-link"
      >
        <ExternalLink size={13} />
        View on Polymarket
      </a>
    </div>
  );
}
