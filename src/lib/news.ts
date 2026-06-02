// ─── News API Client + NLP Market Matcher ────────────────────────────────────
// Fetches top headlines from NewsAPI and matches them to Polymarket questions
// using keyword overlap scoring.

export interface NewsArticleData {
  id: string;
  title: string;
  description: string;
  url: string;
  source: string;
  imageUrl?: string;
  publishedAt: string;
  sentiment: "positive" | "negative" | "neutral";
  keywords: string[];
}

export interface NewsMarketMatch {
  articleId: string;
  conditionId: string;
  relevanceScore: number;
}

// ─── NewsAPI client ───────────────────────────────────────────────────────────

const NEWSAPI_BASE = "https://newsapi.org/v2";

interface NewsAPIArticle {
  source: { name: string };
  title: string;
  description?: string;
  url: string;
  urlToImage?: string;
  publishedAt: string;
}

interface NewsAPIResponse {
  status: string;
  totalResults: number;
  articles: NewsAPIArticle[];
}

export async function fetchTopHeadlines(pageSize = 40): Promise<NewsAPIArticle[]> {
  const apiKey = process.env.NEWS_API_KEY;

  if (!apiKey) {
    console.log("[news] No NEWS_API_KEY — returning mock articles");
    return getMockArticles();
  }

  const queries = ["prediction market", "politics economy", "crypto bitcoin", "AI technology"];
  const allArticles: NewsAPIArticle[] = [];

  for (const q of queries) {
    try {
      const url = `${NEWSAPI_BASE}/everything?q=${encodeURIComponent(q)}&language=en&sortBy=publishedAt&pageSize=${Math.ceil(pageSize / queries.length)}&apiKey=${apiKey}`;
      const res = await fetch(url, { cache: "no-store" });
      if (!res.ok) continue;
      const data: NewsAPIResponse = await res.json();
      if (data.status === "ok") allArticles.push(...(data.articles ?? []));
    } catch (err) {
      console.error(`[news] Failed to fetch for query "${q}":`, err);
    }
  }

  return allArticles.slice(0, pageSize);
}

// ─── Keyword extractor ────────────────────────────────────────────────────────

const STOP_WORDS = new Set([
  "the", "a", "an", "and", "or", "but", "in", "on", "at", "to", "for",
  "of", "with", "by", "from", "is", "are", "was", "were", "be", "been",
  "have", "has", "had", "do", "does", "did", "will", "would", "could",
  "should", "may", "might", "shall", "can", "this", "that", "these",
  "those", "it", "its", "they", "their", "he", "she", "we", "you",
  "as", "if", "into", "about", "up", "out", "over", "after", "than",
]);

export function extractKeywords(text: string): string[] {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, " ")
    .split(/\s+/)
    .filter((w) => w.length > 3 && !STOP_WORDS.has(w))
    .slice(0, 20);
}

// ─── Sentiment analyzer (simple keyword-based) ────────────────────────────────

const POSITIVE_WORDS = new Set([
  "rise", "rising", "surge", "surges", "gain", "gains", "bull", "bullish",
  "rally", "win", "wins", "victory", "approve", "approved", "support",
  "boost", "boosts", "growth", "grows", "up", "record", "high", "best",
  "improve", "positive", "success", "strong", "beat", "beats",
]);

const NEGATIVE_WORDS = new Set([
  "fall", "falls", "drop", "drops", "crash", "bear", "bearish", "decline",
  "lose", "loss", "defeat", "reject", "rejected", "cut", "crisis", "risk",
  "warn", "warning", "concern", "weak", "miss", "misses", "fail", "failure",
  "down", "low", "worst", "threat", "attack", "collapse",
]);

export function analyzeSentiment(text: string): "positive" | "negative" | "neutral" {
  const words = text.toLowerCase().split(/\s+/);
  let score = 0;
  for (const word of words) {
    if (POSITIVE_WORDS.has(word)) score++;
    if (NEGATIVE_WORDS.has(word)) score--;
  }
  if (score > 0) return "positive";
  if (score < 0) return "negative";
  return "neutral";
}

// ─── Market matcher ───────────────────────────────────────────────────────────

export function scoreRelevance(
  articleKeywords: string[],
  marketQuestion: string
): number {
  const marketWords = new Set(extractKeywords(marketQuestion));
  const matches = articleKeywords.filter((kw) => marketWords.has(kw));
  if (matches.length === 0) return 0;
  // Jaccard-like similarity scaled to 0-100
  const union = new Set([...articleKeywords, ...marketWords]).size;
  return Math.min(100, Math.round((matches.length / Math.max(1, union)) * 300));
}

// ─── Article normalizer ───────────────────────────────────────────────────────

export function normalizeArticle(
  raw: NewsAPIArticle,
  id: string
): NewsArticleData {
  const text = `${raw.title ?? ""} ${raw.description ?? ""}`;
  return {
    id,
    title: raw.title ?? "Untitled",
    description: raw.description ?? "",
    url: raw.url,
    source: raw.source?.name ?? "Unknown",
    imageUrl: raw.urlToImage ?? undefined,
    publishedAt: raw.publishedAt,
    sentiment: analyzeSentiment(text),
    keywords: extractKeywords(text),
  };
}

// ─── Mock articles (when no API key) ─────────────────────────────────────────

function getMockArticles(): NewsAPIArticle[] {
  const now = new Date().toISOString();
  return [
    {
      source: { name: "Reuters" },
      title: "Federal Reserve signals potential rate cut in Q3 2026",
      description: "Fed chair hints at easing monetary policy as inflation continues to moderate toward the 2% target.",
      url: "https://reuters.com/mock-fed-rate-cut",
      urlToImage: undefined,
      publishedAt: now,
    },
    {
      source: { name: "CoinDesk" },
      title: "Bitcoin approaches $120,000 as institutional demand surges",
      description: "BTC trades near all-time highs with major institutional players accumulating positions.",
      url: "https://coindesk.com/mock-btc-120k",
      urlToImage: undefined,
      publishedAt: now,
    },
    {
      source: { name: "Bloomberg" },
      title: "Trump approval ratings climb ahead of midterm elections",
      description: "New polls show a surge in presidential approval, with key swing states showing support.",
      url: "https://bloomberg.com/mock-trump-approval",
      urlToImage: undefined,
      publishedAt: now,
    },
    {
      source: { name: "AP News" },
      title: "AI regulation bill advances through Senate committee",
      description: "Bipartisan support grows for comprehensive AI oversight legislation targeting large language models.",
      url: "https://apnews.com/mock-ai-regulation",
      urlToImage: undefined,
      publishedAt: now,
    },
    {
      source: { name: "ESPN" },
      title: "NBA playoffs: Warriors advance to Western Conference Finals",
      description: "Golden State eliminates the Nuggets in six games, setting up a marquee conference finals matchup.",
      url: "https://espn.com/mock-warriors-advance",
      urlToImage: undefined,
      publishedAt: now,
    },
    {
      source: { name: "FT" },
      title: "Ethereum ETF sees record inflows as DeFi adoption grows",
      description: "Spot Ethereum ETFs attracted $2.1B in weekly inflows, signaling mainstream adoption acceleration.",
      url: "https://ft.com/mock-eth-etf",
      urlToImage: undefined,
      publishedAt: now,
    },
  ];
}
