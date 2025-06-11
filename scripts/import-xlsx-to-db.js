// Import XLSX data to PostgreSQL database
// Run with: node scripts/import-xlsx-to-db.js

const { Pool } = require('pg');
const XLSX = require('xlsx');
const path = require('path');
require('dotenv').config();

// Status mapping from XLSX to database values
const STATUS_MAPPING = {
  'Green': 'on-track',
  'Blue': 'exceeded',
  'Amber': 'delayed',
  'Red': 'missed',
  'green': 'on-track',
  'blue': 'exceeded',
  'amber': 'delayed',
  'red': 'missed'
};

function mapStatus(status) {
  if (!status || status.trim() === '' || status === 'undefined') return null;
  return STATUS_MAPPING[status] || status.toLowerCase();
}

function parseXLSX(filePath) {
  try {
    const workbook = XLSX.readFile(filePath);
    const sheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[sheetName];
    return XLSX.utils.sheet_to_json(worksheet);
  } catch (error) {
    console.error(`Error reading ${filePath}:`, error.message);
    return [];
  }
}

async function importData() {
  console.log('🚀 Starting XLSX to PostgreSQL migration...\n');

  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    max: 10,
  });

  const client = await pool.connect();

  try {
    // Start transaction
    await client.query('BEGIN');
    
    // Clear existing data (in reverse order due to foreign keys)
    console.log('🧹 Clearing existing data...');
    await client.query('DELETE FROM strategic_programs');
    await client.query('DELETE FROM strategic_goals');
    await client.query('DELETE FROM categories');
    await client.query('DELETE FROM strategic_pillars');
    console.log('✅ Existing data cleared\n');

    // Load XLSX files
    console.log('📂 Loading XLSX files...');
    const dataPath = path.join(process.cwd(), 'data');
    
    const strategicPillarsData = parseXLSX(path.join(dataPath, 'StrategicPillars.xlsx'));
    const categoriesData = parseXLSX(path.join(dataPath, 'Category-status-comments.xlsx'));
    const strategicGoalsData = parseXLSX(path.join(dataPath, 'Strategic-Goals.xlsx'));
    const strategicProgramsData = parseXLSX(path.join(dataPath, 'DummyData.xlsx'));

    console.log(`   Strategic Pillars: ${strategicPillarsData.length} records`);
    console.log(`   Categories: ${categoriesData.length} records`);
    console.log(`   Strategic Goals: ${strategicGoalsData.length} records`);
    console.log(`   Strategic Programs: ${strategicProgramsData.length} records\n`);

    // Import Strategic Pillars
    console.log('1️⃣ Importing Strategic Pillars...');
    const pillarMap = new Map();
    
    for (const row of strategicPillarsData) {
      const pillarId = row['StrategicPillarID'];
      const pillarName = row['Strategic Pillar'];
      
      if (pillarId && pillarName) {
        await client.query(
          'INSERT INTO strategic_pillars (id, name) VALUES ($1, $2) ON CONFLICT (id) DO NOTHING',
          [pillarId.toString(), pillarName]
        );
        pillarMap.set(pillarId.toString(), pillarName);
        console.log(`   ✓ ${pillarName} (${pillarId})`);
      }
    }
    console.log(`✅ Imported ${pillarMap.size} strategic pillars\n`);

    // Import Categories
    console.log('2️⃣ Importing Categories...');
    const categoryMap = new Map();
    
    for (const row of categoriesData) {
      const categoryId = row['CategoryID'];
      const categoryName = row['Category'];
      const pillarId = row['StrategicPillarID'];
      const status = mapStatus(row['Status']);
      const comments = row['Comments'] || '';
      
      if (categoryId && categoryName && pillarId) {
        await client.query(
          'INSERT INTO categories (id, name, status, comments, pillar_id) VALUES ($1, $2, $3, $4, $5) ON CONFLICT (id) DO NOTHING',
          [categoryId.toString(), categoryName, status, comments, pillarId.toString()]
        );
        categoryMap.set(categoryId.toString(), { name: categoryName, pillarId: pillarId.toString() });
        console.log(`   ✓ ${categoryName} (${categoryId}) → ${pillarId}`);
      }
    }
    console.log(`✅ Imported ${categoryMap.size} categories\n`);

    // Import Strategic Goals
    console.log('3️⃣ Importing Strategic Goals...');
    const goalMap = new Map();
    
    for (const row of strategicGoalsData) {
      const goalId = row['StrategicGoalID'];
      const goalText = row['Strategic Goal'];
      const categoryId = row['CategoryID'];
      const pillarId = row['StrategicPillarID'];
      const status = mapStatus(row['Status']);
      const comments = row['Comments'] || '';
      
      if (goalId && goalText && categoryId && pillarId) {
        await client.query(
          `INSERT INTO strategic_goals (
            id, text, status, comments, pillar_id, category_id
          ) VALUES ($1, $2, $3, $4, $5, $6) 
          ON CONFLICT (id) DO NOTHING`,
          [
            goalId.toString(), goalText, status, comments, pillarId.toString(), categoryId.toString()
          ]
        );
        goalMap.set(goalId.toString(), { text: goalText, categoryId: categoryId.toString(), pillarId: pillarId.toString() });
        console.log(`   ✓ ${goalText.substring(0, 50)}... (${goalId}) → ${categoryId}`);
      }
    }
    console.log(`✅ Imported ${goalMap.size} strategic goals\n`);

    // Import Strategic Programs
    console.log('4️⃣ Importing Strategic Programs...');
    let programCount = 0;
    
    for (const row of strategicProgramsData) {
      const programId = row['StrategicProgramID'];
      const programText = row['Strategic Program'];
      const goalId = row['StrategicGoalID'];
      const categoryId = row['CategoryID'];
      const pillarId = row['StrategicPillarID'];
      
      // Quarterly data
      const q1Obj = row['Q1 Objective'] || '';
      const q2Obj = row['Q2 Objective'] || '';
      const q3Obj = row['Q3 Objective'] || '';
      const q4Obj = row['Q4 Objective'] || '';
      
      const q1Status = mapStatus(row['Q1 Status']);
      const q2Status = mapStatus(row['Q2 Status']);
      const q3Status = mapStatus(row['Q3 Status']);
      const q4Status = mapStatus(row['Q4 Status']);
      
      // Personnel
      const ordLtSponsors = row['ORD LT Sponsor(s)'] || '';
      const sponsorsLeads = row['Sponsor(s)/Lead(s)'] || '';
      const reportingOwners = row['Reporting owner(s)'] || '';
      const progressUpdates = row['Progress Updates'] || '';
      
      if (programId && programText && goalId && categoryId && pillarId) {
        await client.query(
          `INSERT INTO strategic_programs (
            id, text, pillar_id, category_id, goal_id,
            q1_objective, q2_objective, q3_objective, q4_objective,
            q1_status, q2_status, q3_status, q4_status,
            ord_lt_sponsors, sponsors_leads, reporting_owners, progress_updates
          ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17) 
          ON CONFLICT (id) DO NOTHING`,
          [
            programId.toString(), programText, pillarId.toString(), categoryId.toString(), goalId.toString(),
            q1Obj, q2Obj, q3Obj, q4Obj,
            q1Status, q2Status, q3Status, q4Status,
            ordLtSponsors, sponsorsLeads, reportingOwners, progressUpdates
          ]
        );
        programCount++;
        console.log(`   ✓ ${programText.substring(0, 50)}... (${programId}) → ${goalId}`);
      } else {
        console.log(`   ⚠️  Skipped program ${programId}: missing relationships`);
      }
    }
    console.log(`✅ Imported ${programCount} strategic programs\n`);

    // Commit transaction
    await client.query('COMMIT');
    
    // Verify import
    console.log('📊 Verifying import...');
    const counts = await Promise.all([
      client.query('SELECT COUNT(*) FROM strategic_pillars'),
      client.query('SELECT COUNT(*) FROM categories'),
      client.query('SELECT COUNT(*) FROM strategic_goals'),
      client.query('SELECT COUNT(*) FROM strategic_programs')
    ]);
    
    console.log(`   Strategic Pillars: ${counts[0].rows[0].count}`);
    console.log(`   Categories: ${counts[1].rows[0].count}`);
    console.log(`   Strategic Goals: ${counts[2].rows[0].count}`);
    console.log(`   Strategic Programs: ${counts[3].rows[0].count}`);
    
    console.log('\n🎉 XLSX to PostgreSQL migration completed successfully!');
    
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('\n❌ Migration failed:', error.message);
    throw error;
  } finally {
    client.release();
    await pool.end();
  }
}

// Run the import
importData().catch(error => {
  console.error('Migration script failed:', error);
  process.exit(1);
});