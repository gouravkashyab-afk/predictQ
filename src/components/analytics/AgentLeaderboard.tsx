"use client";

import { useEffect, useState } from "react";
import { Trophy, TrendingUp, TrendingDown, Target } from "lucide-react";

interface AgentMetrics {
  agentId: string;
  agentName: string;
  metrics: {
    totalPnL: number;
    winRate: number;
    totalTrades: number;
    roi: number;
    sharpeRatio: number;
  };
}

interface LeaderboardData {
  agents: AgentMetrics[];
  strategies: Record<string, any>;
  summary: {
    totalAgents: number;
    profitableAgents: number;
    totalPnL: number;
    avgWinRate: number;
    bestStrategy: string;
  };
}

export function AgentLeaderboard() {
  const [data, setData] = useState<LeaderboardData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [sortBy, setSortBy] = useState<"pnl" | "winRate" | "roi">("pnl");

  useEffect(() => {
    fetchLeaderboard();
  }, []);

  const fetchLeaderboard = async () => {
    setIsLoading(true);
    try {
      const res = await fetch("/api/performance/leaderboard");
      if (!res.ok) throw new Error("Failed to fetch leaderboard");
      const leaderboardData = await res.json();
      setData(leaderboardData);
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="p-6 border rounded-lg bg-card">
        <p className="text-center text-muted-foreground">Loading leaderboard...</p>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="p-6 border rounded-lg bg-card">
        <p className="text-center text-red-500">Failed to load leaderboard</p>
      </div>
    );
  }

  // Sort agents
  const sortedAgents = [...data.agents].sort((a, b) => {
    switch (sortBy) {
      case "pnl":
        return b.metrics.totalPnL - a.metrics.totalPnL;
      case "winRate":
        return b.metrics.winRate - a.metrics.winRate;
      case "roi":
        return b.metrics.roi - a.metrics.roi;
      default:
        return 0;
    }
  });

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="p-4 border rounded-lg bg-card">
          <p className="text-sm text-muted-foreground mb-1">Total Agents</p>
          <p className="text-2xl font-bold">{data.summary.totalAgents}</p>
        </div>
        <div className="p-4 border rounded-lg bg-card">
          <p className="text-sm text-muted-foreground mb-1">Profitable</p>
          <p className="text-2xl font-bold text-green-600">
            {data.summary.profitableAgents}
          </p>
        </div>
        <div className="p-4 border rounded-lg bg-card">
          <p className="text-sm text-muted-foreground mb-1">Total P&L</p>
          <p className={`text-2xl font-bold ${
            data.summary.totalPnL > 0 ? "text-green-600" : "text-red-600"
          }`}>
            {data.summary.totalPnL > 0 ? "+" : ""}${data.summary.totalPnL.toFixed(2)}
          </p>
        </div>
        <div className="p-4 border rounded-lg bg-card">
          <p className="text-sm text-muted-foreground mb-1">Avg Win Rate</p>
          <p className="text-2xl font-bold">{data.summary.avgWinRate.toFixed(1)}%</p>
        </div>
      </div>

      {/* Leaderboard Table */}
      <div className="border rounded-lg bg-card">
        <div className="p-4 border-b">
          <div className="flex items-center justify-between">
            <h3 className="font-semibold flex items-center gap-2">
              <Trophy className="h-5 w-5 text-yellow-500" />
              Agent Leaderboard
            </h3>
            <div className="flex gap-2">
              <button
                onClick={() => setSortBy("pnl")}
                className={`px-3 py-1 text-sm rounded ${
                  sortBy === "pnl"
                    ? "bg-primary text-primary-foreground"
                    : "bg-secondary"
                }`}
              >
                P&L
              </button>
              <button
                onClick={() => setSortBy("winRate")}
                className={`px-3 py-1 text-sm rounded ${
                  sortBy === "winRate"
                    ? "bg-primary text-primary-foreground"
                    : "bg-secondary"
                }`}
              >
                Win Rate
              </button>
              <button
                onClick={() => setSortBy("roi")}
                className={`px-3 py-1 text-sm rounded ${
                  sortBy === "roi"
                    ? "bg-primary text-primary-foreground"
                    : "bg-secondary"
                }`}
              >
                ROI
              </button>
            </div>
          </div>
        </div>

        <div className="divide-y">
          {sortedAgents.map((agent, index) => {
            const isProfitable = agent.metrics.totalPnL > 0;
            const rankIcon =
              index === 0 ? "🥇" : index === 1 ? "🥈" : index === 2 ? "🥉" : `#${index + 1}`;

            return (
              <div key={agent.agentId} className="p-4 hover:bg-accent transition-colors">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4 flex-1">
                    <span className="text-2xl w-12 text-center">{rankIcon}</span>
                    <div className="flex-1">
                      <h4 className="font-semibold">{agent.agentName}</h4>
                      <p className="text-sm text-muted-foreground">
                        {agent.metrics.totalTrades} trades
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-6">
                    {/* P&L */}
                    <div className="text-right">
                      <p className="text-sm text-muted-foreground">P&L</p>
                      <p className={`font-semibold ${
                        isProfitable ? "text-green-600" : "text-red-600"
                      }`}>
                        {isProfitable ? "+" : ""}${agent.metrics.totalPnL.toFixed(2)}
                      </p>
                    </div>

                    {/* Win Rate */}
                    <div className="text-right">
                      <p className="text-sm text-muted-foreground">Win Rate</p>
                      <p className="font-semibold">{agent.metrics.winRate.toFixed(1)}%</p>
                    </div>

                    {/* ROI */}
                    <div className="text-right">
                      <p className="text-sm text-muted-foreground">ROI</p>
                      <p className={`font-semibold ${
                        agent.metrics.roi > 0 ? "text-green-600" : "text-red-600"
                      }`}>
                        {agent.metrics.roi > 0 ? "+" : ""}{agent.metrics.roi.toFixed(1)}%
                      </p>
                    </div>

                    {/* Sharpe */}
                    <div className="text-right">
                      <p className="text-sm text-muted-foreground">Sharpe</p>
                      <p className="font-semibold">{agent.metrics.sharpeRatio.toFixed(2)}</p>
                    </div>

                    {/* Trend Icon */}
                    <div>
                      {isProfitable ? (
                        <TrendingUp className="h-5 w-5 text-green-600" />
                      ) : (
                        <TrendingDown className="h-5 w-5 text-red-600" />
                      )}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {sortedAgents.length === 0 && (
          <div className="p-8 text-center text-muted-foreground">
            No agents with completed trades yet.
          </div>
        )}
      </div>

      {/* Strategy Performance */}
      <div className="border rounded-lg bg-card p-6">
        <h3 className="font-semibold mb-4 flex items-center gap-2">
          <Target className="h-5 w-5" />
          Strategy Performance
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {Object.entries(data.strategies).map(([strategy, metrics]: [string, any]) => (
            <div key={strategy} className="p-4 border rounded-lg">
              <h4 className="font-medium capitalize mb-2">
                {strategy.replace("_", " ")}
              </h4>
              <div className="space-y-1 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">P&L:</span>
                  <span className={`font-semibold ${
                    metrics.totalPnL > 0 ? "text-green-600" : "text-red-600"
                  }`}>
                    ${metrics.totalPnL.toFixed(2)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Win Rate:</span>
                  <span className="font-semibold">{metrics.winRate.toFixed(1)}%</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Trades:</span>
                  <span className="font-semibold">{metrics.totalTrades}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
