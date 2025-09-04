-- Complete migration to add functional_programs table
-- This file includes all necessary dependencies and can be run on a fresh database
-- Run this to create the functional programs table and all required functions/triggers

-- First, ensure the update_updated_at_column function exists
-- This function is used to automatically update the updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Trigger function for tracking progress updates changes
-- This function records changes to progress_updates field for audit trail
CREATE OR REPLACE FUNCTION record_progress_update_change()
RETURNS TRIGGER AS $$
BEGIN
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
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create the functional_programs table
-- This table is independent from strategic programs and uses text fields for organization
CREATE TABLE IF NOT EXISTS functional_programs (
    id VARCHAR(255) PRIMARY KEY,
    text TEXT NOT NULL,
    
    -- Functional categorization
    function TEXT,
    
    -- Hierarchical text fields (no foreign key dependencies)
    pillar TEXT,
    category TEXT,
    strategic_goal TEXT,
    
    -- Quarterly objectives (legacy format for backward compatibility)
    q1_objective TEXT,
    q2_objective TEXT,
    q3_objective TEXT,
    q4_objective TEXT,
    
    -- Quarterly status (legacy format)
    q1_status VARCHAR(20) CHECK (q1_status IN ('exceeded', 'on-track', 'delayed', 'missed')),
    q2_status VARCHAR(20) CHECK (q2_status IN ('exceeded', 'on-track', 'delayed', 'missed')),
    q3_status VARCHAR(20) CHECK (q3_status IN ('exceeded', 'on-track', 'delayed', 'missed')),
    q4_status VARCHAR(20) CHECK (q4_status IN ('exceeded', 'on-track', 'delayed', 'missed')),
    
    -- 2025 Objectives and Statuses (year-specific format)
    q1_2025_objective TEXT,
    q2_2025_objective TEXT,
    q3_2025_objective TEXT,
    q4_2025_objective TEXT,
    q1_2025_status VARCHAR(20) CHECK (q1_2025_status IN ('exceeded', 'on-track', 'delayed', 'missed')),
    q2_2025_status VARCHAR(20) CHECK (q2_2025_status IN ('exceeded', 'on-track', 'delayed', 'missed')),
    q3_2025_status VARCHAR(20) CHECK (q3_2025_status IN ('exceeded', 'on-track', 'delayed', 'missed')),
    q4_2025_status VARCHAR(20) CHECK (q4_2025_status IN ('exceeded', 'on-track', 'delayed', 'missed')),
    
    -- 2026 Objectives and Statuses
    q1_2026_objective TEXT,
    q2_2026_objective TEXT,
    q3_2026_objective TEXT,
    q4_2026_objective TEXT,
    q1_2026_status VARCHAR(20) CHECK (q1_2026_status IN ('exceeded', 'on-track', 'delayed', 'missed')),
    q2_2026_status VARCHAR(20) CHECK (q2_2026_status IN ('exceeded', 'on-track', 'delayed', 'missed')),
    q3_2026_status VARCHAR(20) CHECK (q3_2026_status IN ('exceeded', 'on-track', 'delayed', 'missed')),
    q4_2026_status VARCHAR(20) CHECK (q4_2026_status IN ('exceeded', 'on-track', 'delayed', 'missed')),
    
    -- Personnel fields (arrays to support multiple people per role)
    function_sponsor TEXT[],
    sponsors_leads TEXT[],
    reporting_owners TEXT[],
    
    -- Progress updates
    progress_updates TEXT,
    
    -- Quarterly progress updates (2025-2026)
    q1_2025_progress TEXT,
    q2_2025_progress TEXT,
    q3_2025_progress TEXT,
    q4_2025_progress TEXT,
    q1_2026_progress TEXT,
    q2_2026_progress TEXT,
    q3_2026_progress TEXT,
    q4_2026_progress TEXT,
    
    -- Link to strategic program (nullable for future use)
    -- This field allows functional programs to be linked to ORD strategic programs
    linked_ORD_strategic_program_ID VARCHAR(255),
    
    -- Audit fields
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_functional_programs_function ON functional_programs(function);
CREATE INDEX IF NOT EXISTS idx_functional_programs_pillar ON functional_programs(pillar);
CREATE INDEX IF NOT EXISTS idx_functional_programs_category ON functional_programs(category);
CREATE INDEX IF NOT EXISTS idx_functional_programs_strategic_goal ON functional_programs(strategic_goal);
CREATE INDEX IF NOT EXISTS idx_functional_programs_linked_strategic ON functional_programs(linked_ORD_strategic_program_ID);

-- Create composite indexes for common query patterns
CREATE INDEX IF NOT EXISTS idx_functional_programs_pillar_category ON functional_programs(pillar, category);
CREATE INDEX IF NOT EXISTS idx_functional_programs_category_goal ON functional_programs(category, strategic_goal);

-- Apply the updated_at trigger to functional_programs
DROP TRIGGER IF EXISTS update_functional_programs_updated_at ON functional_programs;
CREATE TRIGGER update_functional_programs_updated_at 
    BEFORE UPDATE ON functional_programs 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

-- Apply the progress updates tracking trigger to functional_programs
-- This requires that the progress_updates_history table exists
DROP TRIGGER IF EXISTS track_functional_progress_updates_changes ON functional_programs;
CREATE TRIGGER track_functional_progress_updates_changes
    BEFORE UPDATE ON functional_programs
    FOR EACH ROW
    EXECUTE FUNCTION record_progress_update_change();

-- Add comments to document the table structure
COMMENT ON TABLE functional_programs IS 'Functional programs table - independent structure with text-based hierarchy for functional organization view';
COMMENT ON COLUMN functional_programs.function IS 'Functional categorization (e.g., IT, Operations, Manufacturing, Regulatory)';
COMMENT ON COLUMN functional_programs.linked_ORD_strategic_program_ID IS 'Optional link to corresponding strategic program in strategic_programs table';
COMMENT ON COLUMN functional_programs.pillar IS 'Text field for pillar name - no foreign key dependency';
COMMENT ON COLUMN functional_programs.category IS 'Text field for category name - no foreign key dependency';
COMMENT ON COLUMN functional_programs.strategic_goal IS 'Text field for strategic goal - no foreign key dependency';