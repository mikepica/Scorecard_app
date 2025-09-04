import { Pool, PoolClient } from 'pg';
import { ScoreCardData, Pillar, Category, StrategicGoal, StrategicProgram } from '@/types/scorecard';

// Database connection pool
let pool: Pool | null = null;

export function getPool(): Pool {
  if (!pool) {
    pool = new Pool({
      connectionString: process.env.DATABASE_URL,
      max: 20,
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 2000,
    });
  }
  return pool;
}

// Database connection utility
export async function getDbConnection(): Promise<PoolClient> {
  const pool = getPool();
  return await pool.connect();
}

// Close database pool
export async function closeDbPool(): Promise<void> {
  if (pool) {
    await pool.end();
    pool = null;
  }
}

// Initialize database schema
export async function initializeDatabase(): Promise<void> {
  const client = await getDbConnection();
  try {
    // Check if tables exist
    const result = await client.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' AND table_name = 'strategic_pillars'
    `);
    
    if (result.rows.length === 0) {
      console.log('Database tables not found. Please run the schema.sql file first.');
      throw new Error('Database schema not initialized. Run database/schema.sql first.');
    }
    
    console.log('Database connection successful and schema exists.');
  } finally {
    client.release();
  }
}

// Test database connection
export async function testConnection(): Promise<boolean> {
  try {
    const client = await getDbConnection();
    const result = await client.query('SELECT NOW()');
    client.release();
    console.log('Database connection test successful:', result.rows[0]);
    return true;
  } catch (error) {
    console.error('Database connection test failed:', error);
    return false;
  }
}

// Database query functions for scorecard data
export class DatabaseService {
  
  // Get all scorecard data with hierarchical structure
  static async getScoreCardData(): Promise<ScoreCardData> {
    const client = await getDbConnection();
    
    try {
      // Get all data in parallel
      const [pillarsResult, categoriesResult, goalsResult, programsResult] = await Promise.all([
        client.query('SELECT * FROM strategic_pillars ORDER BY id'),
        client.query('SELECT * FROM categories ORDER BY pillar_id, name'),
        client.query('SELECT * FROM strategic_goals ORDER BY category_id, text'),
        client.query('SELECT * FROM strategic_programs ORDER BY goal_id, text')
      ]);

      // Convert to TypeScript objects
      const pillars: Pillar[] = pillarsResult.rows.map(row => ({
        id: row.id,
        name: row.name,
        categories: []
      }));

      const categories: Category[] = categoriesResult.rows.map(row => ({
        id: row.id,
        name: row.name,
        goals: [],
        strategicPillarId: row.pillar_id
      }));

      const goals: StrategicGoal[] = goalsResult.rows.map(row => ({
        id: row.id,
        text: row.text,
        comments: row.comments,
        
        // 2025 Objectives and Statuses
        q1_2025_objective: row.q1_2025_objective,
        q2_2025_objective: row.q2_2025_objective,
        q3_2025_objective: row.q3_2025_objective,
        q4_2025_objective: row.q4_2025_objective,
        q1_2025_status: row.q1_2025_status,
        q2_2025_status: row.q2_2025_status,
        q3_2025_status: row.q3_2025_status,
        q4_2025_status: row.q4_2025_status,
        
        // 2026 Objectives and Statuses
        q1_2026_objective: row.q1_2026_objective,
        q2_2026_objective: row.q2_2026_objective,
        q3_2026_objective: row.q3_2026_objective,
        q4_2026_objective: row.q4_2026_objective,
        q1_2026_status: row.q1_2026_status,
        q2_2026_status: row.q2_2026_status,
        q3_2026_status: row.q3_2026_status,
        q4_2026_status: row.q4_2026_status,
        
        ordLtSponsors: row.function_sponsor || ['(Not Specified)'],
        sponsorsLeads: row.sponsors_leads || ['(Not Specified)'],
        reportingOwners: row.reporting_owners || ['(Not Specified)'],
        progressUpdates: row.progress_updates,
        programs: [],
        categoryId: row.category_id,
        strategicPillarId: row.pillar_id
      }));

      const programs: StrategicProgram[] = programsResult.rows.map(row => ({
        id: row.id,
        text: row.text,
        
        // 2025 Objectives and Statuses
        q1_2025_objective: row.q1_2025_objective,
        q2_2025_objective: row.q2_2025_objective,
        q3_2025_objective: row.q3_2025_objective,
        q4_2025_objective: row.q4_2025_objective,
        q1_2025_status: row.q1_2025_status,
        q2_2025_status: row.q2_2025_status,
        q3_2025_status: row.q3_2025_status,
        q4_2025_status: row.q4_2025_status,
        
        // 2026 Objectives and Statuses
        q1_2026_objective: row.q1_2026_objective,
        q2_2026_objective: row.q2_2026_objective,
        q3_2026_objective: row.q3_2026_objective,
        q4_2026_objective: row.q4_2026_objective,
        q1_2026_status: row.q1_2026_status,
        q2_2026_status: row.q2_2026_status,
        q3_2026_status: row.q3_2026_status,
        q4_2026_status: row.q4_2026_status,
        
        ordLtSponsors: row.function_sponsor || ['(Not Specified)'],
        sponsorsLeads: row.sponsors_leads || ['(Not Specified)'],
        reportingOwners: row.reporting_owners || ['(Not Specified)'],
        progressUpdates: row.progress_updates,
        
        // Quarterly progress updates (2025-2026)
        q1_2025_progress: row.q1_2025_progress,
        q2_2025_progress: row.q2_2025_progress,
        q3_2025_progress: row.q3_2025_progress,
        q4_2025_progress: row.q4_2025_progress,
        q1_2026_progress: row.q1_2026_progress,
        q2_2026_progress: row.q2_2026_progress,
        q3_2026_progress: row.q3_2026_progress,
        q4_2026_progress: row.q4_2026_progress,
        
        updatedAt: row.updated_at,
        strategicGoalId: row.goal_id,
        categoryId: row.category_id,
        strategicPillarId: row.pillar_id
      }));

      // Build hierarchical structure
      const goalsMap = new Map<string, StrategicGoal>();
      goals.forEach(goal => {
        goal.programs = programs.filter(program => program.strategicGoalId === goal.id);
        goalsMap.set(goal.id, goal);
      });

      const categoriesMap = new Map<string, Category>();
      categories.forEach(category => {
        category.goals = goals.filter(goal => goal.categoryId === category.id);
        categoriesMap.set(category.id, category);
      });

      pillars.forEach(pillar => {
        pillar.categories = categories.filter(category => category.strategicPillarId === pillar.id);
      });

      return { pillars };
      
    } finally {
      client.release();
    }
  }

  // Get all functional scorecard data with hierarchical structure
  static async getFunctionalScoreCardData(): Promise<ScoreCardData> {
    const client = await getDbConnection();
    
    try {
      // Get functional programs data (now independent from strategic structure)
      const programsResult = await client.query('SELECT * FROM functional_programs ORDER BY pillar, category, strategic_goal, text');

      // Build hierarchy from functional programs text fields
      const functionalPrograms: StrategicProgram[] = programsResult.rows.map(row => ({
        id: row.id,
        text: row.text,
        
        // Legacy quarterly fields (if they exist)
        q1_objective: row.q1_objective,
        q2_objective: row.q2_objective,
        q3_objective: row.q3_objective,
        q4_objective: row.q4_objective,
        q1_status: row.q1_status,
        q2_status: row.q2_status,
        q3_status: row.q3_status,
        q4_status: row.q4_status,
        
        // 2025 Objectives and Statuses
        q1_2025_objective: row.q1_2025_objective,
        q2_2025_objective: row.q2_2025_objective,
        q3_2025_objective: row.q3_2025_objective,
        q4_2025_objective: row.q4_2025_objective,
        q1_2025_status: row.q1_2025_status,
        q2_2025_status: row.q2_2025_status,
        q3_2025_status: row.q3_2025_status,
        q4_2025_status: row.q4_2025_status,
        
        // 2026 Objectives and Statuses
        q1_2026_objective: row.q1_2026_objective,
        q2_2026_objective: row.q2_2026_objective,
        q3_2026_objective: row.q3_2026_objective,
        q4_2026_objective: row.q4_2026_objective,
        q1_2026_status: row.q1_2026_status,
        q2_2026_status: row.q2_2026_status,
        q3_2026_status: row.q3_2026_status,
        q4_2026_status: row.q4_2026_status,
        
        ordLtSponsors: row.function_sponsor || ['(Not Specified)'],
        sponsorsLeads: row.sponsors_leads || ['(Not Specified)'],
        reportingOwners: row.reporting_owners || ['(Not Specified)'],
        progressUpdates: row.progress_updates,
        
        // Quarterly progress updates (2025-2026)
        q1_2025_progress: row.q1_2025_progress,
        q2_2025_progress: row.q2_2025_progress,
        q3_2025_progress: row.q3_2025_progress,
        q4_2025_progress: row.q4_2025_progress,
        q1_2026_progress: row.q1_2026_progress,
        q2_2026_progress: row.q2_2026_progress,
        q3_2026_progress: row.q3_2026_progress,
        q4_2026_progress: row.q4_2026_progress,
        
        updatedAt: row.updated_at,
        // Store text values for functional hierarchy
        strategicGoalId: row.strategic_goal || 'Unspecified Goal',
        categoryId: row.category || 'Unspecified Category',
        strategicPillarId: row.pillar || 'Unspecified Pillar',
        linkedORDStrategicProgramId: row.linked_ord_strategic_program_id,
        // Add function field if needed in StrategicProgram interface
        functionArea: row.function
      }));

      // Build functional hierarchy from text fields
      const pillarsMap = new Map<string, Pillar>();
      const categoriesMap = new Map<string, Category>();
      const goalsMap = new Map<string, StrategicGoal>();

      // Create unique pillars from functional programs
      functionalPrograms.forEach(program => {
        const pillarName = program.strategicPillarId;
        if (!pillarsMap.has(pillarName)) {
          pillarsMap.set(pillarName, {
            id: pillarName,
            name: pillarName,
            categories: []
          });
        }
      });

      // Create unique categories from functional programs
      functionalPrograms.forEach(program => {
        const categoryKey = `${program.strategicPillarId}|${program.categoryId}`;
        if (!categoriesMap.has(categoryKey)) {
          categoriesMap.set(categoryKey, {
            id: categoryKey,
            name: program.categoryId,
            goals: [],
            strategicPillarId: program.strategicPillarId
          });
        }
      });

      // Create unique goals from functional programs
      functionalPrograms.forEach(program => {
        const goalKey = `${program.strategicPillarId}|${program.categoryId}|${program.strategicGoalId}`;
        if (!goalsMap.has(goalKey)) {
          goalsMap.set(goalKey, {
            id: goalKey,
            text: program.strategicGoalId,
            programs: [],
            categoryId: `${program.strategicPillarId}|${program.categoryId}`,
            strategicPillarId: program.strategicPillarId,
            ordLtSponsors: ['(Not Specified)'],
            sponsorsLeads: ['(Not Specified)'],
            reportingOwners: ['(Not Specified)']
          });
        }
      });

      // Assign programs to goals
      goalsMap.forEach(goal => {
        goal.programs = functionalPrograms.filter(program => {
          const goalKey = `${program.strategicPillarId}|${program.categoryId}|${program.strategicGoalId}`;
          return goalKey === goal.id;
        });
      });

      // Assign goals to categories
      categoriesMap.forEach(category => {
        category.goals = Array.from(goalsMap.values()).filter(goal => goal.categoryId === category.id);
      });

      // Assign categories to pillars
      pillarsMap.forEach(pillar => {
        pillar.categories = Array.from(categoriesMap.values()).filter(category => category.strategicPillarId === pillar.id);
      });

      const pillars = Array.from(pillarsMap.values());

      return { pillars };
      
    } finally {
      client.release();
    }
  }

  // Get distinct functions from functional_programs table
  static async getDistinctFunctions(): Promise<string[]> {
    const client = await getDbConnection();
    
    try {
      const result = await client.query('SELECT DISTINCT function FROM functional_programs WHERE function IS NOT NULL ORDER BY function');
      return result.rows.map(row => row.function);
      
    } finally {
      client.release();
    }
  }

  // Get functional scorecard data filtered by function
  static async getFunctionalScoreCardDataByFunction(selectedFunction: string): Promise<ScoreCardData> {
    const client = await getDbConnection();
    
    try {
      // Get functional programs data filtered by function
      const programsResult = await client.query(
        'SELECT * FROM functional_programs WHERE function = $1 ORDER BY pillar, category, strategic_goal, text',
        [selectedFunction]
      );

      // Build hierarchy from filtered functional programs text fields
      const functionalPrograms: StrategicProgram[] = programsResult.rows.map(row => ({
        id: row.id,
        text: row.text,
        
        // Legacy quarterly fields (if they exist)
        q1_objective: row.q1_objective,
        q2_objective: row.q2_objective,
        q3_objective: row.q3_objective,
        q4_objective: row.q4_objective,
        q1_status: row.q1_status,
        q2_status: row.q2_status,
        q3_status: row.q3_status,
        q4_status: row.q4_status,
        
        // 2025 Objectives and Statuses
        q1_2025_objective: row.q1_2025_objective,
        q2_2025_objective: row.q2_2025_objective,
        q3_2025_objective: row.q3_2025_objective,
        q4_2025_objective: row.q4_2025_objective,
        q1_2025_status: row.q1_2025_status,
        q2_2025_status: row.q2_2025_status,
        q3_2025_status: row.q3_2025_status,
        q4_2025_status: row.q4_2025_status,
        
        // 2026 Objectives and Statuses
        q1_2026_objective: row.q1_2026_objective,
        q2_2026_objective: row.q2_2026_objective,
        q3_2026_objective: row.q3_2026_objective,
        q4_2026_objective: row.q4_2026_objective,
        q1_2026_status: row.q1_2026_status,
        q2_2026_status: row.q2_2026_status,
        q3_2026_status: row.q3_2026_status,
        q4_2026_status: row.q4_2026_status,
        
        ordLtSponsors: row.function_sponsor || ['(Not Specified)'],
        sponsorsLeads: row.sponsors_leads || ['(Not Specified)'],
        reportingOwners: row.reporting_owners || ['(Not Specified)'],
        progressUpdates: row.progress_updates,
        
        // Quarterly progress updates (2025-2026)
        q1_2025_progress: row.q1_2025_progress,
        q2_2025_progress: row.q2_2025_progress,
        q3_2025_progress: row.q3_2025_progress,
        q4_2025_progress: row.q4_2025_progress,
        q1_2026_progress: row.q1_2026_progress,
        q2_2026_progress: row.q2_2026_progress,
        q3_2026_progress: row.q3_2026_progress,
        q4_2026_progress: row.q4_2026_progress,
        
        updatedAt: row.updated_at,
        // Store text values for functional hierarchy
        strategicGoalId: row.strategic_goal || 'Unspecified Goal',
        categoryId: row.category || 'Unspecified Category',
        strategicPillarId: row.pillar || 'Unspecified Pillar',
        linkedORDStrategicProgramId: row.linked_ord_strategic_program_id,
        // Add function field if needed in StrategicProgram interface
        functionArea: row.function
      }));

      // Build functional hierarchy from text fields (same logic as getFunctionalScoreCardData)
      const pillarsMap = new Map<string, Pillar>();
      const categoriesMap = new Map<string, Category>();
      const goalsMap = new Map<string, StrategicGoal>();

      // Create unique pillars from functional programs
      functionalPrograms.forEach(program => {
        const pillarName = program.strategicPillarId;
        if (!pillarsMap.has(pillarName)) {
          pillarsMap.set(pillarName, {
            id: pillarName,
            name: pillarName,
            categories: []
          });
        }
      });

      // Create unique categories from functional programs
      functionalPrograms.forEach(program => {
        const categoryKey = `${program.strategicPillarId}|${program.categoryId}`;
        if (!categoriesMap.has(categoryKey)) {
          categoriesMap.set(categoryKey, {
            id: categoryKey,
            name: program.categoryId,
            goals: [],
            strategicPillarId: program.strategicPillarId
          });
        }
      });

      // Create unique goals from functional programs
      functionalPrograms.forEach(program => {
        const goalKey = `${program.strategicPillarId}|${program.categoryId}|${program.strategicGoalId}`;
        if (!goalsMap.has(goalKey)) {
          goalsMap.set(goalKey, {
            id: goalKey,
            text: program.strategicGoalId,
            programs: [],
            categoryId: `${program.strategicPillarId}|${program.categoryId}`,
            strategicPillarId: program.strategicPillarId,
            ordLtSponsors: ['(Not Specified)'],
            sponsorsLeads: ['(Not Specified)'],
            reportingOwners: ['(Not Specified)']
          });
        }
      });

      // Assign programs to goals
      goalsMap.forEach(goal => {
        goal.programs = functionalPrograms.filter(program => {
          const goalKey = `${program.strategicPillarId}|${program.categoryId}|${program.strategicGoalId}`;
          return goalKey === goal.id;
        });
      });

      // Assign goals to categories
      categoriesMap.forEach(category => {
        category.goals = Array.from(goalsMap.values()).filter(goal => goal.categoryId === category.id);
      });

      // Assign categories to pillars
      pillarsMap.forEach(pillar => {
        pillar.categories = Array.from(categoriesMap.values()).filter(category => category.strategicPillarId === pillar.id);
      });

      const pillars = Array.from(pillarsMap.values());

      return { pillars };
      
    } finally {
      client.release();
    }
  }

  // Update program status (quarterly)
  static async updateProgramStatus(programId: string, quarter: string, status: string | null): Promise<void> {
    const client = await getDbConnection();
    try {
      const column = `${quarter}_status`;
      const result = await client.query(
        `UPDATE strategic_programs SET ${column} = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2`,
        [status, programId]
      );
      
      if (result.rowCount === 0) {
        throw new Error(`Program with ID ${programId} not found`);
      }
    } finally {
      client.release();
    }
  }

  // Update program text
  static async updateProgramText(programId: string, text: string): Promise<void> {
    const client = await getDbConnection();
    try {
      const result = await client.query(
        'UPDATE strategic_programs SET text = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2',
        [text, programId]
      );
      
      if (result.rowCount === 0) {
        throw new Error(`Program with ID ${programId} not found`);
      }
    } finally {
      client.release();
    }
  }

  // Update program quarterly objective
  static async updateProgramObjective(programId: string, quarter: string, objective: string): Promise<void> {
    const client = await getDbConnection();
    try {
      const column = `${quarter}_objective`;
      const result = await client.query(
        `UPDATE strategic_programs SET ${column} = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2`,
        [objective, programId]
      );
      
      if (result.rowCount === 0) {
        throw new Error(`Program with ID ${programId} not found`);
      }
    } finally {
      client.release();
    }
  }

  // Update program progress updates
  static async updateProgramProgress(programId: string, progressUpdates: string): Promise<void> {
    const client = await getDbConnection();
    try {
      const result = await client.query(
        'UPDATE strategic_programs SET progress_updates = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2',
        [progressUpdates, programId]
      );
      
      if (result.rowCount === 0) {
        throw new Error(`Program with ID ${programId} not found`);
      }
    } finally {
      client.release();
    }
  }

  // Update program quarter-specific progress
  static async updateProgramQuarterProgress(programId: string, quarterColumn: string, progressUpdates: string): Promise<void> {
    const client = await getDbConnection();
    try {
      // Validate column name to prevent SQL injection
      const validColumns = [
        'q1_2025_progress', 'q2_2025_progress', 'q3_2025_progress', 'q4_2025_progress',
        'q1_2026_progress', 'q2_2026_progress', 'q3_2026_progress', 'q4_2026_progress'
      ];
      
      if (!validColumns.includes(quarterColumn)) {
        throw new Error(`Invalid quarter column: ${quarterColumn}`);
      }
      
      const result = await client.query(
        `UPDATE strategic_programs SET ${quarterColumn} = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2`,
        [progressUpdates, programId]
      );
      
      if (result.rowCount === 0) {
        throw new Error(`Program with ID ${programId} not found`);
      }
    } finally {
      client.release();
    }
  }

  // FUNCTIONAL PROGRAM UPDATE METHODS

  // Update functional program status (quarterly)
  static async updateFunctionalProgramStatus(programId: string, quarter: string, status: string | null): Promise<void> {
    const client = await getDbConnection();
    try {
      const column = `${quarter}_status`;
      const result = await client.query(
        `UPDATE functional_programs SET ${column} = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2`,
        [status, programId]
      );
      
      if (result.rowCount === 0) {
        throw new Error(`Functional program with ID ${programId} not found`);
      }
    } finally {
      client.release();
    }
  }

  // Update functional program text
  static async updateFunctionalProgramText(programId: string, text: string): Promise<void> {
    const client = await getDbConnection();
    try {
      const result = await client.query(
        'UPDATE functional_programs SET text = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2',
        [text, programId]
      );
      
      if (result.rowCount === 0) {
        throw new Error(`Functional program with ID ${programId} not found`);
      }
    } finally {
      client.release();
    }
  }

  // Update functional program quarterly objective
  static async updateFunctionalProgramObjective(programId: string, quarter: string, objective: string): Promise<void> {
    const client = await getDbConnection();
    try {
      const column = `${quarter}_objective`;
      const result = await client.query(
        `UPDATE functional_programs SET ${column} = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2`,
        [objective, programId]
      );
      
      if (result.rowCount === 0) {
        throw new Error(`Functional program with ID ${programId} not found`);
      }
    } finally {
      client.release();
    }
  }

  // Update functional program progress updates
  static async updateFunctionalProgramProgress(programId: string, progressUpdates: string): Promise<void> {
    const client = await getDbConnection();
    try {
      const result = await client.query(
        'UPDATE functional_programs SET progress_updates = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2',
        [progressUpdates, programId]
      );
      
      if (result.rowCount === 0) {
        throw new Error(`Functional program with ID ${programId} not found`);
      }
    } finally {
      client.release();
    }
  }

  // Update functional program quarter-specific progress
  static async updateFunctionalProgramQuarterProgress(programId: string, quarterColumn: string, progressUpdates: string): Promise<void> {
    const client = await getDbConnection();
    try {
      // Validate column name to prevent SQL injection
      const validColumns = [
        'q1_2025_progress', 'q2_2025_progress', 'q3_2025_progress', 'q4_2025_progress',
        'q1_2026_progress', 'q2_2026_progress', 'q3_2026_progress', 'q4_2026_progress'
      ];
      
      if (!validColumns.includes(quarterColumn)) {
        throw new Error(`Invalid quarter column: ${quarterColumn}`);
      }
      
      const result = await client.query(
        `UPDATE functional_programs SET ${quarterColumn} = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2`,
        [progressUpdates, programId]
      );
      
      if (result.rowCount === 0) {
        throw new Error(`Functional program with ID ${programId} not found`);
      }
    } finally {
      client.release();
    }
  }

  // Note: updateCategoryStatus removed - categories no longer have status column

  // Update category name
  static async updateCategoryName(categoryId: string, name: string): Promise<void> {
    const client = await getDbConnection();
    try {
      const result = await client.query(
        'UPDATE categories SET name = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2',
        [name, categoryId]
      );
      
      if (result.rowCount === 0) {
        throw new Error(`Category with ID ${categoryId} not found`);
      }
    } finally {
      client.release();
    }
  }

  // Note: updateGoalStatus removed - goals no longer have general status column, only year-specific ones

  // Update goal text
  static async updateGoalText(goalId: string, text: string): Promise<void> {
    const client = await getDbConnection();
    try {
      const result = await client.query(
        'UPDATE strategic_goals SET text = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2',
        [text, goalId]
      );
      
      if (result.rowCount === 0) {
        throw new Error(`Goal with ID ${goalId} not found`);
      }
    } finally {
      client.release();
    }
  }

  // Generic update method with transaction support
  static async performUpdate(
    updateType: string,
    fieldPath: string[],
    newValue: string | null,
    quarter?: string,
  ): Promise<ScoreCardData> {
    const client = await getDbConnection();
    
    try {
      // Start transaction
      await client.query('BEGIN');
      
      // Perform the specific update based on type
      let result;
      switch (updateType) {
        case 'program':
          if (!quarter) throw new Error('Quarter is required for program status updates');
          const [,, , programId] = fieldPath;
          
          // Support both legacy and year-specific formats
          const column = quarter.includes('_') ? `${quarter}_status` : `${quarter}_status`;
          
          // Validate column name for year-specific formats
          const validStatusColumns = [
            'q1_2025_status', 'q2_2025_status', 'q3_2025_status', 'q4_2025_status',
            'q1_2026_status', 'q2_2026_status', 'q3_2026_status', 'q4_2026_status'
          ];
          
          if (!validStatusColumns.includes(column.replace('_status', '') + '_status')) {
            throw new Error(`Invalid quarter status column: ${column}`);
          }
          
          result = await client.query(
            `UPDATE strategic_programs SET ${column} = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2`,
            [newValue, programId]
          );
          if (result.rowCount === 0) throw new Error(`Program with ID ${programId} not found`);
          break;
          
        case 'program-text':
          const [,,, programTextId] = fieldPath;
          result = await client.query(
            'UPDATE strategic_programs SET text = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2',
            [newValue, programTextId]
          );
          if (result.rowCount === 0) throw new Error(`Program with ID ${programTextId} not found`);
          break;
          
        case 'program-objective':
          if (!quarter) throw new Error('Quarter is required for program objective updates');
          const [,,, programObjId] = fieldPath;
          
          // Support both legacy and year-specific formats
          const objColumn = quarter.includes('_') ? `${quarter}_objective` : `${quarter}_objective`;
          
          // Validate column name for year-specific formats
          const validObjectiveColumns = [
            'q1_2025_objective', 'q2_2025_objective', 'q3_2025_objective', 'q4_2025_objective',
            'q1_2026_objective', 'q2_2026_objective', 'q3_2026_objective', 'q4_2026_objective'
          ];
          
          if (!validObjectiveColumns.includes(objColumn.replace('_objective', '') + '_objective')) {
            throw new Error(`Invalid quarter objective column: ${objColumn}`);
          }
          
          result = await client.query(
            `UPDATE strategic_programs SET ${objColumn} = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2`,
            [newValue, programObjId]
          );
          if (result.rowCount === 0) throw new Error(`Program with ID ${programObjId} not found`);
          break;
          
        case 'program-progress':
          const [,,, programProgressId] = fieldPath;
          result = await client.query(
            'UPDATE strategic_programs SET progress_updates = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2',
            [newValue, programProgressId]
          );
          if (result.rowCount === 0) throw new Error(`Program with ID ${programProgressId} not found`);
          break;

        case 'program-quarter-progress':
          if (!quarter) throw new Error('Quarter column is required for quarter-specific progress updates');
          const [,,, programQuarterProgressId] = fieldPath;
          
          // Validate quarter column name to prevent SQL injection
          const validColumns = [
            'q1_2025_progress', 'q2_2025_progress', 'q3_2025_progress', 'q4_2025_progress',
            'q1_2026_progress', 'q2_2026_progress', 'q3_2026_progress', 'q4_2026_progress'
          ];
          
          if (!validColumns.includes(quarter)) {
            throw new Error(`Invalid quarter column: ${quarter}`);
          }
          
          result = await client.query(
            `UPDATE strategic_programs SET ${quarter} = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2`,
            [newValue, programQuarterProgressId]
          );
          if (result.rowCount === 0) throw new Error(`Program with ID ${programQuarterProgressId} not found`);
          break;
          
          
        case 'category-name':
          const [, categoryNameId] = fieldPath;
          result = await client.query(
            'UPDATE categories SET name = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2',
            [newValue, categoryNameId]
          );
          if (result.rowCount === 0) throw new Error(`Category with ID ${categoryNameId} not found`);
          break;
          
        // Note: 'goal' case removed - goals no longer have general status column, use 'goal-quarter' instead
          
        case 'goal-text':
          const [,, goalTextId] = fieldPath;
          result = await client.query(
            'UPDATE strategic_goals SET text = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2',
            [newValue, goalTextId]
          );
          if (result.rowCount === 0) throw new Error(`Goal with ID ${goalTextId} not found`);
          break;

        case 'goal-quarter':
          if (!quarter) throw new Error('Quarter is required for goal quarter status updates');
          const [,, goalQuarterId] = fieldPath;
          
          // Support year-specific formats
          const goalColumn = quarter.includes('_') ? `${quarter}_status` : `${quarter}_status`;
          
          // Validate column name for year-specific formats
          const validGoalStatusColumns = [
            'q1_2025_status', 'q2_2025_status', 'q3_2025_status', 'q4_2025_status',
            'q1_2026_status', 'q2_2026_status', 'q3_2026_status', 'q4_2026_status'
          ];
          
          if (!validGoalStatusColumns.includes(goalColumn.replace('_status', '') + '_status')) {
            throw new Error(`Invalid quarter status column for goals: ${goalColumn}`);
          }
          
          result = await client.query(
            `UPDATE strategic_goals SET ${goalColumn} = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2`,
            [newValue, goalQuarterId]
          );
          if (result.rowCount === 0) throw new Error(`Goal with ID ${goalQuarterId} not found`);
          break;
          
        default:
          throw new Error(`Invalid update type: ${updateType}`);
      }
      
      // Commit transaction
      await client.query('COMMIT');
      
      // Return updated data
      return await this.getScoreCardData();
      
    } catch (error) {
      // Rollback on error
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }

  // Generic update method for functional programs with transaction support
  static async performFunctionalUpdate(
    updateType: string,
    fieldPath: string[],
    newValue: string | null,
    quarter?: string,
  ): Promise<ScoreCardData> {
    const client = await getDbConnection();
    
    try {
      // Start transaction
      await client.query('BEGIN');
      
      // Perform the specific update based on type
      let result;
      switch (updateType) {
        case 'functional-program':
          if (!quarter) throw new Error('Quarter is required for functional program status updates');
          const [,, , programId] = fieldPath;
          
          // Support both legacy and year-specific formats
          const column = quarter.includes('_') ? `${quarter}_status` : `${quarter}_status`;
          
          // Validate column name for year-specific formats
          const validStatusColumns = [
            'q1_2025_status', 'q2_2025_status', 'q3_2025_status', 'q4_2025_status',
            'q1_2026_status', 'q2_2026_status', 'q3_2026_status', 'q4_2026_status'
          ];
          
          if (!validStatusColumns.includes(column.replace('_status', '') + '_status')) {
            throw new Error(`Invalid quarter status column: ${column}`);
          }
          
          result = await client.query(
            `UPDATE functional_programs SET ${column} = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2`,
            [newValue, programId]
          );
          if (result.rowCount === 0) throw new Error(`Functional program with ID ${programId} not found`);
          break;
          
        case 'functional-program-text':
          const [,,, programTextId] = fieldPath;
          result = await client.query(
            'UPDATE functional_programs SET text = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2',
            [newValue, programTextId]
          );
          if (result.rowCount === 0) throw new Error(`Functional program with ID ${programTextId} not found`);
          break;
          
        case 'functional-program-objective':
          if (!quarter) throw new Error('Quarter is required for functional program objective updates');
          const [,,, programObjId] = fieldPath;
          
          // Support both legacy and year-specific formats
          const objColumn = quarter.includes('_') ? `${quarter}_objective` : `${quarter}_objective`;
          
          // Validate column name for year-specific formats
          const validObjectiveColumns = [
            'q1_2025_objective', 'q2_2025_objective', 'q3_2025_objective', 'q4_2025_objective',
            'q1_2026_objective', 'q2_2026_objective', 'q3_2026_objective', 'q4_2026_objective'
          ];
          
          if (!validObjectiveColumns.includes(objColumn.replace('_objective', '') + '_objective')) {
            throw new Error(`Invalid quarter objective column: ${objColumn}`);
          }
          
          result = await client.query(
            `UPDATE functional_programs SET ${objColumn} = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2`,
            [newValue, programObjId]
          );
          if (result.rowCount === 0) throw new Error(`Functional program with ID ${programObjId} not found`);
          break;
          
        case 'functional-program-progress':
          const [,,, programProgressId] = fieldPath;
          result = await client.query(
            'UPDATE functional_programs SET progress_updates = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2',
            [newValue, programProgressId]
          );
          if (result.rowCount === 0) throw new Error(`Functional program with ID ${programProgressId} not found`);
          break;

        case 'functional-program-quarter-progress':
          if (!quarter) throw new Error('Quarter column is required for functional quarter-specific progress updates');
          const [,,, programQuarterProgressId] = fieldPath;
          
          // Validate quarter column name to prevent SQL injection
          const validColumns = [
            'q1_2025_progress', 'q2_2025_progress', 'q3_2025_progress', 'q4_2025_progress',
            'q1_2026_progress', 'q2_2026_progress', 'q3_2026_progress', 'q4_2026_progress'
          ];
          
          if (!validColumns.includes(quarter)) {
            throw new Error(`Invalid quarter column: ${quarter}`);
          }
          
          result = await client.query(
            `UPDATE functional_programs SET ${quarter} = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2`,
            [newValue, programQuarterProgressId]
          );
          if (result.rowCount === 0) throw new Error(`Functional program with ID ${programQuarterProgressId} not found`);
          break;
          
        // Reuse the same category and goal update logic since they share the same tables
        case 'category-name':
          const [, categoryNameId] = fieldPath;
          result = await client.query(
            'UPDATE categories SET name = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2',
            [newValue, categoryNameId]
          );
          if (result.rowCount === 0) throw new Error(`Category with ID ${categoryNameId} not found`);
          break;
          
        case 'goal-text':
          const [,, goalTextId] = fieldPath;
          result = await client.query(
            'UPDATE strategic_goals SET text = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2',
            [newValue, goalTextId]
          );
          if (result.rowCount === 0) throw new Error(`Goal with ID ${goalTextId} not found`);
          break;

        case 'goal-quarter':
          if (!quarter) throw new Error('Quarter is required for goal quarter status updates');
          const [,, goalQuarterId] = fieldPath;
          
          // Support year-specific formats
          const goalColumn = quarter.includes('_') ? `${quarter}_status` : `${quarter}_status`;
          
          // Validate column name for year-specific formats
          const validGoalStatusColumns = [
            'q1_2025_status', 'q2_2025_status', 'q3_2025_status', 'q4_2025_status',
            'q1_2026_status', 'q2_2026_status', 'q3_2026_status', 'q4_2026_status'
          ];
          
          if (!validGoalStatusColumns.includes(goalColumn.replace('_status', '') + '_status')) {
            throw new Error(`Invalid quarter status column for goals: ${goalColumn}`);
          }
          
          result = await client.query(
            `UPDATE strategic_goals SET ${goalColumn} = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2`,
            [newValue, goalQuarterId]
          );
          if (result.rowCount === 0) throw new Error(`Goal with ID ${goalQuarterId} not found`);
          break;
          
        default:
          throw new Error(`Invalid functional update type: ${updateType}`);
      }
      
      // Commit transaction
      await client.query('COMMIT');
      
      // Return updated functional data
      return await this.getFunctionalScoreCardData();
      
    } catch (error) {
      // Rollback on error
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }
}