"use client";

import Link from "next/link";
import { Zap, TrendingUp, TrendingDown, Bot } from "lucide-react";

export interface SignalCardProps {
  signal: {
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
  };
}

function formatVolume(n: number): string {
  if (n >= 1_000_000) return `$${(n / 1_000_000).toFixed(2)}M`;
  if (n >= 1_000) return `$${(n / 1_000).toFixed(1)}K`;
  return `$${n.toFixed(2)}`;
}

function timeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60_000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}

export default function SignalCard({ signal }: SignalCardProps) {
  const isYes = signal.direction === "YES";
  const confidenceColor =
    signal.confidence >= 80
      ? "#22c55e"
      : signal.confidence >= 65
      ? "#f59e0b"
      : "#94a3b8";

  return (
    <div className={`signal-card ${isYes ? "signal-yes" : "signal-no"}`} id={`signal-${signal.id}`}>
      {/* Header */}
      <div className="signal-card-header">
        <div className="signal-card-badges">
          <span className={`signal-direction-badge ${isYes ? "yes" : "no"}`}>
            {isYes ? <TrendingUp size={12} /> : <TrendingDown size={12} />}
            BUY {signal.direction}
          </span>
          <span className="signal-category-badge">{signal.category}</span>
        </div>
        <span className="signal-time">{timeAgo(signal.createdAt)}</span>
      </div>

      {/* Question */}
      <p className="signal-question">{signal.question}</p>

      {/* Confidence bar */}
      <div className="signal-confidence-wrap">
        <div className="signal-confidence-label">
          <span>Confidence</span>
          <span className="signal-confidence-pct" style={{ color: confidenceColor }}>
            {signal.confidence}%
          </span>
        </div>
        <div className="signal-confidence-track">
          <div
            className="signal-confidence-fill"
            style={{
              width: `${signal.confidence}%`,
              background: `linear-gradient(90deg, ${confidenceColor}88, ${confidenceColor})`,
            }}
          />
        </div>
      </div>

      {/* Price pills */}
      <div className="signal-prices">
        <div className={`signal-price-pill ${isYes ? "highlighted" : ""}`}>
          <span className="price-pill-label">YES</span>
          <span className="price-pill-value">{Math.round(signal.yesPrice * 100)}¢</span>
        </div>
        <div className={`signal-price-pill ${!isYes ? "highlighted" : ""}`}>
          <span className="price-pill-label">NO</span>
          <span className="price-pill-value">{Math.round(signal.noPrice * 100)}¢</span>
        </div>
        <div className="signal-price-pill">
          <span className="price-pill-label">Vol</span>
          <span className="price-pill-value">{formatVolume(signal.volume)}</span>
        </div>
      </div>

      {/* Reasoning */}
      <p className="signal-reasoning">{signal.reasoning}</p>

      {/* Footer */}
      <div className="signal-card-footer">
        <div className="signal-model-tag">
          <Bot size={11} />
          {signal.model === "mock" ? "Demo Signal" : signal.model}
        </div>
        <Link
          href={`/app/markets/${signal.conditionId}`}
          className="signal-view-market-btn"
        >
          <Zap size={12} />
          View Market
        </Link>
      </div>
    </div>
  );
}
