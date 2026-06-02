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
    // Enhanced fields
    expectedValue?: number;
    impliedProbability?: number;
    aiProbability?: number;
    sentiment?: "bullish" | "bearish" | "neutral";
    technicalSignal?: "strong_buy" | "buy" | "neutral" | "sell" | "strong_sell";
    volumeMomentum?: "increasing" | "stable" | "decreasing";
    edgePercentage?: number;
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

  // EV color coding
  const evColor = 
    !signal.expectedValue ? "#94a3b8" :
    signal.expectedValue > 10 ? "#22c55e" :
    signal.expectedValue > 0 ? "#f59e0b" :
    "#ef4444";

  // Technical signal display
  const techSignalColor = {
    strong_buy: "#22c55e",
    buy: "#10b981",
    neutral: "#94a3b8",
    sell: "#f59e0b",
    strong_sell: "#ef4444",
  }[signal.technicalSignal ?? "neutral"];

  // Sentiment emoji
  const sentimentEmoji = {
    bullish: "📈",
    bearish: "📉",
    neutral: "➡️",
  }[signal.sentiment ?? "neutral"];

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

      {/* Enhanced Metrics (EV, Edge, Sentiment) */}
      {(signal.expectedValue !== undefined || signal.edgePercentage !== undefined) && (
        <div className="signal-metrics" style={{ 
          display: "grid", 
          gridTemplateColumns: "repeat(3, 1fr)", 
          gap: "0.5rem", 
          marginTop: "0.75rem",
          paddingTop: "0.75rem",
          borderTop: "1px solid rgba(255,255,255,0.05)"
        }}>
          {signal.expectedValue !== undefined && (
            <div style={{ textAlign: "center" }}>
              <div style={{ fontSize: "0.7rem", color: "#94a3b8", marginBottom: "0.25rem" }}>
                Expected Value
              </div>
              <div style={{ 
                fontSize: "1rem", 
                fontWeight: "600",
                color: evColor
              }}>
                {signal.expectedValue > 0 ? '+' : ''}{signal.expectedValue.toFixed(1)}%
              </div>
            </div>
          )}
          {signal.edgePercentage !== undefined && (
            <div style={{ textAlign: "center" }}>
              <div style={{ fontSize: "0.7rem", color: "#94a3b8", marginBottom: "0.25rem" }}>
                Edge
              </div>
              <div style={{ 
                fontSize: "1rem", 
                fontWeight: "600",
                color: signal.edgePercentage > 15 ? "#22c55e" : signal.edgePercentage > 10 ? "#f59e0b" : "#94a3b8"
              }}>
                {signal.edgePercentage.toFixed(1)}%
              </div>
            </div>
          )}
          {signal.sentiment && (
            <div style={{ textAlign: "center" }}>
              <div style={{ fontSize: "0.7rem", color: "#94a3b8", marginBottom: "0.25rem" }}>
                Sentiment
              </div>
              <div style={{ fontSize: "1rem", fontWeight: "600" }}>
                {sentimentEmoji} {signal.sentiment}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Technical Signal Badge */}
      {signal.technicalSignal && signal.technicalSignal !== "neutral" && (
        <div style={{
          marginTop: "0.5rem",
          padding: "0.375rem 0.75rem",
          background: `${techSignalColor}15`,
          border: `1px solid ${techSignalColor}40`,
          borderRadius: "0.5rem",
          display: "inline-block",
          fontSize: "0.75rem",
          fontWeight: "600",
          color: techSignalColor,
          textTransform: "uppercase",
          letterSpacing: "0.05em"
        }}>
          {signal.technicalSignal.replace('_', ' ')}
        </div>
      )}

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
