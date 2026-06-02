-- Add grouping columns to markets table
ALTER TABLE markets ADD COLUMN IF NOT EXISTS "group_item_title" text;
ALTER TABLE markets ADD COLUMN IF NOT EXISTS "group_item_threshold" text;

-- Add index for faster grouping queries
CREATE INDEX IF NOT EXISTS markets_group_title_idx ON markets(group_item_title);
