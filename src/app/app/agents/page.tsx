"use client";

import { useState, useEffect, useCallback } from "react";
import { Bot, Plus, Play, Pause, Square, Trash2, ChevronDown, ChevronUp, Activity, TrendingUp, Zap } from "lucide-react";
import AgentCard from "@/components/app/AgentCard";
import AgentLogs from "@/components/app/AgentLogs";

// Pre-made agents offered by the platform
const AVAILABLE_AGENTS = [
  {
    id: "signal_follower",
    name: "Signal Follower",
    description: "Trades based on AI signals with high confidence scores. Follows GPT-4o predictions.",
    icon: "🧠",
    performance: { winRate: 68, totalTrades: 234, avgProfit: "+$12.40" },
    category: "AI-Powered",
    recommended: true,
  },
  {
    id: "whale_tracker",
    name: "Whale Tracker",
    description: "Mirrors large-scale trades on Polymarket. Follows smart money movements.",
    icon: "🐋",
    performance: { winRate: 62, totalTrades: 187, avgProfit: "+$8.20" },
    category: "Social Trading",
    recommended: false,
  },
  {
    id: "contrarian",
    name: "Contrarian",
    description: "Bets opposite to consensus signals. Exploits market inefficiencies.",
    icon: "↩️",
    performance: { winRate: 54, totalTrades: 156, avgProfit: "+$5.60" },
    category: "Arbitrage",
    recommended: false,
  },
  {
    id: "allora_follower",
    name: "Allora Follower",
    description: "Uses Allora Network's decentralized ML predictions for crypto markets.",
    icon: "🔮",
    performance: { winRate: 71, totalTrades: 198, avgProfit: "+$14.80" },
    category: "AI-Powered",
    recommended: true,
  },
  {
    id: "hybrid",
    name: "Hybrid Strategy",
    description: "Combines Allora + GPT-4o for high-conviction trades. Best overall performance.",
    icon: "⚡",
    performance: { winRate: 73, totalTrades: 142, avgProfit: "+$16.50" },
    category: "AI-Powered",
    recommended: true,
  },
];

interface AgentData {
  id: string;
  name: string;
  strategy: string;
  status: string;
  config: Record<string, unknown>;
  totalTrades: number;
  totalPnl: number;
  lastRunAt: string | null;
  createdAt: string;
}

interface SubscribedAgent extends AgentData {
  agentType: string;
}

