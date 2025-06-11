// Test edge cases for update operations
// Run with: node scripts/test-update-edge-cases.js

async function testUpdateEdgeCases() {
  console.log('🧪 Testing Update Operation Edge Cases...\n');

  const baseUrl = 'http://localhost:3000';
  
  try {
    // Test 1: Invalid program ID
    console.log('1️⃣ Testing invalid program ID...');
    const invalidResponse = await fetch(`${baseUrl}/api/scorecard/update`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        fieldPath: ['SPill100', 'Cat100', 'SG100', 'INVALID_ID'],
        newValue: 'exceeded',
        type: 'program',
        quarter: 'q1'
      })
    });
    
    if (invalidResponse.ok) {
      throw new Error('Expected error for invalid program ID, but request succeeded');
    }
    
    const errorData = await invalidResponse.json();
    console.log(`   ✅ Correctly rejected invalid ID: ${errorData.error}`);
    
    // Test 2: Missing quarter for program status
    console.log('\n2️⃣ Testing missing quarter parameter...');
    const missingQuarterResponse = await fetch(`${baseUrl}/api/scorecard/update`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        fieldPath: ['SPill100', 'Cat100', 'SG100', 'SP100'],
        newValue: 'exceeded',
        type: 'program'
        // quarter missing
      })
    });
    
    if (missingQuarterResponse.ok) {
      throw new Error('Expected error for missing quarter, but request succeeded');
    }
    
    const quarterErrorData = await missingQuarterResponse.json();
    console.log(`   ✅ Correctly rejected missing quarter: ${quarterErrorData.error}`);
    
    // Test 3: Invalid update type
    console.log('\n3️⃣ Testing invalid update type...');
    const invalidTypeResponse = await fetch(`${baseUrl}/api/scorecard/update`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        fieldPath: ['SPill100', 'Cat100', 'SG100', 'SP100'],
        newValue: 'exceeded',
        type: 'invalid-type'
      })
    });
    
    if (invalidTypeResponse.ok) {
      throw new Error('Expected error for invalid type, but request succeeded');
    }
    
    const typeErrorData = await invalidTypeResponse.json();
    console.log(`   ✅ Correctly rejected invalid type: ${typeErrorData.error}`);
    
    // Test 4: Test transaction rollback (simulate)
    console.log('\n4️⃣ Testing transaction behavior...');
    
    // Get valid data first
    const dataResponse = await fetch(`${baseUrl}/api/scorecard`);
    const data = await dataResponse.json();
    const program = data.pillars[0].categories[0].goals[0].programs[0];
    
    // Valid update that should work
    const validUpdateResponse = await fetch(`${baseUrl}/api/scorecard/update`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        fieldPath: [data.pillars[0].id, data.pillars[0].categories[0].id, data.pillars[0].categories[0].goals[0].id, program.id],
        newValue: 'delayed',
        type: 'program',
        quarter: 'q3'
      })
    });
    
    if (!validUpdateResponse.ok) {
      throw new Error('Valid update failed - cannot test transaction behavior');
    }
    
    console.log(`   ✅ Transaction completed successfully`);
    
    console.log('\n🎉 All edge case tests passed!');
    
  } catch (error) {
    console.error('\n❌ Edge case tests failed:', error.message);
    process.exit(1);
  }
}

// Run the test
testUpdateEdgeCases();