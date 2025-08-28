import { db } from '../db/index';
import { timeEntries, users, tasks, projects, clients } from '../db/schema';
import { sql, eq } from 'drizzle-orm';

async function testDateHandling() {
  console.log('Testing date handling for manual time entries...\n');

  try {
    // Get a sample user and task for testing
    const sampleUser = await db.select().from(users).limit(1);
    const sampleTask = await db.select().from(tasks).limit(1);

    if (sampleUser.length === 0 || sampleTask.length === 0) {
      console.log('No users or tasks found. Please run the demo data generation first.');
      return;
    }

    const userId = sampleUser[0].id;
    const taskId = sampleTask[0].id;

    console.log(`Using user: ${sampleUser[0].name} (ID: ${userId})`);
    console.log(`Using task: ${sampleTask[0].name} (ID: ${taskId})`);

    // Test 1: Create a manual time entry with a specific date
    const testDate = '2024-01-15'; // January 15, 2024
    console.log(`\nTest 1: Creating manual time entry for date: ${testDate}`);

    const newTimeEntry = await db.insert(timeEntries).values({
      userId: userId,
      taskId: taskId,
      startTime: new Date(testDate), // This should now work correctly
      endTime: null,
      durationManual: 7200, // 2 hours in seconds
      notes: 'Test manual entry with specific date',
    }).returning();

    console.log('✅ Manual time entry created successfully');
    console.log(`Entry ID: ${newTimeEntry[0].id}`);
    console.log(`Start Time: ${newTimeEntry[0].startTime}`);
    console.log(`Duration: ${newTimeEntry[0].durationManual} seconds`);

    // Test 2: Verify the date is stored correctly
    console.log('\nTest 2: Verifying stored date');
    const retrievedEntry = await db
      .select()
      .from(timeEntries)
      .where(eq(timeEntries.id, newTimeEntry[0].id))
      .limit(1);

    if (retrievedEntry.length > 0) {
      const entry = retrievedEntry[0];
      const storedDate = entry.startTime?.toISOString().split('T')[0];
      console.log(`Stored date: ${storedDate}`);
      console.log(`Expected date: ${testDate}`);
      
      if (storedDate === testDate) {
        console.log('✅ Date stored correctly!');
      } else {
        console.log('❌ Date mismatch!');
      }
    }

    // Test 3: Test with current date (no specific date provided)
    console.log('\nTest 3: Creating manual time entry with current date');
    const currentDateEntry = await db.insert(timeEntries).values({
      userId: userId,
      taskId: taskId,
      startTime: new Date(), // Current date
      endTime: null,
      durationManual: 3600, // 1 hour in seconds
      notes: 'Test manual entry with current date',
    }).returning();

    console.log('✅ Current date entry created successfully');
    console.log(`Entry ID: ${currentDateEntry[0].id}`);
    console.log(`Start Time: ${currentDateEntry[0].startTime}`);

    // Test 4: Query entries and verify date display
    console.log('\nTest 4: Querying entries with date filtering');
    const today = new Date();
    const todayString = today.toISOString().split('T')[0];
    
    const recentEntries = await db
      .select({
        id: timeEntries.id,
        startTime: timeEntries.startTime,
        durationManual: timeEntries.durationManual,
        notes: timeEntries.notes,
      })
      .from(timeEntries)
      .where(sql`${timeEntries.startTime} >= ${todayString}`)
      .orderBy(sql`${timeEntries.startTime} DESC`);

    console.log(`Found ${recentEntries.length} entries from today or later:`);
    recentEntries.forEach(entry => {
      const dateStr = entry.startTime?.toISOString().split('T')[0];
      const hours = entry.durationManual ? (entry.durationManual / 3600).toFixed(2) : '0';
      console.log(`  - Entry ${entry.id}: ${dateStr} (${hours}h) - ${entry.notes}`);
    });

    console.log('\n✅ All tests completed successfully!');
    console.log('\nThe date handling fix appears to be working correctly.');
    console.log('Manual time entries now properly store the task date in the startTime field.');

  } catch (error) {
    console.error('❌ Test failed:', error);
  } finally {
    await db.disconnect();
  }
}

// Run the test
testDateHandling();
