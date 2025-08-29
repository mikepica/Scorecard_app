-- Migration: Add quarterly progress columns to strategic_programs table
-- Run this to add the 8 new quarter-specific progress columns

-- Add the 8 new quarterly progress columns
ALTER TABLE strategic_programs 
ADD COLUMN IF NOT EXISTS q1_2025_progress TEXT,
ADD COLUMN IF NOT EXISTS q2_2025_progress TEXT,
ADD COLUMN IF NOT EXISTS q3_2025_progress TEXT,
ADD COLUMN IF NOT EXISTS q4_2025_progress TEXT,
ADD COLUMN IF NOT EXISTS q1_2026_progress TEXT,
ADD COLUMN IF NOT EXISTS q2_2026_progress TEXT,
ADD COLUMN IF NOT EXISTS q3_2026_progress TEXT,
ADD COLUMN IF NOT EXISTS q4_2026_progress TEXT;

-- Update the progress update history trigger to also track changes to quarter-specific columns
DROP TRIGGER IF EXISTS track_progress_updates_changes ON strategic_programs;

-- Updated trigger function to track changes to any of the quarter progress columns
CREATE OR REPLACE FUNCTION record_progress_update_change()
RETURNS TRIGGER AS $$
BEGIN
    -- Track changes to the original progress_updates column
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
    
    -- Track changes to quarterly progress columns
    IF OLD.q1_2025_progress IS DISTINCT FROM NEW.q1_2025_progress THEN
        INSERT INTO progress_updates_history (
            id,
            program_id,
            previous_value,
            new_value,
            changed_by
        ) VALUES (
            gen_random_uuid()::VARCHAR(255),
            NEW.id,
            'Q1-2025: ' || COALESCE(OLD.q1_2025_progress, ''),
            'Q1-2025: ' || COALESCE(NEW.q1_2025_progress, ''),
            current_user
        );
    END IF;
    
    IF OLD.q2_2025_progress IS DISTINCT FROM NEW.q2_2025_progress THEN
        INSERT INTO progress_updates_history (
            id,
            program_id,
            previous_value,
            new_value,
            changed_by
        ) VALUES (
            gen_random_uuid()::VARCHAR(255),
            NEW.id,
            'Q2-2025: ' || COALESCE(OLD.q2_2025_progress, ''),
            'Q2-2025: ' || COALESCE(NEW.q2_2025_progress, ''),
            current_user
        );
    END IF;
    
    IF OLD.q3_2025_progress IS DISTINCT FROM NEW.q3_2025_progress THEN
        INSERT INTO progress_updates_history (
            id,
            program_id,
            previous_value,
            new_value,
            changed_by
        ) VALUES (
            gen_random_uuid()::VARCHAR(255),
            NEW.id,
            'Q3-2025: ' || COALESCE(OLD.q3_2025_progress, ''),
            'Q3-2025: ' || COALESCE(NEW.q3_2025_progress, ''),
            current_user
        );
    END IF;
    
    IF OLD.q4_2025_progress IS DISTINCT FROM NEW.q4_2025_progress THEN
        INSERT INTO progress_updates_history (
            id,
            program_id,
            previous_value,
            new_value,
            changed_by
        ) VALUES (
            gen_random_uuid()::VARCHAR(255),
            NEW.id,
            'Q4-2025: ' || COALESCE(OLD.q4_2025_progress, ''),
            'Q4-2025: ' || COALESCE(NEW.q4_2025_progress, ''),
            current_user
        );
    END IF;
    
    IF OLD.q1_2026_progress IS DISTINCT FROM NEW.q1_2026_progress THEN
        INSERT INTO progress_updates_history (
            id,
            program_id,
            previous_value,
            new_value,
            changed_by
        ) VALUES (
            gen_random_uuid()::VARCHAR(255),
            NEW.id,
            'Q1-2026: ' || COALESCE(OLD.q1_2026_progress, ''),
            'Q1-2026: ' || COALESCE(NEW.q1_2026_progress, ''),
            current_user
        );
    END IF;
    
    IF OLD.q2_2026_progress IS DISTINCT FROM NEW.q2_2026_progress THEN
        INSERT INTO progress_updates_history (
            id,
            program_id,
            previous_value,
            new_value,
            changed_by
        ) VALUES (
            gen_random_uuid()::VARCHAR(255),
            NEW.id,
            'Q2-2026: ' || COALESCE(OLD.q2_2026_progress, ''),
            'Q2-2026: ' || COALESCE(NEW.q2_2026_progress, ''),
            current_user
        );
    END IF;
    
    IF OLD.q3_2026_progress IS DISTINCT FROM NEW.q3_2026_progress THEN
        INSERT INTO progress_updates_history (
            id,
            program_id,
            previous_value,
            new_value,
            changed_by
        ) VALUES (
            gen_random_uuid()::VARCHAR(255),
            NEW.id,
            'Q3-2026: ' || COALESCE(OLD.q3_2026_progress, ''),
            'Q3-2026: ' || COALESCE(NEW.q3_2026_progress, ''),
            current_user
        );
    END IF;
    
    IF OLD.q4_2026_progress IS DISTINCT FROM NEW.q4_2026_progress THEN
        INSERT INTO progress_updates_history (
            id,
            program_id,
            previous_value,
            new_value,
            changed_by
        ) VALUES (
            gen_random_uuid()::VARCHAR(255),
            NEW.id,
            'Q4-2026: ' || COALESCE(OLD.q4_2026_progress, ''),
            'Q4-2026: ' || COALESCE(NEW.q4_2026_progress, ''),
            current_user
        );
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Recreate the trigger
CREATE TRIGGER track_progress_updates_changes
    BEFORE UPDATE ON strategic_programs
    FOR EACH ROW
    EXECUTE FUNCTION record_progress_update_change();

-- Verify the columns were added
\d strategic_programs;

-- Show a success message
SELECT 'Migration completed successfully! Added 8 quarterly progress columns to strategic_programs table.' AS status;