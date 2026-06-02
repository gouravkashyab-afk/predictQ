-- Add event columns to markets table
ALTER TABLE markets ADD COLUMN IF NOT EXISTS "event_id" text;
ALTER TABLE markets ADD COLUMN IF NOT EXISTS "event_title" text;
ALTER TABLE markets ADD COLUMN IF NOT EXISTS "event_slug" text;

-- Add index for faster event grouping queries
CREATE INDEX IF NOT EXISTS markets_event_title_idx ON markets(event_title);
CREATE INDEX IF NOT EXISTS markets_event_id_idx ON markets(event_id);
