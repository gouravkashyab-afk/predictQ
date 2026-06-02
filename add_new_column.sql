-- Add 'new' column to markets table
ALTER TABLE markets ADD COLUMN IF NOT EXISTS "new" boolean DEFAULT false NOT NULL;
