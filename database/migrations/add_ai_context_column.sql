-- Migration: Add AI Context Column
-- This migration adds an ai_context column to both strategic_programs and functional_programs tables
-- Run date: 2025-01-XX

-- Add ai_context column to strategic_programs table
ALTER TABLE strategic_programs
ADD COLUMN ai_context TEXT;

-- Add ai_context column to functional_programs table
ALTER TABLE functional_programs
ADD COLUMN ai_context TEXT;

-- Add comments to document the new columns
COMMENT ON COLUMN strategic_programs.ai_context IS 'AI-specific context and instructions for this strategic program, used to enhance AI chat and progress update generation';
COMMENT ON COLUMN functional_programs.ai_context IS 'AI-specific context and instructions for this functional program, used to enhance AI chat and progress update generation';