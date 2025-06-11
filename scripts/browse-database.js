// Simple database browser
// Run with: node scripts/browse-database.js [table_name]

const { Pool } = require('pg');
require('dotenv').config();

async function browseDatabase() {
  const tableName = process.argv[2];
  
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    max: 1,
  });

  try {
    const client = await pool.connect();
    
    if (!tableName) {
      // Show all tables and their counts
      console.log('📊 Database Overview:\n');
      
      const tables = ['strategic_pillars', 'categories', 'strategic_goals', 'strategic_programs'];
      
      for (const table of tables) {
        const result = await client.query(`SELECT COUNT(*) FROM ${table}`);
        const count = result.rows[0].count;
        console.log(`${table.padEnd(20)} | ${count} rows`);
      }
      
      console.log('\n💡 Usage: node scripts/browse-database.js [table_name]');
      console.log('   Tables: strategic_pillars, categories, strategic_goals, strategic_programs');
      
    } else {
      // Show specific table data
      console.log(`📋 Contents of ${tableName}:\n`);
      
      const result = await client.query(`SELECT * FROM ${tableName} LIMIT 10`);
      
      if (result.rows.length === 0) {
        console.log('No data found in this table.');
      } else {
        console.table(result.rows);
        
        if (result.rows.length === 10) {
          const totalResult = await client.query(`SELECT COUNT(*) FROM ${tableName}`);
          console.log(`\n(Showing first 10 of ${totalResult.rows[0].count} total rows)`);
        }
      }
    }
    
    client.release();
    
  } catch (error) {
    console.error('Error:', error.message);
  } finally {
    await pool.end();
  }
}

browseDatabase();