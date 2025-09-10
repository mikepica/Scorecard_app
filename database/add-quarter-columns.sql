-- Migration to add start_quarter and end_quarter columns
-- These columns control when items are visible based on selected quarter

-- Add start_quarter and end_quarter to strategic_pillars
ALTER TABLE strategic_pillars 
ADD COLUMN start_quarter VARCHAR(10),
ADD COLUMN end_quarter VARCHAR(10);

-- Add start_quarter and end_quarter to categories
ALTER TABLE categories 
ADD COLUMN start_quarter VARCHAR(10),
ADD COLUMN end_quarter VARCHAR(10);

-- Add start_quarter and end_quarter to strategic_goals
ALTER TABLE strategic_goals 
ADD COLUMN start_quarter VARCHAR(10),
ADD COLUMN end_quarter VARCHAR(10);

-- Add start_quarter and end_quarter to strategic_programs
ALTER TABLE strategic_programs 
ADD COLUMN start_quarter VARCHAR(10),
ADD COLUMN end_quarter VARCHAR(10);

-- Add start_quarter and end_quarter to functional_programs
ALTER TABLE functional_programs 
ADD COLUMN start_quarter VARCHAR(10),
ADD COLUMN end_quarter VARCHAR(10);

-- Add comments for documentation
COMMENT ON COLUMN strategic_pillars.start_quarter IS 'Quarter when this pillar starts being visible (format: Q1-2025 or q1-2025)';
COMMENT ON COLUMN strategic_pillars.end_quarter IS 'Quarter when this pillar stops being visible (format: Q1-2025 or q1-2025)';

COMMENT ON COLUMN categories.start_quarter IS 'Quarter when this category starts being visible (format: Q1-2025 or q1-2025)';
COMMENT ON COLUMN categories.end_quarter IS 'Quarter when this category stops being visible (format: Q1-2025 or q1-2025)';

COMMENT ON COLUMN strategic_goals.start_quarter IS 'Quarter when this goal starts being visible (format: Q1-2025 or q1-2025)';
COMMENT ON COLUMN strategic_goals.end_quarter IS 'Quarter when this goal stops being visible (format: Q1-2025 or q1-2025)';

COMMENT ON COLUMN strategic_programs.start_quarter IS 'Quarter when this program starts being visible (format: Q1-2025 or q1-2025)';
COMMENT ON COLUMN strategic_programs.end_quarter IS 'Quarter when this program stops being visible (format: Q1-2025 or q1-2025)';

COMMENT ON COLUMN functional_programs.start_quarter IS 'Quarter when this functional program starts being visible (format: Q1-2025 or q1-2025)';
COMMENT ON COLUMN functional_programs.end_quarter IS 'Quarter when this functional program stops being visible (format: Q1-2025 or q1-2025)';