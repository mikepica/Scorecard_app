-- Link functional_programs to functional_strategic_goals
-- This script updates the functional_goal_id foreign key based on matching strategic_goal text

-- Update functional_programs to link to functional_strategic_goals
UPDATE functional_programs fp
SET functional_goal_id = fsg.id
FROM functional_strategic_goals fsg
WHERE fp.strategic_goal = fsg.text;

-- Show results
SELECT
    COUNT(*) as total_programs,
    COUNT(functional_goal_id) as linked_programs,
    COUNT(*) - COUNT(functional_goal_id) as unlinked_programs
FROM functional_programs;

-- Show breakdown by goal
SELECT
    fsg.id,
    fsg.text as goal_text,
    COUNT(fp.id) as program_count
FROM functional_strategic_goals fsg
LEFT JOIN functional_programs fp ON fp.functional_goal_id = fsg.id
GROUP BY fsg.id, fsg.text
ORDER BY fsg.id;
