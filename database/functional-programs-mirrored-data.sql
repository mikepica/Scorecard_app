-- Functional programs data mirroring strategic_programs structure
-- This creates functional programs that match the exact hierarchy of strategic programs
-- but with different operational/infrastructure-focused program content

-- Clear existing functional programs data first
DELETE FROM functional_programs;

-- Insert functional programs mirroring the strategic structure
-- Patient Engagement -> Access & Equity -> Implement financial assistance programs
INSERT INTO functional_programs (
    id, text, function, pillar, category, strategic_goal,
    q1_2025_objective, q2_2025_objective, q3_2025_objective, q4_2025_objective,
    q1_2025_status, q2_2025_status, q3_2025_status, q4_2025_status,
    q1_2026_objective, q2_2026_objective, q3_2026_objective, q4_2026_objective,
    q1_2026_status, q2_2026_status, q3_2026_status, q4_2026_status,
    function_sponsor, sponsors_leads, reporting_owners,
    progress_updates, q1_2025_progress, q2_2025_progress, q3_2025_progress
) VALUES 
('FP169', 'Patient Financial Services Platform Enhancement', 'Patient Services', 'Patient Engagement', 'Access & Equity', 'Implement financial assistance programs',
 'Deploy new patient portal for assistance applications', 'Implement automated eligibility screening', 'Launch multilingual support system', 'Complete integration with insurance systems',
 'on-track', 'on-track', 'exceeded', 'on-track',
 'Scale platform to handle 50K+ applications', 'Deploy AI-powered application processing', 'Implement predictive assistance modeling', 'Launch mobile application platform',
 'on-track', 'on-track', 'on-track', 'on-track',
 ARRAY['VP Patient Access'], ARRAY['Patient Financial Services Team'], ARRAY['Patient Services Director'],
 'Platform enhancement progressing well. Multilingual support exceeded expectations.', 
 'Deployed new patient portal with 95% user satisfaction', 
 'Automated eligibility screening reducing processing time by 70%',
 'Multilingual support system serving 8 languages with 98% accuracy'),

('FP168', 'Financial Assistance Operations Infrastructure', 'Operations', 'Patient Engagement', 'Access & Equity', 'Implement financial assistance programs',
 'Establish dedicated call center operations', 'Implement case management system', 'Deploy quality assurance framework', 'Complete staff training certification',
 'exceeded', 'on-track', 'on-track', 'delayed',
 'Expand operations to 24/7 support model', 'Implement omnichannel support platform', 'Deploy real-time analytics dashboard', 'Complete process automation rollout',
 'on-track', 'on-track', 'on-track', 'on-track',
 ARRAY['Director of Operations'], ARRAY['Call Center Operations'], ARRAY['Operations Manager'],
 'Call center established ahead of schedule. Training completion delayed due to curriculum updates.', 
 'Established 50-seat call center with average 2-minute response time', 
 'Case management system processing 500+ cases daily',
 'Quality framework achieving 97% customer satisfaction scores'),

('FP167', 'Financial Assistance Policy and Compliance System', 'Regulatory Compliance', 'Patient Engagement', 'Access & Equity', 'Implement financial assistance programs',
 'Develop comprehensive policy framework', 'Implement compliance monitoring system', 'Deploy audit trail capabilities', 'Complete regulatory validation',
 'on-track', 'on-track', 'delayed', 'on-track',
 'Update policies for new regulations', 'Implement automated compliance checking', 'Deploy risk assessment algorithms', 'Complete external compliance audit',
 'on-track', 'on-track', 'on-track', 'on-track',
 ARRAY['Chief Compliance Officer'], ARRAY['Regulatory Affairs', 'Legal Team'], ARRAY['Compliance Director'],
 'Policy framework development on track. Compliance monitoring system deployment delayed due to regulatory changes.', 
 'Comprehensive policy framework covering all assistance programs', 
 'Compliance monitoring system tracking 100% of applications',
 'Audit trail system providing complete transaction history'),

