-- Sample functional programs data
-- This data provides examples of functional programs that are different from the ORD strategic programs
-- These programs focus on infrastructure, operations, and support functions rather than direct research
-- Run this after creating the functional_programs table

-- Clear existing functional programs data first
DELETE FROM functional_programs;

-- Insert functional programs for Precision Medicine pillar
-- These focus on infrastructure and operational support rather than direct research

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
-- Biomarker Discovery operational support programs
('FP001', 'Laboratory Information Management System Enhancement', 'IT Operations', 'Precision Medicine Infrastructure', 'Biomarker Discovery Operations', 'Laboratory Systems Modernization',
 'Deploy LIMS v3.0 infrastructure', 'Integrate barcode tracking system', 'Implement quality control dashboards', 'Complete user training programs',
 'on-track', 'on-track', 'delayed', 'on-track',
 'Upgrade LIMS to v4.0 with enhanced features', 'Deploy automated sample tracking', 'Implement advanced analytics dashboard', 'Complete system validation and certification',
 'on-track', 'on-track', 'on-track', 'on-track',
 'Plan LIMS v5.0 architecture', 'Implement AI-powered quality control', 'Deploy predictive maintenance systems', 'Complete full system modernization',
 'pending', 'pending', 'pending', 'pending',
 ARRAY['Dr. Sarah Chen', 'Dr. Michael Roberts'], ARRAY['IT Operations Team'], ARRAY['Lab Systems Manager'],
 'Infrastructure deployment on schedule. Minor delays in Q3 due to hardware procurement.', 
 'Successfully deployed core LIMS infrastructure to 3 primary labs', 
 'Completed barcode integration and staff training across all sites',
 'Deployed quality control dashboards with real-time monitoring capabilities'),

('FP002', 'Biomarker Data Infrastructure Platform', 'Data Engineering', 'Precision Medicine Infrastructure', 'Biomarker Discovery Operations', 'Data Platform Modernization',
 'Establish cloud data lake architecture', 'Migrate legacy biomarker databases', 'Implement real-time analytics', 'Deploy machine learning pipelines',
 'exceeded', 'on-track', 'on-track', 'delayed',
 ARRAY['Chief Data Officer'], ARRAY['Data Engineering Team', 'Cloud Architecture'], ARRAY['Platform Operations Lead'],
 'Data migration completed ahead of schedule. ML pipeline deployment behind due to regulatory requirements.', 
 'Migrated 15TB of historical biomarker data to cloud platform', 
 'Implemented real-time processing for 12 biomarker types',
 'Completed machine learning pipeline deployment for 8 biomarker types'),

('FP003', 'Single Cell Analytics Infrastructure', 'High Performance Computing', 'Precision Medicine Infrastructure', 'Biomarker Discovery Operations', 'Analytics Infrastructure Enhancement',
 'Procure high-performance computing cluster', 'Deploy single cell workflow orchestration', 'Implement data visualization tools', 'Complete performance optimization',
 'on-track', 'exceeded', 'on-track', 'on-track',
 ARRAY['VP Research Operations'], ARRAY['HPC Team'], ARRAY['Scientific Computing Lead'],
 'HPC cluster procurement completed. Workflow deployment exceeded performance targets.', 
 'Installed 512-core HPC cluster with 2TB RAM', 
 'Deployed automated single cell analysis workflows',
 'Implemented GPU acceleration achieving 3x performance improvement'),

('FP004', 'Advanced Analytics Compute Platform', 'Cloud Infrastructure', 'Precision Medicine Infrastructure', 'Biomarker Discovery Operations', 'Compute Platform Scaling',
 'Design scalable compute architecture', 'Implement container orchestration', 'Deploy monitoring and alerting', 'Complete disaster recovery setup',
 'on-track', 'on-track', 'delayed', 'missed',
 ARRAY['CTO'], ARRAY['DevOps Team', 'Platform Engineering'], ARRAY['Infrastructure Director'],
 'Container platform deployed successfully. DR setup delayed due to compliance requirements.', 
 'Completed Docker container migration for 80% of analytics workloads', 
 'Implemented Kubernetes orchestration with 99.9% uptime',
 'Completed Kubernetes migration with 99.95% uptime target achieved'),

