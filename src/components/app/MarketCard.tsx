"use client";

import Link from "next/link";
import { TrendingUp, Clock, BarChart2, Droplets } from "lucide-react";
import type { Market } from "@/lib/polymarket";

function formatVolume(n: number): string {
  if (n >= 1_000_000) return `$${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `$${(n / 1_000).toFixed(0)}K`;
  return `$${n.toFixed(0)}`;
}

function formatDate(iso: string): string {
  if (!iso) return "No expiry";
  try {
    return new Date(iso).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  } catch {
    return "—";
  }
}

interface MarketCardProps {
  market: Market;
}

export default function MarketCard({ market }: MarketCardProps) {
  const yesPercent = Math.round(market.yesPrice * 100);
  const noPercent = Math.round(market.noPrice * 100);

  return (
    <Link
      href={`/app/markets/${market.conditionId}`}
      id={`market-card-${market.conditionId.slice(0, 8)}`}
      className="market-card"
    >
      {/* Header */}
      <div className="market-card-header">
        {market.icon ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={market.icon}
            alt=""
            className="market-card-icon"
            onError={(e) => {
              (e.target as HTMLImageElement).style.display = "none";
            }}
          />
        ) : (
          <div className="market-card-icon-fallback">
            <TrendingUp size={14} />
          </div>
        )}
        <span className="market-card-category">{market.category}</span>
        {market.featured && (
          <span className="market-card-featured">Featured</span>
        )}
      </div>

      {/* Question */}
      <p className="market-card-question">{market.question}</p>

      {/* YES / NO price bar */}
      <div className="market-price-bar">
        <div className="market-price-bar-inner">
          <div
            className="market-price-bar-yes"
            style={{ width: `${yesPercent}%` }}
          />
        </div>
        <div className="market-price-labels">
          <span className="market-price-yes">YES {yesPercent}¢</span>
          <span className="market-price-no">NO {noPercent}¢</span>
        </div>
      </div>

      {/* Footer stats */}
      <div className="market-card-footer">
        <div className="market-stat">
          <BarChart2 size={11} />
          <span>{formatVolume(market.volume)}</span>
          <span className="market-stat-label">vol</span>
        </div>
        <div className="market-stat">
          <Droplets size={11} />
          <span>{formatVolume(market.liquidity)}</span>
          <span className="market-stat-label">liq</span>
        </div>
        <div className="market-stat">
          <Clock size={11} />
          <span>{formatDate(market.endDate)}</span>
        </div>
      </div>
    </Link>
  );
}
