-- Consolidated Database Migration Script
-- Combines all migrations except sponsor fields to arrays migration
-- Run this first, then run migrate-sponsor-fields-to-arrays.sql separately if needed

-- ==================================================
-- STEP 1: ADD YEAR-SPECIFIC COLUMNS TO STRATEGIC_PROGRAMS
-- ==================================================

-- Add new 2025 columns first (before renaming)
ALTER TABLE strategic_programs 
ADD COLUMN IF NOT EXISTS q1_2025_objective TEXT,
ADD COLUMN IF NOT EXISTS q2_2025_objective TEXT,
ADD COLUMN IF NOT EXISTS q3_2025_objective TEXT,
ADD COLUMN IF NOT EXISTS q4_2025_objective TEXT,
ADD COLUMN IF NOT EXISTS q1_2025_status VARCHAR(20) CHECK (q1_2025_status IN ('exceeded', 'on-track', 'delayed', 'missed')),
ADD COLUMN IF NOT EXISTS q2_2025_status VARCHAR(20) CHECK (q2_2025_status IN ('exceeded', 'on-track', 'delayed', 'missed')),
ADD COLUMN IF NOT EXISTS q3_2025_status VARCHAR(20) CHECK (q3_2025_status IN ('exceeded', 'on-track', 'delayed', 'missed')),
ADD COLUMN IF NOT EXISTS q4_2025_status VARCHAR(20) CHECK (q4_2025_status IN ('exceeded', 'on-track', 'delayed', 'missed'));

-- Add new 2026 columns for objectives and statuses
ALTER TABLE strategic_programs 
ADD COLUMN IF NOT EXISTS q1_2026_objective TEXT,
ADD COLUMN IF NOT EXISTS q2_2026_objective TEXT,
ADD COLUMN IF NOT EXISTS q3_2026_objective TEXT,
ADD COLUMN IF NOT EXISTS q4_2026_objective TEXT,
ADD COLUMN IF NOT EXISTS q1_2026_status VARCHAR(20) CHECK (q1_2026_status IN ('exceeded', 'on-track', 'delayed', 'missed')),
ADD COLUMN IF NOT EXISTS q2_2026_status VARCHAR(20) CHECK (q2_2026_status IN ('exceeded', 'on-track', 'delayed', 'missed')),
ADD COLUMN IF NOT EXISTS q3_2026_status VARCHAR(20) CHECK (q3_2026_status IN ('exceeded', 'on-track', 'delayed', 'missed')),
ADD COLUMN IF NOT EXISTS q4_2026_status VARCHAR(20) CHECK (q4_2026_status IN ('exceeded', 'on-track', 'delayed', 'missed'));

-- Copy existing data from generic columns to 2025-specific columns
UPDATE strategic_programs SET 
    q1_2025_objective = q1_objective,
    q2_2025_objective = q2_objective,
    q3_2025_objective = q3_objective,
    q4_2025_objective = q4_objective,
    q1_2025_status = q1_status,
    q2_2025_status = q2_status,
    q3_2025_status = q3_status,
    q4_2025_status = q4_status
WHERE q1_2025_objective IS NULL; -- Only update if not already migrated

-- ==================================================
-- STEP 2: ADD YEAR-SPECIFIC COLUMNS TO STRATEGIC_GOALS
-- ==================================================

-- Add year-specific status columns for 2025
ALTER TABLE strategic_goals ADD COLUMN IF NOT EXISTS q1_2025_status VARCHAR(20) CHECK (q1_2025_status IN ('exceeded', 'on-track', 'delayed', 'missed'));
ALTER TABLE strategic_goals ADD COLUMN IF NOT EXISTS q2_2025_status VARCHAR(20) CHECK (q2_2025_status IN ('exceeded', 'on-track', 'delayed', 'missed'));
ALTER TABLE strategic_goals ADD COLUMN IF NOT EXISTS q3_2025_status VARCHAR(20) CHECK (q3_2025_status IN ('exceeded', 'on-track', 'delayed', 'missed'));
ALTER TABLE strategic_goals ADD COLUMN IF NOT EXISTS q4_2025_status VARCHAR(20) CHECK (q4_2025_status IN ('exceeded', 'on-track', 'delayed', 'missed'));

-- Add year-specific status columns for 2026
ALTER TABLE strategic_goals ADD COLUMN IF NOT EXISTS q1_2026_status VARCHAR(20) CHECK (q1_2026_status IN ('exceeded', 'on-track', 'delayed', 'missed'));
ALTER TABLE strategic_goals ADD COLUMN IF NOT EXISTS q2_2026_status VARCHAR(20) CHECK (q2_2026_status IN ('exceeded', 'on-track', 'delayed', 'missed'));
ALTER TABLE strategic_goals ADD COLUMN IF NOT EXISTS q3_2026_status VARCHAR(20) CHECK (q3_2026_status IN ('exceeded', 'on-track', 'delayed', 'missed'));
ALTER TABLE strategic_goals ADD COLUMN IF NOT EXISTS q4_2026_status VARCHAR(20) CHECK (q4_2026_status IN ('exceeded', 'on-track', 'delayed', 'missed'));

