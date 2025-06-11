// Compare file mode vs database mode API responses
// Run with: node scripts/compare-data-sources.js

async function compareDataSources() {
  console.log('🔍 Comparing File vs Database API Responses...\n');

  try {
    // Test file mode
    console.log('1️⃣ Testing file mode...');
    let response = await fetch('http://localhost:3001/api/scorecard?mode=file');
    if (!response.ok) {
      // Fallback: switch env var temporarily
      console.log('   Switching to file mode via env...');
      process.env.FEATURE_FLAG_USE_DATABASE = 'false';
      response = await fetch('http://localhost:3001/api/scorecard');
    }
    const fileData = await response.json();
    
    // Test database mode  
    console.log('2️⃣ Testing database mode...');
    process.env.FEATURE_FLAG_USE_DATABASE = 'true';
    const dbResponse = await fetch('http://localhost:3001/api/scorecard');
    const dbData = await dbResponse.json();
    
    // Compare structures
    console.log('3️⃣ Comparing data structures...\n');
    
    console.log('📊 Summary Comparison:');
    console.log(`   File Mode:     ${fileData.pillars?.length || 0} pillars`);
    console.log(`   Database Mode: ${dbData.pillars?.length || 0} pillars`);
    
    if (fileData.pillars && dbData.pillars) {
      let fileCats = 0, fileGoals = 0, filePrograms = 0;
      let dbCats = 0, dbGoals = 0, dbPrograms = 0;
      
      fileData.pillars.forEach(pillar => {
        fileCats += pillar.categories?.length || 0;
        pillar.categories?.forEach(cat => {
          fileGoals += cat.goals?.length || 0;
          cat.goals?.forEach(goal => {
            filePrograms += goal.programs?.length || 0;
          });
        });
      });
      
      dbData.pillars.forEach(pillar => {
        dbCats += pillar.categories?.length || 0;
        pillar.categories?.forEach(cat => {
          dbGoals += cat.goals?.length || 0;
          cat.goals?.forEach(goal => {
            dbPrograms += goal.programs?.length || 0;
          });
        });
      });
      
      console.log(`   File Mode:     ${fileCats} categories, ${fileGoals} goals, ${filePrograms} programs`);
      console.log(`   Database Mode: ${dbCats} categories, ${dbGoals} goals, ${dbPrograms} programs`);
      
      // Check structure equality
      if (fileCats === dbCats && fileGoals === dbGoals && filePrograms === dbPrograms) {
        console.log('\n✅ Data structures match!');
      } else {
        console.log('\n⚠️  Data structures differ!');
      }
    }
    
    // Check first program structure
    console.log('\n🔍 Sample Program Structure:');
    const fileProgram = fileData.pillars?.[0]?.categories?.[0]?.goals?.[0]?.programs?.[0];
    const dbProgram = dbData.pillars?.[0]?.categories?.[0]?.goals?.[0]?.programs?.[0];
    
    if (fileProgram && dbProgram) {
      console.log('File Mode Fields:', Object.keys(fileProgram).sort());
      console.log('DB Mode Fields:  ', Object.keys(dbProgram).sort());
      
      const fileFields = new Set(Object.keys(fileProgram));
      const dbFields = new Set(Object.keys(dbProgram));
      const missingInDb = [...fileFields].filter(f => !dbFields.has(f));
      const extraInDb = [...dbFields].filter(f => !fileFields.has(f));
      
      if (missingInDb.length > 0) {
        console.log('Missing in DB:', missingInDb);
      }
      if (extraInDb.length > 0) {
        console.log('Extra in DB:', extraInDb);
      }
      
      if (missingInDb.length === 0 && extraInDb.length === 0) {
        console.log('✅ Program structures match!');
      }
    }
    
  } catch (error) {
    console.error('❌ Comparison failed:', error.message);
  }
}

// Run comparison
compareDataSources();