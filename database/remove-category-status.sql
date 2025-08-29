-- Migration script to remove status and comments columns from categories table
-- This removes the ability to set status on categories, leaving status only for goals and programs

-- Remove the status column from categories table
ALTER TABLE categories DROP COLUMN IF EXISTS status;

-- Remove the comments column from categories table  
ALTER TABLE categories DROP COLUMN IF EXISTS comments;

-- Note: The CHECK constraint on status will be automatically dropped when the column is dropped