-- Add year-specific objective columns for 2025
ALTER TABLE strategic_goals ADD COLUMN IF NOT EXISTS q1_2025_objective TEXT;
ALTER TABLE strategic_goals ADD COLUMN IF NOT EXISTS q2_2025_objective TEXT;
ALTER TABLE strategic_goals ADD COLUMN IF NOT EXISTS q3_2025_objective TEXT;
ALTER TABLE strategic_goals ADD COLUMN IF NOT EXISTS q4_2025_objective TEXT;

-- Add year-specific objective columns for 2026
ALTER TABLE strategic_goals ADD COLUMN IF NOT EXISTS q1_2026_objective TEXT;
ALTER TABLE strategic_goals ADD COLUMN IF NOT EXISTS q2_2026_objective TEXT;
ALTER TABLE strategic_goals ADD COLUMN IF NOT EXISTS q3_2026_objective TEXT;
ALTER TABLE strategic_goals ADD COLUMN IF NOT EXISTS q4_2026_objective TEXT;

-- Migrate existing general status data to Q3 2025 (current quarter based on August 29, 2025)
UPDATE strategic_goals SET q3_2025_status = status WHERE status IS NOT NULL;

-- Drop the general status column
ALTER TABLE strategic_goals DROP COLUMN IF EXISTS status;

-- Drop the legacy quarterly status columns (currently unused)
ALTER TABLE strategic_goals DROP COLUMN IF EXISTS q1_status;
ALTER TABLE strategic_goals DROP COLUMN IF EXISTS q2_status;
ALTER TABLE strategic_goals DROP COLUMN IF EXISTS q3_status;
ALTER TABLE strategic_goals DROP COLUMN IF EXISTS q4_status;

-- Drop the legacy quarterly objective columns
ALTER TABLE strategic_goals DROP COLUMN IF EXISTS q1_objective;
ALTER TABLE strategic_goals DROP COLUMN IF EXISTS q2_objective;
ALTER TABLE strategic_goals DROP COLUMN IF EXISTS q3_objective;
ALTER TABLE strategic_goals DROP COLUMN IF EXISTS q4_objective;

-- ==================================================
-- STEP 3: ADD QUARTERLY PROGRESS COLUMNS
-- ==================================================

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

-- ==================================================
-- STEP 4: FIX STATUS NULL CONSTRAINTS
-- ==================================================

-- Remove CHECK constraints and allow NULL values for category status
ALTER TABLE categories DROP CONSTRAINT IF EXISTS categories_status_check;
ALTER TABLE categories ADD CONSTRAINT categories_status_check 
  CHECK (status IS NULL OR status IN ('exceeded', 'on-track', 'delayed', 'missed'));

-- Remove CHECK constraints and allow NULL values for goal status
ALTER TABLE strategic_goals DROP CONSTRAINT IF EXISTS strategic_goals_status_check;
ALTER TABLE strategic_goals ADD CONSTRAINT strategic_goals_status_check 
  CHECK (status IS NULL OR status IN ('exceeded', 'on-track', 'delayed', 'missed'));

-- Remove CHECK constraints and allow NULL values for goal quarterly status
ALTER TABLE strategic_goals DROP CONSTRAINT IF EXISTS strategic_goals_q1_status_check;
ALTER TABLE strategic_goals ADD CONSTRAINT strategic_goals_q1_status_check 
  CHECK (q1_status IS NULL OR q1_status IN ('exceeded', 'on-track', 'delayed', 'missed'));

ALTER TABLE strategic_goals DROP CONSTRAINT IF EXISTS strategic_goals_q2_status_check;
ALTER TABLE strategic_goals ADD CONSTRAINT strategic_goals_q2_status_check 
  CHECK (q2_status IS NULL OR q2_status IN ('exceeded', 'on-track', 'delayed', 'missed'));

ALTER TABLE strategic_goals DROP CONSTRAINT IF EXISTS strategic_goals_q3_status_check;
ALTER TABLE strategic_goals ADD CONSTRAINT strategic_goals_q3_status_check 
  CHECK (q3_status IS NULL OR q3_status IN ('exceeded', 'on-track', 'delayed', 'missed'));

