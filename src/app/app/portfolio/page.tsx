"use client";

import { useState, useEffect } from "react";
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from "recharts";
import {
  TrendingUp, TrendingDown, DollarSign, BarChart2, Bot, Zap, Clock,
} from "lucide-react";
import Link from "next/link";

interface PortfolioData {
  summary: {
    totalTrades: number;
    filledTrades: number;
    pendingTrades: number;
    failedTrades: number;
    totalInvested: number;
    totalShares: number;
    totalPotentialPayout: number;
    unrealizedPnl: number;
    activeAgents: number;
    totalAgents: number;
  };
  openPositions: Array<{
    conditionId: string;
    question: string;
    direction: string;
    totalInvested: number;
    totalShares: number;
    potentialPayout: number;
    tradeCount: number;
    latestPrice: number;
  }>;
  recentTrades: Array<{
    id: string;
    conditionId: string;
    question: string;
    direction: string;
    amountUsdc: number;
    pricePerShare: number;
    shares: number;
    potentialPayout: number;
    status: string;
    createdAt: string;
  }>;
  pnlHistory: Array<{ date: string; pnl: number }>;
}

function formatUsd(n: number): string {
  if (Math.abs(n) >= 1000) return `$${(n / 1000).toFixed(2)}K`;
  return `$${Math.abs(n).toFixed(2)}`;
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

export default function PortfolioPage() {
  const [data, setData] = useState<PortfolioData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/portfolio")
      .then((r) => r.json())
      .then(setData)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="portfolio-page">
        <div className="portfolio-skeleton-grid">
          {[1, 2, 3, 4].map((i) => <div key={i} className="portfolio-stat-card skeleton" />)}
        </div>
      </div>
    );
  }

  const summary = data?.summary;
  const pnl = summary?.unrealizedPnl ?? 0;
  const pnlPositive = pnl >= 0;

  // Empty state
  if (!summary || summary.totalTrades === 0) {
    return (
      <div className="portfolio-page">
        <h1 className="portfolio-title"><DollarSign size={20} />Portfolio</h1>
        <div className="portfolio-empty">
          <BarChart2 size={48} className="portfolio-empty-icon" />
          <p>No trades yet</p>
          <span>Start trading on any market to track your positions here</span>
          <Link href="/app/markets" className="portfolio-cta-btn">
            <Zap size={14} /> Browse Markets
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="portfolio-page">
      <h1 className="portfolio-title"><DollarSign size={20} />Portfolio</h1>

      {/* Stats cards */}
      <div className="portfolio-stats-grid">
        <div className="portfolio-stat-card" id="portfolio-invested">
          <div className="portfolio-stat-icon"><DollarSign size={16} /></div>
          <div className="portfolio-stat-info">
            <span className="portfolio-stat-label">Total Invested</span>
            <span className="portfolio-stat-value">{formatUsd(summary.totalInvested)}</span>
          </div>
        </div>
        <div className="portfolio-stat-card" id="portfolio-payout">
          <div className="portfolio-stat-icon"><TrendingUp size={16} /></div>
          <div className="portfolio-stat-info">
            <span className="portfolio-stat-label">Potential Payout</span>
            <span className="portfolio-stat-value">{formatUsd(summary.totalPotentialPayout)}</span>
          </div>
        </div>
        <div className={`portfolio-stat-card ${pnlPositive ? "positive" : "negative"}`} id="portfolio-pnl">
          <div className="portfolio-stat-icon">
            {pnlPositive ? <TrendingUp size={16} /> : <TrendingDown size={16} />}
          </div>
          <div className="portfolio-stat-info">
            <span className="portfolio-stat-label">Unrealized P&amp;L</span>
            <span className={`portfolio-stat-value ${pnlPositive ? "positive" : "negative"}`}>
              {pnlPositive ? "+" : "-"}{formatUsd(pnl)}
            </span>
          </div>
        </div>
        <div className="portfolio-stat-card" id="portfolio-trades">
          <div className="portfolio-stat-icon"><BarChart2 size={16} /></div>
          <div className="portfolio-stat-info">
            <span className="portfolio-stat-label">Total Trades</span>
            <span className="portfolio-stat-value">{summary.totalTrades}</span>
          </div>
        </div>
      </div>

      {/* P&L Chart */}
      {data.pnlHistory.length > 1 && (
        <div className="portfolio-chart-panel">
          <div className="panel-header">
            <span className="panel-title">P&amp;L History</span>
          </div>
          <div className="portfolio-chart-wrap">
            <ResponsiveContainer width="100%" height={200}>
              <AreaChart data={data.pnlHistory} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="pnlGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor={pnlPositive ? "#22c55e" : "#f87171"} stopOpacity={0.25} />
                    <stop offset="95%" stopColor={pnlPositive ? "#22c55e" : "#f87171"} stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                <XAxis dataKey="date" hide />
                <YAxis tickFormatter={(v) => `$${v}`} tick={{ fill: "rgba(255,255,255,0.3)", fontSize: 11 }} width={48} />
                <Tooltip
                  contentStyle={{ background: "#0a0a14", border: "1px solid rgba(255,255,255,0.1)", borderRadius: "0.5rem" }}
                  labelStyle={{ color: "rgba(255,255,255,0.5)" }}
                  formatter={(v: number) => [`$${v.toFixed(2)}`, "Cumulative P&L"]}
                />
                <Area type="monotone" dataKey="pnl" stroke={pnlPositive ? "#22c55e" : "#f87171"}
                  strokeWidth={2} fill="url(#pnlGrad)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {/* Open Positions */}
      {data.openPositions.length > 0 && (
        <div className="portfolio-panel">
          <div className="panel-header">
            <span className="panel-title">Open Positions</span>
            <span className="portfolio-count">{data.openPositions.length}</span>
          </div>
          <div className="portfolio-positions">
            {data.openPositions.map((pos) => {
              const positionPnl = pos.potentialPayout - pos.totalInvested;
              return (
                <div key={`${pos.conditionId}-${pos.direction}`} className="position-row">
                  <div className={`position-direction ${pos.direction.toLowerCase()}`}>
                    {pos.direction}
                  </div>
                  <div className="position-info">
                    <p className="position-question">{pos.question}</p>
                    <span className="position-meta">
                      {pos.tradeCount} trade{pos.tradeCount > 1 ? "s" : ""} · 
                      {pos.totalShares.toFixed(0)} shares
                    </span>
                  </div>
                  <div className="position-financials">
                    <span className="position-invested">{formatUsd(pos.totalInvested)}</span>
                    <span className={`position-pnl ${positionPnl >= 0 ? "positive" : "negative"}`}>
                      {positionPnl >= 0 ? "+" : ""}{formatUsd(positionPnl)}
                    </span>
                  </div>
                  <Link href={`/app/markets/${pos.conditionId}`} className="position-link">→</Link>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Recent Trades */}
      <div className="portfolio-panel">
        <div className="panel-header">
          <span className="panel-title">Recent Trades</span>
        </div>
        <div className="portfolio-trades">
          {data.recentTrades.map((trade) => (
            <div key={trade.id} className="trade-history-row">
              <div className={`trade-history-dir ${trade.direction.toLowerCase()}`}>{trade.direction}</div>
              <div className="trade-history-info">
                <p className="trade-history-q">{trade.question.slice(0, 60)}...</p>
                <span className="trade-history-meta">
                  <Clock size={10} /> {timeAgo(trade.createdAt)}
                </span>
              </div>
              <div className="trade-history-amount">${trade.amountUsdc.toFixed(0)}</div>
              <div className={`trade-history-status ${trade.status}`}>{trade.status}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
