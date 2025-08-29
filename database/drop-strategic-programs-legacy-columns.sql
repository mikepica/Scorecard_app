-- Migration script to drop legacy columns from strategic_programs table
-- This removes the old quarterly columns that have been replaced by year-specific ones

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

-- Note: Year-specific columns (q1_2025_status, q1_2026_status, etc.) are retained