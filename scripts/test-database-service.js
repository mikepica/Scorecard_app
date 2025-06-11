// Test database service layer
// Run with: node scripts/test-database-service.js

// We'll test the database layer directly instead of importing TypeScript
const { Pool } = require('pg');
require('dotenv').config();

// Helper function to get scorecard data
async function getScoreCardData(pool) {
  const client = await pool.connect();
  
  try {
    // Get all data in parallel
    const [pillarsResult, categoriesResult, goalsResult, programsResult] = await Promise.all([
      client.query('SELECT * FROM strategic_pillars ORDER BY name'),
      client.query('SELECT * FROM categories ORDER BY pillar_id, name'),
      client.query('SELECT * FROM strategic_goals ORDER BY category_id, text'),
      client.query('SELECT * FROM strategic_programs ORDER BY goal_id, text')
    ]);

    // Build hierarchical structure
    const pillars = pillarsResult.rows.map(row => ({
      id: row.id,
      name: row.name,
      categories: []
    }));

    const categories = categoriesResult.rows.map(row => ({
      id: row.id,
      name: row.name,
      status: row.status,
      goals: [],
      strategicPillarId: row.pillar_id
    }));

    const goals = goalsResult.rows.map(row => ({
      id: row.id,
      text: row.text,
      status: row.status,
      programs: [],
      categoryId: row.category_id,
      strategicPillarId: row.pillar_id
    }));

    const programs = programsResult.rows.map(row => ({
      id: row.id,
      text: row.text,
      q1Status: row.q1_status,
      q2Status: row.q2_status,
      q3Status: row.q3_status,
      q4Status: row.q4_status,
      strategicGoalId: row.goal_id,
      categoryId: row.category_id,
      strategicPillarId: row.pillar_id
    }));

    // Link programs to goals
    goals.forEach(goal => {
      goal.programs = programs.filter(program => program.strategicGoalId === goal.id);
    });

    // Link goals to categories
    categories.forEach(category => {
      category.goals = goals.filter(goal => goal.categoryId === category.id);
    });

    // Link categories to pillars
    pillars.forEach(pillar => {
      pillar.categories = categories.filter(category => category.strategicPillarId === pillar.id);
    });

    return { pillars };
  } finally {
    client.release();
  }
}

async function testDatabaseService() {
  console.log('🧪 Testing Database Service Layer...\n');
  
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    max: 5,
  });

  try {
    // Test connection
    console.log('1️⃣ Testing database connection...');
    const client = await pool.connect();
    const result = await client.query('SELECT NOW()');
    client.release();
    console.log('✅ Database connection successful\n');

    // Test getting scorecard data structure
    console.log('2️⃣ Testing hierarchical data retrieval...');
    const scorecardData = await getScoreCardData(pool);
    
    console.log(`   Pillars loaded: ${scorecardData.pillars.length}`);
    
    // Test hierarchical structure
    let totalCategories = 0;
    let totalGoals = 0;  
    let totalPrograms = 0;
    
    scorecardData.pillars.forEach(pillar => {
      console.log(`   📊 ${pillar.name}: ${pillar.categories.length} categories`);
      totalCategories += pillar.categories.length;
      
      pillar.categories.forEach(category => {
        totalGoals += category.goals.length;
        category.goals.forEach(goal => {
          totalPrograms += goal.programs?.length || 0;
        });
      });
    });
    
    console.log(`   Total hierarchy: ${totalCategories} categories, ${totalGoals} goals, ${totalPrograms} programs`);
    console.log('✅ Scorecard data retrieval successful\n');

    // Test update operations
    console.log('3️⃣ Testing update operations...');
    
    // Find a program to test with
    const firstProgram = scorecardData.pillars[0]?.categories[0]?.goals[0]?.programs?.[0];
    if (firstProgram) {
      console.log(`   Testing with program: ${firstProgram.text.substring(0, 30)}... (${firstProgram.id})`);
      
      // Test program status update
      const originalStatus = firstProgram.q1Status;
      const newStatus = originalStatus === 'on-track' ? 'exceeded' : 'on-track';
      
      const updateClient = await pool.connect();
      try {
        await updateClient.query(
          'UPDATE strategic_programs SET q1_status = $1 WHERE id = $2',
          [newStatus, firstProgram.id]
        );
        console.log(`   ✅ Updated program Q1 status: ${originalStatus} → ${newStatus}`);
        
        // Revert the change
        await updateClient.query(
          'UPDATE strategic_programs SET q1_status = $1 WHERE id = $2',
          [originalStatus, firstProgram.id]
        );
        console.log(`   ✅ Reverted program Q1 status: ${newStatus} → ${originalStatus}`);
      } finally {
        updateClient.release();
      }
    }
    
    console.log('✅ Update operations successful\n');

    console.log('🎉 All database service tests passed!');
    
  } catch (error) {
    console.error('\n❌ Database service test failed:', error.message);
    console.error(error.stack);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

// Run the test
testDatabaseService();