export default function AgentsPage() {
  const [subscribedAgents, setSubscribedAgents] = useState<SubscribedAgent[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedLogs, setSelectedLogs] = useState<string | null>(null);
  const [activating, setActivating] = useState<string | null>(null);

  const loadAgents = useCallback(async () => {
    try {
      const res = await fetch("/api/agents");
      const data = await res.json();
      setSubscribedAgents(data.agents ?? []);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadAgents(); }, [loadAgents]);

  const handleActivateAgent = async (agentType: string) => {
    setActivating(agentType);
    try {
      // Check if user already has this agent
      const existing = subscribedAgents.find(a => a.strategy === agentType);
      if (existing) {
        // Just activate it
        await fetch(`/api/agents/${existing.id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ status: "active" }),
        });
      } else {
        // Create new agent subscription
        const agentInfo = AVAILABLE_AGENTS.find(a => a.id === agentType);
        await fetch("/api/agents", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            name: agentInfo?.name || "Agent",
            strategy: agentType,
            config: {
              maxPositionSize: 50,
              minConfidence: 70,
              maxMarketsPerRun: 3,
              riskLevel: "medium",
              simulateOnly: true, // Start in paper trading mode
            },
          }),
        });
      }
      loadAgents();
    } finally {
      setActivating(null);
    }
  };

  const handleStatusChange = async (id: string, status: string) => {
    await fetch(`/api/agents/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    });
    loadAgents();
  };

  const handleUnsubscribe = async (id: string) => {
    if (!confirm("Unsubscribe from this agent? You can re-activate it anytime.")) return;
    await fetch(`/api/agents/${id}`, { method: "DELETE" });
    loadAgents();
  };

  const activeCount = subscribedAgents.filter((a) => a.status === "active").length;
  const subscribedAgentTypes = subscribedAgents.map(a => a.strategy);

  return (
    <div className="agents-page">
      {/* Header */}
      <div className="agents-header">
        <div className="agents-header-left">
          <h1 className="agents-title">
            <Bot size={20} className="agents-title-icon" />
            Trading Agents
          </h1>
          <p className="text-sm text-gray-400 mt-1">
            Activate pre-built AI agents to trade automatically on your behalf
          </p>
        </div>
        {activeCount > 0 && (
          <div className="agents-stats-row">
            <span className="agents-stat-pill active">
              <span className="auto-refresh-dot" style={{ width: 6, height: 6 }} />
              {activeCount} Active
            </span>
          </div>
        )}
      </div>

      {/* Available Agents Grid */}
      <div className="mb-8">
        <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
          <Zap size={18} className="text-yellow-400" />
          Available Agents
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {AVAILABLE_AGENTS.map((agent) => {
            const isSubscribed = subscribedAgentTypes.includes(agent.id);
            const subscribedAgent = subscribedAgents.find(a => a.strategy === agent.id);
            const isActive = subscribedAgent?.status === "active";

            return (
              <div
                key={agent.id}
                className="relative rounded-xl p-6 border transition-all"
                style={{
                  background: "rgba(255,255,255,0.02)",
                  borderColor: isActive 
                    ? "rgba(34, 197, 94, 0.3)" 
                    : isSubscribed 
                    ? "rgba(59, 130, 246, 0.3)" 
                    : "rgba(255,255,255,0.08)",
                }}
              >
                {agent.recommended && (
                  <div className="absolute top-4 right-4 px-2 py-0.5 rounded-full text-xs font-medium bg-yellow-500/20 text-yellow-400 border border-yellow-500/30">
                    Recommended
                  </div>
                )}

                <div className="flex items-start gap-3 mb-4">
                  <div className="text-4xl">{agent.icon}</div>
                  <div className="flex-1">
                    <h3 className="text-lg font-bold text-white">{agent.name}</h3>
                    <p className="text-xs text-gray-400">{agent.category}</p>
                  </div>
                </div>

                <p className="text-sm text-gray-400 mb-4 leading-relaxed">
                  {agent.description}
                </p>

                {/* Performance Stats */}
                <div className="grid grid-cols-3 gap-2 mb-4 p-3 rounded-lg bg-black/20">
                  <div className="text-center">
                    <p className="text-xs text-gray-500">Win Rate</p>
                    <p className="text-sm font-bold text-green-400">{agent.performance.winRate}%</p>
                  </div>
                  <div className="text-center">
                    <p className="text-xs text-gray-500">Trades</p>
                    <p className="text-sm font-bold text-white">{agent.performance.totalTrades}</p>
                  </div>
                  <div className="text-center">
                    <p className="text-xs text-gray-500">Avg P&L</p>
                    <p className="text-sm font-bold text-blue-400">{agent.performance.avgProfit}</p>
                  </div>
                </div>

                {/* Status & Actions */}
                {isSubscribed ? (
                  <div className="flex items-center gap-2">
                    {isActive ? (
                      <>
                        <button
                          onClick={() => handleStatusChange(subscribedAgent.id, "paused")}
                          className="flex-1 px-4 py-2 rounded-lg bg-orange-500/20 text-orange-400 border border-orange-500/30 hover:bg-orange-500/30 transition-colors text-sm font-medium"
                        >
                          <Pause size={14} className="inline mr-1" />
                          Pause
                        </button>
                        <button
                          onClick={() => setSelectedLogs(selectedLogs === subscribedAgent.id ? null : subscribedAgent.id)}
                          className="px-4 py-2 rounded-lg bg-white/5 text-gray-400 border border-white/10 hover:bg-white/10 transition-colors text-sm"
                        >
                          <Activity size={14} />
                        </button>
                      </>
                    ) : (
                      <>
                        <button
                          onClick={() => handleStatusChange(subscribedAgent.id, "active")}
                          className="flex-1 px-4 py-2 rounded-lg bg-green-500/20 text-green-400 border border-green-500/30 hover:bg-green-500/30 transition-colors text-sm font-medium"
                        >
                          <Play size={14} className="inline mr-1" />
                          Activate
                        </button>
                        <button
                          onClick={() => handleUnsubscribe(subscribedAgent.id)}
                          className="px-4 py-2 rounded-lg bg-red-500/20 text-red-400 border border-red-500/30 hover:bg-red-500/30 transition-colors text-sm"
                        >
                          <Trash2 size={14} />
                        </button>
                      </>
                    )}
                  </div>
                ) : (
                  <button
                    onClick={() => handleActivateAgent(agent.id)}
                    disabled={activating === agent.id}
                    className="w-full px-4 py-2 rounded-lg bg-blue-500/20 text-blue-400 border border-blue-500/30 hover:bg-blue-500/30 transition-colors text-sm font-medium disabled:opacity-50"
                  >
                    {activating === agent.id ? "Activating..." : "Activate Agent"}
                  </button>
                )}

                {/* Show logs if expanded */}
                {isSubscribed && selectedLogs === subscribedAgent.id && (
                  <div className="mt-4 pt-4 border-t border-white/10">
                    <AgentLogs agentId={subscribedAgent.id} />
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* My Active Agents */}
      {subscribedAgents.length > 0 && (
        <div>
          <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
            <TrendingUp size={18} className="text-green-400" />
            My Active Agents
          </h2>
          <div className="agents-list">
            {subscribedAgents.map((agent) => (
              <div key={agent.id} className="agent-list-item">
                <AgentCard
                  agent={agent}
                  onStart={() => handleStatusChange(agent.id, "active")}
                  onPause={() => handleStatusChange(agent.id, "paused")}
                  onStop={() => handleStatusChange(agent.id, "stopped")}
                  onDelete={() => handleUnsubscribe(agent.id)}
                  onViewLogs={() => setSelectedLogs(selectedLogs === agent.id ? null : agent.id)}
                  showingLogs={selectedLogs === agent.id}
                />
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
