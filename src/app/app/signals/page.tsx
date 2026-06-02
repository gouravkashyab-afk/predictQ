"use client";

import { useState, useEffect, useRef } from "react";
import { Zap, RefreshCw, Filter, Bot } from "lucide-react";
import SignalCard from "@/components/app/SignalCard";

type Direction = "ALL" | "YES" | "NO";

const DIRECTION_TABS: { label: string; value: Direction }[] = [
  { label: "All Signals", value: "ALL" },
  { label: "BUY YES", value: "YES" },
  { label: "BUY NO", value: "NO" },
];

interface Signal {
  id: string;
  conditionId: string;
  question: string;
  direction: "YES" | "NO";
  confidence: number;
  reasoning: string;
  model: string;
  yesPrice: number;
  noPrice: number;
  volume: number;
  category: string;
  createdAt: string;
}

export default function SignalsPage() {
  const [signals, setSignals] = useState<Signal[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [direction, setDirection] = useState<Direction>("ALL");
  const [minConfidence, setMinConfidence] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  const loadSignals = async (reset = false) => {
    try {
      if (reset) setLoading(true);
      else setRefreshing(true);
      setError(null);

      const params = new URLSearchParams({ limit: "20" });
      if (direction !== "ALL") params.set("direction", direction);
      if (minConfidence > 0) params.set("minConfidence", String(minConfidence));

      const res = await fetch(`/api/signals?${params.toString()}`);
      if (!res.ok) throw new Error("Failed to fetch signals");
      const data = await res.json();
      setSignals(data.signals ?? []);
    } catch (err) {
      setError("Failed to load signals. Retrying...");
      console.error(err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  // Auto-refresh every 60s
  useEffect(() => {
    loadSignals(true);
    intervalRef.current = setInterval(() => loadSignals(false), 60_000);
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [direction, minConfidence]);

  const yesCount = signals.filter((s) => s.direction === "YES").length;
  const noCount = signals.filter((s) => s.direction === "NO").length;
  const avgConfidence =
    signals.length > 0
      ? Math.round(signals.reduce((s, c) => s + c.confidence, 0) / signals.length)
      : 0;

  return (
    <div className="signals-page">
      {/* Header */}
      <div className="signals-header">
        <div className="signals-header-left">
          <h1 className="signals-title">
            <Zap size={20} className="signals-title-icon" />
            AI Signals
          </h1>
          <div className="signals-stats-row">
            <span className="signals-stat-pill yes">{yesCount} BUY YES</span>
            <span className="signals-stat-pill no">{noCount} BUY NO</span>
            {avgConfidence > 0 && (
              <span className="signals-stat-pill neutral">{avgConfidence}% avg confidence</span>
            )}
          </div>
        </div>
        <button
          id="signals-refresh-btn"
          className={`signals-refresh-btn ${refreshing ? "spinning" : ""}`}
          onClick={() => loadSignals(false)}
          disabled={loading}
          aria-label="Refresh signals"
        >
          <RefreshCw size={14} />
        </button>
      </div>

      {/* Direction tabs */}
      <div className="signals-tabs">
        {DIRECTION_TABS.map((tab) => (
          <button
            key={tab.value}
            id={`signals-tab-${tab.value.toLowerCase()}`}
            className={`signals-tab ${direction === tab.value ? "active" : ""} ${
              tab.value === "YES" ? "yes-tab" : tab.value === "NO" ? "no-tab" : ""
            }`}
            onClick={() => setDirection(tab.value)}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Confidence filter */}
      <div className="signals-filter-row">
        <Filter size={13} />
        <span className="signals-filter-label">Min Confidence:</span>
        {[0, 60, 70, 80].map((val) => (
          <button
            key={val}
            id={`conf-filter-${val}`}
            className={`signals-conf-btn ${minConfidence === val ? "active" : ""}`}
            onClick={() => setMinConfidence(val)}
          >
            {val === 0 ? "Any" : `${val}%+`}
          </button>
        ))}
      </div>

      {/* Content */}
      {error ? (
        <div className="signals-error">
          <p>{error}</p>
          <button onClick={() => loadSignals(true)} className="signals-retry-btn">
            Retry
          </button>
        </div>
      ) : loading ? (
        <div className="signals-grid">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="signal-card skeleton" />
          ))}
        </div>
      ) : signals.length === 0 ? (
        <div className="signals-empty">
          <Bot size={40} className="signals-empty-icon" />
          <p>No signals found</p>
          <span>Try adjusting your filters</span>
        </div>
      ) : (
        <div className="signals-grid">
          {signals.map((signal) => (
            <SignalCard key={signal.id} signal={signal} />
          ))}
        </div>
      )}

      {/* Auto-refresh indicator */}
      <div className="signals-auto-refresh">
        <div className="auto-refresh-dot" />
        Auto-refreshing every 60s
      </div>
    </div>
  );
}
