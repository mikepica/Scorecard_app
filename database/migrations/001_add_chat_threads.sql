-- Migration: Add Chat Threads Feature
-- Date: 2025-09-15
-- Description: Adds chat threads and messages tables for AI chat functionality

-- Chat Threads table
CREATE TABLE IF NOT EXISTS chat_threads (
    id VARCHAR(255) PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Chat Messages table
CREATE TABLE IF NOT EXISTS chat_messages (
    id VARCHAR(255) PRIMARY KEY,
    thread_id VARCHAR(255) NOT NULL REFERENCES chat_threads(id) ON DELETE CASCADE,
    text TEXT NOT NULL,
    sender VARCHAR(20) NOT NULL CHECK (sender IN ('user', 'ai')),
    timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Indexes for chat tables
CREATE INDEX IF NOT EXISTS idx_chat_messages_thread_id ON chat_messages(thread_id);
CREATE INDEX IF NOT EXISTS idx_chat_messages_timestamp ON chat_messages(timestamp);
CREATE INDEX IF NOT EXISTS idx_chat_threads_updated_at ON chat_threads(updated_at);

-- Apply update trigger to chat_threads (assumes update_updated_at_column function exists)
CREATE TRIGGER update_chat_threads_updated_at 
    BEFORE UPDATE ON chat_threads 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

-- Verification queries (optional - comment out if not needed)
-- SELECT 'chat_threads table created' as status WHERE EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'chat_threads');
-- SELECT 'chat_messages table created' as status WHERE EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'chat_messages');