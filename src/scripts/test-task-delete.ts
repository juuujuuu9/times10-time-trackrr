import { db } from '../db/index';
import { tasks, taskAssignments, timeEntries, users, projects, clients } from '../db/schema';
import { eq } from 'drizzle-orm';

async function testTaskDelete() {
  console.log('🧪 Testing task deletion functionality...\n');

  try {
    // Create a test client
    const testClient = await db.insert(clients).values({
      name: 'Test Client for Task Delete',
      createdBy: 1, // Assuming user ID 1 exists
    }).returning();
    const clientId = testClient[0].id;
    console.log('✅ Created test client:', testClient[0].name);

    // Create a test project
    const testProject = await db.insert(projects).values({
      name: 'Test Project for Task Delete',
      clientId: clientId,
    }).returning();
    const projectId = testProject[0].id;
    console.log('✅ Created test project:', testProject[0].name);

    // Create a test task
    const testTask = await db.insert(tasks).values({
      name: 'Test Task for Deletion',
      projectId: projectId,
      description: 'This task will be deleted to test the functionality',
    }).returning();
    const taskId = testTask[0].id;
    console.log('✅ Created test task:', testTask[0].name);

    // Create test user assignments
    const testAssignments = await db.insert(taskAssignments).values([
      { taskId: taskId, userId: 1 },
      { taskId: taskId, userId: 2 }, // Assuming user ID 2 exists
    ]).returning();
    console.log('✅ Created test assignments:', testAssignments.length, 'assignments');

    // Create test time entries
    const testTimeEntries = await db.insert(timeEntries).values([
      {
        taskId: taskId,
        userId: 1,
        startTime: new Date('2024-01-01T09:00:00Z'),
        endTime: new Date('2024-01-01T10:00:00Z'),
        notes: 'Test time entry 1',
      },
      {
        taskId: taskId,
        userId: 2,
        startTime: new Date('2024-01-01T11:00:00Z'),
        endTime: new Date('2024-01-01T12:00:00Z'),
        notes: 'Test time entry 2',
      },
    ]).returning();
    console.log('✅ Created test time entries:', testTimeEntries.length, 'entries');

    // Verify initial state
    console.log('\n📊 Initial state:');
    const initialTask = await db.select().from(tasks).where(eq(tasks.id, taskId));
    const initialAssignments = await db.select().from(taskAssignments).where(eq(taskAssignments.taskId, taskId));
    const initialTimeEntries = await db.select().from(timeEntries).where(eq(timeEntries.taskId, taskId));
    
    console.log(`   - Task exists: ${initialTask.length > 0}`);
    console.log(`   - Assignments: ${initialAssignments.length}`);
    console.log(`   - Time entries: ${initialTimeEntries.length}`);

    // Simulate the delete operation (what the API endpoint does)
    console.log('\n🗑️  Performing delete operation...');
    
    // 1. Remove all user assignments
    await db.delete(taskAssignments).where(eq(taskAssignments.taskId, taskId));
    console.log('✅ Removed all user assignments');

    // 2. Delete the task (time entries remain)
    await db.delete(tasks).where(eq(tasks.id, taskId));
    console.log('✅ Deleted the task');

    // Verify final state
    console.log('\n📊 Final state:');
    const finalTask = await db.select().from(tasks).where(eq(tasks.id, taskId));
    const finalAssignments = await db.select().from(taskAssignments).where(eq(taskAssignments.taskId, taskId));
    const finalTimeEntries = await db.select().from(timeEntries).where(eq(timeEntries.taskId, taskId));
    
    console.log(`   - Task exists: ${finalTask.length > 0}`);
    console.log(`   - Assignments: ${finalAssignments.length}`);
    console.log(`   - Time entries: ${finalTimeEntries.length}`);

    // Verify the test results
    const taskDeleted = finalTask.length === 0;
    const assignmentsRemoved = finalAssignments.length === 0;
    const timeEntriesPreserved = finalTimeEntries.length === 2;

    console.log('\n🎯 Test Results:');
    console.log(`   - Task deleted: ${taskDeleted ? '✅ PASS' : '❌ FAIL'}`);
    console.log(`   - Assignments removed: ${assignmentsRemoved ? '✅ PASS' : '❌ FAIL'}`);
    console.log(`   - Time entries preserved: ${timeEntriesPreserved ? '✅ PASS' : '❌ FAIL'}`);

    if (taskDeleted && assignmentsRemoved && timeEntriesPreserved) {
      console.log('\n🎉 All tests passed! Task deletion works correctly.');
    } else {
      console.log('\n❌ Some tests failed. Please check the implementation.');
    }

    // Clean up test data
    console.log('\n🧹 Cleaning up test data...');
    await db.delete(timeEntries).where(eq(timeEntries.taskId, taskId)); // Clean up orphaned time entries
    await db.delete(projects).where(eq(projects.id, projectId));
    await db.delete(clients).where(eq(clients.id, clientId));
    console.log('✅ Test data cleaned up');

  } catch (error) {
    console.error('❌ Test failed with error:', error);
  } finally {
    await db.disconnect();
  }
}

// Run the test
testTaskDelete();

