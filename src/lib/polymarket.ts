// ─── Gamma API Response Schema (from Polymarket documentation) ───────────────

export interface GammaMarket {
  id: string;
  question: string | null;
  conditionId: string;
  slug: string | null;
  twitterCardImage: string | null;
  resolutionSource: string | null;
  endDate: string | null;
  category: string | null;
  ammType: string | null;
  liquidity: string | null;
  sponsorName: string | null;
  sponsorImage: string | null;
  startDate: string | null;
  xAxisValue: string | null;
  yAxisValue: string | null;
  denominationToken: string | null;
  fee: string | null;
  image: string | null;
  icon: string | null;
  lowerBound: string | null;
  upperBound: string | null;
  description: string | null;
  outcomes: string | null;
  outcomePrices: string | null;
  volume: string | null;
  active: boolean | null;
  marketType: string | null;
  formatType: string | null;
  lowerBoundDate: string | null;
  upperBoundDate: string | null;
  closed: boolean | null;
  marketMakerAddress: string;
  createdBy: number | null;
  updatedBy: number | null;
  createdAt: string | null;
  updatedAt: string | null;
  closedTime: string | null;
  wideFormat: boolean | null;
  new: boolean | null;
  mailchimpTag: string | null;
  featured: boolean | null;
  archived: boolean | null;
  resolvedBy: string | null;
  restricted: boolean | null;
  marketGroup: number | null;
  groupItemTitle: string | null;
  groupItemThreshold: string | null;
  questionID: string | null;
  umaEndDate: string | null;
  enableOrderBook: boolean | null;
  orderPriceMinTickSize: number | null;
  orderMinSize: number | null;
  umaResolutionStatus: string | null;
  curationOrder: number | null;
  volumeNum: number | null;
  liquidityNum: number | null;
  endDateIso: string | null;
  startDateIso: string | null;
  umaEndDateIso: string | null;
  hasReviewedDates: boolean | null;
  readyForCron: boolean | null;
  commentsEnabled: boolean | null;
  volume24hr: number | null;
  volume1wk: number | null;
  volume1mo: number | null;
  volume1yr: number | null;
  gameStartTime: string | null;
  secondsDelay: number | null;
  clobTokenIds: string | null;
  disqusThread: string | null;
  shortOutcomes: string | null;
  teamAID: string | null;
  teamBID: string | null;
  umaBond: string | null;
  umaReward: string | null;
  fpmmLive: boolean | null;
  volume24hrAmm: number | null;
  volume1wkAmm: number | null;
  volume1moAmm: number | null;
  volume1yrAmm: number | null;
  volume24hrClob: number | null;
  volume1wkClob: number | null;
  volume1moClob: number | null;
  volume1yrClob: number | null;
  volumeAmm: number | null;
  volumeClob: number | null;
  liquidityAmm: number | null;
  liquidityClob: number | null;
  makerBaseFee: number | null;
  takerBaseFee: number | null;
  customLiveness: number | null;
  acceptingOrders: boolean | null;
  notificationsEnabled: boolean | null;
  score: number | null;
  tags?: Array<{ id: string; label: string; slug: string }>;
  categories?: Array<{ id: string; label: string; slug: string }>;
  events?: Array<{
    id: string;
    title: string;
    slug: string;
    tags?: Array<{ id: string; label: string; slug: string }>;
  }>;
  lastTradePrice: number | null;
  bestBid: number | null;
  bestAsk: number | null;
  spread: number | null;
  oneDayPriceChange: number | null;
  oneHourPriceChange: number | null;
  oneWeekPriceChange: number | null;
  oneMonthPriceChange: number | null;
  oneYearPriceChange: number | null;
}

// Legacy CLOB types for backward compatibility
export interface PolyToken {
  token_id: string;
  outcome: string;
  price?: number;
  winner?: boolean;
}

export interface PolyMarket {
  condition_id: string;
  question_id: string;
  question: string;
  description: string;
  market_slug: string;
  end_date_iso: string;
  game_start_time?: string;
  seconds_delay: number;
  fpmm: string;
  maker_base_fee: number;
  taker_base_fee: number;
  notifications_enabled: boolean;
  neg_risk: boolean;
  neg_risk_market_id?: string;
  neg_risk_request_id?: string;
  icon?: string;
  image?: string;
  tokens: PolyToken[];
  tags?: string[];
  active: boolean;
  closed: boolean;
  archived: boolean;
  new: boolean;
  featured: boolean;
  restricted: boolean;
  volume: string;
  volume_num: number;
  volume_24hr: number;
  liquidity: string;
  liquidity_num: number;
  best_ask: number;
  best_bid: number;
  last_trade_price: number;
  competitive: number;
  minimum_order_size: number;
  minimum_tick_size: number;
  category?: string;
  accepting_orders: boolean;
  accepting_order_timestamp?: string;
  cyom: boolean;
  rewards?: {
    min_size: number;
    max_spread: number;
    event_start_date?: string;
    event_end_date?: string;
    in_game_multiplier?: number;
    reward_epoch?: number;
  };
}

