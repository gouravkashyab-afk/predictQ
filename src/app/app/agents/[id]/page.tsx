"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { ArrowLeft, Save, CheckCircle } from "lucide-react";
import Link from "next/link";

const AGENT_INFO: Record<string, { name: string; description: string; icon: string; platform: string }> = {
  "poly-farming": {
    name: "Poly Farming Agent",
    description: "When enabled, the Poly Farming agent will automatically discover high-probability markets (96-98%), validate them, and execute trades based on your position sizing parameters. Markets are filtered for safety (excluding crypto and sports).",
    icon: "📦",
    platform: "Polymarket",
  },
  "btc-5min": {
    name: "Allora Agent (BTC 5-Min)",
    description: "Automated trading agent for BTC 5-minute markets on Polymarket using Allora predictions",
    icon: "⚡",
    platform: "Polymarket",
  },
  "kalshi-farming": {
    name: "Kalshi Farming Agent",
    description: "Automated farming agent for high-probability Kalshi prediction markets",
    icon: "🌾",
    platform: "Kalshi",
  },
  "kalshi-btc-15min": {
    name: "Kalshi Agent (BTC 15-Min)",
    description: "Automated trading agent for BTC 15-minute markets on Kalshi",
    icon: "₿",
    platform: "Kalshi",
  },
  "perps-btc-hyperliquid": {
    name: "Perps Agent (BTC - Hyperliquid)",
    description: "Autonomous BTC perpetuals trading on Hyperliquid via Allora 8h price signal. 3-5x leverage scaled by confidence. TP/SL placed alongside every order.",
    icon: "🔥",
    platform: "Hyperliquid",
  },
};

export default function AgentDetailPage() {
  const params = useParams();
  const router = useRouter();
  const agentId = params.id as string;
  const agentInfo = AGENT_INFO[agentId];

  const [enabled, setEnabled] = useState(false);
  const [minPosition, setMinPosition] = useState(5);
  const [avgPosition, setAvgPosition] = useState(5);
  const [maxPosition, setMaxPosition] = useState(5);
  const [notifyOnTrade, setNotifyOnTrade] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    // Load agent settings from API
    fetch(`/api/agents/${agentId}/settings`)
      .then((r) => r.json())
      .then((data) => {
        if (data.settings) {
          setEnabled(data.settings.enabled || false);
          setMinPosition(data.settings.minPosition || 5);
          setAvgPosition(data.settings.avgPosition || 5);
          setMaxPosition(data.settings.maxPosition || 5);
          setNotifyOnTrade(data.settings.notifyOnTrade !== false);
        }
      })
      .catch(console.error);
  }, [agentId]);

  const handleSave = async () => {
    setSaving(true);
    setSaved(false);
    try {
      await fetch(`/api/agents/${agentId}/settings`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          enabled,
          minPosition,
          avgPosition,
          maxPosition,
          notifyOnTrade,
        }),
      });
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch (error) {
      console.error("Failed to save settings:", error);
    } finally {
      setSaving(false);
    }
  };

  if (!agentInfo) {
    return (
      <div className="agent-detail-page">
        <p>Agent not found</p>
        <Link href="/app/agents">← Back to Agents</Link>
      </div>
    );
  }

  return (
    <div className="agent-detail-page">
      {/* Header */}
      <div className="agent-detail-header">
        <Link href="/app/agents" className="agent-back-btn">
          <ArrowLeft size={16} />
        </Link>
        <div className="agent-detail-title-section">
          <div className="agent-detail-icon">{agentInfo.icon}</div>
          <h1 className="agent-detail-title">{agentInfo.name}</h1>
        </div>
      </div>

      {/* Enable Section */}
      <section className="agent-config-section">
        <h2 className="agent-config-section-title">Enable {agentInfo.name}</h2>
        <p className="agent-config-section-desc">{agentInfo.description}</p>
        
        <div className="agent-toggle-row">
          <div
            className={`agent-toggle ${enabled ? "on" : "off"}`}
            onClick={() => setEnabled(!enabled)}
            role="switch"
            aria-checked={enabled}
          >
            <div className="agent-toggle-thumb" />
          </div>
          <span className="agent-toggle-label">{enabled ? "Enabled" : "Disabled"}</span>
        </div>
      </section>

      {/* Position Sizing */}
      <section className="agent-config-section">
        <h2 className="agent-config-section-title">Position Sizing</h2>
        <p className="agent-config-section-desc">
          Control trade sizes to manage risk. The agent will use the average position size for each trade, constrained by your min and max limits.
        </p>

        <div className="agent-position-grid">
          <div className="agent-position-field">
            <label>Min Position Size (USD)*</label>
            <input
              type="number"
              min="1"
              max="1000"
              value={minPosition}
              onChange={(e) => setMinPosition(Number(e.target.value))}
              className="agent-position-input"
            />
          </div>
          <div className="agent-position-field">
            <label>Avg Position Size (USD)*</label>
            <input
              type="number"
              min="1"
              max="1000"
              value={avgPosition}
              onChange={(e) => setAvgPosition(Number(e.target.value))}
              className="agent-position-input"
            />
          </div>
          <div className="agent-position-field">
            <label>Max Position Size (USD)*</label>
            <input
              type="number"
              min="1"
              max="1000"
              value={maxPosition}
              onChange={(e) => setMaxPosition(Number(e.target.value))}
              className="agent-position-input"
            />
          </div>
        </div>
      </section>

      {/* Notifications */}
      <section className="agent-config-section">
        <h2 className="agent-config-section-title">Notifications</h2>
        <p className="agent-config-section-desc">
          Choose when to receive notifications about trading activity.
        </p>

        <div className="agent-notification-row">
          <div className="agent-checkbox-wrapper">
            <input
              type="checkbox"
              id="notify-trade"
              checked={notifyOnTrade}
              onChange={(e) => setNotifyOnTrade(e.target.checked)}
              className="agent-checkbox"
            />
            <label htmlFor="notify-trade" className="agent-checkbox-label">
              <div className="agent-checkbox-box">
                {notifyOnTrade && <CheckCircle size={14} />}
              </div>
              <div>
                <span className="agent-checkbox-title">Notify on Trade Execution</span>
                <span className="agent-checkbox-desc">Get notified when a trade is executed</span>
              </div>
            </label>
          </div>
        </div>
      </section>

      {/* Trading Statistics */}
      <section className="agent-config-section">
        <h2 className="agent-config-section-title">Trading Statistics</h2>
        <div className="agent-stats-grid">
          <div className="agent-stat-box">
            <span className="agent-stat-box-label">Total Trades</span>
            <span className="agent-stat-box-value">0</span>
          </div>
          <div className="agent-stat-box">
            <span className="agent-stat-box-label">Win Rate</span>
            <span className="agent-stat-box-value">0%</span>
          </div>
          <div className="agent-stat-box">
            <span className="agent-stat-box-label">Total P&L</span>
            <span className="agent-stat-box-value">$0.00</span>
          </div>
          <div className="agent-stat-box">
            <span className="agent-stat-box-label">Avg Trade Size</span>
            <span className="agent-stat-box-value">$0.00</span>
          </div>
        </div>
      </section>

      {/* Save Button */}
      <div className="agent-save-section">
        <button
          className={`agent-save-btn ${saved ? "saved" : ""}`}
          onClick={handleSave}
          disabled={saving}
        >
          {saved ? (
            <>
              <CheckCircle size={16} />
              Saved!
            </>
          ) : saving ? (
            "Saving..."
          ) : (
            <>
              <Save size={16} />
              Save Settings
            </>
          )}
        </button>
      </div>
    </div>
  );
}
