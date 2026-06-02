"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { ArrowLeft, ExternalLink } from "lucide-react";
import CobotMarketCard from "@/components/app/CobotMarketCard";
import type { Market } from "@/lib/polymarket";

export default function EventPage() {
  const params = useParams<{ eventId: string }>();
  const router = useRouter();
  const eventId = params.eventId;

  const [markets, setMarkets] = useState<Market[]>([]);
  const [eventTitle, setEventTitle] = useState<string>("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadEventMarkets() {
      try {
        if (!loading) {
          // Silent refresh (don't show loading state)
        } else {
          setLoading(true);
        }
        setError(null);

        // Fetch all markets and filter by eventId
        const res = await fetch(`/api/markets?limit=200&order=volumeNum&ascending=false`);
        if (!res.ok) throw new Error("Failed to fetch markets");
        
        const data = await res.json();
        
        // Filter markets by eventId
        const eventMarkets = data.markets.filter((m: Market) => m.eventId === eventId);
        
        if (eventMarkets.length === 0) {
          throw new Error("Event not found");
        }

        // Sort by YES price (highest probability first)
        eventMarkets.sort((a: Market, b: Market) => b.yesPrice - a.yesPrice);
        
        setMarkets(eventMarkets);
        setEventTitle(eventMarkets[0].eventTitle || "Event Markets");
      } catch (err) {
        setError((err as Error).message);
      } finally {
        setLoading(false);
      }
    }

    if (eventId) {
      loadEventMarkets();
      
      // Set up polling for real-time updates (every 30 seconds)
      const pollInterval = setInterval(() => {
        loadEventMarkets();
      }, 30000);
      
      return () => clearInterval(pollInterval);
    }
  }, [eventId, loading]);

  if (loading) {
    return (
      <div className="markets-page">
        <div className="markets-grid-cobot">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="cobot-market-card skeleton" style={{ height: 200 }} />
          ))}
        </div>
      </div>
    );
  }

  if (error || markets.length === 0) {
    return (
      <div className="markets-error">
        <p>{error || "Event not found"}</p>
        <button onClick={() => router.push("/app/markets")} className="markets-retry-btn">
          ← Back to Markets
        </button>
      </div>
    );
  }

  const totalVolume = markets.reduce((sum, m) => sum + m.volume, 0);
  const formatVolume = (n: number) => {
    if (n >= 1_000_000) return `$${(n / 1_000_000).toFixed(1)}M`;
    if (n >= 1_000) return `$${(n / 1_000).toFixed(1)}K`;
    return `$${n.toFixed(0)}`;
  };

  return (
    <div className="markets-page">
      {/* Back button */}
      <button
        className="market-detail-back"
        onClick={() => router.push("/app/markets")}
        style={{ marginBottom: "1rem" }}
      >
        <ArrowLeft size={16} />
        All Markets
      </button>

      {/* Event header */}
      <div style={{ marginBottom: "2rem" }}>
        <h1 style={{ fontSize: "2rem", fontWeight: "bold", marginBottom: "0.5rem" }}>
          {eventTitle}
        </h1>
        <div style={{ display: "flex", gap: "1rem", color: "#888", fontSize: "0.9rem" }}>
          <span>{markets.length} markets</span>
          <span>•</span>
          <span>{formatVolume(totalVolume)} total volume</span>
        </div>
      </div>

      {/* Markets grid */}
      <div className="markets-grid-cobot">
        {markets.map((market) => (
          <CobotMarketCard 
            key={market.conditionId} 
            market={market}
          />
        ))}
      </div>

      {/* Polymarket link */}
      {markets[0]?.eventSlug && (
        <a
          href={`https://polymarket.com/event/${markets[0].eventSlug}`}
          target="_blank"
          rel="noopener noreferrer"
          className="polymarket-link"
          style={{ marginTop: "2rem", display: "inline-flex", alignItems: "center", gap: "0.5rem" }}
        >
          <ExternalLink size={13} />
          View on Polymarket
        </a>
      )}
    </div>
  );
}
