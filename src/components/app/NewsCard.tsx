"use client";

import { ExternalLink, TrendingUp, Newspaper } from "lucide-react";

export interface NewsCardProps {
  article: {
    id: string;
    title: string;
    description: string;
    url: string;
    source: string;
    imageUrl?: string | null;
    publishedAt: string;
    sentiment: string;
    keywords: string[];
    relatedMarkets?: Array<{ conditionId: string; question: string; score?: number }>;
  };
}

function timeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60_000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}

const SENTIMENT_CONFIG = {
  positive: { label: "Positive", className: "sentiment-positive" },
  negative: { label: "Negative", className: "sentiment-negative" },
  neutral: { label: "Neutral", className: "sentiment-neutral" },
};

export default function NewsCard({ article }: NewsCardProps) {
  const sentiment = SENTIMENT_CONFIG[article.sentiment as keyof typeof SENTIMENT_CONFIG] ?? SENTIMENT_CONFIG.neutral;

  return (
    <div className="news-card" id={`news-${article.id}`}>
      {/* Header */}
      <div className="news-card-header">
        <div className="news-card-meta">
          <span className="news-source-badge">
            <Newspaper size={11} />
            {article.source}
          </span>
          <span className={`news-sentiment-badge ${sentiment.className}`}>
            {sentiment.label}
          </span>
        </div>
        <span className="news-time">{timeAgo(article.publishedAt)}</span>
      </div>

      {/* Image */}
      {article.imageUrl && (
        <div className="news-card-image-wrap">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={article.imageUrl}
            alt={article.title}
            className="news-card-image"
            onError={(e) => {
              (e.target as HTMLImageElement).style.display = "none";
            }}
          />
        </div>
      )}

      {/* Title & Description */}
      <h3 className="news-card-title">{article.title}</h3>
      {article.description && (
        <p className="news-card-description">{article.description}</p>
      )}

      {/* Related markets */}
      {article.relatedMarkets && article.relatedMarkets.length > 0 && (
        <div className="news-related-markets">
          <div className="news-related-label">
            <TrendingUp size={11} />
            Related Markets
          </div>
          <div className="news-related-pills">
            {article.relatedMarkets.slice(0, 2).map((m) => (
              <a
                key={m.conditionId}
                href={`/app/markets/${m.conditionId}`}
                className="news-market-pill"
              >
                {m.question.length > 50
                  ? `${m.question.slice(0, 47)}...`
                  : m.question}
              </a>
            ))}
          </div>
        </div>
      )}

      {/* Footer */}
      <a
        href={article.url}
        target="_blank"
        rel="noopener noreferrer"
        className="news-read-btn"
      >
        Read Article
        <ExternalLink size={12} />
      </a>
    </div>
  );
}