ALTER TABLE strategic_goals DROP CONSTRAINT IF EXISTS strategic_goals_q4_status_check;
ALTER TABLE strategic_goals ADD CONSTRAINT strategic_goals_q4_status_check 
  CHECK (q4_status IS NULL OR q4_status IN ('exceeded', 'on-track', 'delayed', 'missed'));

-- Remove CHECK constraints and allow NULL values for program quarterly status (legacy)
ALTER TABLE strategic_programs DROP CONSTRAINT IF EXISTS strategic_programs_q1_status_check;
ALTER TABLE strategic_programs ADD CONSTRAINT strategic_programs_q1_status_check 
  CHECK (q1_status IS NULL OR q1_status IN ('exceeded', 'on-track', 'delayed', 'missed'));

ALTER TABLE strategic_programs DROP CONSTRAINT IF EXISTS strategic_programs_q2_status_check;
ALTER TABLE strategic_programs ADD CONSTRAINT strategic_programs_q2_status_check 
  CHECK (q2_status IS NULL OR q2_status IN ('exceeded', 'on-track', 'delayed', 'missed'));

ALTER TABLE strategic_programs DROP CONSTRAINT IF EXISTS strategic_programs_q3_status_check;
ALTER TABLE strategic_programs ADD CONSTRAINT strategic_programs_q3_status_check 
  CHECK (q3_status IS NULL OR q3_status IN ('exceeded', 'on-track', 'delayed', 'missed'));

ALTER TABLE strategic_programs DROP CONSTRAINT IF EXISTS strategic_programs_q4_status_check;
ALTER TABLE strategic_programs ADD CONSTRAINT strategic_programs_q4_status_check 
  CHECK (q4_status IS NULL OR q4_status IN ('exceeded', 'on-track', 'delayed', 'missed'));

-- Fix year-specific quarterly status constraints (2025)
ALTER TABLE strategic_programs DROP CONSTRAINT IF EXISTS strategic_programs_q1_2025_status_check;
ALTER TABLE strategic_programs ADD CONSTRAINT strategic_programs_q1_2025_status_check 
  CHECK (q1_2025_status IS NULL OR q1_2025_status IN ('exceeded', 'on-track', 'delayed', 'missed'));

ALTER TABLE strategic_programs DROP CONSTRAINT IF EXISTS strategic_programs_q2_2025_status_check;
ALTER TABLE strategic_programs ADD CONSTRAINT strategic_programs_q2_2025_status_check 
  CHECK (q2_2025_status IS NULL OR q2_2025_status IN ('exceeded', 'on-track', 'delayed', 'missed'));

ALTER TABLE strategic_programs DROP CONSTRAINT IF EXISTS strategic_programs_q3_2025_status_check;
ALTER TABLE strategic_programs ADD CONSTRAINT strategic_programs_q3_2025_status_check 
  CHECK (q3_2025_status IS NULL OR q3_2025_status IN ('exceeded', 'on-track', 'delayed', 'missed'));

ALTER TABLE strategic_programs DROP CONSTRAINT IF EXISTS strategic_programs_q4_2025_status_check;
ALTER TABLE strategic_programs ADD CONSTRAINT strategic_programs_q4_2025_status_check 
  CHECK (q4_2025_status IS NULL OR q4_2025_status IN ('exceeded', 'on-track', 'delayed', 'missed'));

-- Fix year-specific quarterly status constraints (2026)
ALTER TABLE strategic_programs DROP CONSTRAINT IF EXISTS strategic_programs_q1_2026_status_check;
ALTER TABLE strategic_programs ADD CONSTRAINT strategic_programs_q1_2026_status_check 
  CHECK (q1_2026_status IS NULL OR q1_2026_status IN ('exceeded', 'on-track', 'delayed', 'missed'));

ALTER TABLE strategic_programs DROP CONSTRAINT IF EXISTS strategic_programs_q2_2026_status_check;
ALTER TABLE strategic_programs ADD CONSTRAINT strategic_programs_q2_2026_status_check 
  CHECK (q2_2026_status IS NULL OR q2_2026_status IN ('exceeded', 'on-track', 'delayed', 'missed'));

ALTER TABLE strategic_programs DROP CONSTRAINT IF EXISTS strategic_programs_q3_2026_status_check;
ALTER TABLE strategic_programs ADD CONSTRAINT strategic_programs_q3_2026_status_check 
  CHECK (q3_2026_status IS NULL OR q3_2026_status IN ('exceeded', 'on-track', 'delayed', 'missed'));

ALTER TABLE strategic_programs DROP CONSTRAINT IF EXISTS strategic_programs_q4_2026_status_check;
ALTER TABLE strategic_programs ADD CONSTRAINT strategic_programs_q4_2026_status_check 
  CHECK (q4_2026_status IS NULL OR q4_2026_status IN ('exceeded', 'on-track', 'delayed', 'missed'));

