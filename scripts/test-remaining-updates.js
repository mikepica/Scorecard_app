// Test remaining update operation types
// Run with: node scripts/test-remaining-updates.js

async function testRemainingUpdates() {
  console.log('🧪 Testing Remaining Update Operations...\n');

  const baseUrl = 'http://localhost:3000';
  
  try {
    // Get current data
    const response = await fetch(`${baseUrl}/api/scorecard`);
    const data = await response.json();
    
    const pillar = data.pillars[0];
    const category = pillar.categories[0];
    const goal = category.goals[0];
    const program = goal.programs?.[0];
    
    // Test program-progress update
    console.log('1️⃣ Testing program progress update...');
    const originalProgress = program.progressUpdates || '';
    const newProgress = 'Test progress update - ' + new Date().toISOString();
    
    const progressResponse = await fetch(`${baseUrl}/api/scorecard/update`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        fieldPath: [pillar.id, category.id, goal.id, program.id],
        newValue: newProgress,
        type: 'program-progress'
      })
    });
    
    if (!progressResponse.ok) {
      const error = await progressResponse.text();
      throw new Error(`Program progress update failed: ${error}`);
    }
    
    const progressData = await progressResponse.json();
    const updatedProgram = progressData.pillars[0].categories[0].goals[0].programs[0];
    console.log(`   ✅ Updated progress: "${originalProgress}" → "${updatedProgram.progressUpdates}"`);
    
    // Test category-name update
    console.log('\n2️⃣ Testing category name update...');
    const originalCategoryName = category.name;
    const newCategoryName = originalCategoryName + ' [TEST]';
    
    const categoryNameResponse = await fetch(`${baseUrl}/api/scorecard/update`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        fieldPath: [pillar.id, category.id],
        newValue: newCategoryName,
        type: 'category-name'
      })
    });
    
    if (!categoryNameResponse.ok) {
      const error = await categoryNameResponse.text();
      throw new Error(`Category name update failed: ${error}`);
    }
    
    const categoryNameData = await categoryNameResponse.json();
    const updatedCategory = categoryNameData.pillars[0].categories[0];
    console.log(`   ✅ Updated category name: "${originalCategoryName}" → "${updatedCategory.name}"`);
    
    // Test goal-text update
    console.log('\n3️⃣ Testing goal text update...');
    const originalGoalText = goal.text;
    const newGoalText = originalGoalText + ' [UPDATED]';
    
    const goalTextResponse = await fetch(`${baseUrl}/api/scorecard/update`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        fieldPath: [pillar.id, category.id, goal.id],
        newValue: newGoalText,
        type: 'goal-text'
      })
    });
    
    if (!goalTextResponse.ok) {
      const error = await goalTextResponse.text();
      throw new Error(`Goal text update failed: ${error}`);
    }
    
    const goalTextData = await goalTextResponse.json();
    const updatedGoal = goalTextData.pillars[0].categories[0].goals[0];
    console.log(`   ✅ Updated goal text: "${originalGoalText.substring(0, 30)}..." → "${updatedGoal.text.substring(0, 30)}..."`);
    
    // Cleanup: Revert all changes
    console.log('\n4️⃣ Reverting test changes...');
    
    // Revert progress
    await fetch(`${baseUrl}/api/scorecard/update`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        fieldPath: [pillar.id, category.id, goal.id, program.id],
        newValue: originalProgress,
        type: 'program-progress'
      })
    });
    
    // Revert category name
    await fetch(`${baseUrl}/api/scorecard/update`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        fieldPath: [pillar.id, category.id],
        newValue: originalCategoryName,
        type: 'category-name'
      })
    });
    
    // Revert goal text
    await fetch(`${baseUrl}/api/scorecard/update`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        fieldPath: [pillar.id, category.id, goal.id],
        newValue: originalGoalText,
        type: 'goal-text'
      })
    });
    
    console.log('   ✅ All changes reverted');
    
    console.log('\n🎉 All remaining update operations successful!');
    
  } catch (error) {
    console.error('\n❌ Remaining update tests failed:', error.message);
    process.exit(1);
  }
}

// Run the test
testRemainingUpdates();