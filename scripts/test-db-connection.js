// Test database connection script
// Run with: node scripts/test-db-connection.js

const { Pool } = require('pg');
require('dotenv').config();

async function testDatabaseConnection() {
  console.log('🔍 Testing database connection...');
  console.log('Database URL:', process.env.DATABASE_URL?.replace(/\/\/.*@/, '//***:***@')); // Hide credentials
  
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    max: 1, // Just for testing
  });

  try {
    // Test basic connection
    console.log('\n1. Testing basic connection...');
    const client = await pool.connect();
    const result = await client.query('SELECT NOW() as current_time, version() as pg_version');
    console.log('✅ Connection successful!');
    console.log('   Current time:', result.rows[0].current_time);
    console.log('   PostgreSQL version:', result.rows[0].pg_version.split(' ')[0]);
    client.release();

    // Test if database exists and is accessible
    console.log('\n2. Testing database accessibility...');
    const dbResult = await pool.query('SELECT current_database(), current_user');
    console.log('✅ Connected to database:', dbResult.rows[0].current_database);
    console.log('   Current user:', dbResult.rows[0].current_user);

    // Check if schema exists
    console.log('\n3. Checking for existing tables...');
    const tableResult = await pool.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public'
      ORDER BY table_name
    `);
    
    if (tableResult.rows.length > 0) {
      console.log('✅ Found existing tables:');
      tableResult.rows.forEach(row => {
        console.log('   -', row.table_name);
      });
    } else {
      console.log('⚠️  No tables found. You need to run the schema.sql file.');
      console.log('   Run: psql -d scorecard_db -f database/schema.sql');
    }

    console.log('\n🎉 Database connection test completed successfully!');

  } catch (error) {
    console.error('\n❌ Database connection failed:');
    console.error('Error:', error.message);
    
    if (error.code === 'ENOTFOUND') {
      console.error('💡 Hint: PostgreSQL server might not be running or host is incorrect');
    } else if (error.code === '3D000') {
      console.error('💡 Hint: Database "scorecard_db" does not exist. Create it with: createdb scorecard_db');
    } else if (error.code === '28P01') {
      console.error('💡 Hint: Authentication failed. Check your username/password in DATABASE_URL');
    }
    
    process.exit(1);
  } finally {
    await pool.end();
  }
}

// Run the test
testDatabaseConnection();