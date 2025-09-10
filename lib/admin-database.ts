import { getDbConnection } from '@/lib/database';

export interface TableColumn {
  name: string;
  type: string;
  nullable: boolean;
  defaultValue?: string;
}

export interface TableRow {
  [key: string]: unknown;
}

export interface PaginatedResult<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

// Admin database service for CRUD operations on all tables
export class AdminDatabaseService {
  
  // Get table schema information
  static async getTableSchema(tableName: string): Promise<TableColumn[]> {
    const client = await getDbConnection();
    
    try {
      const result = await client.query(`
        SELECT 
          column_name as name,
          data_type as type,
          is_nullable = 'YES' as nullable,
          column_default as default_value
        FROM information_schema.columns 
        WHERE table_name = $1 AND table_schema = 'public'
        ORDER BY ordinal_position
      `, [tableName]);
      
      return result.rows;
    } finally {
      client.release();
    }
  }

  // Generic paginated data fetch
  static async getPaginatedData<T>(
    tableName: string,
    page: number = 1,
    limit: number = 50,
    sortColumn: string = 'id',
    sortDirection: 'ASC' | 'DESC' = 'ASC',
    searchQuery?: string,
    searchColumns?: string[]
  ): Promise<PaginatedResult<T>> {
    const client = await getDbConnection();
    
    try {
      const offset = (page - 1) * limit;
      let whereClause = '';
      const params: unknown[] = [limit, offset];
      
      // Add search functionality
      if (searchQuery && searchColumns && searchColumns.length > 0) {
        const searchConditions = searchColumns.map((col) => {
          params.push(`%${searchQuery}%`);
          return `${col}::text ILIKE $${params.length}`;
        }).join(' OR ');
        whereClause = `WHERE ${searchConditions}`;
      }
      
      // Get total count
      const countQuery = `SELECT COUNT(*) as total FROM ${tableName} ${whereClause}`;
      const countParams = searchQuery && searchColumns ? params.slice(2) : [];
      const countResult = await client.query(countQuery, countParams);
      const total = parseInt(countResult.rows[0].total);
      
      // Get paginated data
      const dataQuery = `
        SELECT * FROM ${tableName} 
        ${whereClause}
        ORDER BY ${sortColumn} ${sortDirection}
        LIMIT $1 OFFSET $2
      `;
      const dataResult = await client.query(dataQuery, params);
      
      return {
        data: dataResult.rows,
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit)
      };
    } finally {
      client.release();
    }
  }

  // STRATEGIC PILLARS CRUD
  static async createPillar(name: string): Promise<string> {
    const client = await getDbConnection();
    
    try {
      const id = await this.getNextId('strategic_pillars', 'pillar');
      await client.query(
        'INSERT INTO strategic_pillars (id, name) VALUES ($1, $2)',
        [id, name]
      );
      return id;
    } finally {
      client.release();
    }
  }

  static async updatePillar(id: string, data: Partial<{name: string}>): Promise<void> {
    const client = await getDbConnection();
    
    try {
      const setClause = Object.keys(data)
        .map((key, index) => `${key} = $${index + 2}`)
        .join(', ');
      const values = Object.values(data);
      
      const result = await client.query(
        `UPDATE strategic_pillars SET ${setClause}, updated_at = CURRENT_TIMESTAMP WHERE id = $1`,
        [id, ...values]
      );
      
      if (result.rowCount === 0) {
        throw new Error(`Pillar with ID ${id} not found`);
      }
    } finally {
      client.release();
    }
  }

  static async deletePillar(id: string): Promise<void> {
    const client = await getDbConnection();
    
    try {
      // Check for dependent records
      const dependentCount = await client.query(
        'SELECT COUNT(*) as count FROM categories WHERE pillar_id = $1',
        [id]
      );
      
      if (parseInt(dependentCount.rows[0].count) > 0) {
        throw new Error(`Cannot delete pillar: ${dependentCount.rows[0].count} categories depend on it`);
      }
      
      const result = await client.query('DELETE FROM strategic_pillars WHERE id = $1', [id]);
      
      if (result.rowCount === 0) {
        throw new Error(`Pillar with ID ${id} not found`);
      }
    } finally {
      client.release();
    }
  }

  // CATEGORIES CRUD
  static async createCategory(name: string, pillarId: string, status?: string, comments?: string): Promise<string> {
    const client = await getDbConnection();
    
    try {
      const id = await this.getNextId('categories', 'category');
      await client.query(
        'INSERT INTO categories (id, name, pillar_id, status, comments) VALUES ($1, $2, $3, $4, $5)',
        [id, name, pillarId, status, comments]
      );
      return id;
    } finally {
      client.release();
    }
  }

  static async updateCategory(id: string, data: Partial<{
    name: string;
    pillar_id: string;
    status: string;
    comments: string;
  }>): Promise<void> {
    const client = await getDbConnection();
    
    try {
      const setClause = Object.keys(data)
        .map((key, index) => `${key} = $${index + 2}`)
        .join(', ');
      const values = Object.values(data);
      
      const result = await client.query(
        `UPDATE categories SET ${setClause}, updated_at = CURRENT_TIMESTAMP WHERE id = $1`,
        [id, ...values]
      );
      
      if (result.rowCount === 0) {
        throw new Error(`Category with ID ${id} not found`);
      }
    } finally {
      client.release();
    }
  }

  static async deleteCategory(id: string): Promise<void> {
    const client = await getDbConnection();
    
    try {
      // Check for dependent records
      const dependentCount = await client.query(
        'SELECT COUNT(*) as count FROM strategic_goals WHERE category_id = $1',
        [id]
      );
      
      if (parseInt(dependentCount.rows[0].count) > 0) {
        throw new Error(`Cannot delete category: ${dependentCount.rows[0].count} goals depend on it`);
      }
      
      const result = await client.query('DELETE FROM categories WHERE id = $1', [id]);
      
      if (result.rowCount === 0) {
        throw new Error(`Category with ID ${id} not found`);
      }
    } finally {
      client.release();
    }
  }

  // STRATEGIC GOALS CRUD
  static async createGoal(
    text: string,
    categoryId: string,
    pillarId: string,
    data?: Partial<{
      status: string;
      comments: string;
      q1_objective: string;
      q2_objective: string;
      q3_objective: string;
      q4_objective: string;
      q1_status: string;
      q2_status: string;
      q3_status: string;
      q4_status: string;
      ord_lt_sponsors: string[];
      sponsors_leads: string[];
      reporting_owners: string[];
      progress_updates: string;
    }>
  ): Promise<string> {
    const client = await getDbConnection();
    
    try {
      const id = await this.getNextId('strategic_goals', 'goal');
      
      const columns = ['id', 'text', 'category_id', 'pillar_id'];
      const values = [id, text, categoryId, pillarId];
      const placeholders = ['$1', '$2', '$3', '$4'];
      
      // Add optional fields
      if (data) {
        Object.entries(data).forEach(([key, value]) => {
          columns.push(key);
          values.push(value);
          placeholders.push(`$${values.length}`);
        });
      }
      
      await client.query(
        `INSERT INTO strategic_goals (${columns.join(', ')}) VALUES (${placeholders.join(', ')})`,
        values
      );
      
      return id;
    } finally {
      client.release();
    }
  }

  static async updateGoal(id: string, data: Partial<{
    text: string;
    category_id: string;
    pillar_id: string;
    status: string;
    comments: string;
    q1_objective: string;
    q2_objective: string;
    q3_objective: string;
    q4_objective: string;
    q1_status: string;
    q2_status: string;
    q3_status: string;
    q4_status: string;
    ord_lt_sponsors: string[];
    sponsors_leads: string[];
    reporting_owners: string[];
    progress_updates: string;
  }>): Promise<void> {
    const client = await getDbConnection();
    
    try {
      const setClause = Object.keys(data)
        .map((key, index) => `${key} = $${index + 2}`)
        .join(', ');
      const values = Object.values(data);
      
      const result = await client.query(
        `UPDATE strategic_goals SET ${setClause}, updated_at = CURRENT_TIMESTAMP WHERE id = $1`,
        [id, ...values]
      );
      
      if (result.rowCount === 0) {
        throw new Error(`Goal with ID ${id} not found`);
      }
    } finally {
      client.release();
    }
  }

  static async deleteGoal(id: string): Promise<void> {
    const client = await getDbConnection();
    
    try {
      // Check for dependent records
      const dependentCount = await client.query(
        'SELECT COUNT(*) as count FROM strategic_programs WHERE goal_id = $1',
        [id]
      );
      
      if (parseInt(dependentCount.rows[0].count) > 0) {
        throw new Error(`Cannot delete goal: ${dependentCount.rows[0].count} programs depend on it`);
      }
      
      const result = await client.query('DELETE FROM strategic_goals WHERE id = $1', [id]);
      
      if (result.rowCount === 0) {
        throw new Error(`Goal with ID ${id} not found`);
      }
    } finally {
      client.release();
    }
  }

  // STRATEGIC PROGRAMS CRUD
  static async createProgram(
    text: string,
    goalId: string,
    categoryId: string,
    pillarId: string,
    data?: Partial<{
      q1_objective: string;
      q2_objective: string;
      q3_objective: string;
      q4_objective: string;
      q1_status: string;
      q2_status: string;
      q3_status: string;
      q4_status: string;
      ord_lt_sponsors: string[];
      sponsors_leads: string[];
      reporting_owners: string[];
      progress_updates: string;
      q1_2025_progress: string;
      q2_2025_progress: string;
      q3_2025_progress: string;
      q4_2025_progress: string;
      q1_2026_progress: string;
      q2_2026_progress: string;
      q3_2026_progress: string;
      q4_2026_progress: string;
    }>
  ): Promise<string> {
    const client = await getDbConnection();
    
    try {
      const id = await this.getNextId('strategic_programs', 'program');
      
      const columns = ['id', 'text', 'goal_id', 'category_id', 'pillar_id'];
      const values = [id, text, goalId, categoryId, pillarId];
      const placeholders = ['$1', '$2', '$3', '$4', '$5'];
      
      // Add optional fields
      if (data) {
        Object.entries(data).forEach(([key, value]) => {
          columns.push(key);
          values.push(value);
          placeholders.push(`$${values.length}`);
        });
      }
      
      await client.query(
        `INSERT INTO strategic_programs (${columns.join(', ')}) VALUES (${placeholders.join(', ')})`,
        values
      );
      
      return id;
    } finally {
      client.release();
    }
  }

  static async updateProgram(id: string, data: Record<string, unknown>): Promise<void> {
    const client = await getDbConnection();
    
    try {
      const setClause = Object.keys(data)
        .map((key, index) => `${key} = $${index + 2}`)
        .join(', ');
      const values = Object.values(data);
      
      const result = await client.query(
        `UPDATE strategic_programs SET ${setClause}, updated_at = CURRENT_TIMESTAMP WHERE id = $1`,
        [id, ...values]
      );
      
      if (result.rowCount === 0) {
        throw new Error(`Program with ID ${id} not found`);
      }
    } finally {
      client.release();
    }
  }

  static async deleteProgram(id: string): Promise<void> {
    const client = await getDbConnection();
    
    try {
      const result = await client.query('DELETE FROM strategic_programs WHERE id = $1', [id]);
      
      if (result.rowCount === 0) {
        throw new Error(`Program with ID ${id} not found`);
      }
    } finally {
      client.release();
    }
  }

  // FUNCTIONAL PROGRAMS CRUD
  static async createFunctionalProgram(
    text: string,
    goalId: string,
    categoryId: string,
    pillarId: string,
    data?: Record<string, unknown>
  ): Promise<string> {
    const client = await getDbConnection();
    
    try {
      const id = await this.getNextId('functional_programs', 'functional');
      
      const columns = ['id', 'text', 'goal_id', 'category_id', 'pillar_id'];
      const values = [id, text, goalId, categoryId, pillarId];
      const placeholders = ['$1', '$2', '$3', '$4', '$5'];
      
      // Add optional fields
      if (data) {
        Object.entries(data).forEach(([key, value]) => {
          columns.push(key);
          values.push(value);
          placeholders.push(`$${values.length}`);
        });
      }
      
      await client.query(
        `INSERT INTO functional_programs (${columns.join(', ')}) VALUES (${placeholders.join(', ')})`,
        values
      );
      
      return id;
    } finally {
      client.release();
    }
  }

  static async updateFunctionalProgram(id: string, data: Record<string, unknown>): Promise<void> {
    const client = await getDbConnection();
    
    try {
      const setClause = Object.keys(data)
        .map((key, index) => `${key} = $${index + 2}`)
        .join(', ');
      const values = Object.values(data);
      
      const result = await client.query(
        `UPDATE functional_programs SET ${setClause}, updated_at = CURRENT_TIMESTAMP WHERE id = $1`,
        [id, ...values]
      );
      
      if (result.rowCount === 0) {
        throw new Error(`Functional program with ID ${id} not found`);
      }
    } finally {
      client.release();
    }
  }

  static async deleteFunctionalProgram(id: string): Promise<void> {
    const client = await getDbConnection();
    
    try {
      const result = await client.query('DELETE FROM functional_programs WHERE id = $1', [id]);
      
      if (result.rowCount === 0) {
        throw new Error(`Functional program with ID ${id} not found`);
      }
    } finally {
      client.release();
    }
  }

  // UTILITY FUNCTIONS
  
  // Generate next sequential ID for a table
  static async getNextId(tableName: string, prefix: string): Promise<string> {
    const client = await getDbConnection();
    
    try {
      // Get the highest current ID with the prefix
      const result = await client.query(
        `SELECT id FROM ${tableName} WHERE id LIKE $1 ORDER BY 
         CAST(SUBSTRING(id FROM ${prefix.length + 2}) AS INTEGER) DESC LIMIT 1`,
        [`${prefix}-%`]
      );
      
      let nextNumber = 1;
      if (result.rows.length > 0) {
        const currentId = result.rows[0].id;
        const numberPart = currentId.split('-')[1];
        if (numberPart && !isNaN(parseInt(numberPart))) {
          nextNumber = parseInt(numberPart) + 1;
        }
      }
      
      return `${prefix}-${String(nextNumber).padStart(3, '0')}`;
    } catch {
      // Fallback to timestamp-based ID if sequential parsing fails
      return `${prefix}-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`;
    } finally {
      client.release();
    }
  }
  
  // Get all pillars for dropdowns
  static async getAllPillars(): Promise<Array<{id: string, name: string}>> {
    const client = await getDbConnection();
    
    try {
      const result = await client.query('SELECT id, name FROM strategic_pillars ORDER BY name');
      return result.rows;
    } finally {
      client.release();
    }
  }

  // Get categories for a pillar
  static async getCategoriesForPillar(pillarId: string): Promise<Array<{id: string, name: string}>> {
    const client = await getDbConnection();
    
    try {
      const result = await client.query(
        'SELECT id, name FROM categories WHERE pillar_id = $1 ORDER BY name',
        [pillarId]
      );
      return result.rows;
    } finally {
      client.release();
    }
  }

  // Get goals for a category
  static async getGoalsForCategory(categoryId: string): Promise<Array<{id: string, text: string}>> {
    const client = await getDbConnection();
    
    try {
      const result = await client.query(
        'SELECT id, text FROM strategic_goals WHERE category_id = $1 ORDER BY text',
        [categoryId]
      );
      return result.rows;
    } finally {
      client.release();
    }
  }

  // Bulk delete with transaction
  static async bulkDelete(tableName: string, ids: string[]): Promise<number> {
    const client = await getDbConnection();
    
    try {
      await client.query('BEGIN');
      
      const placeholders = ids.map((_, index) => `$${index + 1}`).join(',');
      const result = await client.query(
        `DELETE FROM ${tableName} WHERE id IN (${placeholders})`,
        ids
      );
      
      await client.query('COMMIT');
      return result.rowCount || 0;
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }

  // Get progress update history
  static async getProgressUpdateHistory(programId?: string, limit: number = 50): Promise<Record<string, unknown>[]> {
    const client = await getDbConnection();
    
    try {
      let query = `
        SELECT h.*, p.text as program_text 
        FROM progress_updates_history h 
        LEFT JOIN strategic_programs p ON h.program_id = p.id
      `;
      const params: unknown[] = [];
      
      if (programId) {
        query += ' WHERE h.program_id = $1';
        params.push(programId);
      }
      
      query += ` ORDER BY h.changed_at DESC LIMIT $${params.length + 1}`;
      params.push(limit);
      
      const result = await client.query(query, params);
      return result.rows;
    } finally {
      client.release();
    }
  }
}