-- Targeted Therapies manufacturing and supply chain programs
('FP005', 'Kinase Inhibitor Manufacturing Scale-Up', 'Manufacturing Operations', 'Precision Medicine Infrastructure', 'Targeted Therapies Production', 'Manufacturing Process Optimization',
 'Establish pilot manufacturing line', 'Validate process parameters', 'Complete facility qualification', 'Achieve commercial production',
 'exceeded', 'on-track', 'on-track', 'delayed',
 ARRAY['VP Manufacturing'], ARRAY['Process Engineering', 'Quality Assurance'], ARRAY['Manufacturing Operations Lead'],
 'Pilot line established ahead of schedule. Commercial production delayed due to equipment validation.', 
 'Completed pilot manufacturing line installation with 95% efficiency', 
 'Validated all critical process parameters within specification',
 'Facility qualification completed, awaiting final regulatory approval'),

('FP006', 'Bispecific Antibody Production Platform', 'Biologics Manufacturing', 'Precision Medicine Infrastructure', 'Targeted Therapies Production', 'Biomanufacturing Technology Platform',
 'Install bioreactor systems', 'Qualify purification processes', 'Implement quality control systems', 'Complete technology transfer',
 'on-track', 'delayed', 'on-track', 'on-track',
 ARRAY['Head of Biologics'], ARRAY['Bioprocess Engineering'], ARRAY['Manufacturing Sciences Lead'],
 'Bioreactor installation on track. Purification process qualification delayed by 3 weeks.', 
 'Installed 500L and 1000L bioreactor systems', 
 'Completed downstream purification process development',
 'Completed process analytical technology implementation'),

('FP007', 'AI-Driven Target Selection Platform', 'Artificial Intelligence', 'Precision Medicine Infrastructure', 'Targeted Therapies Production', 'Target Discovery Automation',
 'Deploy machine learning infrastructure', 'Integrate multi-omics databases', 'Implement prediction algorithms', 'Validate target scoring system',
 'on-track', 'on-track', 'exceeded', 'on-track',
 ARRAY['Chief AI Officer'], ARRAY['Data Science Team', 'Computational Biology'], ARRAY['AI Platform Lead'],
 'ML infrastructure deployed successfully. Prediction algorithms exceeding accuracy targets.', 
 'Deployed GPU cluster for protein folding predictions', 
 'Integrated 15 multi-omics datasets into unified platform',
 'Deployed automated screening platform processing 1000+ compounds daily'),

-- Companion Diagnostics regulatory and commercial programs
('FP008', 'CDx Regulatory Affairs Infrastructure', 'Regulatory Operations', 'Precision Medicine Infrastructure', 'Companion Diagnostics Operations', 'Regulatory Systems Integration',
 'Establish regulatory database system', 'Implement submission tracking', 'Deploy document management', 'Complete staff training',
 'exceeded', 'on-track', 'on-track', 'on-track',
 ARRAY['VP Regulatory Affairs'], ARRAY['Regulatory Operations'], ARRAY['Regulatory Affairs Director'],
 'Regulatory database deployed ahead of schedule. All submission tracking systems operational.', 
 'Deployed comprehensive regulatory database with 99.5% uptime', 
 'Completed submission tracking for 25 active CDx programs',
 'Implemented mobile access for regulatory team with secure authentication'),

('FP009', 'NGS Panel Manufacturing Operations', 'Diagnostics Manufacturing', 'Precision Medicine Infrastructure', 'Companion Diagnostics Operations', 'NGS Manufacturing Excellence',
 'Establish clean room facilities', 'Validate assay manufacturing process', 'Implement quality management system', 'Complete FDA pre-submission',
 'on-track', 'delayed', 'on-track', 'missed',
 ARRAY['VP Diagnostics Manufacturing'], ARRAY['Manufacturing Engineering'], ARRAY['Quality Systems Lead'],
 'Clean room facilities operational. Manufacturing process validation delayed due to reagent supply issues.', 
 'Completed 10,000 sq ft clean room facility qualification', 
 'Validated NGS panel manufacturing for research use only',
 'Quality management system fully operational across all manufacturing'),