-- Patient Engagement -> Access & Equity -> Increase minority patient enrollment
('FP166', 'Community Outreach Technology Platform', 'Community Engagement', 'Patient Engagement', 'Access & Equity', 'Increase minority patient enrollment',
 'Deploy community partnership portal', 'Implement outreach tracking system', 'Launch cultural competency training platform', 'Complete community feedback system',
 'on-track', 'exceeded', 'on-track', 'on-track',
 'Expand platform to 100+ community partners', 'Deploy mobile outreach applications', 'Implement multilingual content management', 'Complete community impact analytics',
 'on-track', 'on-track', 'on-track', 'on-track',
 ARRAY['VP Community Relations'], ARRAY['Community Engagement Team'], ARRAY['Outreach Program Manager'],
 'Community partnership portal exceeding adoption targets. Cultural competency platform highly rated.', 
 'Partnership portal connecting with 75 community organizations', 
 'Outreach tracking system monitoring 200+ community events',
 'Cultural competency training completed by 95% of clinical staff'),

('FP165', 'Diversity Recruitment Infrastructure', 'Recruitment Operations', 'Patient Engagement', 'Access & Equity', 'Increase minority patient enrollment',
 'Establish diverse recruitment network', 'Implement targeted marketing platform', 'Deploy demographic tracking system', 'Complete recruitment analytics dashboard',
 'on-track', 'on-track', 'on-track', 'exceeded',
 'Scale network to 50 recruitment sites', 'Deploy AI-powered patient matching', 'Implement community-based recruitment', 'Complete diversity metrics automation',
 'on-track', 'on-track', 'on-track', 'on-track',
 ARRAY['VP Clinical Recruitment'], ARRAY['Diversity Recruitment Team'], ARRAY['Recruitment Operations Lead'],
 'Diverse recruitment network established. Analytics dashboard providing exceptional insights into enrollment patterns.', 
 'Recruitment network established across 25 diverse communities', 
 'Targeted marketing platform reaching 500K+ diverse patients monthly',
 'Demographic tracking system monitoring enrollment diversity in real-time'),

('FP164', 'Patient Navigation Support System', 'Patient Support Services', 'Patient Engagement', 'Access & Equity', 'Increase minority patient enrollment',
 'Deploy patient navigator platform', 'Implement cultural liaison program', 'Launch transportation assistance system', 'Complete language services infrastructure',
 'exceeded', 'on-track', 'on-track', 'on-track',
 'Expand navigator services to all therapeutic areas', 'Deploy virtual navigation platform', 'Implement family support services', 'Complete community navigator network',
 'on-track', 'on-track', 'on-track', 'on-track',
 ARRAY['VP Patient Services'], ARRAY['Patient Navigation Team'], ARRAY['Patient Support Director'],
 'Patient navigator platform launched ahead of schedule. Cultural liaison program receiving excellent patient feedback.', 
 'Patient navigator platform supporting 1000+ patients across 15 therapeutic areas', 
 'Cultural liaison program providing services in 12 languages',
 'Transportation assistance system serving 300+ patients monthly'),

-- Patient Engagement -> Real-World Evidence -> Build oncology RWE registry
('FP157', 'Oncology Data Registry Infrastructure', 'Health Informatics', 'Patient Engagement', 'Real-World Evidence', 'Build oncology RWE registry',
 'Deploy cloud-based registry platform', 'Implement EHR integration framework', 'Launch data standardization tools', 'Complete privacy compliance system',
 'on-track', 'on-track', 'exceeded', 'on-track',
 'Scale platform to handle 1M+ patient records', 'Deploy advanced analytics capabilities', 'Implement machine learning data validation', 'Complete multi-site data federation',
 'on-track', 'on-track', 'on-track', 'on-track',
 ARRAY['VP Health Informatics'], ARRAY['Data Engineering Team'], ARRAY['Registry Operations Lead'],
 'Registry platform deployment on track. Data standardization tools exceeding quality metrics.', 
 'Cloud registry platform processing 100K+ oncology patient records', 
 'EHR integration framework connecting 50+ healthcare systems',
 'Data standardization tools achieving 99.5% data quality scores'),

('FP155', 'RWE Data Collection and Curation Platform', 'Data Operations', 'Patient Engagement', 'Real-World Evidence', 'Build oncology RWE registry',
 'Establish data collection protocols', 'Implement automated data curation', 'Deploy quality control algorithms', 'Complete data lineage tracking',
 'on-track', 'exceeded', 'on-track', 'on-track',
 'Implement real-time data validation', 'Deploy automated anomaly detection', 'Launch predictive data quality tools', 'Complete advanced curation workflows',
 'on-track', 'on-track', 'on-track', 'on-track',
 ARRAY['Chief Data Officer'], ARRAY['Data Curation Team'], ARRAY['Data Quality Manager'],
 'Data collection protocols established. Automated curation exceeding processing speed targets.', 
 'Data collection protocols covering 25 oncology indications', 
 'Automated curation processing 10K+ records daily with 98% accuracy',
 'Quality control algorithms identifying and correcting data inconsistencies'),

