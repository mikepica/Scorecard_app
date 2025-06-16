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
    
    -- Personnel fields
    ord_lt_sponsors TEXT,
    sponsors_leads TEXT,
    reporting_owners TEXT,
    
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
    
    -- Personnel fields
    ord_lt_sponsors TEXT,
    sponsors_leads TEXT,
    reporting_owners TEXT,
    
    -- Progress updates
    progress_updates TEXT,
    
    -- Foreign keys
    goal_id VARCHAR(255) NOT NULL REFERENCES strategic_goals(id) ON DELETE CASCADE,
    category_id VARCHAR(255) NOT NULL REFERENCES categories(id) ON DELETE CASCADE,
    pillar_id VARCHAR(255) NOT NULL REFERENCES strategic_pillars(id) ON DELETE CASCADE,
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Indexes for better query performance
CREATE INDEX idx_categories_pillar_id ON categories(pillar_id);
CREATE INDEX idx_strategic_goals_category_id ON strategic_goals(category_id);
CREATE INDEX idx_strategic_goals_pillar_id ON strategic_goals(pillar_id);
CREATE INDEX idx_strategic_programs_goal_id ON strategic_programs(goal_id);
CREATE INDEX idx_strategic_programs_category_id ON strategic_programs(category_id);
CREATE INDEX idx_strategic_programs_pillar_id ON strategic_programs(pillar_id);

-- Trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Apply the trigger to all tables
CREATE TRIGGER update_strategic_pillars_updated_at BEFORE UPDATE ON strategic_pillars FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_categories_updated_at BEFORE UPDATE ON categories FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_strategic_goals_updated_at BEFORE UPDATE ON strategic_goals FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_strategic_programs_updated_at BEFORE UPDATE ON strategic_programs FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();