-- Pipeline Acceleration operations and infrastructure programs
('FP010', 'Clinical Trial Management System Upgrade', 'Clinical Operations', 'Pipeline Acceleration Infrastructure', 'Clinical Development Operations', 'Trial Management Technology Enhancement',
 'Deploy CTMS v2.0 platform', 'Migrate historical trial data', 'Implement workflow automation', 'Complete user training',
 'on-track', 'on-track', 'exceeded', 'on-track',
 ARRAY['VP Clinical Operations'], ARRAY['Clinical IT'], ARRAY['Clinical Operations Lead'],
 'CTMS upgrade on schedule. Workflow automation exceeding efficiency targets by 30%.', 
 'Successfully migrated 150 historical trials to new platform', 
 'Implemented automated workflow routing for all study types',
 'Patient portal integration completed with 85% user adoption rate'),

('FP011', 'Adaptive Trial Design Platform', 'Biostatistics', 'Pipeline Acceleration Infrastructure', 'Clinical Development Operations', 'Statistical Computing Platform Development',
 'Deploy statistical computing platform', 'Implement simulation engines', 'Build decision support tools', 'Complete validation studies',
 'delayed', 'on-track', 'on-track', 'delayed',
 ARRAY['Chief Statistician'], ARRAY['Biostatistics', 'Clinical Data Science'], ARRAY['Statistical Computing Lead'],
 'Platform deployment delayed due to software licensing issues. Simulation engines performing well.', 
 'Completed statistical computing platform installation', 
 'Deployed Monte Carlo simulation engines for 5 trial designs',
 'Decision support tools deployed for 3 ongoing adaptive trials'),

('FP012', 'First-in-Human Trial Network Infrastructure', 'Site Operations', 'Pipeline Acceleration Infrastructure', 'Clinical Development Operations', 'Early Phase Trial Network Expansion',
 'Establish site qualification system', 'Implement investigator portal', 'Deploy safety monitoring dashboard', 'Complete network certification',
 'on-track', 'exceeded', 'on-track', 'on-track',
 ARRAY['VP Early Development'], ARRAY['Site Management'], ARRAY['Clinical Operations Director'],
 'Site qualification system operational. Investigator portal adoption exceeding targets.', 
 'Qualified 15 new phase I sites across US and EU', 
 'Deployed real-time safety monitoring dashboard',
 'Centralized monitoring implemented across 80% of active sites'),

-- Regulatory Affairs programs
('FP013', 'Global Regulatory Harmonization Platform', 'Regulatory Operations', 'Pipeline Acceleration Infrastructure', 'Regulatory Affairs Operations', 'Global Submission Process Optimization',
 'Map global regulatory requirements', 'Implement submission templates', 'Deploy regulatory intelligence system', 'Complete cross-regional training',
 'on-track', 'on-track', 'exceeded', 'on-track',
 ARRAY['VP Global Regulatory'], ARRAY['Regulatory Affairs'], ARRAY['Global Regulatory Lead'],
 'Regulatory harmonization platform operational. Intelligence system exceeding expectations.', 
 'Completed regulatory requirement mapping for 15 countries', 
 'Deployed standardized submission templates across all regions',
 'Regulatory intelligence system processing 500+ regulatory updates daily'),

('FP014', 'Agency Engagement Management System', 'Regulatory Relations', 'Pipeline Acceleration Infrastructure', 'Regulatory Affairs Operations', 'Agency Communication Platform Development',
 'Deploy CRM for regulatory contacts', 'Implement meeting tracking system', 'Build regulatory calendar', 'Complete communication protocols',
 'exceeded', 'on-track', 'delayed', 'on-track',
 ARRAY['Head of Regulatory Strategy'], ARRAY['Regulatory Operations'], ARRAY['Agency Relations Lead'],
 'CRM system deployed ahead of schedule. Communication protocols established across all agencies.', 
 'Implemented regulatory CRM managing 200+ agency contacts', 
 'Deployed meeting tracking system with automated follow-up',
 'Regulatory calendar integrated with corporate planning systems'),

