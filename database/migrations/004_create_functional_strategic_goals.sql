-- Migration: Create functional_strategic_goals table
-- This table tracks status information for functional strategic goals
-- Simplified version with only status fields and unique ID

-- Drop the old table if it exists
DROP TABLE IF EXISTS functional_strategic_goals CASCADE;

CREATE TABLE functional_strategic_goals (
    -- Unique identifier (UUID)
    id VARCHAR(255) PRIMARY KEY,

    -- Goal name/text
    text TEXT NOT NULL,

    -- 2025 Quarterly status
    q1_2025_status VARCHAR(20) CHECK (q1_2025_status IN ('exceeded', 'on-track', 'delayed', 'missed')),
    q2_2025_status VARCHAR(20) CHECK (q2_2025_status IN ('exceeded', 'on-track', 'delayed', 'missed')),
    q3_2025_status VARCHAR(20) CHECK (q3_2025_status IN ('exceeded', 'on-track', 'delayed', 'missed')),
    q4_2025_status VARCHAR(20) CHECK (q4_2025_status IN ('exceeded', 'on-track', 'delayed', 'missed')),

    -- 2026 Quarterly status
    q1_2026_status VARCHAR(20) CHECK (q1_2026_status IN ('exceeded', 'on-track', 'delayed', 'missed')),
    q2_2026_status VARCHAR(20) CHECK (q2_2026_status IN ('exceeded', 'on-track', 'delayed', 'missed')),
    q3_2026_status VARCHAR(20) CHECK (q3_2026_status IN ('exceeded', 'on-track', 'delayed', 'missed')),
    q4_2026_status VARCHAR(20) CHECK (q4_2026_status IN ('exceeded', 'on-track', 'delayed', 'missed')),

    -- Audit fields
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Apply the updated_at trigger to functional_strategic_goals
CREATE TRIGGER update_functional_strategic_goals_updated_at
    BEFORE UPDATE ON functional_strategic_goals
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Add foreign key column to functional_programs table
ALTER TABLE functional_programs
ADD COLUMN IF NOT EXISTS functional_goal_id VARCHAR(255) REFERENCES functional_strategic_goals(id) ON DELETE SET NULL;

-- Create index on the foreign key
CREATE INDEX IF NOT EXISTS idx_functional_programs_goal_id ON functional_programs(functional_goal_id);

-- Add comments to document the table structure
COMMENT ON TABLE functional_strategic_goals IS 'Functional strategic goals table - tracks quarterly status at the goal level for functional hierarchy';
COMMENT ON COLUMN functional_strategic_goals.id IS 'Unique identifier for the functional strategic goal';
COMMENT ON COLUMN functional_strategic_goals.text IS 'Goal name/description';
COMMENT ON COLUMN functional_programs.functional_goal_id IS 'Foreign key reference to functional_strategic_goals table';

-- Populate initial functional strategic goals data
INSERT INTO functional_strategic_goals (id, text, created_at, updated_at) VALUES
('FSP01', 'Another change.', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('FSP02', 'Validate novel predictive biomarkers', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('FSP03', 'Expand tumor genomics database', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('FSP04', 'Advance single cell analytics platform', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('FSP05', 'Optimize next gen kinase inhibitors', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('FSP06', 'Develop bispecific antibodies portfolio', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('FSP07', 'Integrate AI for target selection', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('FSP08', 'Codevelop CDx assays with therapy programs', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('FSP09', 'Obtain FDA clearance for NGS panel', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('FSP10', 'Reduce IND cycle time by 20%', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('FSP11', 'Implement adaptive trial designs', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('FSP12', 'Expand first human trial network', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('FSP13', 'Harmonize global filings', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('FSP14', 'Strengthen agency engagement strategy', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('FSP15', 'Enhance CMC readiness', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('FSP16', 'Deploy decentralized trial platform', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('FSP17', 'Leverage wearables for safety monitoring', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
ON CONFLICT (id) DO UPDATE SET
    text = EXCLUDED.text,
    updated_at = CURRENT_TIMESTAMP;

-- Link functional_programs to functional_strategic_goals
-- This updates the functional_goal_id foreign key based on matching strategic_goal text
UPDATE functional_programs fp
SET functional_goal_id = fsg.id
FROM functional_strategic_goals fsg
WHERE fp.strategic_goal = fsg.text;

-- Display linking results
SELECT
    COUNT(*) as total_programs,
    COUNT(functional_goal_id) as linked_programs,
    COUNT(*) - COUNT(functional_goal_id) as unlinked_programs
FROM functional_programs;
