-- Fix status columns to allow NULL values for "Not Defined" status
-- This addresses the error when trying to save undefined/null status values

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