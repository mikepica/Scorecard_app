-- Migration script to update existing functional_programs table structure
-- This script modifies the existing table to add 'function' column and convert foreign keys to text fields
-- Run this on databases that already have the functional_programs table

-- Drop existing functional_programs table and recreate with new structure
-- WARNING: This will delete all existing functional programs data
DROP TABLE IF EXISTS functional_programs CASCADE;

-- Create the new functional_programs table with updated structure
CREATE TABLE functional_programs (
    id VARCHAR(255) PRIMARY KEY,
    text TEXT NOT NULL,
    
    -- Functional categorization
    function TEXT,
    
    -- Hierarchical text fields (no foreign key dependencies)
    pillar TEXT,
    category TEXT,
    strategic_goal TEXT,
    
    -- Legacy quarterly objectives (backward compatibility)
    q1_objective TEXT,
    q2_objective TEXT,
    q3_objective TEXT,
    q4_objective TEXT,
    
    -- Legacy quarterly status (backward compatibility)
    q1_status VARCHAR(20) CHECK (q1_status IN ('exceeded', 'on-track', 'delayed', 'missed')),
    q2_status VARCHAR(20) CHECK (q2_status IN ('exceeded', 'on-track', 'delayed', 'missed')),
    q3_status VARCHAR(20) CHECK (q3_status IN ('exceeded', 'on-track', 'delayed', 'missed')),
    q4_status VARCHAR(20) CHECK (q4_status IN ('exceeded', 'on-track', 'delayed', 'missed')),
    
    -- 2025 Objectives and Statuses
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
    
    -- Personnel fields (arrays)
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
    linked_ORD_strategic_program_ID VARCHAR(255),
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for the new structure
CREATE INDEX idx_functional_programs_function ON functional_programs(function);
CREATE INDEX idx_functional_programs_pillar ON functional_programs(pillar);
CREATE INDEX idx_functional_programs_category ON functional_programs(category);
CREATE INDEX idx_functional_programs_strategic_goal ON functional_programs(strategic_goal);
CREATE INDEX idx_functional_programs_linked_strategic ON functional_programs(linked_ORD_strategic_program_ID);

-- Create composite indexes for common query patterns
CREATE INDEX idx_functional_programs_pillar_category ON functional_programs(pillar, category);
CREATE INDEX idx_functional_programs_category_goal ON functional_programs(category, strategic_goal);

-- Apply update trigger to functional_programs (assuming the function exists)
CREATE TRIGGER update_functional_programs_updated_at 
    BEFORE UPDATE ON functional_programs 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

-- Apply progress updates tracking trigger (assuming the function exists)
CREATE TRIGGER track_functional_progress_updates_changes
    BEFORE UPDATE ON functional_programs
    FOR EACH ROW
    EXECUTE FUNCTION record_progress_update_change();

-- Add comments to document the new structure
COMMENT ON TABLE functional_programs IS 'Functional programs table - independent structure with text-based hierarchy for functional organization view';
COMMENT ON COLUMN functional_programs.function IS 'Functional categorization (e.g., IT, Operations, Manufacturing, Regulatory)';
COMMENT ON COLUMN functional_programs.linked_ORD_strategic_program_ID IS 'Optional link to corresponding strategic program in strategic_programs table';
COMMENT ON COLUMN functional_programs.pillar IS 'Text field for pillar name - no foreign key dependency';
COMMENT ON COLUMN functional_programs.category IS 'Text field for category name - no foreign key dependency';
COMMENT ON COLUMN functional_programs.strategic_goal IS 'Text field for strategic goal - no foreign key dependency';