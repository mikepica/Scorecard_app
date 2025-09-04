-- Migration to add functional_programs table
-- Run this to create the functional programs table in your database

-- Functional Programs table
CREATE TABLE functional_programs (
    id VARCHAR(255) PRIMARY KEY,
    text TEXT NOT NULL,
    
    -- Functional categorization
    function TEXT,
    
    -- Hierarchical text fields (no foreign key dependencies)
    pillar TEXT,
    category TEXT,
    strategic_goal TEXT,
    
    
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

-- Indexes for functional_programs table
CREATE INDEX idx_functional_programs_function ON functional_programs(function);
CREATE INDEX idx_functional_programs_pillar ON functional_programs(pillar);
CREATE INDEX idx_functional_programs_category ON functional_programs(category);
CREATE INDEX idx_functional_programs_strategic_goal ON functional_programs(strategic_goal);
CREATE INDEX idx_functional_programs_linked_strategic ON functional_programs(linked_ORD_strategic_program_ID);

-- Apply update trigger to functional_programs
CREATE TRIGGER update_functional_programs_updated_at BEFORE UPDATE ON functional_programs FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Trigger to track functional progress updates changes
CREATE TRIGGER track_functional_progress_updates_changes
    BEFORE UPDATE ON functional_programs
    FOR EACH ROW
    EXECUTE FUNCTION record_progress_update_change();