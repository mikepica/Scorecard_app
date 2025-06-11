// Test update operations for database mode
// Run with: node scripts/test-update-operations.js

async function testUpdateOperations() {
  console.log('🧪 Testing Database Update Operations...\n');

  const baseUrl = 'http://localhost:3000';
  
  try {
    // First, get current data to find test targets
    console.log('1️⃣ Getting current scorecard data...');
    const response = await fetch(`${baseUrl}/api/scorecard`);
    const data = await response.json();
    
    if (!data.pillars || data.pillars.length === 0) {
      throw new Error('No pillars found in scorecard data');
    }
    
    // Find test targets
    const pillar = data.pillars[0];
    const category = pillar.categories[0];
    const goal = category.goals[0];
    const program = goal.programs?.[0];
    
    if (!program) {
      throw new Error('No program found for testing');
    }
    
    console.log(`   Found test targets:`);
    console.log(`   - Pillar: ${pillar.name} (${pillar.id})`);
    console.log(`   - Category: ${category.name} (${category.id})`);
    console.log(`   - Goal: ${goal.text.substring(0, 30)}... (${goal.id})`);
    console.log(`   - Program: ${program.text.substring(0, 30)}... (${program.id})`);
    
    const fieldPath = [pillar.id, category.id, goal.id, program.id];
    
    // Test 1: Program status update
    console.log('\n2️⃣ Testing program status update...');
    const originalStatus = program.q1Status || 'on-track';
    const newStatus = originalStatus === 'on-track' ? 'exceeded' : 'on-track';
    
    const updateResponse1 = await fetch(`${baseUrl}/api/scorecard/update`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        fieldPath,
        newValue: newStatus,
        type: 'program',
        quarter: 'q1'
      })
    });
    
    if (!updateResponse1.ok) {
      const error = await updateResponse1.text();
      throw new Error(`Program status update failed: ${error}`);
    }
    
    const updatedData1 = await updateResponse1.json();
    const updatedProgram1 = updatedData1.pillars[0].categories[0].goals[0].programs[0];
    console.log(`   ✅ Updated Q1 status: ${originalStatus} → ${updatedProgram1.q1Status}`);
    
    // Test 2: Program text update
    console.log('\n3️⃣ Testing program text update...');
    const originalText = program.text;
    const newText = originalText + ' [UPDATED TEST]';
    
    const updateResponse2 = await fetch(`${baseUrl}/api/scorecard/update`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        fieldPath,
        newValue: newText,
        type: 'program-text'
      })
    });
    
    if (!updateResponse2.ok) {
      const error = await updateResponse2.text();
      throw new Error(`Program text update failed: ${error}`);
    }
    
    const updatedData2 = await updateResponse2.json();
    const updatedProgram2 = updatedData2.pillars[0].categories[0].goals[0].programs[0];
    console.log(`   ✅ Updated text: ${originalText.substring(0, 30)}... → ${updatedProgram2.text.substring(0, 30)}...`);
    
    // Test 3: Program objective update
    console.log('\n4️⃣ Testing program objective update...');
    const originalObjective = program.q2Objective || '';
    const newObjective = 'Test objective update - ' + new Date().toISOString();
    
    const updateResponse3 = await fetch(`${baseUrl}/api/scorecard/update`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        fieldPath,
        newValue: newObjective,
        type: 'program-objective',
        quarter: 'q2'
      })
    });
    
    if (!updateResponse3.ok) {
      const error = await updateResponse3.text();
      throw new Error(`Program objective update failed: ${error}`);
    }
    
    const updatedData3 = await updateResponse3.json();
    const updatedProgram3 = updatedData3.pillars[0].categories[0].goals[0].programs[0];
    console.log(`   ✅ Updated Q2 objective: "${originalObjective}" → "${updatedProgram3.q2Objective}"`);
    
    // Test 4: Category status update
    console.log('\n5️⃣ Testing category status update...');
    const categoryFieldPath = [pillar.id, category.id];
    const originalCategoryStatus = category.status || 'on-track';
    const newCategoryStatus = originalCategoryStatus === 'on-track' ? 'delayed' : 'on-track';
    
    const updateResponse4 = await fetch(`${baseUrl}/api/scorecard/update`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        fieldPath: categoryFieldPath,
        newValue: newCategoryStatus,
        type: 'category'
      })
    });
    
    if (!updateResponse4.ok) {
      const error = await updateResponse4.text();
      throw new Error(`Category status update failed: ${error}`);
    }
    
    const updatedData4 = await updateResponse4.json();
    const updatedCategory = updatedData4.pillars[0].categories[0];
    console.log(`   ✅ Updated category status: ${originalCategoryStatus} → ${updatedCategory.status}`);
    
    // Test 5: Goal status update  
    console.log('\n6️⃣ Testing goal status update...');
    const goalFieldPath = [pillar.id, category.id, goal.id];
    const originalGoalStatus = goal.status || 'on-track';
    const newGoalStatus = originalGoalStatus === 'on-track' ? 'exceeded' : 'on-track';
    
    const updateResponse5 = await fetch(`${baseUrl}/api/scorecard/update`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        fieldPath: goalFieldPath,
        newValue: newGoalStatus,
        type: 'goal'
      })
    });
    
    if (!updateResponse5.ok) {
      const error = await updateResponse5.text();
      throw new Error(`Goal status update failed: ${error}`);
    }
    
    const updatedData5 = await updateResponse5.json();
    const updatedGoal = updatedData5.pillars[0].categories[0].goals[0];
    console.log(`   ✅ Updated goal status: ${originalGoalStatus} → ${updatedGoal.status}`);
    
    // Cleanup: Revert changes
    console.log('\n7️⃣ Reverting test changes...');
    
    // Revert program status
    await fetch(`${baseUrl}/api/scorecard/update`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        fieldPath,
        newValue: originalStatus,
        type: 'program',
        quarter: 'q1'
      })
    });
    
    // Revert program text
    await fetch(`${baseUrl}/api/scorecard/update`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        fieldPath,
        newValue: originalText,
        type: 'program-text'
      })
    });
    
    // Revert category status
    await fetch(`${baseUrl}/api/scorecard/update`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        fieldPath: categoryFieldPath,
        newValue: originalCategoryStatus,
        type: 'category'
      })
    });
    
    // Revert goal status
    await fetch(`${baseUrl}/api/scorecard/update`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        fieldPath: goalFieldPath,
        newValue: originalGoalStatus,
        type: 'goal'
      })
    });
    
    console.log('   ✅ All changes reverted');
    
    console.log('\n🎉 All database update operations successful!');
    
  } catch (error) {
    console.error('\n❌ Update operations test failed:', error.message);
    process.exit(1);
  }
}

// Run the test
testUpdateOperations();