CREATE TABLE "agent_logs" (
	"id" text PRIMARY KEY NOT NULL,
	"agent_id" text NOT NULL,
	"level" text DEFAULT 'info' NOT NULL,
	"message" text NOT NULL,
	"metadata" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "agent_trades" (
	"id" text PRIMARY KEY NOT NULL,
	"agent_id" text NOT NULL,
	"trade_id" text,
	"condition_id" text NOT NULL,
	"question" text NOT NULL,
	"direction" text NOT NULL,
	"amount_usdc" double precision NOT NULL,
	"confidence" integer NOT NULL,
	"signal_id" text,
	"status" text DEFAULT 'pending' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "agents" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"name" text NOT NULL,
	"strategy" text NOT NULL,
	"status" text DEFAULT 'stopped' NOT NULL,
	"config" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"total_trades" integer DEFAULT 0 NOT NULL,
	"total_pnl" double precision DEFAULT 0 NOT NULL,
	"last_run_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "markets" (
	"condition_id" text PRIMARY KEY NOT NULL,
	"question" text NOT NULL,
	"description" text DEFAULT '' NOT NULL,
	"slug" text NOT NULL,
	"end_date" timestamp with time zone,
	"category" text DEFAULT 'Other' NOT NULL,
	"tags" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"icon" text,
	"image" text,
	"yes_token_id" text NOT NULL,
	"no_token_id" text NOT NULL,
	"yes_price" double precision DEFAULT 0 NOT NULL,
	"no_price" double precision DEFAULT 0 NOT NULL,
	"volume" double precision DEFAULT 0 NOT NULL,
	"volume_24h" double precision DEFAULT 0 NOT NULL,
	"liquidity" double precision DEFAULT 0 NOT NULL,
	"last_trade_price" double precision DEFAULT 0 NOT NULL,
	"active" boolean DEFAULT true NOT NULL,
	"closed" boolean DEFAULT false NOT NULL,
	"featured" boolean DEFAULT false NOT NULL,
	"new" boolean DEFAULT false NOT NULL,
	"synced_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "news_articles" (
	"id" text PRIMARY KEY NOT NULL,
	"title" text NOT NULL,
	"description" text DEFAULT '' NOT NULL,
	"url" text NOT NULL,
	"source" text NOT NULL,
	"image_url" text,
	"published_at" timestamp with time zone NOT NULL,
	"sentiment" text DEFAULT 'neutral' NOT NULL,
	"keywords" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "news_articles_url_unique" UNIQUE("url")
);
--> statement-breakpoint
CREATE TABLE "news_market_map" (
	"id" text PRIMARY KEY NOT NULL,
	"article_id" text NOT NULL,
	"condition_id" text NOT NULL,
	"relevance_score" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "sessions" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"token" text NOT NULL,
	"expires_at" timestamp with time zone NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "sessions_token_unique" UNIQUE("token")
);
--> statement-breakpoint
CREATE TABLE "signals" (
	"id" text PRIMARY KEY NOT NULL,
	"condition_id" text NOT NULL,
	"question" text NOT NULL,
	"direction" text NOT NULL,
	"confidence" integer NOT NULL,
	"reasoning" text NOT NULL,
	"model" text DEFAULT 'gpt-4o' NOT NULL,
	"yes_price" double precision DEFAULT 0 NOT NULL,
	"no_price" double precision DEFAULT 0 NOT NULL,
	"volume" double precision DEFAULT 0 NOT NULL,
	"category" text DEFAULT 'Other' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "trades" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"condition_id" text NOT NULL,
	"question" text NOT NULL,
	"token_id" text NOT NULL,
	"direction" text NOT NULL,
	"amount_usdc" double precision NOT NULL,
	"price_per_share" double precision NOT NULL,
	"shares" double precision NOT NULL,
	"potential_payout" double precision NOT NULL,
	"status" text DEFAULT 'pending' NOT NULL,
	"tx_hash" text,
	"order_hash" text,
	"agent_id" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"filled_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "user_settings" (
	"user_id" text PRIMARY KEY NOT NULL,
	"risk_level" text DEFAULT 'medium' NOT NULL,
	"max_position_size" text DEFAULT '100' NOT NULL,
	"auto_trade" boolean DEFAULT false NOT NULL,
	"notifications_enabled" boolean DEFAULT true NOT NULL,
	"telegram_chat_id" text,
	"preferred_chain" text DEFAULT 'polygon' NOT NULL,
	"preferences" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" text PRIMARY KEY NOT NULL,
	"privy_id" text NOT NULL,
	"wallet_address" text,
	"email" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"last_seen_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "users_privy_id_unique" UNIQUE("privy_id")
);
--> statement-breakpoint
CREATE TABLE "whale_events" (
	"id" text PRIMARY KEY NOT NULL,
	"tx_hash" text NOT NULL,
	"wallet" text NOT NULL,
	"amount_usd" double precision NOT NULL,
	"direction" text NOT NULL,
	"token" text DEFAULT 'USDC' NOT NULL,
	"contract_address" text NOT NULL,
	"block_number" text NOT NULL,
	"network" text DEFAULT 'polygon' NOT NULL,
	"timestamp" timestamp with time zone NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "whale_events_tx_hash_unique" UNIQUE("tx_hash")
);
--> statement-breakpoint
ALTER TABLE "agent_logs" ADD CONSTRAINT "agent_logs_agent_id_agents_id_fk" FOREIGN KEY ("agent_id") REFERENCES "public"."agents"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "agent_trades" ADD CONSTRAINT "agent_trades_agent_id_agents_id_fk" FOREIGN KEY ("agent_id") REFERENCES "public"."agents"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "agent_trades" ADD CONSTRAINT "agent_trades_trade_id_trades_id_fk" FOREIGN KEY ("trade_id") REFERENCES "public"."trades"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "news_market_map" ADD CONSTRAINT "news_market_map_article_id_news_articles_id_fk" FOREIGN KEY ("article_id") REFERENCES "public"."news_articles"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sessions" ADD CONSTRAINT "sessions_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_settings" ADD CONSTRAINT "user_settings_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "agent_logs_agent_idx" ON "agent_logs" USING btree ("agent_id");--> statement-breakpoint
CREATE INDEX "agent_logs_created_idx" ON "agent_logs" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "agent_trades_agent_idx" ON "agent_trades" USING btree ("agent_id");--> statement-breakpoint
CREATE INDEX "agent_trades_created_idx" ON "agent_trades" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "agents_user_idx" ON "agents" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "agents_status_idx" ON "agents" USING btree ("status");--> statement-breakpoint
CREATE INDEX "markets_active_idx" ON "markets" USING btree ("active");--> statement-breakpoint
CREATE INDEX "markets_category_idx" ON "markets" USING btree ("category");--> statement-breakpoint
CREATE INDEX "markets_volume_idx" ON "markets" USING btree ("volume");--> statement-breakpoint
CREATE INDEX "markets_featured_idx" ON "markets" USING btree ("featured");--> statement-breakpoint
CREATE INDEX "news_published_idx" ON "news_articles" USING btree ("published_at");--> statement-breakpoint
CREATE INDEX "news_sentiment_idx" ON "news_articles" USING btree ("sentiment");--> statement-breakpoint
CREATE INDEX "nmm_article_idx" ON "news_market_map" USING btree ("article_id");--> statement-breakpoint
CREATE INDEX "nmm_condition_idx" ON "news_market_map" USING btree ("condition_id");--> statement-breakpoint
CREATE INDEX "signals_condition_idx" ON "signals" USING btree ("condition_id");--> statement-breakpoint
CREATE INDEX "signals_direction_idx" ON "signals" USING btree ("direction");--> statement-breakpoint
CREATE INDEX "signals_confidence_idx" ON "signals" USING btree ("confidence");--> statement-breakpoint
CREATE INDEX "signals_created_idx" ON "signals" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "trades_user_idx" ON "trades" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "trades_condition_idx" ON "trades" USING btree ("condition_id");--> statement-breakpoint
CREATE INDEX "trades_status_idx" ON "trades" USING btree ("status");--> statement-breakpoint
CREATE INDEX "trades_created_idx" ON "trades" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "whale_wallet_idx" ON "whale_events" USING btree ("wallet");--> statement-breakpoint
CREATE INDEX "whale_amount_idx" ON "whale_events" USING btree ("amount_usd");--> statement-breakpoint
CREATE INDEX "whale_timestamp_idx" ON "whale_events" USING btree ("timestamp");