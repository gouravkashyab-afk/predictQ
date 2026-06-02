"use client";

import { useState, useEffect, useRef } from "react";
import { Fish, RefreshCw, TrendingUp, Filter } from "lucide-react";
import WhaleFeed, { type WhaleEventData } from "@/components/app/WhaleFeed";

type DirectionFilter = "ALL" | "IN" | "OUT";

function formatAmount(n: number): string {
  if (n >= 1_000_000) return `$${(n / 1_000_000).toFixed(2)}M`;
  if (n >= 1_000) return `$${(n / 1_000).toFixed(0)}K`;
  return `$${n.toFixed(0)}`;
}

export default function WhalesPage() {
  const [events, setEvents] = useState<WhaleEventData[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [direction, setDirection] = useState<DirectionFilter>("ALL");
  const [minAmount, setMinAmount] = useState(0);
  const [stats, setStats] = useState({
    volume24h: 0,
    biggestTrade: 0,
    eventCount24h: 0,
  });
  const [error, setError] = useState<string | null>(null);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  const loadWhales = async (reset = false) => {
    try {
      if (reset) setLoading(true);
      else setRefreshing(true);
      setError(null);

      const params = new URLSearchParams({ limit: "30" });
      if (direction !== "ALL") params.set("direction", direction);
      if (minAmount > 0) params.set("minAmount", String(minAmount));

      const res = await fetch(`/api/whales?${params.toString()}`);
      if (!res.ok) throw new Error("Failed to fetch whale data");
      const data = await res.json();
      setEvents(data.events ?? []);
      if (data.stats) setStats(data.stats);
    } catch (err) {
      setError("Failed to load whale activity.");
      console.error(err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  // Auto-refresh every 30s
  useEffect(() => {
    loadWhales(true);
    intervalRef.current = setInterval(() => loadWhales(false), 30_000);
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [direction, minAmount]);

  return (
    <div className="whales-page">
      {/* Header */}
      <div className="whales-header">
        <div className="whales-header-left">
          <h1 className="whales-title">
            <Fish size={20} className="whales-title-icon" />
            Whale Feed
          </h1>
          <p className="whales-subtitle">
            Large USDC flows on Polymarket (Polygon)
          </p>
        </div>
        <button
          id="whales-refresh-btn"
          className={`whales-refresh-btn ${refreshing ? "spinning" : ""}`}
          onClick={() => loadWhales(false)}
          disabled={loading}
          aria-label="Refresh whale feed"
        >
          <RefreshCw size={14} />
        </button>
      </div>

      {/* Stats row */}
      <div className="whales-stats">
        <div className="whale-stat-card" id="whale-stat-volume">
          <div className="whale-stat-icon">
            <TrendingUp size={16} />
          </div>
          <div className="whale-stat-info">
            <span className="whale-stat-label">24h Volume</span>
            <span className="whale-stat-value">{formatAmount(stats.volume24h)}</span>
          </div>
        </div>
        <div className="whale-stat-card" id="whale-stat-biggest">
          <div className="whale-stat-icon">🐋</div>
          <div className="whale-stat-info">
            <span className="whale-stat-label">Biggest Trade</span>
            <span className="whale-stat-value">{formatAmount(stats.biggestTrade)}</span>
          </div>
        </div>
        <div className="whale-stat-card" id="whale-stat-count">
          <div className="whale-stat-icon">
            <Fish size={16} />
          </div>
          <div className="whale-stat-info">
            <span className="whale-stat-label">Events (24h)</span>
            <span className="whale-stat-value">{stats.eventCount24h}</span>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="whales-filters">
        <div className="whales-direction-tabs">
          {(["ALL", "IN", "OUT"] as DirectionFilter[]).map((dir) => (
            <button
              key={dir}
              id={`whale-dir-${dir.toLowerCase()}`}
              className={`whales-dir-btn ${direction === dir ? "active" : ""}`}
              onClick={() => setDirection(dir)}
            >
              {dir === "ALL" ? "All" : dir === "IN" ? "↓ Deposits" : "↑ Withdrawals"}
            </button>
          ))}
        </div>

        <div className="whales-amount-filter">
          <Filter size={13} />
          <span>Min:</span>
          {[0, 10_000, 50_000, 100_000].map((amt) => (
            <button
              key={amt}
              id={`whale-amt-${amt}`}
              className={`whales-amount-btn ${minAmount === amt ? "active" : ""}`}
              onClick={() => setMinAmount(amt)}
            >
              {amt === 0 ? "Any" : formatAmount(amt)}
            </button>
          ))}
        </div>
      </div>

      {/* Feed */}
      {error ? (
        <div className="whales-error">
          <p>{error}</p>
          <button onClick={() => loadWhales(true)} className="whales-retry-btn">
            Retry
          </button>
        </div>
      ) : (
        <div className="whales-feed-panel">
          <div className="panel-header">
            <span className="panel-title">Live Whale Activity</span>
            <span className="whales-count">
              {loading ? "Loading..." : `${events.length} events`}
            </span>
          </div>
          <WhaleFeed events={events} loading={loading} />
        </div>
      )}

      {/* Auto-refresh indicator */}
      <div className="signals-auto-refresh">
        <div className="auto-refresh-dot" />
        Auto-refreshing every 30s
      </div>
    </div>
  );
}