('FP015', 'CMC Readiness Infrastructure', 'Quality Operations', 'Pipeline Acceleration Infrastructure', 'Regulatory Affairs Operations', 'Chemistry Manufacturing Controls Systems Enhancement',
 'Establish CMC data repository', 'Implement batch record systems', 'Deploy quality control dashboards', 'Complete regulatory submission modules',
 'on-track', 'delayed', 'on-track', 'exceeded',
 ARRAY['VP CMC'], ARRAY['Quality Control', 'Manufacturing Sciences'], ARRAY['CMC Operations Lead'],
 'CMC data repository operational. Quality dashboards exceeding compliance requirements.', 
 'Deployed comprehensive CMC data repository with version control', 
 'Implemented digital batch record systems across 5 facilities',
 'Quality control dashboards providing real-time compliance monitoring'),

-- Digital Trial Innovation programs  
('FP016', 'Decentralized Trial Technology Platform', 'Digital Health Technology', 'Pipeline Acceleration Infrastructure', 'Digital Trial Innovation', 'Decentralized Clinical Trial Platform Development',
 'Deploy patient-facing mobile app', 'Implement remote monitoring systems', 'Build telemedicine infrastructure', 'Complete data integration',
 'on-track', 'exceeded', 'on-track', 'delayed',
 ARRAY['VP Digital Trials'], ARRAY['Digital Health Technology'], ARRAY['DCT Operations Lead'],
 'Mobile app deployment successful. Telemedicine integration behind schedule due to regulatory requirements.', 
 'Launched patient mobile app with 90% user satisfaction rating', 
 'Deployed remote monitoring systems across 25 trial sites',
 'Telemedicine infrastructure operational for 15 therapeutic areas'),

('FP017', 'Wearables Safety Monitoring Infrastructure', 'Digital Biomarkers', 'Pipeline Acceleration Infrastructure', 'Digital Trial Innovation', 'Remote Patient Monitoring Technology Implementation',
 'Integrate wearable device platforms', 'Implement real-time data streaming', 'Deploy safety alert systems', 'Complete regulatory validation',
 'delayed', 'on-track', 'exceeded', 'on-track',
 ARRAY['Chief Medical Officer'], ARRAY['Digital Biomarkers'], ARRAY['Safety Technology Lead'],
 'Wearable integration delayed initially but safety systems exceeding performance targets.', 
 'Integrated 5 wearable device platforms with clinical systems', 
 'Deployed real-time data streaming processing 1M+ data points daily',
 'Safety alert systems achieving 99.9% uptime with <30 second response time'),

('FP018', 'Data Capture Automation Platform', 'Clinical Data Science', 'Pipeline Acceleration Infrastructure', 'Digital Trial Innovation', 'Automated Data Collection Technology Deployment',
 'Deploy automated data extraction', 'Implement OCR and NLP systems', 'Build quality control algorithms', 'Complete validation studies',
 'exceeded', 'on-track', 'on-track', 'on-track',
 ARRAY['VP Clinical Data'], ARRAY['Data Science', 'Clinical Operations'], ARRAY['Clinical Data Lead'],
 'Automation platform exceeding accuracy targets. Quality algorithms performing above expectations.', 
 'Deployed OCR systems achieving 98.5% accuracy on clinical documents', 
 'Implemented NLP for automated adverse event extraction',
 'Quality control algorithms reducing manual review by 70%');

