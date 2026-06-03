"use client";

import { useEffect, useState } from "react";
import { TrendingUp, TrendingDown, DollarSign, Target, Activity, Award } from "lucide-react";

interface PerformanceMetrics {
  totalTrades: number;
  realTrades: number;
  simulatedTrades: number;
  wins: number;
  losses: number;
  winRate: number;
  totalPnL: number;
  realizedPnL: number;
  unrealizedPnL: number;
  avgWin: number;
  avgLoss: number;
  largestWin: number;
  largestLoss: number;
  profitFactor: number;
  sharpeRatio: number;
  maxDrawdown: number;
  roi: number;
}

interface PerformanceMetricsProps {
  agentId: string;
}

export function PerformanceMetrics({ agentId }: PerformanceMetricsProps) {
  const [metrics, setMetrics] = useState<PerformanceMetrics | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchMetrics();
  }, [agentId]);

  const fetchMetrics = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/agents/${agentId}/performance`);
      if (!res.ok) throw new Error("Failed to fetch metrics");
      const data = await res.json();
      setMetrics(data.metrics);
    } catch (err) {
      setError("Failed to load performance metrics");
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="p-6 border rounded-lg bg-card">
        <p className="text-center text-muted-foreground">Loading performance...</p>
      </div>
    );
  }

  if (error || !metrics) {
    return (
      <div className="p-6 border rounded-lg bg-card">
        <p className="text-center text-red-500">{error || "No data available"}</p>
      </div>
    );
  }

  const isProfitable = metrics.totalPnL > 0;

  return (
    <div className="space-y-6">
      {/* Header Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {/* Total P&L */}
        <div className="p-4 border rounded-lg bg-card">
          <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
            <DollarSign className="h-4 w-4" />
            <span>Total P&L</span>
          </div>
          <p className={`text-2xl font-bold ${isProfitable ? "text-green-600" : "text-red-600"}`}>
            {isProfitable ? "+" : ""}${metrics.totalPnL.toFixed(2)}
          </p>
          <p className="text-xs text-muted-foreground mt-1">
            Realized: ${metrics.realizedPnL.toFixed(2)} | Unrealized: ${metrics.unrealizedPnL.toFixed(2)}
          </p>
        </div>

        {/* Win Rate */}
        <div className="p-4 border rounded-lg bg-card">
          <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
            <Target className="h-4 w-4" />
            <span>Win Rate</span>
          </div>
          <p className="text-2xl font-bold">{metrics.winRate.toFixed(1)}%</p>
          <p className="text-xs text-muted-foreground mt-1">
            {metrics.wins}W / {metrics.losses}L
          </p>
        </div>

        {/* ROI */}
        <div className="p-4 border rounded-lg bg-card">
          <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
            <TrendingUp className="h-4 w-4" />
            <span>ROI</span>
          </div>
          <p className={`text-2xl font-bold ${metrics.roi > 0 ? "text-green-600" : "text-red-600"}`}>
            {metrics.roi > 0 ? "+" : ""}{metrics.roi.toFixed(1)}%
          </p>
          <p className="text-xs text-muted-foreground mt-1">
            Return on Investment
          </p>
        </div>

        {/* Total Trades */}
        <div className="p-4 border rounded-lg bg-card">
          <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
            <Activity className="h-4 w-4" />
            <span>Total Trades</span>
          </div>
          <p className="text-2xl font-bold">{metrics.totalTrades}</p>
          <p className="text-xs text-muted-foreground mt-1">
            {metrics.realTrades} Real | {metrics.simulatedTrades} Simulated
          </p>
        </div>
      </div>

      {/* Detailed Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Win/Loss Analysis */}
        <div className="p-6 border rounded-lg bg-card">
          <h3 className="font-semibold mb-4 flex items-center gap-2">
            <Award className="h-5 w-5" />
            Win/Loss Analysis
          </h3>
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground">Average Win</span>
              <span className="font-semibold text-green-600">+${metrics.avgWin.toFixed(2)}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground">Average Loss</span>
              <span className="font-semibold text-red-600">-${metrics.avgLoss.toFixed(2)}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground">Largest Win</span>
              <span className="font-semibold text-green-600">+${metrics.largestWin.toFixed(2)}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground">Largest Loss</span>
              <span className="font-semibold text-red-600">-${metrics.largestLoss.toFixed(2)}</span>
            </div>
            <div className="flex justify-between items-center pt-3 border-t">
              <span className="text-sm text-muted-foreground">Profit Factor</span>
              <span className="font-semibold">{metrics.profitFactor.toFixed(2)}x</span>
            </div>
          </div>
        </div>

        {/* Risk Metrics */}
        <div className="p-6 border rounded-lg bg-card">
          <h3 className="font-semibold mb-4 flex items-center gap-2">
            <TrendingDown className="h-5 w-5" />
            Risk Metrics
          </h3>
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground">Sharpe Ratio</span>
              <span className={`font-semibold ${
                metrics.sharpeRatio > 1 ? "text-green-600" :
                metrics.sharpeRatio > 0 ? "text-yellow-600" :
                "text-red-600"
              }`}>
                {metrics.sharpeRatio.toFixed(2)}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground">Max Drawdown</span>
              <span className="font-semibold text-red-600">
                -${metrics.maxDrawdown.toFixed(2)}
              </span>
            </div>
            <div className="pt-3 border-t">
              <p className="text-xs text-muted-foreground">
                Sharpe Ratio measures risk-adjusted returns. Higher is better:
              </p>
              <ul className="text-xs text-muted-foreground mt-2 space-y-1">
                <li>• &gt;2.0 = Excellent</li>
                <li>• 1.0-2.0 = Good</li>
                <li>• 0-1.0 = Acceptable</li>
                <li>• &lt;0 = Poor</li>
              </ul>
            </div>
          </div>
        </div>
      </div>

      {/* Performance Grade */}
      <div className="p-6 border rounded-lg bg-card">
        <h3 className="font-semibold mb-3">Performance Grade</h3>
        <div className="flex items-center gap-4">
          <div className="text-6xl font-bold">
            {metrics.winRate >= 60 && metrics.sharpeRatio >= 1.5
              ? "A"
              : metrics.winRate >= 55 && metrics.sharpeRatio >= 1.0
              ? "B"
              : metrics.winRate >= 50 && metrics.sharpeRatio >= 0.5
              ? "C"
              : metrics.winRate >= 45
              ? "D"
              : "F"}
          </div>
          <div className="flex-1">
            <p className="text-sm text-muted-foreground">
              {metrics.winRate >= 60 && metrics.sharpeRatio >= 1.5
                ? "🎉 Excellent performance! This agent is highly profitable."
                : metrics.winRate >= 55 && metrics.sharpeRatio >= 1.0
                ? "👍 Good performance. Agent is consistently profitable."
                : metrics.winRate >= 50 && metrics.sharpeRatio >= 0.5
                ? "⚖️ Average performance. Agent is break-even or slightly profitable."
                : metrics.winRate >= 45
                ? "⚠️ Below average. Consider adjusting strategy or limits."
                : "🚫 Poor performance. Consider pausing this agent."}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
