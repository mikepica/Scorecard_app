-- Migration: Add progress updates history tracking
-- Description: Adds table and triggers to track changes to progress_updates field
-- Author: System
-- Date: 2024-03-21

-- Up Migration
DO $$ 
BEGIN
    -- Create the history table
    CREATE TABLE IF NOT EXISTS progress_updates_history (
        id VARCHAR(255) PRIMARY KEY,
        program_id VARCHAR(255) NOT NULL REFERENCES strategic_programs(id) ON DELETE CASCADE,
        previous_value TEXT,
        new_value TEXT,
        changed_by VARCHAR(255) NOT NULL,
        changed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );

    -- Create index for better query performance
    CREATE INDEX IF NOT EXISTS idx_progress_updates_history_program_id 
    ON progress_updates_history(program_id);

    -- Create the trigger function
    CREATE OR REPLACE FUNCTION record_progress_update_change()
    RETURNS TRIGGER AS $$
    BEGIN
        IF OLD.progress_updates IS DISTINCT FROM NEW.progress_updates THEN
            INSERT INTO progress_updates_history (
                id,
                program_id,
                previous_value,
                new_value,
                changed_by
            ) VALUES (
                gen_random_uuid()::VARCHAR(255),
                NEW.id,
                OLD.progress_updates,
                NEW.progress_updates,
                current_user
            );
        END IF;
        RETURN NEW;
    END;
    $$ language 'plpgsql';

    -- Create the trigger
    DROP TRIGGER IF EXISTS track_progress_updates_changes ON strategic_programs;
    CREATE TRIGGER track_progress_updates_changes
        BEFORE UPDATE ON strategic_programs
        FOR EACH ROW
        EXECUTE FUNCTION record_progress_update_change();
END $$;

-- Down Migration
DO $$ 
BEGIN
    -- Drop the trigger first
    DROP TRIGGER IF EXISTS track_progress_updates_changes ON strategic_programs;
    
    -- Drop the function
    DROP FUNCTION IF EXISTS record_progress_update_change();
    
    -- Drop the index
    DROP INDEX IF EXISTS idx_progress_updates_history_program_id;
    
    -- Drop the table
    DROP TABLE IF EXISTS progress_updates_history;
END $$; 