-- Patient Engagement programs
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
-- Real-World Evidence programs
('FP019', 'Oncology RWE Registry Infrastructure', 'Health Informatics', 'Patient Engagement Infrastructure', 'Real-World Evidence Operations', 'Registry Platform Development',
 'Deploy EHR integration platform', 'Implement patient consent systems', 'Build data standardization tools', 'Complete privacy compliance',
 'on-track', 'on-track', 'exceeded', 'delayed',
 ARRAY['VP Real-World Evidence'], ARRAY['Health Informatics'], ARRAY['RWE Operations Lead'],
 'EHR integration successful. Data standardization tools exceeding quality metrics.', 
 'Integrated EHR data from 50 oncology centers', 
 'Implemented patient consent management system with 95% enrollment rate',
 'Data standardization tools processing 10K+ patient records daily'),

('FP020', 'Comparative Effectiveness Analytics Platform', 'Health Economics', 'Patient Engagement Infrastructure', 'Real-World Evidence Operations', 'Analytics Platform Development',
 'Build analytics infrastructure', 'Implement statistical models', 'Deploy visualization tools', 'Complete methodology validation',
 'exceeded', 'on-track', 'delayed', 'on-track',
 ARRAY['Chief Epidemiologist'], ARRAY['Biostatistics', 'Health Economics'], ARRAY['Analytics Platform Lead'],
 'Analytics infrastructure deployed ahead of schedule. Statistical models performing well.', 
 'Deployed cloud-based analytics platform with 100TB capacity', 
 'Implemented propensity score matching algorithms',
 'Statistical models validated for 8 therapeutic areas'),

('FP021', 'EHR Data Signal Detection System', 'Pharmacovigilance', 'Patient Engagement Infrastructure', 'Real-World Evidence Operations', 'Safety Signal Detection System Implementation',
 'Deploy machine learning algorithms', 'Implement safety signal detection', 'Build clinical decision support', 'Complete regulatory validation',
 'delayed', 'on-track', 'on-track', 'exceeded',
 ARRAY['VP Pharmacovigilance'], ARRAY['AI Safety'], ARRAY['Signal Detection Lead'],
 'ML algorithms deployment delayed but signal detection exceeding sensitivity targets.', 
 'Implemented ML algorithms for adverse event detection', 
 'Deployed safety signal detection across 25 therapeutic areas',
 'Clinical decision support tools integrated with physician workflow'),

-- Access & Equity programs
('FP022', 'Financial Assistance Program Platform', 'Patient Financial Services', 'Patient Engagement Infrastructure', 'Access & Equity Operations', 'Patient Access Program Technology Enhancement',
 'Build patient assistance portal', 'Implement eligibility screening', 'Deploy payment processing systems', 'Complete compliance framework',
 'on-track', 'exceeded', 'on-track', 'on-track',
 ARRAY['VP Patient Access'], ARRAY['Patient Financial Services'], ARRAY['Access Programs Lead'],
 'Patient portal deployment successful. Eligibility screening exceeding enrollment targets.', 
 'Launched patient assistance portal serving 10K+ patients', 
 'Implemented automated eligibility screening reducing processing time by 80%',
 'Payment processing systems handling $50M+ in assistance annually'),

('FP023', 'Minority Patient Enrollment Infrastructure', 'Community Engagement', 'Patient Engagement Infrastructure', 'Access & Equity Operations', 'Diversity & Inclusion Program Development',
 'Build community outreach platform', 'Implement cultural competency training', 'Deploy multilingual resources', 'Complete diversity metrics dashboard',
 'on-track', 'on-track', 'delayed', 'exceeded',
 ARRAY['VP Diversity & Inclusion'], ARRAY['Community Engagement'], ARRAY['Patient Diversity Lead'],
 'Community outreach successful. Diversity metrics dashboard exceeding reporting requirements.', 
 'Established partnerships with 30 community health centers', 
 'Completed cultural competency training for 500+ clinical staff',
 'Diversity metrics dashboard tracking enrollment across 15 demographic categories');

-- Set some example linked strategic program IDs (commented out since we don't have actual IDs)
-- UPDATE functional_programs SET linked_ord_strategic_program_id = 'strategic_program_id_here' WHERE id = 'FP001';

-- Add final comment
COMMENT ON TABLE functional_programs IS 'Contains functional programs focused on operational infrastructure, manufacturing, IT systems, and support functions - distinct from strategic research programs';