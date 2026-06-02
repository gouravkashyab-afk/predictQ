"use client";

import { useState, useEffect, useRef } from "react";
import { Newspaper, RefreshCw, Search } from "lucide-react";
import NewsCard from "@/components/app/NewsCard";

type Sentiment = "all" | "positive" | "negative" | "neutral";

const SENTIMENT_TABS: { label: string; value: Sentiment }[] = [
  { label: "All News", value: "all" },
  { label: "Positive", value: "positive" },
  { label: "Negative", value: "negative" },
  { label: "Neutral", value: "neutral" },
];

interface Article {
  id: string;
  title: string;
  description: string;
  url: string;
  source: string;
  imageUrl?: string | null;
  publishedAt: string;
  sentiment: string;
  keywords: string[];
  relatedMarkets?: Array<{ conditionId: string; question: string }>;
}

export default function NewsroomPage() {
  const [articles, setArticles] = useState<Article[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [sentiment, setSentiment] = useState<Sentiment>("all");
  const [search, setSearch] = useState("");
  const [error, setError] = useState<string | null>(null);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  const loadNews = async (reset = false) => {
    try {
      if (reset) setLoading(true);
      else setRefreshing(true);
      setError(null);

      const params = new URLSearchParams({ limit: "24" });
      if (sentiment !== "all") params.set("sentiment", sentiment);

      const res = await fetch(`/api/news?${params.toString()}`);
      if (!res.ok) throw new Error("Failed to fetch news");
      const data = await res.json();
      setArticles(data.articles ?? []);
    } catch (err) {
      setError("Failed to load news. Retrying...");
      console.error(err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  // Auto-refresh every 2 minutes
  useEffect(() => {
    loadNews(true);
    intervalRef.current = setInterval(() => loadNews(false), 120_000);
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sentiment]);

  // Client-side search filter
  const filtered = search
    ? articles.filter(
        (a) =>
          a.title.toLowerCase().includes(search.toLowerCase()) ||
          a.description?.toLowerCase().includes(search.toLowerCase())
      )
    : articles;

  const positiveCount = articles.filter((a) => a.sentiment === "positive").length;
  const negativeCount = articles.filter((a) => a.sentiment === "negative").length;

  return (
    <div className="newsroom-page">
      {/* Header */}
      <div className="newsroom-header">
        <div className="newsroom-header-left">
          <h1 className="newsroom-title">
            <Newspaper size={20} className="newsroom-title-icon" />
            Newsroom
          </h1>
          <div className="newsroom-stats-row">
            <span className="newsroom-stat-pill positive">
              {positiveCount} Positive
            </span>
            <span className="newsroom-stat-pill negative">
              {negativeCount} Negative
            </span>
          </div>
        </div>
        <button
          id="newsroom-refresh-btn"
          className={`newsroom-refresh-btn ${refreshing ? "spinning" : ""}`}
          onClick={() => loadNews(false)}
          disabled={loading}
          aria-label="Refresh news"
        >
          <RefreshCw size={14} />
        </button>
      </div>

      {/* Filters row */}
      <div className="newsroom-filters">
        {/* Sentiment tabs */}
        <div className="newsroom-tabs">
          {SENTIMENT_TABS.map((tab) => (
            <button
              key={tab.value}
              id={`news-tab-${tab.value}`}
              className={`newsroom-tab ${sentiment === tab.value ? "active" : ""} ${
                tab.value !== "all" ? `sentiment-${tab.value}` : ""
              }`}
              onClick={() => setSentiment(tab.value)}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Search */}
        <div className="newsroom-search">
          <Search size={13} className="newsroom-search-icon" />
          <input
            id="newsroom-search-input"
            type="text"
            placeholder="Search articles..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="newsroom-search-input"
          />
        </div>
      </div>

      {/* Content */}
      {error ? (
        <div className="newsroom-error">
          <p>{error}</p>
          <button onClick={() => loadNews(true)} className="newsroom-retry-btn">
            Retry
          </button>
        </div>
      ) : loading ? (
        <div className="newsroom-grid">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="news-card skeleton" />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="newsroom-empty">
          <Newspaper size={40} className="newsroom-empty-icon" />
          <p>No articles found</p>
          <span>Try adjusting your filters or search</span>
        </div>
      ) : (
        <div className="newsroom-grid">
          {filtered.map((article) => (
            <NewsCard key={article.id} article={article} />
          ))}
        </div>
      )}

      {/* Auto-refresh indicator */}
      <div className="signals-auto-refresh">
        <div className="auto-refresh-dot" />
        Auto-refreshing every 2 minutes
      </div>
    </div>
  );
}
