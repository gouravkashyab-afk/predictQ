import { pgTable, text, timestamp, boolean, jsonb, doublePrecision, integer, index } from "drizzle-orm/pg-core";

// ─── Users ────────────────────────────────────────────────────────────────────
export const users = pgTable("users", {
  id: text("id").primaryKey(),
  privyId: text("privy_id").notNull().unique(),
  walletAddress: text("wallet_address"),
  email: text("email"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
  lastSeenAt: timestamp("last_seen_at", { withTimezone: true }).defaultNow().notNull(),
});

// ─── Sessions ─────────────────────────────────────────────────────────────────
export const sessions = pgTable("sessions", {
  id: text("id").primaryKey(),
  userId: text("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  token: text("token").notNull().unique(),
  expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});

// ─── User Settings ────────────────────────────────────────────────────────────
export const userSettings = pgTable("user_settings", {
  userId: text("user_id")
    .primaryKey()
    .references(() => users.id, { onDelete: "cascade" }),
  riskLevel: text("risk_level").default("medium").notNull(),
  maxPositionSize: text("max_position_size").default("100").notNull(),
  autoTrade: boolean("auto_trade").default(false).notNull(),
  notificationsEnabled: boolean("notifications_enabled").default(true).notNull(),
  telegramChatId: text("telegram_chat_id"),
  preferredChain: text("preferred_chain").default("polygon").notNull(),
  preferences: jsonb("preferences").default({}).notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
});

// ─── Markets ──────────────────────────────────────────────────────────────────
export const markets = pgTable(
  "markets",
  {
    conditionId: text("condition_id").primaryKey(),
    question: text("question").notNull(),
    description: text("description").default("").notNull(),
    slug: text("slug").notNull(),
    endDate: timestamp("end_date", { withTimezone: true }),
    category: text("category").default("Other").notNull(),
    tags: jsonb("tags").default([]).notNull(),
    icon: text("icon"),
    image: text("image"),
    yesTokenId: text("yes_token_id").notNull(),
    noTokenId: text("no_token_id").notNull(),
    yesPrice: doublePrecision("yes_price").default(0).notNull(),
    noPrice: doublePrecision("no_price").default(0).notNull(),
    volume: doublePrecision("volume").default(0).notNull(),
    volume24h: doublePrecision("volume_24h").default(0).notNull(),
    liquidity: doublePrecision("liquidity").default(0).notNull(),
    lastTradePrice: doublePrecision("last_trade_price").default(0).notNull(),
    active: boolean("active").default(true).notNull(),
    closed: boolean("closed").default(false).notNull(),
    featured: boolean("featured").default(false).notNull(),
    new: boolean("new").default(false).notNull(),
    groupItemTitle: text("group_item_title"),
    groupItemThreshold: text("group_item_threshold"),
    eventId: text("event_id"),
    eventTitle: text("event_title"),
    eventSlug: text("event_slug"),
    syncedAt: timestamp("synced_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (t) => [
    index("markets_active_idx").on(t.active),
    index("markets_category_idx").on(t.category),
    index("markets_volume_idx").on(t.volume),
    index("markets_featured_idx").on(t.featured),
  ]
);

export type User = typeof users.$inferSelect;
export type NewUser = typeof users.$inferInsert;
export type Session = typeof sessions.$inferSelect;
export type UserSettings = typeof userSettings.$inferSelect;
export type MarketRow = typeof markets.$inferSelect;
export type NewMarket = typeof markets.$inferInsert;

// ─── AI Signals ───────────────────────────────────────────────────────────────
export const signals = pgTable(
  "signals",
  {
    id: text("id").primaryKey(),
    conditionId: text("condition_id").notNull(),
    question: text("question").notNull(),
    direction: text("direction").notNull(), // "YES" | "NO"
    confidence: integer("confidence").notNull(), // 0-100
    reasoning: text("reasoning").notNull(),
    model: text("model").default("gpt-4o").notNull(),
    yesPrice: doublePrecision("yes_price").default(0).notNull(),
    noPrice: doublePrecision("no_price").default(0).notNull(),
    volume: doublePrecision("volume").default(0).notNull(),
    category: text("category").default("Other").notNull(),
    metadata: jsonb("metadata").default({}).notNull(), // Enhanced fields: EV, edge, sentiment, etc.
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (t) => [
    index("signals_condition_idx").on(t.conditionId),
    index("signals_direction_idx").on(t.direction),
    index("signals_confidence_idx").on(t.confidence),
    index("signals_created_idx").on(t.createdAt),
  ]
);

// ─── News Articles ────────────────────────────────────────────────────────────
export const newsArticles = pgTable(
  "news_articles",
  {
    id: text("id").primaryKey(),
    title: text("title").notNull(),
    description: text("description").default("").notNull(),
    url: text("url").notNull().unique(),
    source: text("source").notNull(),
    imageUrl: text("image_url"),
    publishedAt: timestamp("published_at", { withTimezone: true }).notNull(),
    sentiment: text("sentiment").default("neutral").notNull(), // positive | negative | neutral
    keywords: jsonb("keywords").default([]).notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (t) => [
    index("news_published_idx").on(t.publishedAt),
    index("news_sentiment_idx").on(t.sentiment),
  ]
);

// ─── News ↔ Market Mapping ────────────────────────────────────────────────────
export const newsMarketMap = pgTable(
  "news_market_map",
  {
    id: text("id").primaryKey(),
    articleId: text("article_id")
      .notNull()
      .references(() => newsArticles.id, { onDelete: "cascade" }),
    conditionId: text("condition_id").notNull(),
    relevanceScore: integer("relevance_score").default(0).notNull(), // 0-100
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (t) => [
    index("nmm_article_idx").on(t.articleId),
    index("nmm_condition_idx").on(t.conditionId),
  ]
);

// ─── Whale Events ─────────────────────────────────────────────────────────────
export const whaleEvents = pgTable(
  "whale_events",
  {
    id: text("id").primaryKey(),
    txHash: text("tx_hash").notNull().unique(),
    wallet: text("wallet").notNull(),
    amountUsd: doublePrecision("amount_usd").notNull(),
    direction: text("direction").notNull(), // "IN" | "OUT"
    token: text("token").default("USDC").notNull(),
    contractAddress: text("contract_address").notNull(),
    blockNumber: text("block_number").notNull(),
    network: text("network").default("polygon").notNull(),
    timestamp: timestamp("timestamp", { withTimezone: true }).notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (t) => [
    index("whale_wallet_idx").on(t.wallet),
    index("whale_amount_idx").on(t.amountUsd),
    index("whale_timestamp_idx").on(t.timestamp),
  ]
);

export type Signal = typeof signals.$inferSelect;
export type NewSignal = typeof signals.$inferInsert;
export type NewsArticle = typeof newsArticles.$inferSelect;
export type NewNewsArticle = typeof newsArticles.$inferInsert;
export type NewsMarketMap = typeof newsMarketMap.$inferSelect;
export type WhaleEvent = typeof whaleEvents.$inferSelect;
export type NewWhaleEvent = typeof whaleEvents.$inferInsert;

// ─── Trades ───────────────────────────────────────────────────────────────────
export const trades = pgTable(
  "trades",
  {
    id: text("id").primaryKey(),
    userId: text("user_id").notNull(),          // wallet address (lowercase)
    conditionId: text("condition_id").notNull(),
    question: text("question").notNull(),
    tokenId: text("token_id").notNull(),         // YES or NO token
    direction: text("direction").notNull(),       // "YES" | "NO"
    amountUsdc: doublePrecision("amount_usdc").notNull(),
    pricePerShare: doublePrecision("price_per_share").notNull(), // 0-1
    shares: doublePrecision("shares").notNull(),
    potentialPayout: doublePrecision("potential_payout").notNull(),
    status: text("status").default("pending").notNull(), // pending|filled|failed|cancelled
    txHash: text("tx_hash"),
    orderHash: text("order_hash"),
    agentId: text("agent_id"),                   // null = manual trade
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    filledAt: timestamp("filled_at", { withTimezone: true }),
  },
  (t) => [
    index("trades_user_idx").on(t.userId),
    index("trades_condition_idx").on(t.conditionId),
    index("trades_status_idx").on(t.status),
    index("trades_created_idx").on(t.createdAt),
  ]
);

// ─── Agents ───────────────────────────────────────────────────────────────────
export const agents = pgTable(
  "agents",
  {
    id: text("id").primaryKey(),
    userId: text("user_id").notNull(),
    name: text("name").notNull(),
    strategy: text("strategy").notNull(), // signal_follower|whale_tracker|contrarian
    status: text("status").default("stopped").notNull(), // active|paused|stopped
    // Config stored as JSONB: { maxPositionSize, minConfidence, maxMarketsPerRun, riskLevel }
    config: jsonb("config").default({}).notNull(),
    totalTrades: integer("total_trades").default(0).notNull(),
    totalPnl: doublePrecision("total_pnl").default(0).notNull(),
    lastRunAt: timestamp("last_run_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (t) => [
    index("agents_user_idx").on(t.userId),
    index("agents_status_idx").on(t.status),
  ]
);

// ─── Agent Trades ─────────────────────────────────────────────────────────────
export const agentTrades = pgTable(
  "agent_trades",
  {
    id: text("id").primaryKey(),
    agentId: text("agent_id")
      .notNull()
      .references(() => agents.id, { onDelete: "cascade" }),
    tradeId: text("trade_id").references(() => trades.id, { onDelete: "set null" }),
    conditionId: text("condition_id").notNull(),
    question: text("question").notNull(),
    direction: text("direction").notNull(),
    amountUsdc: doublePrecision("amount_usdc").notNull(),
    confidence: integer("confidence").notNull(),
    signalId: text("signal_id"),
    status: text("status").default("pending").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (t) => [
    index("agent_trades_agent_idx").on(t.agentId),
    index("agent_trades_created_idx").on(t.createdAt),
  ]
);

// ─── Agent Logs ───────────────────────────────────────────────────────────────
export const agentLogs = pgTable(
  "agent_logs",
  {
    id: text("id").primaryKey(),
    agentId: text("agent_id")
      .notNull()
      .references(() => agents.id, { onDelete: "cascade" }),
    level: text("level").default("info").notNull(), // info|warn|error
    message: text("message").notNull(),
    metadata: jsonb("metadata").default({}).notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (t) => [
    index("agent_logs_agent_idx").on(t.agentId),
    index("agent_logs_created_idx").on(t.createdAt),
  ]
);

export type Trade = typeof trades.$inferSelect;
export type NewTrade = typeof trades.$inferInsert;
export type Agent = typeof agents.$inferSelect;
export type NewAgent = typeof agents.$inferInsert;
export type AgentTrade = typeof agentTrades.$inferSelect;
export type AgentLog = typeof agentLogs.$inferSelect;
