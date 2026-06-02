"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { Search, Filter } from "lucide-react";
import CobotMarketCard from "@/components/app/CobotMarketCard";
import type { Market } from "@/lib/polymarket";
import { groupMarkets } from "@/lib/polymarket";
import { usePolymarketWebSocket } from "@/hooks/usePolymarketWebSocket";

const CATEGORIES = [
  "Trending",
  "New",
  "Politics",
  "Sports",
  "Finance",
  "Crypto",
];

const SORT_OPTIONS = [
  { value: "volumeNum", label: "Volume" },
  { value: "liquidityNum", label: "Liquidity" },
  { value: "endDateIso", label: "End Date" },
];

interface MarketsResponse {
  markets: Market[];
  offset: number;
  limit: number;
  count: number;
  hasMore: boolean;
}

export default function MarketsPage() {
  const [markets, setMarkets] = useState<Array<Market & { relatedMarkets?: Market[] }>>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [category, setCategory] = useState("Trending");
  const [sortBy, setSortBy] = useState("volume");
  const [error, setError] = useState<string | null>(null);
  const searchTimeout = useRef<NodeJS.Timeout | null>(null);
  const pollTimeout = useRef<NodeJS.Timeout | null>(null);

  // TODO: Re-enable WebSocket after fixing memory leak
  // const assetIds = markets.flatMap(m => [m.yesTokenId, m.noTokenId]).filter(Boolean);
  // const { isConnected } = usePolymarketWebSocket({
  //   assetIds,
  //   enabled: markets.length > 0,
  //   onPriceUpdate: (assetId, price) => {
  //     setMarkets(prev => prev.map(market => {
  //       if (market.yesTokenId === assetId) {
  //         return { ...market, yesPrice: price, noPrice: 1 - price };
  //       } else if (market.noTokenId === assetId) {
  //         return { ...market, noPrice: price, yesPrice: 1 - price };
  //       }
  //       return market;
  //     }));
  //   },
  // });
  const isConnected = false; // Temporarily disabled

  // Debounce search
  useEffect(() => {
    if (searchTimeout.current) clearTimeout(searchTimeout.current);
    searchTimeout.current = setTimeout(() => {
      setDebouncedSearch(search);
    }, 400);
    return () => {
      if (searchTimeout.current) clearTimeout(searchTimeout.current);
    };
  }, [search]);

  const buildUrl = useCallback(
    () => {
      const params = new URLSearchParams();
      params.set("limit", "100"); // Fetch more to have enough for filtering
      params.set("order", "volumeNum");
      params.set("ascending", "false");
      if (debouncedSearch) params.set("search", debouncedSearch);
      return `/api/markets?${params.toString()}`;
    },
    [debouncedSearch]
  );

  const loadMarkets = useCallback(
    async () => {
      try {
        setLoading(true);
        setError(null);

        const url = buildUrl();
        const res = await fetch(url);
        if (!res.ok) throw new Error("Failed to fetch");
        const data: MarketsResponse = await res.json();

        // Client-side category filter using keyword matching
        let filtered = data.markets;
        
        if (category === "Trending") {
          // Show ALL markets sorted by 24h volume (no filtering)
          filtered = [...data.markets]
            .sort((a, b) => b.volume24h - a.volume24h)
            .slice(0, 50);
        } else if (category === "New") {
          // Show recently created markets
          filtered = filtered.filter(m => m.new);
          if (filtered.length === 0) {
            // Fallback: show all markets sorted by volume
            filtered = [...data.markets]
              .sort((a, b) => b.volume24h - a.volume24h)
              .slice(0, 30);
          }
        } else if (category === "Politics") {
          // Filter by keywords in question (exclude sports/crypto to avoid overlap)
          filtered = filtered.filter(m => {
            const q = m.question.toLowerCase();
            const isPolitics = /president|election|congress|senate|political|vote|democrat|republican|trump|biden|white house|governor|mayor|parliament|prime minister/i.test(q);
            const isSports = /world cup|fifa|nfl|nba|mlb|nhl|soccer|football|basketball|baseball|hockey|championship|league|super bowl|playoffs/i.test(q);
            const isCrypto = /bitcoin|ethereum|crypto|blockchain|btc|eth|solana|cardano|polygon|defi|nft|web3|binance|coinbase/i.test(q);
            return isPolitics && !isSports && !isCrypto;
          }).slice(0, 30);
        } else if (category === "Sports") {
          // Filter by keywords in question
          filtered = filtered.filter(m => 
            /world cup|fifa|nfl|nba|mlb|nhl|soccer|football|basketball|baseball|hockey|sports|championship|league|super bowl|playoffs|tennis|golf|boxing|ufc|mma/i.test(m.question)
          ).slice(0, 30);
        } else if (category === "Finance") {
          // Filter by keywords in question (exclude crypto)
          filtered = filtered.filter(m => {
            const q = m.question.toLowerCase();
            const isFinance = /stock|market|economy|inflation|fed|interest rate|gdp|recession|price|dollar|euro|trading|nasdaq|dow jones|s&p|wall street|treasury|bond/i.test(q);
            const isCrypto = /bitcoin|ethereum|crypto|blockchain|btc|eth|solana|cardano|polygon|defi|nft|web3|binance|coinbase/i.test(q);
            return isFinance && !isCrypto;
          }).slice(0, 30);
        } else if (category === "Crypto") {
          // Filter ONLY crypto keywords (very specific)
          filtered = filtered.filter(m => 
            /bitcoin|ethereum|crypto|blockchain|btc|eth|solana|cardano|polygon|matic|defi|nft|web3|binance|coinbase|usdc|usdt|stablecoin|metamask|ledger|trezor|satoshi/i.test(m.question)
          ).slice(0, 30);
        }

        // Apply grouping before setting markets
        console.log('Before grouping:', filtered.length, 'markets');
        console.log('Markets with eventTitle:', filtered.filter(m => m.eventTitle && m.eventTitle.trim() !== "").length);
        console.log('Markets with groupItemTitle:', filtered.filter(m => m.groupItemTitle && m.groupItemTitle.trim() !== "").length);
        
        const grouped = groupMarkets(filtered);
        const groupedCount = grouped.filter(m => m.relatedMarkets && m.relatedMarkets.length > 0).length;
        
        console.log('After grouping:', grouped.length, 'markets');
        console.log('Event groups found:', groupedCount);
        
        if (groupedCount > 0) {
          const sample = grouped.find(m => m.relatedMarkets && m.relatedMarkets.length > 0);
          console.log('Sample grouped event:', {
            eventTitle: sample?.eventTitle,
            mainMarket: sample?.question,
            relatedCount: sample?.relatedMarkets?.length
          });
        }
        
        setMarkets(grouped);
      } catch (err) {
        setError("Failed to load markets. Please try again.");
        console.error(err);
      } finally {
        setLoading(false);
      }
    },
    [buildUrl, category]
  );

  // Reset + reload when filters change
  useEffect(() => { 
    loadMarkets();
    
    // Poll every 30 seconds for updates
    if (pollTimeout.current) clearTimeout(pollTimeout.current);
    
    pollTimeout.current = setInterval(() => {
      loadMarkets();
    }, 30000);
    
    return () => {
      if (pollTimeout.current) clearInterval(pollTimeout.current);
    };
  }, [loadMarkets]);

  return (
    <div className="markets-page">
      {/* Filters */}
      <div className="markets-filters-cobot">
        {/* Platform dropdown */}
        <div className="markets-dropdown">
          <span>Polymarket</span>
          {isConnected && (
            <span style={{ 
              marginLeft: '8px', 
              width: '8px', 
              height: '8px', 
              borderRadius: '50%', 
              backgroundColor: '#10b981',
              display: 'inline-block',
              animation: 'pulse 2s infinite'
            }} title="Live prices" />
          )}
        </div>

        {/* Sort dropdown */}
        <div className="markets-dropdown">
          <span>24hr Volume</span>
        </div>

        {/* Search */}
        <div className="markets-search-cobot">
          <Search size={14} />
          <input
            type="text"
            placeholder="Search markets..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        {/* Filter button */}
        <button className="markets-filter-btn">
          <Filter size={14} />
        </button>
      </div>

      {/* Category tabs */}
      <div className="markets-categories-cobot">
        {CATEGORIES.map((cat) => (
          <button
            key={cat}
            className={`markets-cat-btn-cobot ${category === cat ? "active" : ""}`}
            onClick={() => setCategory(cat)}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* Markets Grid */}
      {error ? (
        <div className="markets-error">
          <p>{error}</p>
          <button onClick={() => loadMarkets()} className="markets-retry-btn">
            Retry
          </button>
        </div>
      ) : loading ? (
        <div className="markets-grid-cobot">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="cobot-market-card skeleton" style={{ height: 200 }} />
          ))}
        </div>
      ) : markets.length === 0 ? (
        <div className="markets-empty">
          <div className="empty-state-icon">🔍</div>
          <p className="empty-state-text">No markets found</p>
          <p className="empty-state-sub">Try adjusting your filters or search</p>
        </div>
      ) : (
        <div className="markets-grid-cobot">
          {markets.map((market) => (
            <CobotMarketCard 
              key={market.conditionId} 
              market={market}
              relatedMarkets={market.relatedMarkets}
            />
          ))}
        </div>
      )}
    </div>
  );
}
