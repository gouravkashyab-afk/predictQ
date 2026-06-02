"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { TrendingUp, Bot, ArrowRight } from "lucide-react";
import CobotMarketCard from "@/components/app/CobotMarketCard";
import type { Market } from "@/lib/polymarket";

const FEATURED_AGENTS = [
  {
    id: "poly-farming",
    name: "Poly Farming Agent",
    description: "Automated airdrop farming on Polymarket",
    badge: "Popular",
    badgeColor: "#5542ff",
    icon: "📦",
  },
  {
    id: "btc-5min",
    name: "Allora Agent (BTC 5-Min)",
    description: "BTC 5-minute trading with Allora predictions",
    badge: "New",
    badgeColor: "#f59e0b",
    icon: "⚡",
  },
  {
    id: "sports-ai",
    name: "Sports AI Agent",
    description: "Live sports trading with ESPN data",
    badge: "Live",
    badgeColor: "#4ade80",
    icon: "⚽",
  },
];

export default function HomePage() {
  const [trendingMarkets, setTrendingMarkets] = useState<Market[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/markets?limit=10&order=volume")
      .then((r) => r.json())
      .then((d) => {
        setTrendingMarkets(d.markets || []);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="home-page">
      {/* Trending Agents */}
      <section className="home-section">
        <div className="home-section-header">
          <h2 className="home-section-title">
            <Bot size={18} />
            Trending Agents
          </h2>
          <Link href="/app/agents" className="home-view-all">
            View All
            <ArrowRight size={14} />
          </Link>
        </div>

        <div className="home-agents-grid">
          {FEATURED_AGENTS.map((agent) => (
            <Link
              key={agent.id}
              href={`/app/agents/${agent.id}`}
              className="home-agent-card"
            >
              <div className="home-agent-icon">{agent.icon}</div>
              <div className="home-agent-content">
                <div className="home-agent-header">
                  <h3 className="home-agent-name">{agent.name}</h3>
                  <span
                    className="home-agent-badge"
                    style={{ background: `${agent.badgeColor}20`, color: agent.badgeColor }}
                  >
                    {agent.badge}
                  </span>
                </div>
                <p className="home-agent-description">{agent.description}</p>
              </div>
              <ArrowRight size={16} className="home-agent-arrow" />
            </Link>
          ))}
        </div>
      </section>

      {/* Trending Predictions */}
      <section className="home-section">
        <div className="home-section-header">
          <h2 className="home-section-title">
            <TrendingUp size={18} />
            Trending Predictions
          </h2>
          <Link href="/app/markets" className="home-view-all">
            View All
            <ArrowRight size={14} />
          </Link>
        </div>

        {loading ? (
          <div className="markets-grid-cobot">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="cobot-market-card skeleton" style={{ height: 200 }} />
            ))}
          </div>
        ) : (
          <div className="markets-grid-cobot">
            {trendingMarkets.slice(0, 5).map((market) => (
              <CobotMarketCard key={market.conditionId} market={market} />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
