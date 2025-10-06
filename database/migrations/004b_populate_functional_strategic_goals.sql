-- Populate functional_strategic_goals table with initial data
-- This script imports goal data into the functional_strategic_goals table

INSERT INTO functional_strategic_goals (id, text, created_at, updated_at) VALUES
('FSP01', 'Another change', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('FSP02', 'Validate existing', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('FSP03', 'Expand tumor', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('FSP04', 'Advance existing', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('FSP05', 'Optimize next', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('FSP06', 'Develop late', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('FSP07', 'Integrate AI fc', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('FSP08', 'Develop & Pilot', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('FSP09', 'Enhance current', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('FSP10', 'Reduce IND d', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('FSP11', 'Leverage Al &', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('FSP12', 'Expand first in', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('FSP13', 'Drive patient', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('FSP14', 'Strengthen an', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('FSP15', 'Enhance CXO', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('FSP16', 'Deliver operational', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('FSP17', 'Leverage digital', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
ON CONFLICT (id) DO UPDATE SET
    text = EXCLUDED.text,
    updated_at = CURRENT_TIMESTAMP;

-- Display results
SELECT COUNT(*) as total_goals FROM functional_strategic_goals;
SELECT * FROM functional_strategic_goals ORDER BY id;
