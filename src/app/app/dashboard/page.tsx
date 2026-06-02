import { TrendingUp, Zap, Fish, Bot, ArrowUpRight, ArrowDownRight } from "lucide-react";
import WalletDisplay from "@/components/app/WalletDisplay";

const STAT_CARDS = [
  {
    id: "stat-markets",
    label: "Active Markets",
    value: "2,847",
    change: "+12%",
    positive: true,
    icon: TrendingUp,
    color: "#5542ff",
  },
  {
    id: "stat-signals",
    label: "AI Signals Today",
    value: "143",
    change: "+8 new",
    positive: true,
    icon: Zap,
    color: "#f59e0b",
  },
  {
    id: "stat-whale-volume",
    label: "Whale Volume 24h",
    value: "$4.2M",
    change: "-3.1%",
    positive: false,
    icon: Fish,
    color: "#06b6d4",
  },
  {
    id: "stat-agents",
    label: "Active Agents",
    value: "0",
    change: "Set up agents",
    positive: true,
    icon: Bot,
    color: "#8b5cf6",
  },
];

const RECENT_SIGNALS = [
  {
    id: "sig-1",
    market: "Will BTC exceed $120K by July 2026?",
    signal: "BUY YES",
    confidence: 82,
    price: "0.54",
    time: "2m ago",
  },
  {
    id: "sig-2",
    market: "Fed rate cut in June 2026?",
    signal: "BUY NO",
    confidence: 71,
    price: "0.38",
    time: "11m ago",
  },
  {
    id: "sig-3",
    market: "Trump approval > 50% by Q3?",
    signal: "BUY YES",
    confidence: 65,
    price: "0.41",
    time: "34m ago",
  },
];

export default function DashboardPage() {
  return (
    <div className="dashboard">
      {/* Wallet Display */}
      <WalletDisplay />

      {/* Stat cards */}
      <section className="dashboard-stats">
        {STAT_CARDS.map((card) => {
          const Icon = card.icon;
          return (
            <div key={card.id} id={card.id} className="dashboard-stat-card">
              <div className="stat-card-header">
                <span className="stat-card-label">{card.label}</span>
                <div
                  className="stat-card-icon"
                  style={{ background: `${card.color}20`, color: card.color }}
                >
                  <Icon size={16} />
                </div>
              </div>
              <div className="stat-card-value">{card.value}</div>
              <div
                className={`stat-card-change ${card.positive ? "positive" : "negative"}`}
              >
                {card.positive ? (
                  <ArrowUpRight size={12} />
                ) : (
                  <ArrowDownRight size={12} />
                )}
                {card.change}
              </div>
            </div>
          );
        })}
      </section>

      {/* Main grid */}
      <section className="dashboard-grid">
        {/* Recent AI Signals */}
        <div className="dashboard-panel">
          <div className="panel-header">
            <h2 className="panel-title">
              <Zap size={16} className="panel-title-icon" />
              Recent AI Signals
            </h2>
            <a href="/app/signals" className="panel-view-all">
              View all →
            </a>
          </div>
          <div className="panel-content">
            {RECENT_SIGNALS.map((sig) => (
              <div key={sig.id} id={sig.id} className="signal-row">
                <div className="signal-row-left">
                  <span
                    className={`signal-badge ${sig.signal.includes("YES") ? "yes" : "no"}`}
                  >
                    {sig.signal}
                  </span>
                  <span className="signal-market">{sig.market}</span>
                </div>
                <div className="signal-row-right">
                  <span className="signal-confidence">{sig.confidence}%</span>
                  <span className="signal-price">${sig.price}</span>
                  <span className="signal-time">{sig.time}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Portfolio Summary */}
        <div className="dashboard-panel">
          <div className="panel-header">
            <h2 className="panel-title">Portfolio Summary</h2>
          </div>
          <div className="panel-content panel-empty">
            <div className="empty-state">
              <div className="empty-state-icon">📊</div>
              <p className="empty-state-text">No positions yet</p>
              <p className="empty-state-sub">
                Browse markets to place your first trade
              </p>
              <a
                href="/app/markets"
                id="dashboard-browse-markets-btn"
                className="empty-state-btn"
              >
                Browse Markets
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* Agent status */}
      <section className="dashboard-agents-banner">
        <div className="agents-banner-inner">
          <div className="agents-banner-left">
            <Bot size={24} className="agents-banner-icon" />
            <div>
              <h3 className="agents-banner-title">Autonomous Agents</h3>
              <p className="agents-banner-sub">
                Set up AI agents to trade on your behalf, 24/7.
              </p>
            </div>
          </div>
          <a
            href="/app/agents"
            id="dashboard-setup-agents-btn"
            className="agents-banner-btn"
          >
            Set Up Agent
          </a>
        </div>
      </section>
    </div>
  );
}