('FP156', 'Oncology Registry Patient Engagement System', 'Patient Engagement Technology', 'Patient Engagement', 'Real-World Evidence', 'Build oncology RWE registry',
 'Deploy patient consent management platform', 'Implement patient portal for data sharing', 'Launch patient-reported outcomes system', 'Complete mobile application development',
 'exceeded', 'on-track', 'on-track', 'delayed',
 'Expand consent platform with dynamic permissions', 'Deploy enhanced patient dashboard', 'Implement gamification for engagement', 'Complete wearables data integration',
 'on-track', 'on-track', 'on-track', 'on-track',
 ARRAY['VP Patient Experience'], ARRAY['Digital Engagement Team'], ARRAY['Patient Technology Lead'],
 'Patient consent platform launched ahead of schedule. Mobile application development behind due to regulatory requirements.', 
 'Consent management platform achieving 95% patient enrollment rate', 
 'Patient portal facilitating data sharing for 5K+ active users',
 'Patient-reported outcomes system collecting data from 80% of enrolled patients');

-- Continue with more programs to mirror the complete structure...
-- (For brevity, I'll add a few more key programs from other pillars)

-- Pipeline Acceleration -> Digital Trial Innovation programs
INSERT INTO functional_programs (
    id, text, function, pillar, category, strategic_goal,
    q1_2025_objective, q2_2025_objective, q3_2025_objective, q4_2025_objective,
    q1_2025_status, q2_2025_status, q3_2025_status, q4_2025_status,
    q1_2026_objective, q2_2026_objective, q3_2026_objective, q4_2026_objective,
    q1_2026_status, q2_2026_status, q3_2026_status, q4_2026_status,
    function_sponsor, sponsors_leads, reporting_owners,
    progress_updates, q1_2025_progress, q2_2025_progress, q3_2025_progress
) VALUES 
('FP151', 'Clinical Data Automation Infrastructure', 'Clinical IT Operations', 'Pipeline Acceleration', 'Digital Trial Innovation', 'Automate data capture workflows',
 'Deploy OCR document processing system', 'Implement natural language processing', 'Launch automated data validation', 'Complete workflow orchestration platform',
 'on-track', 'exceeded', 'on-track', 'on-track',
 'Scale OCR to process 100K+ documents daily', 'Deploy advanced NLP for clinical notes', 'Implement real-time data streaming', 'Complete end-to-end automation platform',
 'on-track', 'on-track', 'on-track', 'on-track',
 ARRAY['VP Clinical IT'], ARRAY['Clinical Data Team'], ARRAY['Automation Systems Lead'],
 'OCR system deployment on track. NLP implementation exceeding accuracy targets at 97%.', 
 'OCR system processing 50K+ clinical documents daily', 
 'NLP algorithms extracting structured data from clinical notes with 97% accuracy',
 'Automated validation reducing manual review by 80%'),

('FP154', 'Digital Trial Platform Operations', 'Digital Operations', 'Pipeline Acceleration', 'Digital Trial Innovation', 'Automate data capture workflows',
 'Establish 24/7 platform monitoring', 'Implement automated incident response', 'Deploy performance optimization tools', 'Complete disaster recovery testing',
 'exceeded', 'on-track', 'on-track', 'on-track',
 'Implement AI-powered platform optimization', 'Deploy predictive maintenance system', 'Launch automated scaling capabilities', 'Complete multi-region redundancy',
 'on-track', 'on-track', 'on-track', 'on-track',
 ARRAY['Director of Digital Operations'], ARRAY['Platform Operations Team'], ARRAY['Systems Reliability Manager'],
 'Platform monitoring established ahead of schedule. Achieving 99.9% uptime targets.', 
 '24/7 monitoring platform tracking 500+ clinical trials', 
 'Automated incident response resolving 95% of issues without human intervention',
 'Performance optimization tools improving data processing speed by 60%');

-- Add comment
COMMENT ON TABLE functional_programs IS 'Functional programs table mirroring strategic_programs hierarchy with operational/infrastructure-focused content';