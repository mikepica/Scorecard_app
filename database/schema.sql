-- Scorecard Database Schema
-- PostgreSQL schema for scorecard application

-- Strategic Pillars table
CREATE TABLE strategic_pillars (
    id VARCHAR(255) PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Categories table
CREATE TABLE categories (
    id VARCHAR(255) PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    status VARCHAR(20) CHECK (status IN ('exceeded', 'on-track', 'delayed', 'missed')),
    comments TEXT,
    pillar_id VARCHAR(255) NOT NULL REFERENCES strategic_pillars(id) ON DELETE CASCADE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Strategic Goals table
CREATE TABLE strategic_goals (
    id VARCHAR(255) PRIMARY KEY,
    text TEXT NOT NULL,
    status VARCHAR(20) CHECK (status IN ('exceeded', 'on-track', 'delayed', 'missed')),
    comments TEXT,
    
    -- Quarterly objectives
    q1_objective TEXT,
    q2_objective TEXT,
    q3_objective TEXT,
    q4_objective TEXT,
    
    -- Quarterly status
    q1_status VARCHAR(20) CHECK (q1_status IN ('exceeded', 'on-track', 'delayed', 'missed')),
    q2_status VARCHAR(20) CHECK (q2_status IN ('exceeded', 'on-track', 'delayed', 'missed')),
    q3_status VARCHAR(20) CHECK (q3_status IN ('exceeded', 'on-track', 'delayed', 'missed')),
    q4_status VARCHAR(20) CHECK (q4_status IN ('exceeded', 'on-track', 'delayed', 'missed')),
    
    -- Personnel fields (arrays)
    ord_lt_sponsors TEXT[],
    sponsors_leads TEXT[],
    reporting_owners TEXT[],
    
    -- Progress updates
    progress_updates TEXT,
    
    -- Foreign keys
    category_id VARCHAR(255) NOT NULL REFERENCES categories(id) ON DELETE CASCADE,
    pillar_id VARCHAR(255) NOT NULL REFERENCES strategic_pillars(id) ON DELETE CASCADE,
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Strategic Programs table
CREATE TABLE strategic_programs (
    id VARCHAR(255) PRIMARY KEY,
    text TEXT NOT NULL,
    
    -- Quarterly objectives
    q1_objective TEXT,
    q2_objective TEXT,
    q3_objective TEXT,
    q4_objective TEXT,
    
    -- Quarterly status
    q1_status VARCHAR(20) CHECK (q1_status IN ('exceeded', 'on-track', 'delayed', 'missed')),
    q2_status VARCHAR(20) CHECK (q2_status IN ('exceeded', 'on-track', 'delayed', 'missed')),
    q3_status VARCHAR(20) CHECK (q3_status IN ('exceeded', 'on-track', 'delayed', 'missed')),
    q4_status VARCHAR(20) CHECK (q4_status IN ('exceeded', 'on-track', 'delayed', 'missed')),
    
    -- Personnel fields (arrays)
    ord_lt_sponsors TEXT[],
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
    
    -- Foreign keys
    goal_id VARCHAR(255) NOT NULL REFERENCES strategic_goals(id) ON DELETE CASCADE,
    category_id VARCHAR(255) NOT NULL REFERENCES categories(id) ON DELETE CASCADE,
    pillar_id VARCHAR(255) NOT NULL REFERENCES strategic_pillars(id) ON DELETE CASCADE,
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Progress Updates History table
CREATE TABLE progress_updates_history (
    id VARCHAR(255) PRIMARY KEY,
    program_id VARCHAR(255) NOT NULL REFERENCES strategic_programs(id) ON DELETE CASCADE,
    previous_value TEXT,
    new_value TEXT,
    changed_by VARCHAR(255) NOT NULL,
    changed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Indexes for better query performance
CREATE INDEX idx_categories_pillar_id ON categories(pillar_id);
CREATE INDEX idx_strategic_goals_category_id ON strategic_goals(category_id);
CREATE INDEX idx_strategic_goals_pillar_id ON strategic_goals(pillar_id);
CREATE INDEX idx_strategic_programs_goal_id ON strategic_programs(goal_id);
CREATE INDEX idx_strategic_programs_category_id ON strategic_programs(category_id);
CREATE INDEX idx_strategic_programs_pillar_id ON strategic_programs(pillar_id);
CREATE INDEX idx_progress_updates_history_program_id ON progress_updates_history(program_id);

-- Trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Trigger function for tracking progress updates changes
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

-- Apply the trigger to all tables
CREATE TRIGGER update_strategic_pillars_updated_at BEFORE UPDATE ON strategic_pillars FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_categories_updated_at BEFORE UPDATE ON categories FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_strategic_goals_updated_at BEFORE UPDATE ON strategic_goals FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_strategic_programs_updated_at BEFORE UPDATE ON strategic_programs FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Functional Programs table
CREATE TABLE functional_programs (
    id VARCHAR(255) PRIMARY KEY,
    text TEXT NOT NULL,
    
    -- Quarterly objectives
    q1_objective TEXT,
    q2_objective TEXT,
    q3_objective TEXT,
    q4_objective TEXT,
    
    -- Quarterly status
    q1_status VARCHAR(20) CHECK (q1_status IN ('exceeded', 'on-track', 'delayed', 'missed')),
    q2_status VARCHAR(20) CHECK (q2_status IN ('exceeded', 'on-track', 'delayed', 'missed')),
    q3_status VARCHAR(20) CHECK (q3_status IN ('exceeded', 'on-track', 'delayed', 'missed')),
    q4_status VARCHAR(20) CHECK (q4_status IN ('exceeded', 'on-track', 'delayed', 'missed')),
    
    -- Personnel fields (arrays)
    ord_lt_sponsors TEXT[],
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
    
    -- Foreign keys
    goal_id VARCHAR(255) NOT NULL REFERENCES strategic_goals(id) ON DELETE CASCADE,
    category_id VARCHAR(255) NOT NULL REFERENCES categories(id) ON DELETE CASCADE,
    pillar_id VARCHAR(255) NOT NULL REFERENCES strategic_pillars(id) ON DELETE CASCADE,
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Indexes for functional_programs table
CREATE INDEX idx_functional_programs_goal_id ON functional_programs(goal_id);
CREATE INDEX idx_functional_programs_category_id ON functional_programs(category_id);
CREATE INDEX idx_functional_programs_pillar_id ON functional_programs(pillar_id);
CREATE INDEX idx_functional_programs_linked_strategic ON functional_programs(linked_ORD_strategic_program_ID);

-- Apply update trigger to functional_programs
CREATE TRIGGER update_functional_programs_updated_at BEFORE UPDATE ON functional_programs FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Trigger to track progress updates changes
CREATE TRIGGER track_progress_updates_changes
    BEFORE UPDATE ON strategic_programs
    FOR EACH ROW
    EXECUTE FUNCTION record_progress_update_change();

-- Trigger to track functional progress updates changes
CREATE TRIGGER track_functional_progress_updates_changes
    BEFORE UPDATE ON functional_programs
    FOR EACH ROW
    EXECUTE FUNCTION record_progress_update_change();