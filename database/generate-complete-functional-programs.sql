-- Generate functional programs that mirror ALL strategic programs
-- This script creates a complete 1:1 mapping of strategic to functional programs

-- Clear existing functional programs data first
DELETE FROM functional_programs;

-- Generate functional programs based on strategic programs structure
INSERT INTO functional_programs (
    id, text, function, pillar, category, strategic_goal,
    q1_2025_objective, q2_2025_objective, q3_2025_objective, q4_2025_objective,
    q1_2025_status, q2_2025_status, q3_2025_status, q4_2025_status,
    q1_2026_objective, q2_2026_objective, q3_2026_objective, q4_2026_objective,
    q1_2026_status, q2_2026_status, q3_2026_status, q4_2026_status,
    function_sponsor, sponsors_leads, reporting_owners,
    progress_updates, q1_2025_progress, q2_2025_progress, q3_2025_progress
)
SELECT 
    'FP' || SUBSTRING(sp.id FROM 3) as id,  -- Convert SP169 to FP169
    CASE 
        WHEN sp.pillar_id = 'SPill102' AND sp.category_id = 'Cat107' THEN 
            CASE 
                WHEN sp.goal_id = 'SG122' THEN 'Financial Assistance Operations Platform - ' || SUBSTRING(sp.text FROM 7)
                WHEN sp.goal_id = 'SG121' THEN 'Diversity Recruitment Infrastructure - ' || SUBSTRING(sp.text FROM 7)
            END
        WHEN sp.pillar_id = 'SPill102' AND sp.category_id = 'Cat106' THEN 
            CASE 
                WHEN sp.goal_id = 'SG118' THEN 'RWE Data Infrastructure Platform - ' || SUBSTRING(sp.text FROM 8)
                WHEN sp.goal_id = 'SG119' THEN 'Comparative Analytics Operations - ' || SUBSTRING(sp.text FROM 8)
                WHEN sp.goal_id = 'SG120' THEN 'EHR Integration Infrastructure - ' || SUBSTRING(sp.text FROM 8)
            END
        WHEN sp.pillar_id = 'SPill101' AND sp.category_id = 'Cat105' THEN 
            CASE 
                WHEN sp.goal_id = 'SG117' THEN 'Clinical Data Automation Platform - ' || SUBSTRING(sp.text FROM 9)
                WHEN sp.goal_id = 'SG115' THEN 'DCT Technology Infrastructure - ' || SUBSTRING(sp.text FROM 9)
                WHEN sp.goal_id = 'SG116' THEN 'Wearables Platform Operations - ' || SUBSTRING(sp.text FROM 9)
            END
        WHEN sp.pillar_id = 'SPill101' AND sp.category_id = 'Cat103' THEN 
            CASE 
                WHEN sp.goal_id = 'SG111' THEN 'Clinical Site Network Infrastructure - ' || SUBSTRING(sp.text FROM 8)
                WHEN sp.goal_id = 'SG110' THEN 'Adaptive Trials Technology Platform - ' || SUBSTRING(sp.text FROM 8)
                WHEN sp.goal_id = 'SG109' THEN 'Regulatory Submission Operations - ' || SUBSTRING(sp.text FROM 8)
            END
        WHEN sp.pillar_id = 'SPill101' AND sp.category_id = 'Cat104' THEN 
            CASE 
                WHEN sp.goal_id = 'SG114' THEN 'CMC Operations Infrastructure - ' || SUBSTRING(sp.text FROM 7)
                WHEN sp.goal_id = 'SG112' THEN 'Global Regulatory IT Platform - ' || SUBSTRING(sp.text FROM 7)
                WHEN sp.goal_id = 'SG113' THEN 'Agency Relations Management System - ' || SUBSTRING(sp.text FROM 7)
            END
        WHEN sp.pillar_id = 'SPill100' AND sp.category_id = 'Cat100' THEN 
            CASE 
                WHEN sp.goal_id = 'SG103' THEN 'Single Cell Analytics Infrastructure - ' || SUBSTRING(sp.text FROM 7)
                WHEN sp.goal_id = 'SG100' THEN 'Biomarker Discovery Platform - ' || SUBSTRING(sp.text FROM 7)
                WHEN sp.goal_id = 'SG102' THEN 'Genomics Data Infrastructure - ' || SUBSTRING(sp.text FROM 7)
                WHEN sp.goal_id = 'SG101' THEN 'Predictive Biomarker Platform - ' || SUBSTRING(sp.text FROM 7)
            END
        WHEN sp.pillar_id = 'SPill100' AND sp.category_id = 'Cat102' THEN 
            CASE 
                WHEN sp.goal_id = 'SG107' THEN 'CDx Manufacturing Operations - ' || SUBSTRING(sp.text FROM 9)
                WHEN sp.goal_id = 'SG108' THEN 'NGS Platform Infrastructure - ' || SUBSTRING(sp.text FROM 9)
            END
        WHEN sp.pillar_id = 'SPill100' AND sp.category_id = 'Cat101' THEN 
            CASE 
                WHEN sp.goal_id = 'SG105' THEN 'Bispecific Manufacturing Platform - ' || SUBSTRING(sp.text FROM 7)
                WHEN sp.goal_id = 'SG106' THEN 'AI Target Selection Infrastructure - ' || SUBSTRING(sp.text FROM 7)
                WHEN sp.goal_id = 'SG104' THEN 'Kinase Inhibitor Production Platform - ' || SUBSTRING(sp.text FROM 7)
            END
        ELSE 'Functional Operations Platform - ' || sp.text
    END as text,
    
    CASE 
        WHEN sp.pillar_id = 'SPill102' THEN 'Patient Services Operations'
        WHEN sp.pillar_id = 'SPill101' THEN 'Clinical Operations Technology'
        WHEN sp.pillar_id = 'SPill100' THEN 'R&D Operations Infrastructure'
        ELSE 'Operations Support'
    END as function,
    
    spi.name as pillar,
    c.name as category,
    sg.text as strategic_goal,
    
    -- 2025 Q1-Q4 Objectives (operational focus)
    'Deploy infrastructure platform for ' || LOWER(sg.text) as q1_2025_objective,
    'Implement automation systems for ' || LOWER(sg.text) as q2_2025_objective,
    'Scale operations platform for ' || LOWER(sg.text) as q3_2025_objective,
    'Complete platform optimization for ' || LOWER(sg.text) as q4_2025_objective,
    
    -- 2025 Q1-Q4 Status (varied realistic statuses)
    CASE (RANDOM() * 4)::INT 
        WHEN 0 THEN 'exceeded' 
        WHEN 1 THEN 'on-track'
        WHEN 2 THEN 'on-track'  -- Higher probability of on-track
        ELSE 'delayed' 
    END as q1_2025_status,
    CASE (RANDOM() * 4)::INT 
        WHEN 0 THEN 'exceeded' 
        WHEN 1 THEN 'on-track'
        WHEN 2 THEN 'on-track'
        ELSE 'delayed' 
    END as q2_2025_status,
    CASE (RANDOM() * 4)::INT 
        WHEN 0 THEN 'exceeded' 
        WHEN 1 THEN 'on-track'
        WHEN 2 THEN 'on-track'
        ELSE 'delayed' 
    END as q3_2025_status,
    CASE (RANDOM() * 4)::INT 
        WHEN 0 THEN 'exceeded' 
        WHEN 1 THEN 'on-track'
        WHEN 2 THEN 'on-track'
        ELSE 'delayed' 
    END as q4_2025_status,
    
    -- 2026 Q1-Q4 Objectives (advanced operational focus)
    'Advance next-gen platform for ' || LOWER(sg.text) as q1_2026_objective,
    'Deploy AI-powered automation for ' || LOWER(sg.text) as q2_2026_objective,
    'Implement predictive systems for ' || LOWER(sg.text) as q3_2026_objective,
    'Complete digital transformation for ' || LOWER(sg.text) as q4_2026_objective,
    
    -- 2026 Q1-Q4 Status (all on-track for future planning)
    'on-track' as q1_2026_status,
    'on-track' as q2_2026_status,
    'on-track' as q3_2026_status,
    'on-track' as q4_2026_status,
    
    -- Personnel (operational focus)
    CASE 
        WHEN sp.pillar_id = 'SPill102' THEN ARRAY['VP Patient Services Operations']
        WHEN sp.pillar_id = 'SPill101' THEN ARRAY['VP Clinical Operations Technology']
        WHEN sp.pillar_id = 'SPill100' THEN ARRAY['VP R&D Operations']
        ELSE ARRAY['VP Operations']
    END as function_sponsor,
    
    ARRAY['Operations Team', 'Technology Team'] as sponsors_leads,
    ARRAY['Operations Manager'] as reporting_owners,
    
    -- Progress updates
    'Operational infrastructure development progressing according to plan. Platform deployment on schedule.' as progress_updates,
    'Successfully established operational foundation for platform deployment' as q1_2025_progress,
    'Implemented core automation systems with 95% operational efficiency' as q2_2025_progress,
    'Scaled platform operations to support increased workload demands' as q3_2025_progress

FROM strategic_programs sp
JOIN strategic_pillars spi ON sp.pillar_id = spi.id 
JOIN categories c ON sp.category_id = c.id 
JOIN strategic_goals sg ON sp.goal_id = sg.id 
ORDER BY spi.name, c.name, sg.text, sp.id;

-- Add final comment
COMMENT ON TABLE functional_programs IS 'Functional programs table mirroring complete strategic_programs hierarchy with operational/infrastructure focus';