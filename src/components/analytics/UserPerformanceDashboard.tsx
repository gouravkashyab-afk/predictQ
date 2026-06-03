"use client";

import { useEffect, useState } from "react";
import { DollarSign, TrendingUp, Activity, Award } from "lucide-react";

interface UserPerformance {
  userId: string;
  summary: {
    totalPnL: number;
    realizedPnL: number;
    unrealizedPnL: number;
    totalTrades: number;
    wins: number;
    losses: number;
    winRate: number;
    avgWinRate: number;
    totalAgents: number;
    profitableAgents: number;
  };
  agents: Array<{
    agentId: string;
    agentName: string;
    metrics: any;
  }>;
}

interface UserPerformanceDashboardProps {
  userId: string;
}

export function UserPerformanceDashboard({ userId }: UserPerformanceDashboardProps) {
  const [performance, setPerformance] = useState<UserPerformance | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchPerformance();
  }, [userId]);

  const fetchPerformance = async () => {
    setIsLoading(true);
    try {
      const res = await fetch("/api/user/performance", {
        headers: {
          "x-user-id": userId,
        },
      });
      if (!res.ok) throw new Error("Failed to fetch performance");
      const data = await res.json();
      setPerformance(data);
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="p-6 border rounded-lg bg-card">
        <p className="text-center text-muted-foreground">Loading your performance...</p>
      </div>
    );
  }

  if (!performance) {
    return (
      <div className="p-6 border rounded-lg bg-card">
        <p className="text-center text-red-500">Failed to load performance</p>
      </div>
    );
  }

  const { summary } = performance;
  const isProfitable = summary.totalPnL > 0;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold">Your Performance</h2>
        <p className="text-muted-foreground">
          Your personal P&L across all your agents
        </p>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {/* Total P&L */}
        <div className="p-6 border rounded-lg bg-card">
          <div className="flex items-center gap-2 text-sm text-muted-foreground mb-2">
            <DollarSign className="h-4 w-4" />
            <span>Your Total P&L</span>
          </div>
          <p
            className={`text-3xl font-bold ${
              isProfitable ? "text-green-600" : "text-red-600"
            }`}
          >
            {isProfitable ? "+" : ""}${summary.totalPnL.toFixed(2)}
          </p>
          <div className="mt-2 text-xs text-muted-foreground space-y-1">
            <p>Realized: ${summary.realizedPnL.toFixed(2)}</p>
            <p>Unrealized: ${summary.unrealizedPnL.toFixed(2)}</p>
          </div>
        </div>

        {/* Win Rate */}
        <div className="p-6 border rounded-lg bg-card">
          <div className="flex items-center gap-2 text-sm text-muted-foreground mb-2">
            <Award className="h-4 w-4" />
            <span>Your Win Rate</span>
          </div>
          <p className="text-3xl font-bold">{summary.winRate.toFixed(1)}%</p>
          <p className="mt-2 text-xs text-muted-foreground">
            {summary.wins}W / {summary.losses}L
          </p>
        </div>

        {/* Total Trades */}
        <div className="p-6 border rounded-lg bg-card">
          <div className="flex items-center gap-2 text-sm text-muted-foreground mb-2">
            <Activity className="h-4 w-4" />
            <span>Total Trades</span>
          </div>
          <p className="text-3xl font-bold">{summary.totalTrades}</p>
          <p className="mt-2 text-xs text-muted-foreground">
            Across {summary.totalAgents} agents
          </p>
        </div>

        {/* Profitable Agents */}
        <div className="p-6 border rounded-lg bg-card">
          <div className="flex items-center gap-2 text-sm text-muted-foreground mb-2">
            <TrendingUp className="h-4 w-4" />
            <span>Profitable Agents</span>
          </div>
          <p className="text-3xl font-bold text-green-600">
            {summary.profitableAgents}
          </p>
          <p className="mt-2 text-xs text-muted-foreground">
            out of {summary.totalAgents} total
          </p>
        </div>
      </div>

      {/* Your Agents Performance */}
      <div className="border rounded-lg bg-card">
        <div className="p-4 border-b">
          <h3 className="font-semibold">Your Agents</h3>
        </div>
        <div className="divide-y">
          {performance.agents.map((agent) => {
            const agentProfitable = agent.metrics.totalPnL > 0;
            return (
              <div key={agent.agentId} className="p-4 hover:bg-accent transition-colors">
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <h4 className="font-semibold">{agent.agentName}</h4>
                    <p className="text-sm text-muted-foreground">
                      {agent.metrics.totalTrades} trades • {agent.metrics.winRate.toFixed(1)}% win rate
                    </p>
                  </div>

                  <div className="flex items-center gap-6">
                    <div className="text-right">
                      <p className="text-sm text-muted-foreground">P&L</p>
                      <p
                        className={`text-xl font-bold ${
                          agentProfitable ? "text-green-600" : "text-red-600"
                        }`}
                      >
                        {agentProfitable ? "+" : ""}$
                        {agent.metrics.totalPnL.toFixed(2)}
                      </p>
                    </div>

                    <div className="text-right">
                      <p className="text-sm text-muted-foreground">ROI</p>
                      <p
                        className={`text-xl font-bold ${
                          agent.metrics.roi > 0 ? "text-green-600" : "text-red-600"
                        }`}
                      >
                        {agent.metrics.roi > 0 ? "+" : ""}
                        {agent.metrics.roi.toFixed(1)}%
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}

          {performance.agents.length === 0 && (
            <div className="p-8 text-center text-muted-foreground">
              No agents yet. Create your first agent to start trading!
            </div>
          )}
        </div>
      </div>

      {/* Performance Tips */}
      <div className="p-6 border rounded-lg bg-card">
        <h3 className="font-semibold mb-3">💡 Performance Tips</h3>
        <ul className="space-y-2 text-sm text-muted-foreground">
          {isProfitable ? (
            <>
              <li>✅ You're profitable! Consider increasing position sizes for winning agents.</li>
              <li>✅ Review which strategies work best and focus on those.</li>
              <li>✅ Monitor your agents regularly to catch any performance changes.</li>
            </>
          ) : (
            <>
              <li>⚠️ Review your agent strategies and confidence thresholds.</li>
              <li>⚠️ Consider using simulation mode to test before real trading.</li>
              <li>⚠️ Check the global leaderboard to see which strategies perform best.</li>
            </>
          )}
        </ul>
      </div>
    </div>
  );
}