export interface PolyMarketListResponse {
  limit: number;
  count: number;
  next_cursor: string;
  data: PolyMarket[];
}

export interface OrderbookLevel {
  price: string;
  size: string;
}

export interface Orderbook {
  market: string;
  asset_id: string;
  bids: OrderbookLevel[];
  asks: OrderbookLevel[];
  hash: string;
  timestamp: string;
}

export interface PricePoint {
  t: number;  // unix timestamp
  p: number;  // price
}

// ─── Normalized internal type ─────────────────────────────────────────────────

export interface Market {
  conditionId: string;
  question: string;
  description: string;
  slug: string;
  endDate: string;
  category: string;
  tags: string[];
  icon?: string;
  image?: string;
  yesPrice: number;
  noPrice: number;
  volume: number;
  volume24h: number;
  liquidity: number;
  lastTradePrice: number;
  active: boolean;
  closed: boolean;
  featured: boolean;
  new: boolean;
  yesTokenId: string;
  noTokenId: string;
  eventSlug?: string;
  groupItemTitle?: string;
  groupItemThreshold?: string;
}

// ─── Polymarket API Client ────────────────────────────────────────────────────

const CLOB_BASE = "https://clob.polymarket.com";
const GAMMA_BASE = "https://gamma-api.polymarket.com";

/**
 * Fetch markets from Gamma API (public market data)
 * Documentation: https://docs.polymarket.com/api-reference/markets/list-markets
 */
export async function fetchMarkets(params?: {
  limit?: number;
  offset?: number;
  order?: string;
  ascending?: boolean;
  active?: boolean;
  closed?: boolean;
  tag_id?: number;
}): Promise<GammaMarket[]> {
  const qs = new URLSearchParams();
  
  // Default to limit 20, offset 0
  qs.set("limit", String(params?.limit ?? 20));
  qs.set("offset", String(params?.offset ?? 0));
  
  if (params?.order) qs.set("order", params.order);
  if (params?.ascending !== undefined) qs.set("ascending", String(params.ascending));
  if (params?.active !== undefined) qs.set("active", String(params.active));
  if (params?.closed !== undefined) qs.set("closed", String(params.closed));
  if (params?.tag_id !== undefined) qs.set("tag_id", String(params.tag_id));

  const url = `${GAMMA_BASE}/markets?${qs.toString()}`;
  const res = await fetch(url, {
    cache: "no-store",
    headers: { Accept: "application/json" },
  });

  if (!res.ok) {
    const errorText = await res.text();
    throw new Error(`Polymarket Gamma API error: ${res.status} - ${errorText}`);
  }
  
  // Gamma API returns an array directly, not wrapped in an object
  return res.json();
}

/**
 * Fetch a single market by condition ID from Gamma API
 */
export async function fetchMarket(conditionId: string): Promise<GammaMarket> {
  const res = await fetch(`${GAMMA_BASE}/markets/${conditionId}`, {
    next: { revalidate: 30 },
    headers: { Accept: "application/json" },
  });
  if (!res.ok) {
    const errorText = await res.text();
    throw new Error(`Market not found: ${conditionId} - ${errorText}`);
  }
  return res.json();
}

/**
 * Fetch orderbook from CLOB API (for trading)
 */
export async function fetchOrderbook(tokenId: string): Promise<Orderbook> {
  const res = await fetch(`${CLOB_BASE}/book?token_id=${tokenId}`, {
    cache: "no-store",
    headers: { Accept: "application/json" },
  });
  if (!res.ok) throw new Error(`Orderbook error: ${res.status}`);
  return res.json();
}

/**
 * Fetch price history from CLOB API
 */
export async function fetchPriceHistory(
  tokenId: string,
  interval: "1m" | "1h" | "1d" | "1w" | "all" = "1w"
): Promise<PricePoint[]> {
  const res = await fetch(
    `${CLOB_BASE}/prices-history?market=${tokenId}&interval=${interval}&fidelity=60`,
    {
      next: { revalidate: 60 },
      headers: { Accept: "application/json" },
    }
  );
  if (!res.ok) return [];
  const json = await res.json();
  return json.history ?? [];
}

// ─── Normalizer ───────────────────────────────────────────────────────────────

/**
 * Convert Gamma API market to internal Market format
 */
