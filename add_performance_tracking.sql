-- Add performance tracking support
-- Phase 6A: Performance Tracking & P&L Calculation

-- Add fields to trades table for tracking fills and exits
ALTER TABLE trades ADD COLUMN IF NOT EXISTS entry_price DOUBLE PRECISION;
ALTER TABLE trades ADD COLUMN IF NOT EXISTS exit_price DOUBLE PRECISION;
ALTER TABLE trades ADD COLUMN IF NOT EXISTS realized_pnl DOUBLE PRECISION DEFAULT 0;
ALTER TABLE trades ADD COLUMN IF NOT EXISTS unrealized_pnl DOUBLE PRECISION DEFAULT 0;
ALTER TABLE trades ADD COLUMN IF NOT EXISTS closed_at TIMESTAMP WITH TIME ZONE;

-- Add performance metrics to agents table
ALTER TABLE agents ADD COLUMN IF NOT EXISTS win_rate DOUBLE PRECISION DEFAULT 0;
ALTER TABLE agents ADD COLUMN IF NOT EXISTS total_wins INTEGER DEFAULT 0;
ALTER TABLE agents ADD COLUMN IF NOT EXISTS total_losses INTEGER DEFAULT 0;
ALTER TABLE agents ADD COLUMN IF NOT EXISTS sharpe_ratio DOUBLE PRECISION DEFAULT 0;
ALTER TABLE agents ADD COLUMN IF NOT EXISTS max_drawdown DOUBLE PRECISION DEFAULT 0;
ALTER TABLE agents ADD COLUMN IF NOT EXISTS roi DOUBLE PRECISION DEFAULT 0;

-- Create positions table for tracking open positions
CREATE TABLE IF NOT EXISTS positions (
  id TEXT PRIMARY KEY,
  agent_id TEXT NOT NULL REFERENCES agents(id) ON DELETE CASCADE,
  trade_id TEXT REFERENCES trades(id) ON DELETE SET NULL,
  condition_id TEXT NOT NULL,
  question TEXT NOT NULL,
  direction TEXT NOT NULL, -- YES | NO
  token_id TEXT NOT NULL,
  entry_price DOUBLE PRECISION NOT NULL,
  current_price DOUBLE PRECISION NOT NULL,
  shares DOUBLE PRECISION NOT NULL,
  amount_usdc DOUBLE PRECISION NOT NULL,
  unrealized_pnl DOUBLE PRECISION DEFAULT 0,
  status TEXT DEFAULT 'open' NOT NULL, -- open | closed
  opened_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
  closed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

CREATE INDEX IF NOT EXISTS positions_agent_idx ON positions(agent_id);
CREATE INDEX IF NOT EXISTS positions_status_idx ON positions(status);
CREATE INDEX IF NOT EXISTS positions_condition_idx ON positions(condition_id);

-- Create performance_snapshots table for historical tracking
CREATE TABLE IF NOT EXISTS performance_snapshots (
  id TEXT PRIMARY KEY,
  agent_id TEXT NOT NULL REFERENCES agents(id) ON DELETE CASCADE,
  snapshot_date TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
  total_trades INTEGER DEFAULT 0,
  wins INTEGER DEFAULT 0,
  losses INTEGER DEFAULT 0,
  win_rate DOUBLE PRECISION DEFAULT 0,
  total_pnl DOUBLE PRECISION DEFAULT 0,
  realized_pnl DOUBLE PRECISION DEFAULT 0,
  unrealized_pnl DOUBLE PRECISION DEFAULT 0,
  sharpe_ratio DOUBLE PRECISION DEFAULT 0,
  max_drawdown DOUBLE PRECISION DEFAULT 0,
  roi DOUBLE PRECISION DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

CREATE INDEX IF NOT EXISTS perf_snapshots_agent_date_idx ON performance_snapshots(agent_id, snapshot_date);

-- Create signal_performance table to track AI model accuracy
CREATE TABLE IF NOT EXISTS signal_performance (
  id TEXT PRIMARY KEY,
  signal_id TEXT NOT NULL REFERENCES signals(id) ON DELETE CASCADE,
  agent_id TEXT,
  was_traded BOOLEAN DEFAULT FALSE,
  trade_id TEXT REFERENCES trades(id) ON DELETE SET NULL,
  predicted_direction TEXT NOT NULL, -- YES | NO
  predicted_confidence INTEGER NOT NULL,
  predicted_ev DOUBLE PRECISION,
  actual_outcome TEXT, -- YES | NO | null (if not resolved)
  was_correct BOOLEAN,
  actual_pnl DOUBLE PRECISION,
  resolved_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

CREATE INDEX IF NOT EXISTS signal_perf_signal_idx ON signal_performance(signal_id);
CREATE INDEX IF NOT EXISTS signal_perf_agent_idx ON signal_performance(agent_id);
CREATE INDEX IF NOT EXISTS signal_perf_outcome_idx ON signal_performance(was_correct);

-- Add comments for documentation
COMMENT ON TABLE positions IS 'Tracks open and closed trading positions for agents';
COMMENT ON TABLE performance_snapshots IS 'Daily snapshots of agent performance metrics';
COMMENT ON TABLE signal_performance IS 'Tracks accuracy of AI signals and predictions';

COMMENT ON COLUMN trades.entry_price IS 'Price at which position was entered';
COMMENT ON COLUMN trades.exit_price IS 'Price at which position was exited';
COMMENT ON COLUMN trades.realized_pnl IS 'Actual profit/loss after closing position';
COMMENT ON COLUMN trades.unrealized_pnl IS 'Current profit/loss for open positions';

COMMENT ON COLUMN agents.win_rate IS 'Percentage of winning trades (0-100)';
COMMENT ON COLUMN agents.sharpe_ratio IS 'Risk-adjusted return metric';
COMMENT ON COLUMN agents.max_drawdown IS 'Maximum loss from peak equity';
COMMENT ON COLUMN agents.roi IS 'Return on investment percentage';
