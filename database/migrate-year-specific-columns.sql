-- Migration: Rename existing columns to 2025-specific and add 2026 columns
-- This migration transforms generic quarterly columns to year-specific columns

-- Step 1: Add new 2026 columns for objectives and statuses
ALTER TABLE strategic_programs 
ADD COLUMN IF NOT EXISTS q1_2026_objective TEXT,
ADD COLUMN IF NOT EXISTS q2_2026_objective TEXT,
ADD COLUMN IF NOT EXISTS q3_2026_objective TEXT,
ADD COLUMN IF NOT EXISTS q4_2026_objective TEXT,
ADD COLUMN IF NOT EXISTS q1_2026_status VARCHAR(20) CHECK (q1_2026_status IN ('exceeded', 'on-track', 'delayed', 'missed')),
ADD COLUMN IF NOT EXISTS q2_2026_status VARCHAR(20) CHECK (q2_2026_status IN ('exceeded', 'on-track', 'delayed', 'missed')),
ADD COLUMN IF NOT EXISTS q3_2026_status VARCHAR(20) CHECK (q3_2026_status IN ('exceeded', 'on-track', 'delayed', 'missed')),
ADD COLUMN IF NOT EXISTS q4_2026_status VARCHAR(20) CHECK (q4_2026_status IN ('exceeded', 'on-track', 'delayed', 'missed'));

-- Step 2: Add new 2025 columns first (before renaming)
ALTER TABLE strategic_programs 
ADD COLUMN IF NOT EXISTS q1_2025_objective TEXT,
ADD COLUMN IF NOT EXISTS q2_2025_objective TEXT,
ADD COLUMN IF NOT EXISTS q3_2025_objective TEXT,
ADD COLUMN IF NOT EXISTS q4_2025_objective TEXT,
ADD COLUMN IF NOT EXISTS q1_2025_status VARCHAR(20) CHECK (q1_2025_status IN ('exceeded', 'on-track', 'delayed', 'missed')),
ADD COLUMN IF NOT EXISTS q2_2025_status VARCHAR(20) CHECK (q2_2025_status IN ('exceeded', 'on-track', 'delayed', 'missed')),
ADD COLUMN IF NOT EXISTS q3_2025_status VARCHAR(20) CHECK (q3_2025_status IN ('exceeded', 'on-track', 'delayed', 'missed')),
ADD COLUMN IF NOT EXISTS q4_2025_status VARCHAR(20) CHECK (q4_2025_status IN ('exceeded', 'on-track', 'delayed', 'missed'));

-- Step 3: Copy existing data from generic columns to 2025-specific columns
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

-- Step 4: Keep the original columns for now (for backward compatibility during transition)
-- We'll remove them later once all code is updated

-- Update the schema file to reflect the new structure
-- Update the main schema to include these columns as well
-- (This is just a comment - the actual schema.sql file will be updated separately)

-- Verify the new columns exist
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns 
WHERE table_name = 'strategic_programs' 
AND column_name LIKE '%_202%'
ORDER BY column_name;

-- Show success message
SELECT 'Migration completed successfully! Added 2025 and 2026 year-specific columns and copied existing data.' AS status;