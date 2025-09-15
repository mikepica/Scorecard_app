-- Migration: Add context_selection to chat_threads
-- Date: 2025-09-15
-- Description: Adds a JSONB column to persist per-thread AI context selections

ALTER TABLE chat_threads 
ADD COLUMN IF NOT EXISTS context_selection JSONB DEFAULT '{"allSelected": true}'::jsonb;

-- Optional: touch updated_at on change via trigger already present

-- Verification (optional)
-- SELECT column_name FROM information_schema.columns WHERE table_name = 'chat_threads' AND column_name = 'context_selection';

