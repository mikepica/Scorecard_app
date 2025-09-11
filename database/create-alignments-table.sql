-- Create scorecard_alignments table for flexible alignment system
-- Allows any functional item to align with any ORD item at any hierarchy level

CREATE TABLE scorecard_alignments (
    id VARCHAR(255) PRIMARY KEY DEFAULT gen_random_uuid()::VARCHAR(255),
    
    -- Functional side (any level)
    functional_type VARCHAR(50) CHECK (functional_type IN ('pillar', 'category', 'goal', 'program')),
    functional_pillar_id VARCHAR(255),
    functional_category_id VARCHAR(255), 
    functional_goal_id VARCHAR(255),
    functional_program_id VARCHAR(255),
    
    -- ORD side (any level)
    ord_type VARCHAR(50) CHECK (ord_type IN ('pillar', 'category', 'goal', 'program')),
    ord_pillar_id VARCHAR(255),
    ord_category_id VARCHAR(255),
    ord_goal_id VARCHAR(255), 
    ord_program_id VARCHAR(255),
    
    -- Alignment metadata
    alignment_strength VARCHAR(20) DEFAULT 'moderate' CHECK (alignment_strength IN ('strong', 'moderate', 'weak', 'informational')),
    alignment_rationale TEXT,
    created_by VARCHAR(255) DEFAULT 'system',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    -- Ensure at least one functional and one ORD item is specified
    CONSTRAINT check_functional_item CHECK (
        functional_pillar_id IS NOT NULL OR 
        functional_category_id IS NOT NULL OR 
        functional_goal_id IS NOT NULL OR 
        functional_program_id IS NOT NULL
    ),
    CONSTRAINT check_ord_item CHECK (
        ord_pillar_id IS NOT NULL OR 
        ord_category_id IS NOT NULL OR 
        ord_goal_id IS NOT NULL OR 
        ord_program_id IS NOT NULL
    ),
    
    -- Prevent duplicate alignments
    UNIQUE(functional_type, functional_pillar_id, functional_category_id, functional_goal_id, functional_program_id, 
           ord_type, ord_pillar_id, ord_category_id, ord_goal_id, ord_program_id)
);

-- Indexes for performance
CREATE INDEX idx_alignments_functional_pillar ON scorecard_alignments(functional_pillar_id);
CREATE INDEX idx_alignments_functional_category ON scorecard_alignments(functional_category_id);
CREATE INDEX idx_alignments_functional_goal ON scorecard_alignments(functional_goal_id);
CREATE INDEX idx_alignments_functional_program ON scorecard_alignments(functional_program_id);

CREATE INDEX idx_alignments_ord_pillar ON scorecard_alignments(ord_pillar_id);
CREATE INDEX idx_alignments_ord_category ON scorecard_alignments(ord_category_id);
CREATE INDEX idx_alignments_ord_goal ON scorecard_alignments(ord_goal_id);
CREATE INDEX idx_alignments_ord_program ON scorecard_alignments(ord_program_id);

CREATE INDEX idx_alignments_strength ON scorecard_alignments(alignment_strength);
CREATE INDEX idx_alignments_created_at ON scorecard_alignments(created_at);

-- Apply update trigger
CREATE TRIGGER update_scorecard_alignments_updated_at 
    BEFORE UPDATE ON scorecard_alignments 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

-- Add sample alignment data for testing
INSERT INTO scorecard_alignments (
    functional_type, functional_program_id,
    ord_type, ord_program_id,
    alignment_strength, alignment_rationale,
    created_by
) VALUES (
    'program', (SELECT id FROM functional_programs LIMIT 1),
    'program', (SELECT id FROM strategic_programs LIMIT 1),
    'strong', 'Both programs focus on system reliability improvements',
    'system'
) ON CONFLICT DO NOTHING;