-- Fix year-specific quarterly status constraints for goals (2025)
ALTER TABLE strategic_goals DROP CONSTRAINT IF EXISTS strategic_goals_q1_2025_status_check;
ALTER TABLE strategic_goals ADD CONSTRAINT strategic_goals_q1_2025_status_check 
  CHECK (q1_2025_status IS NULL OR q1_2025_status IN ('exceeded', 'on-track', 'delayed', 'missed'));

ALTER TABLE strategic_goals DROP CONSTRAINT IF EXISTS strategic_goals_q2_2025_status_check;
ALTER TABLE strategic_goals ADD CONSTRAINT strategic_goals_q2_2025_status_check 
  CHECK (q2_2025_status IS NULL OR q2_2025_status IN ('exceeded', 'on-track', 'delayed', 'missed'));

ALTER TABLE strategic_goals DROP CONSTRAINT IF EXISTS strategic_goals_q3_2025_status_check;
ALTER TABLE strategic_goals ADD CONSTRAINT strategic_goals_q3_2025_status_check 
  CHECK (q3_2025_status IS NULL OR q3_2025_status IN ('exceeded', 'on-track', 'delayed', 'missed'));

ALTER TABLE strategic_goals DROP CONSTRAINT IF EXISTS strategic_goals_q4_2025_status_check;
ALTER TABLE strategic_goals ADD CONSTRAINT strategic_goals_q4_2025_status_check 
  CHECK (q4_2025_status IS NULL OR q4_2025_status IN ('exceeded', 'on-track', 'delayed', 'missed'));

-- Fix year-specific quarterly status constraints for goals (2026)
ALTER TABLE strategic_goals DROP CONSTRAINT IF EXISTS strategic_goals_q1_2026_status_check;
ALTER TABLE strategic_goals ADD CONSTRAINT strategic_goals_q1_2026_status_check 
  CHECK (q1_2026_status IS NULL OR q1_2026_status IN ('exceeded', 'on-track', 'delayed', 'missed'));

ALTER TABLE strategic_goals DROP CONSTRAINT IF EXISTS strategic_goals_q2_2026_status_check;
ALTER TABLE strategic_goals ADD CONSTRAINT strategic_goals_q2_2026_status_check 
  CHECK (q2_2026_status IS NULL OR q2_2026_status IN ('exceeded', 'on-track', 'delayed', 'missed'));

ALTER TABLE strategic_goals DROP CONSTRAINT IF EXISTS strategic_goals_q3_2026_status_check;
ALTER TABLE strategic_goals ADD CONSTRAINT strategic_goals_q3_2026_status_check 
  CHECK (q3_2026_status IS NULL OR q3_2026_status IN ('exceeded', 'on-track', 'delayed', 'missed'));

ALTER TABLE strategic_goals DROP CONSTRAINT IF EXISTS strategic_goals_q4_2026_status_check;
ALTER TABLE strategic_goals ADD CONSTRAINT strategic_goals_q4_2026_status_check 
  CHECK (q4_2026_status IS NULL OR q4_2026_status IN ('exceeded', 'on-track', 'delayed', 'missed'));

-- ==================================================
-- STEP 5: DROP LEGACY COLUMNS FROM STRATEGIC_PROGRAMS
-- ==================================================

-- Drop legacy quarterly status columns
ALTER TABLE strategic_programs DROP COLUMN IF EXISTS q1_status;
ALTER TABLE strategic_programs DROP COLUMN IF EXISTS q2_status;
ALTER TABLE strategic_programs DROP COLUMN IF EXISTS q3_status;
ALTER TABLE strategic_programs DROP COLUMN IF EXISTS q4_status;

-- Drop legacy quarterly objective columns
ALTER TABLE strategic_programs DROP COLUMN IF EXISTS q1_objective;
ALTER TABLE strategic_programs DROP COLUMN IF EXISTS q2_objective;
ALTER TABLE strategic_programs DROP COLUMN IF EXISTS q3_objective;
ALTER TABLE strategic_programs DROP COLUMN IF EXISTS q4_objective;

-- ==================================================
-- STEP 6: REMOVE CATEGORY STATUS AND COMMENTS COLUMNS
-- ==================================================

-- Remove the status column from categories table
ALTER TABLE categories DROP COLUMN IF EXISTS status;

-- Remove the comments column from categories table  
ALTER TABLE categories DROP COLUMN IF EXISTS comments;

-- ==================================================
-- MIGRATION COMPLETED
-- ==================================================

SELECT 'Consolidated migration completed successfully! All migrations applied except sponsor fields to arrays.' AS status;