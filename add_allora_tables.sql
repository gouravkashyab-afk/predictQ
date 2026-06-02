-- Add Allora Network inference tracking
-- This stores predictions from Allora's decentralized ML models

-- Table to store Allora inferences
CREATE TABLE IF NOT EXISTS allora_inferences (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  topic_id INTEGER NOT NULL,
  topic_name TEXT,
  asset TEXT, -- 'BTC', 'ETH', 'SOL', etc.
  timeframe TEXT, -- '5m', '8h', '24h', etc.
  network_inference DECIMAL NOT NULL, -- Weighted prediction from all models
  network_inference_normalized DECIMAL, -- Normalized value
  confidence_score INTEGER NOT NULL, -- 0-100, calculated from confidence interval
  confidence_interval_min DECIMAL,
  confidence_interval_max DECIMAL,
  timestamp BIGINT NOT NULL, -- Unix timestamp from Allora
  extra_data TEXT, -- JSON string with additional metadata
  signature TEXT, -- Cryptographic signature for verification
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Index for fast lookups by topic
CREATE INDEX IF NOT EXISTS idx_allora_topic_timestamp 
ON allora_inferences(topic_id, timestamp DESC);

-- Index for fast lookups by asset
CREATE INDEX IF NOT EXISTS idx_allora_asset_created 
ON allora_inferences(asset, created_at DESC);

-- Add source column to signals table (if not exists)
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'signals' AND column_name = 'source'
  ) THEN
    ALTER TABLE signals ADD COLUMN source TEXT DEFAULT 'gpt4o';
    COMMENT ON COLUMN signals.source IS 'Source of signal: gpt4o, allora, or hybrid';
  END IF;
END $$;

-- Add Allora inference reference to signals table
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'signals' AND column_name = 'allora_inference_id'
  ) THEN
    ALTER TABLE signals ADD COLUMN allora_inference_id TEXT REFERENCES allora_inferences(id);
    COMMENT ON COLUMN signals.allora_inference_id IS 'Link to Allora inference if signal used Allora data';
  END IF;
END $$;

-- Add index on signals.source for filtering
CREATE INDEX IF NOT EXISTS idx_signals_source 
ON signals(source);

-- Table to track Allora model performance
CREATE TABLE IF NOT EXISTS allora_performance (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  topic_id INTEGER NOT NULL,
  prediction_date DATE NOT NULL,
  predicted_value DECIMAL NOT NULL,
  actual_value DECIMAL,
  absolute_error DECIMAL,
  percentage_error DECIMAL,
  was_correct BOOLEAN,
  confidence_score INTEGER,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  resolved_at TIMESTAMP
);

-- Index for performance tracking
CREATE INDEX IF NOT EXISTS idx_allora_performance_topic_date 
ON allora_performance(topic_id, prediction_date DESC);

-- Comments for documentation
COMMENT ON TABLE allora_inferences IS 'Stores predictions from Allora Network decentralized ML models';
COMMENT ON TABLE allora_performance IS 'Tracks accuracy of Allora predictions vs actual outcomes';