export function normalizeMarket(raw: GammaMarket): Market {
  // Parse token IDs from clobTokenIds (JSON array string)
  let tokenIds: string[] = [];
  try {
    tokenIds = raw.clobTokenIds ? JSON.parse(raw.clobTokenIds) : [];
  } catch {
    // Fallback: try comma-separated
    tokenIds = raw.clobTokenIds?.split(",") ?? [];
  }
  const yesTokenId = tokenIds[0] ?? "";
  const noTokenId = tokenIds[1] ?? "";

  // Parse outcome prices from outcomePrices (JSON array string like "[\"0.551\", \"0.49\"]")
  let prices: number[] = [0.5, 0.5];
  try {
    if (raw.outcomePrices) {
      const priceStrings: string[] = JSON.parse(raw.outcomePrices);
      prices = priceStrings.map(p => parseFloat(p));
    }
  } catch (error) {
    console.warn(`Failed to parse outcomePrices for ${raw.conditionId}:`, error);
    // Fallback to lastTradePrice or 0.5
    prices = [raw.lastTradePrice ?? 0.5, 1 - (raw.lastTradePrice ?? 0.5)];
  }
  
  const yesPrice = prices[0] ?? raw.lastTradePrice ?? 0.5;
  const noPrice = prices[1] ?? (1 - (raw.lastTradePrice ?? 0.5));

  // Extract tag labels from events (events contain the category tags)
  let tags: string[] = [];
  let category = "Other";
  
  if (raw.events && raw.events.length > 0) {
    const event = raw.events[0];
    if (event.tags && Array.isArray(event.tags)) {
      tags = event.tags.map((t: any) => t.label || t.slug || "");
      
      // Map tags to categories
      const tagLabels = tags.map(t => t.toLowerCase());
      if (tagLabels.some(t => t.includes("politic") || t.includes("election") || t.includes("government"))) {
        category = "Politics";
      } else if (tagLabels.some(t => t.includes("sport") || t.includes("nfl") || t.includes("nba") || t.includes("fifa"))) {
        category = "Sports";
      } else if (tagLabels.some(t => t.includes("crypto") || t.includes("bitcoin") || t.includes("ethereum"))) {
        category = "Crypto";
      } else if (tagLabels.some(t => t.includes("business") || t.includes("economy") || t.includes("finance") || t.includes("stock"))) {
        category = "Finance";
      }
    }
  }
  
  // Fallback: use raw.tags if available
  if (tags.length === 0 && raw.tags && Array.isArray(raw.tags)) {
    tags = raw.tags.map((t: any) => t.label || t.slug || "");
  }

  return {
    conditionId: raw.conditionId,
    question: raw.question ?? "",
    description: raw.description ?? "",
    slug: raw.slug ?? "",
    endDate: raw.endDateIso ?? raw.endDate ?? "",
    category,
    tags,
    icon: raw.icon ?? undefined,
    image: raw.image ?? undefined,
    yesPrice,
    noPrice,
    volume: raw.volumeNum ?? parseFloat(raw.volume ?? "0"),
    volume24h: raw.volume24hr ?? 0,
    liquidity: raw.liquidityNum ?? parseFloat(raw.liquidity ?? "0"),
    lastTradePrice: raw.lastTradePrice ?? 0.5,
    active: raw.active ?? false,
    closed: raw.closed ?? false,
    featured: raw.featured ?? false,
    new: raw.new ?? false,
    yesTokenId,
    noTokenId,
    groupItemTitle: raw.groupItemTitle ?? undefined,
    groupItemThreshold: raw.groupItemThreshold ?? undefined,
    eventId: raw.events?.[0]?.id ?? undefined,
    eventTitle: raw.events?.[0]?.title ?? undefined,
    eventSlug: raw.events?.[0]?.slug ?? undefined,
  };
}

export function normalizeMarkets(raw: GammaMarket[]): Market[] {
  return raw.map(normalizeMarket);
}

/**
 * Group markets by their eventTitle (Polymarket events)
 * Returns an array where each main market (highest probability) has relatedMarkets attached
 */
export function groupMarkets(markets: Market[]): Array<Market & { relatedMarkets?: Market[] }> {
  const grouped = new Map<string, Market[]>();
  const ungrouped: Market[] = [];

  // First pass: group by eventTitle
  markets.forEach(market => {
    // Only group if eventTitle exists and is not empty, AND has groupItemTitle
    if (market.eventTitle && market.eventTitle.trim() !== "" && market.groupItemTitle && market.groupItemTitle.trim() !== "") {
      const existing = grouped.get(market.eventTitle) || [];
      existing.push(market);
      grouped.set(market.eventTitle, existing);
    } else {
      ungrouped.push(market);
    }
  });

  // Second pass: create result with main market + related markets
  const result: Array<Market & { relatedMarkets?: Market[] }> = [];

  // Add grouped markets (show highest probability one as main, rest as related)
  grouped.forEach((group) => {
    if (group.length > 1) {
      // Sort by YES price (highest probability first)
      const sorted = group.sort((a, b) => b.yesPrice - a.yesPrice);

      const [main, ...related] = sorted;
      result.push({
        ...main,
        relatedMarkets: related,
      });
    } else {
      // Single market in group, add without related markets
      ungrouped.push(group[0]);
    }
  });

  // Add ungrouped markets
  ungrouped.forEach(market => {
    result.push(market);
  });

  return result;
}
