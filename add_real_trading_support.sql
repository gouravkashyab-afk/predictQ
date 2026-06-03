-- Add real trading support to agent_trades
-- Phase 5: Real wallet signing

-- Add orderHash column for tracking Polymarket orders
ALTER TABLE agent_trades ADD COLUMN IF NOT EXISTS order_hash TEXT;

-- Update status column comment to include new statuses
COMMENT ON COLUMN agent_trades.status IS 'pending|filled|failed|cancelled|simulated';

-- Create index on orderHash for faster lookups
CREATE INDEX IF NOT EXISTS agent_trades_order_hash_idx ON agent_trades(order_hash);

-- Add encrypted wallet key storage (for future use with Privy)
-- ALTER TABLE users ADD COLUMN IF NOT EXISTS encrypted_wallet_key TEXT;
-- COMMENT ON COLUMN users.encrypted_wallet_key IS 'Encrypted private key (DO NOT use in production without proper encryption)';
