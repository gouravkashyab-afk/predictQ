"use client";

import { useState, useEffect, useCallback } from "react";
import { Bot, Plus, Play, Pause, Square, Trash2, ChevronDown, ChevronUp, Activity } from "lucide-react";
import AgentCard from "@/components/app/AgentCard";
import AgentLogs from "@/components/app/AgentLogs";

const STRATEGIES = [
  {
    id: "signal_follower",
    label: "Signal Follower",
    desc: "Trades based on AI signals above your confidence threshold.",
    icon: "🧠",
  },
  {
    id: "whale_tracker",
    label: "Whale Tracker",
    desc: "Mirrors large USDC moves on Polygon — follows the smart money.",
    icon: "🐋",
  },
  {
    id: "contrarian",
    label: "Contrarian",
    desc: "Bets opposite to AI signals — fades the consensus for edge.",
    icon: "↩️",
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

type CreateStep = "strategy" | "config" | "confirm";

export default function AgentsPage() {
  const [agentList, setAgentList] = useState<AgentData[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [selectedLogs, setSelectedLogs] = useState<string | null>(null);
  const [createStep, setCreateStep] = useState<CreateStep>("strategy");
  const [creating, setCreating] = useState(false);

  // Form state
  const [form, setForm] = useState({
    name: "",
    strategy: "",
    maxPositionSize: 50,
    minConfidence: 70,
    maxMarketsPerRun: 3,
    riskLevel: "medium",
  });

  const loadAgents = useCallback(async () => {
    try {
      const res = await fetch("/api/agents");
      const data = await res.json();
      setAgentList(data.agents ?? []);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadAgents(); }, [loadAgents]);

  const handleStatusChange = async (id: string, status: string) => {
    await fetch(`/api/agents/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    });
    loadAgents();
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this agent? This cannot be undone.")) return;
    await fetch(`/api/agents/${id}`, { method: "DELETE" });
    loadAgents();
  };

  const handleCreate = async () => {
    if (!form.name || !form.strategy) return;
    setCreating(true);
    try {
      await fetch("/api/agents", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: form.name,
          strategy: form.strategy,
          config: {
            maxPositionSize: form.maxPositionSize,
            minConfidence: form.minConfidence,
            maxMarketsPerRun: form.maxMarketsPerRun,
            riskLevel: form.riskLevel,
          },
        }),
      });
      setShowCreate(false);
      setCreateStep("strategy");
      setForm({ name: "", strategy: "", maxPositionSize: 50, minConfidence: 70, maxMarketsPerRun: 3, riskLevel: "medium" });
      loadAgents();
    } finally {
      setCreating(false);
    }
  };

  const activeCount = agentList.filter((a) => a.status === "active").length;

  return (
    <div className="agents-page">
      {/* Header */}
      <div className="agents-header">
        <div className="agents-header-left">
          <h1 className="agents-title">
            <Bot size={20} className="agents-title-icon" />
            Agents
          </h1>
          <div className="agents-stats-row">
            {activeCount > 0 && (
              <span className="agents-stat-pill active">
                <span className="auto-refresh-dot" style={{ width: 6, height: 6 }} />
                {activeCount} Active
              </span>
            )}
            <span className="agents-stat-pill neutral">{agentList.length} / 5 agents</span>
          </div>
        </div>
        {agentList.length < 5 && (
          <button
            id="create-agent-btn"
            className="agents-create-btn"
            onClick={() => { setShowCreate(!showCreate); setCreateStep("strategy"); }}
          >
            <Plus size={14} />
            New Agent
          </button>
        )}
      </div>

      {/* Create flow */}
      {showCreate && (
        <div className="agent-create-panel">
          <div className="agent-create-header">
            <span className="agent-create-step-label">
              {createStep === "strategy" && "Step 1 — Choose Strategy"}
              {createStep === "config" && "Step 2 — Risk Config"}
              {createStep === "confirm" && "Step 3 — Review & Launch"}
            </span>
          </div>

          {createStep === "strategy" && (
            <div className="agent-strategy-grid">
              {STRATEGIES.map((s) => (
                <button
                  key={s.id}
                  id={`strategy-${s.id}`}
                  className={`agent-strategy-card ${form.strategy === s.id ? "selected" : ""}`}
                  onClick={() => setForm((f) => ({ ...f, strategy: s.id }))}
                >
                  <span className="agent-strategy-icon">{s.icon}</span>
                  <span className="agent-strategy-label">{s.label}</span>
                  <span className="agent-strategy-desc">{s.desc}</span>
                </button>
              ))}
              <div className="agent-create-actions">
                <button
                  className="agent-btn-primary"
                  disabled={!form.strategy}
                  onClick={() => setCreateStep("config")}
                >
                  Continue →
                </button>
              </div>
            </div>
          )}

          {createStep === "config" && (
            <div className="agent-config-form">
              <div className="agent-form-field">
                <label>Agent Name</label>
                <input
                  id="agent-name-input"
                  type="text"
                  placeholder="e.g. Alpha Bot"
                  value={form.name}
                  onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                  className="agent-text-input"
                  maxLength={32}
                />
              </div>
              <div className="agent-form-field">
                <label>Max Position Size (USDC)</label>
                <div className="agent-slider-wrap">
                  <input type="range" min="5" max="500" step="5" value={form.maxPositionSize}
                    onChange={(e) => setForm((f) => ({ ...f, maxPositionSize: +e.target.value }))}
                    className="agent-slider" id="slider-position-size"
                  />
                  <span className="agent-slider-value">${form.maxPositionSize}</span>
                </div>
              </div>
              <div className="agent-form-field">
                <label>Minimum Signal Confidence</label>
                <div className="agent-slider-wrap">
                  <input type="range" min="50" max="95" step="5" value={form.minConfidence}
                    onChange={(e) => setForm((f) => ({ ...f, minConfidence: +e.target.value }))}
                    className="agent-slider" id="slider-confidence"
                  />
                  <span className="agent-slider-value">{form.minConfidence}%</span>
                </div>
              </div>
              <div className="agent-form-field">
                <label>Risk Level</label>
                <div className="agent-risk-tabs">
                  {["low", "medium", "high"].map((r) => (
                    <button key={r} id={`risk-${r}`}
                      className={`agent-risk-btn ${form.riskLevel === r ? "active" : ""}`}
                      onClick={() => setForm((f) => ({ ...f, riskLevel: r }))}
                    >
                      {r.charAt(0).toUpperCase() + r.slice(1)}
                    </button>
                  ))}
                </div>
              </div>
              <div className="agent-create-actions">
                <button className="agent-btn-secondary" onClick={() => setCreateStep("strategy")}>← Back</button>
                <button className="agent-btn-primary" disabled={!form.name}
                  onClick={() => setCreateStep("confirm")}>
                  Review →
                </button>
              </div>
            </div>
          )}

          {createStep === "confirm" && (
            <div className="agent-confirm">
              <div className="agent-confirm-summary">
                <div className="agent-confirm-row">
                  <span>Name</span><strong>{form.name}</strong>
                </div>
                <div className="agent-confirm-row">
                  <span>Strategy</span>
                  <strong>{STRATEGIES.find((s) => s.id === form.strategy)?.label}</strong>
                </div>
                <div className="agent-confirm-row">
                  <span>Max per trade</span><strong>${form.maxPositionSize} USDC</strong>
                </div>
                <div className="agent-confirm-row">
                  <span>Min confidence</span><strong>{form.minConfidence}%</strong>
                </div>
                <div className="agent-confirm-row">
                  <span>Risk level</span><strong className={`risk-${form.riskLevel}`}>{form.riskLevel}</strong>
                </div>
              </div>
              <p className="agent-confirm-note">
                Agent starts paused. Activate it after reviewing to let it trade on your behalf every 30 minutes.
              </p>
              <div className="agent-create-actions">
                <button className="agent-btn-secondary" onClick={() => setCreateStep("config")}>← Back</button>
                <button className="agent-btn-primary" onClick={handleCreate} disabled={creating}>
                  {creating ? "Creating..." : "🚀 Launch Agent"}
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Agent list */}
      {loading ? (
        <div className="agents-grid">
          {[1, 2].map((i) => <div key={i} className="agent-card skeleton" />)}
        </div>
      ) : agentList.length === 0 ? (
        <div className="agents-empty">
          <Bot size={40} className="agents-empty-icon" />
          <p>No agents yet</p>
          <span>Create your first AI trading agent to get started</span>
          <button className="agents-create-btn" style={{ marginTop: "1rem" }}
            onClick={() => setShowCreate(true)}>
            <Plus size={14} /> Create Agent
          </button>
        </div>
      ) : (
        <div className="agents-list">
          {agentList.map((agent) => (
            <div key={agent.id} className="agent-list-item">
              <AgentCard
                agent={agent}
                onStart={() => handleStatusChange(agent.id, "active")}
                onPause={() => handleStatusChange(agent.id, "paused")}
                onStop={() => handleStatusChange(agent.id, "stopped")}
                onDelete={() => handleDelete(agent.id)}
                onViewLogs={() => setSelectedLogs(selectedLogs === agent.id ? null : agent.id)}
                showingLogs={selectedLogs === agent.id}
              />
              {selectedLogs === agent.id && (
                <AgentLogs agentId={agent.id} />
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
