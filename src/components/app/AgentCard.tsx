"use client";

import { Play, Pause, Square, Trash2, Activity, ChevronRight } from "lucide-react";

interface AgentCardProps {
  agent: {
    id: string;
    name: string;
    strategy: string;
    status: string;
    config: Record<string, unknown>;
    totalTrades: number;
    totalPnl: number;
    lastRunAt: string | null;
  };
  onStart: () => void;
  onPause: () => void;
  onStop: () => void;
  onDelete: () => void;
  onViewLogs: () => void;
  showingLogs: boolean;
}

const STRATEGY_META: Record<string, { label: string; icon: string; color: string }> = {
  signal_follower: { label: "Signal Follower", icon: "🧠", color: "#7c6fff" },
  whale_tracker: { label: "Whale Tracker", icon: "🐋", color: "#06b6d4" },
  contrarian: { label: "Contrarian", icon: "↩️", color: "#f59e0b" },
};

function timeAgo(iso: string | null): string {
  if (!iso) return "Never";
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60_000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}

export default function AgentCard({
  agent, onStart, onPause, onStop, onDelete, onViewLogs, showingLogs,
}: AgentCardProps) {
  const meta = STRATEGY_META[agent.strategy] ?? { label: agent.strategy, icon: "🤖", color: "#94a3b8" };
  const isActive = agent.status === "active";
  const isPaused = agent.status === "paused";
  const config = agent.config as Record<string, unknown>;

  return (
    <div className={`agent-card ${agent.status}`} id={`agent-card-${agent.id}`}>
      {/* Status pulse */}
      <div className="agent-card-status-bar">
        <div className={`agent-status-indicator ${agent.status}`}>
          {isActive && <span className="agent-live-pulse" />}
          <span className="agent-status-label">{agent.status.toUpperCase()}</span>
        </div>
        <span className="agent-last-run">Last run: {timeAgo(agent.lastRunAt)}</span>
      </div>

      {/* Main info */}
      <div className="agent-card-main">
        <div className="agent-card-icon" style={{ background: `${meta.color}20`, color: meta.color }}>
          {meta.icon}
        </div>
        <div className="agent-card-info">
          <h3 className="agent-card-name">{agent.name}</h3>
          <span className="agent-strategy-tag" style={{ color: meta.color, borderColor: `${meta.color}40` }}>
            {meta.label}
          </span>
        </div>
      </div>

      {/* Stats */}
      <div className="agent-card-stats">
        <div className="agent-stat">
          <span className="agent-stat-label">Trades</span>
          <span className="agent-stat-value">{agent.totalTrades}</span>
        </div>
        <div className="agent-stat">
          <span className="agent-stat-label">P&amp;L</span>
          <span className={`agent-stat-value ${agent.totalPnl >= 0 ? "positive" : "negative"}`}>
            {agent.totalPnl >= 0 ? "+" : ""}${agent.totalPnl.toFixed(2)}
          </span>
        </div>
        <div className="agent-stat">
          <span className="agent-stat-label">Max Trade</span>
          <span className="agent-stat-value">${config.maxPositionSize as number ?? 50}</span>
        </div>
        <div className="agent-stat">
          <span className="agent-stat-label">Min Conf.</span>
          <span className="agent-stat-value">{config.minConfidence as number ?? 70}%</span>
        </div>
      </div>

      {/* Controls */}
      <div className="agent-card-controls">
        {!isActive && (
          <button id={`agent-start-${agent.id}`} className="agent-ctrl-btn start" onClick={onStart} title="Start">
            <Play size={13} />
            Start
          </button>
        )}
        {isActive && (
          <button id={`agent-pause-${agent.id}`} className="agent-ctrl-btn pause" onClick={onPause} title="Pause">
            <Pause size={13} />
            Pause
          </button>
        )}
        {(isActive || isPaused) && (
          <button id={`agent-stop-${agent.id}`} className="agent-ctrl-btn stop" onClick={onStop} title="Stop">
            <Square size={13} />
            Stop
          </button>
        )}
        <button
          id={`agent-logs-${agent.id}`}
          className={`agent-ctrl-btn logs ${showingLogs ? "active" : ""}`}
          onClick={onViewLogs}
        >
          <Activity size={13} />
          Logs
        </button>
        <button id={`agent-delete-${agent.id}`} className="agent-ctrl-btn delete" onClick={onDelete} title="Delete">
          <Trash2 size={13} />
        </button>
      </div>
    </div>
  );
}
