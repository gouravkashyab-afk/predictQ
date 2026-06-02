"use client";

import { useState } from "react";
import { ChevronDown, ChevronUp, TrendingUp } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import type { Market } from "@/lib/polymarket";

interface CobotMarketCardProps {
  market: Market;
  relatedMarkets?: Market[];
}

export default function CobotMarketCard({ market, relatedMarkets = [] }: CobotMarketCardProps) {
  const [expanded, setExpanded] = useState(false);
  const router = useRouter();
  
  const yesPercent = (market.yesPrice * 100).toFixed(2);
  const noPercent = (market.noPrice * 100).toFixed(2);
  const volumeDisplay = market.volume >= 1000000 
    ? `${(market.volume / 1000000).toFixed(1)} M` 
    : `${(market.volume / 1000).toFixed(1)} K`;

  const marketsToShow = expanded ? relatedMarkets : [];

  return (
    <div className="cobot-market-card">
      {/* Main Market */}
      <div className="cobot-market-main">
        {/* Header - Clickable to market detail */}
        <Link 
          href={`/app/markets/${market.conditionId}`}
          className="cobot-market-header"
          style={{ textDecoration: 'none', color: 'inherit', cursor: 'pointer' }}
        >
          {market.icon && (
            <img src={market.icon} alt="" className="cobot-market-icon" />
          )}
          <h3 className="cobot-market-question">{market.question}</h3>
          {market.featured && (
            <span className="cobot-market-badge">
              <TrendingUp size={12} />
            </span>
          )}
        </Link>

        {/* Outcomes */}
        <div className="cobot-market-outcomes">
          {/* YES Outcome */}
          <div className="cobot-outcome-row">
            <div className="cobot-outcome-info">
              <span className="cobot-outcome-name">Yes</span>
              <span className="cobot-outcome-percentage">{yesPercent}%</span>
            </div>
            <Link 
              href={`/app/markets/${market.conditionId}?side=YES`}
              className="cobot-buy-btn yes"
            >
              Buy Yes
              <span className="cobot-buy-price">{yesPercent}%</span>
            </Link>
          </div>

          {/* NO Outcome */}
          <div className="cobot-outcome-row">
            <div className="cobot-outcome-info">
              <span className="cobot-outcome-name">No</span>
              <span className="cobot-outcome-percentage">{noPercent}%</span>
            </div>
            <Link 
              href={`/app/markets/${market.conditionId}?side=NO`}
              className="cobot-buy-btn no"
            >
              Buy No
              <span className="cobot-buy-price">{noPercent}%</span>
            </Link>
          </div>
        </div>

        {/* Volume */}
        <div className="cobot-market-volume">
          {volumeDisplay} $ Vol.
        </div>
      </div>

      {/* Related Markets (Expandable) */}
      {relatedMarkets.length > 0 && (
        <>
          {marketsToShow.map((relatedMarket) => {
            const relYesPercent = (relatedMarket.yesPrice * 100).toFixed(2);
            const relNoPercent = (relatedMarket.noPrice * 100).toFixed(2);
            const relVolumeDisplay = relatedMarket.volume >= 1000000 
              ? `${(relatedMarket.volume / 1000000).toFixed(1)} M` 
              : `${(relatedMarket.volume / 1000).toFixed(1)} K`;

            return (
              <div key={relatedMarket.conditionId} className="cobot-market-related">
                <div className="cobot-outcome-row">
                  <div className="cobot-outcome-info">
                    <span className="cobot-outcome-name">{relatedMarket.question.slice(0, 40)}...</span>
                    <span className="cobot-outcome-percentage">{relYesPercent}%</span>
                  </div>
                  <Link 
                    href={`/app/markets/${relatedMarket.conditionId}?side=YES`}
                    className="cobot-buy-btn yes small"
                  >
                    Buy Yes
                    <span className="cobot-buy-price">{relYesPercent}%</span>
                  </Link>
                </div>
                <div className="cobot-outcome-row">
                  <div className="cobot-outcome-info">
                    <span className="cobot-outcome-name">No</span>
                    <span className="cobot-outcome-percentage">{relNoPercent}%</span>
                  </div>
                  <Link 
                    href={`/app/markets/${relatedMarket.conditionId}?side=NO`}
                    className="cobot-buy-btn no small"
                  >
                    Buy No
                    <span className="cobot-buy-price">{relNoPercent}%</span>
                  </Link>
                </div>
                <div className="cobot-market-volume small">
                  {relVolumeDisplay} $ Vol.
                </div>
              </div>
            );
          })}

          {/* Expand Button */}
          <button 
            className="cobot-expand-btn"
            onClick={(e) => {
              e.stopPropagation(); // Prevent card click
              if (market.eventId) {
                router.push(`/app/markets/event/${market.eventId}`);
              } else {
                setExpanded(!expanded);
              }
            }}
          >
            {expanded ? (
              <>
                <ChevronUp size={14} />
                Show less
              </>
            ) : (
              <>
                <ChevronDown size={14} />
                +{relatedMarkets.length} more markets
              </>
            )}
          </button>
        </>
      )}
    </div>
  );
}
