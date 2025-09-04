-- Updated sample functional programs data with 2025/2026 objectives
-- This data provides examples of functional programs with quarterly objectives for 2025 and 2026
-- Run this after applying the updated functional_programs table structure

-- Clear existing functional programs data first
DELETE FROM functional_programs;

-- Insert updated functional programs with 2025/2026 objectives
INSERT INTO functional_programs (
    id, text, function, pillar, category, strategic_goal,
    q1_objective, q2_objective, q3_objective, q4_objective,
    q1_status, q2_status, q3_status, q4_status,
    q1_2025_objective, q2_2025_objective, q3_2025_objective, q4_2025_objective,
    q1_2025_status, q2_2025_status, q3_2025_status, q4_2025_status,
    q1_2026_objective, q2_2026_objective, q3_2026_objective, q4_2026_objective,
    q1_2026_status, q2_2026_status, q3_2026_status, q4_2026_status,
    function_sponsor, sponsors_leads, reporting_owners,
    progress_updates, q1_2025_progress, q2_2025_progress, q3_2025_progress
) VALUES 
-- IT Operations programs
('FP001', 'Laboratory Information Management System Enhancement', 'IT Operations', 'Precision Medicine Infrastructure', 'Biomarker Discovery Operations', 'Laboratory Systems Modernization',
 'Deploy LIMS v3.0 infrastructure', 'Integrate barcode tracking system', 'Implement quality control dashboards', 'Complete user training programs',
 'on-track', 'on-track', 'delayed', 'on-track',
 'Upgrade LIMS to v4.0 with enhanced features', 'Deploy automated sample tracking', 'Implement advanced analytics dashboard', 'Complete system validation and certification',
 'on-track', 'on-track', 'on-track', 'on-track',
 'Plan LIMS v5.0 architecture', 'Implement AI-powered quality control', 'Deploy predictive maintenance systems', 'Complete full system modernization',
 'on-track', 'on-track', 'on-track', 'on-track',
 ARRAY['Dr. Sarah Chen', 'Dr. Michael Roberts'], ARRAY['IT Operations Team'], ARRAY['Lab Systems Manager'],
 'Infrastructure deployment on schedule. LIMS v4.0 planning underway.', 
 'Successfully deployed core LIMS infrastructure to 3 primary labs', 
 'Completed barcode integration and staff training across all sites',
 'Deployed quality control dashboards with real-time monitoring capabilities'),

('FP002', 'Biomarker Data Infrastructure Platform', 'Data Engineering', 'Precision Medicine Infrastructure', 'Biomarker Discovery Operations', 'Data Platform Modernization',
 'Establish cloud data lake architecture', 'Migrate legacy biomarker databases', 'Implement real-time analytics', 'Deploy machine learning pipelines',
 'exceeded', 'on-track', 'on-track', 'delayed',
 'Expand data lake capacity by 200%', 'Implement multi-region replication', 'Deploy advanced ML model registry', 'Complete data governance framework',
 'on-track', 'exceeded', 'on-track', 'on-track',
 'Implement next-gen data mesh architecture', 'Deploy federated learning platform', 'Complete data democratization initiative', 'Launch self-service analytics platform',
 'on-track', 'on-track', 'on-track', 'on-track',
 ARRAY['Chief Data Officer'], ARRAY['Data Engineering Team', 'Cloud Architecture'], ARRAY['Platform Operations Lead'],
 'Data migration completed ahead of schedule. ML pipeline deployment behind due to regulatory requirements.', 
 'Migrated 15TB of historical biomarker data to cloud platform', 
 'Implemented real-time processing for 12 biomarker types',
 'Completed machine learning pipeline deployment for 8 biomarker types'),

-- Manufacturing Operations programs
('FP003', 'Kinase Inhibitor Manufacturing Scale-Up', 'Manufacturing Operations', 'Precision Medicine Infrastructure', 'Targeted Therapies Production', 'Manufacturing Process Optimization',
 'Establish pilot manufacturing line', 'Validate process parameters', 'Complete facility qualification', 'Achieve commercial production',
 'exceeded', 'on-track', 'on-track', 'delayed',
 'Scale production capacity to 500kg annually', 'Implement continuous manufacturing', 'Deploy automated quality systems', 'Complete regulatory validation',
 'on-track', 'on-track', 'delayed', 'on-track',
 'Expand to multi-product facility', 'Implement Industry 4.0 technologies', 'Deploy predictive quality systems', 'Achieve zero-waste manufacturing',
 'on-track', 'on-track', 'on-track', 'on-track',
 ARRAY['VP Manufacturing'], ARRAY['Process Engineering', 'Quality Assurance'], ARRAY['Manufacturing Operations Lead'],
 'Pilot line established ahead of schedule. Commercial production delayed due to equipment validation.', 
 'Completed pilot manufacturing line installation with 95% efficiency', 
 'Validated all critical process parameters within specification',
 'Facility qualification completed, awaiting final regulatory approval'),

-- Clinical Operations programs
('FP004', 'Clinical Trial Management System Upgrade', 'Clinical Operations', 'Pipeline Acceleration Infrastructure', 'Clinical Development Operations', 'Trial Management Technology Enhancement',
 'Deploy CTMS v2.0 platform', 'Migrate historical trial data', 'Implement workflow automation', 'Complete user training',
 'on-track', 'on-track', 'exceeded', 'on-track',
 'Integrate AI-powered patient matching', 'Deploy real-time trial dashboards', 'Implement predictive enrollment models', 'Complete mobile app for investigators',
 'exceeded', 'on-track', 'on-track', 'delayed',
 'Launch next-gen CTMS v3.0 platform', 'Implement blockchain for trial integrity', 'Deploy virtual trial coordination', 'Complete global platform rollout',
 'on-track', 'on-track', 'on-track', 'on-track',
 ARRAY['VP Clinical Operations'], ARRAY['Clinical IT'], ARRAY['Clinical Operations Lead'],
 'CTMS upgrade on schedule. AI patient matching exceeding enrollment targets by 40%.', 
 'Successfully migrated 150 historical trials to new platform', 
 'Implemented automated workflow routing for all study types',
 'Patient portal integration completed with 85% user adoption rate'),

-- Digital Health Technology programs
('FP005', 'Decentralized Trial Technology Platform', 'Digital Health Technology', 'Pipeline Acceleration Infrastructure', 'Digital Trial Innovation', 'Decentralized Clinical Trial Platform Development',
 'Deploy patient-facing mobile app', 'Implement remote monitoring systems', 'Build telemedicine infrastructure', 'Complete data integration',
 'on-track', 'exceeded', 'on-track', 'delayed',
 'Launch advanced patient engagement platform', 'Deploy wearables integration suite', 'Implement virtual site capabilities', 'Complete regulatory compliance framework',
 'on-track', 'on-track', 'exceeded', 'on-track',
 'Deploy AI-powered patient support', 'Implement virtual reality for patient education', 'Launch global DCT network', 'Complete next-gen platform migration',
 'on-track', 'on-track', 'on-track', 'on-track',
 ARRAY['VP Digital Trials'], ARRAY['Digital Health Technology'], ARRAY['DCT Operations Lead'],
 'Mobile app deployment successful. Telemedicine integration behind schedule due to regulatory requirements.', 
 'Launched patient mobile app with 90% user satisfaction rating', 
 'Deployed remote monitoring systems across 25 trial sites',
 'Telemedicine infrastructure operational for 15 therapeutic areas');

-- Add final comment
COMMENT ON TABLE functional_programs IS 'Updated functional programs table with 2025/2026 quarterly objectives and renamed personnel fields';