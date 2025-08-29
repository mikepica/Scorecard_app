-- Migration script to add year-specific columns to strategic_goals table and migrate data
-- This adds 2025 and 2026 year-specific columns and migrates existing general status to Q3 2025

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