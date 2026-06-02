-- Add metadata column to signals table for enhanced signal data
-- This stores EV, edge, sentiment, technical signals, etc.

ALTER TABLE signals 
ADD COLUMN IF NOT EXISTS metadata jsonb DEFAULT '{}'::jsonb NOT NULL;

-- Update existing signals to have empty metadata
UPDATE signals 
SET metadata = '{}'::jsonb 
WHERE metadata IS NULL;

COMMENT ON COLUMN signals.metadata IS 'Enhanced signal data: expectedValue, edgePercentage, sentiment, technicalSignal, etc.';
