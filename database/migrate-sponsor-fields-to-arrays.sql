-- Migration to convert sponsor TEXT columns to TEXT[] array columns
-- This migration parses existing comma/semicolon/slash separated values into proper PostgreSQL arrays

BEGIN;

-- Add new array columns to strategic_programs table
ALTER TABLE strategic_programs 
  ADD COLUMN ord_lt_sponsors_array TEXT[],
  ADD COLUMN sponsors_leads_array TEXT[],
  ADD COLUMN reporting_owners_array TEXT[];

-- Migrate data with parsing for strategic_programs
UPDATE strategic_programs
SET 
  ord_lt_sponsors_array = 
    CASE 
      WHEN ord_lt_sponsors IS NULL OR TRIM(ord_lt_sponsors) = '' 
      THEN ARRAY['(Not Specified)']
      ELSE string_to_array(
        regexp_replace(
          regexp_replace(ord_lt_sponsors, '\s*[,;/]+\s*', '|', 'g'),
          '^\s+|\s+$', '', 'g'
        ), '|'
      )
    END,
  sponsors_leads_array = 
    CASE 
      WHEN sponsors_leads IS NULL OR TRIM(sponsors_leads) = '' 
      THEN ARRAY['(Not Specified)']
      ELSE string_to_array(
        regexp_replace(
          regexp_replace(sponsors_leads, '\s*[,;/]+\s*', '|', 'g'),
          '^\s+|\s+$', '', 'g'
        ), '|'
      )
    END,
  reporting_owners_array = 
    CASE 
      WHEN reporting_owners IS NULL OR TRIM(reporting_owners) = '' 
      THEN ARRAY['(Not Specified)']
      ELSE string_to_array(
        regexp_replace(
          regexp_replace(reporting_owners, '\s*[,;/]+\s*', '|', 'g'),
          '^\s+|\s+$', '', 'g'
        ), '|'
      )
    END;

-- Add new array columns to strategic_goals table
ALTER TABLE strategic_goals 
  ADD COLUMN ord_lt_sponsors_array TEXT[],
  ADD COLUMN sponsors_leads_array TEXT[],
  ADD COLUMN reporting_owners_array TEXT[];

-- Migrate data with parsing for strategic_goals
UPDATE strategic_goals
SET 
  ord_lt_sponsors_array = 
    CASE 
      WHEN ord_lt_sponsors IS NULL OR TRIM(ord_lt_sponsors) = '' 
      THEN ARRAY['(Not Specified)']
      ELSE string_to_array(
        regexp_replace(
          regexp_replace(ord_lt_sponsors, '\s*[,;/]+\s*', '|', 'g'),
          '^\s+|\s+$', '', 'g'
        ), '|'
      )
    END,
  sponsors_leads_array = 
    CASE 
      WHEN sponsors_leads IS NULL OR TRIM(sponsors_leads) = '' 
      THEN ARRAY['(Not Specified)']
      ELSE string_to_array(
        regexp_replace(
          regexp_replace(sponsors_leads, '\s*[,;/]+\s*', '|', 'g'),
          '^\s+|\s+$', '', 'g'
        ), '|'
      )
    END,
  reporting_owners_array = 
    CASE 
      WHEN reporting_owners IS NULL OR TRIM(reporting_owners) = '' 
      THEN ARRAY['(Not Specified)']
      ELSE string_to_array(
        regexp_replace(
          regexp_replace(reporting_owners, '\s*[,;/]+\s*', '|', 'g'),
          '^\s+|\s+$', '', 'g'
        ), '|'
      )
    END;

-- Verify the migration worked by checking a few records
-- Uncomment these lines to inspect the migration results before dropping columns
-- SELECT id, text, ord_lt_sponsors, ord_lt_sponsors_array FROM strategic_programs LIMIT 5;
-- SELECT id, text, ord_lt_sponsors, ord_lt_sponsors_array FROM strategic_goals LIMIT 5;

-- Drop old TEXT columns from strategic_programs
ALTER TABLE strategic_programs 
  DROP COLUMN ord_lt_sponsors,
  DROP COLUMN sponsors_leads,
  DROP COLUMN reporting_owners;

-- Drop old TEXT columns from strategic_goals
ALTER TABLE strategic_goals 
  DROP COLUMN ord_lt_sponsors,
  DROP COLUMN sponsors_leads,
  DROP COLUMN reporting_owners;

-- Rename array columns to original names for strategic_programs
ALTER TABLE strategic_programs 
  RENAME COLUMN ord_lt_sponsors_array TO ord_lt_sponsors;
ALTER TABLE strategic_programs 
  RENAME COLUMN sponsors_leads_array TO sponsors_leads;
ALTER TABLE strategic_programs 
  RENAME COLUMN reporting_owners_array TO reporting_owners;

-- Rename array columns to original names for strategic_goals
ALTER TABLE strategic_goals 
  RENAME COLUMN ord_lt_sponsors_array TO ord_lt_sponsors;
ALTER TABLE strategic_goals 
  RENAME COLUMN sponsors_leads_array TO sponsors_leads;
ALTER TABLE strategic_goals 
  RENAME COLUMN reporting_owners_array TO reporting_owners;

COMMIT;

-- Print success message
\echo 'Migration completed successfully! Sponsor fields are now TEXT[] arrays.'