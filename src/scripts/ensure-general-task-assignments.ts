import 'dotenv/config';
import { db } from '../db/index';
import { tasks, users, taskAssignments } from '../db/schema';
import { eq, and } from 'drizzle-orm';

async function ensureGeneralTaskAssignments() {
  console.log('=== ENSURING ALL GENERAL TASKS ARE ASSIGNED TO ALL USERS ===');
  
  // Get all General tasks
  const generalTasks = await db.select().from(tasks).where(eq(tasks.name, 'General'));
  console.log(`Found ${generalTasks.length} General tasks`);
  
  // Get all active users
  const activeUsers = await db.select().from(users).where(eq(users.status, 'active'));
  console.log(`Found ${activeUsers.length} active users`);
  
  if (activeUsers.length === 0) {
    console.log('No active users found. Skipping assignments.');
    return;
  }
  
  let totalAssignmentsCreated = 0;
  
  for (const task of generalTasks) {
    console.log(`\nProcessing General task #${task.id} (Project #${task.projectId})`);
    
    // Get existing assignments for this task
    const existingAssignments = await db.select().from(taskAssignments).where(eq(taskAssignments.taskId, task.id));
    const assignedUserIds = existingAssignments.map(a => a.userId);
    
    // Find users who are not assigned to this task
    const missingUsers = activeUsers.filter(u => !assignedUserIds.includes(u.id));
    
    if (missingUsers.length === 0) {
      console.log(`  ✓ All users already assigned`);
      continue;
    }
    
    console.log(`  Missing assignments for ${missingUsers.length} users: ${missingUsers.map(u => u.name).join(', ')}`);
    
    // Create missing assignments
    const newAssignments = missingUsers.map(user => ({
      taskId: task.id,
      userId: user.id,
    }));
    
    try {
      await db.insert(taskAssignments).values(newAssignments);
      console.log(`  ✓ Created ${newAssignments.length} new assignments`);
      totalAssignmentsCreated += newAssignments.length;
    } catch (error) {
      console.error(`  ✗ Error creating assignments for task #${task.id}:`, error);
    }
  }
  
  console.log(`\n=== SUMMARY ===`);
  console.log(`Total assignments created: ${totalAssignmentsCreated}`);
  console.log(`All General tasks are now assigned to all active users.`);
}

ensureGeneralTaskAssignments().catch((e) => {
  console.error('Error ensuring General task assignments:', e);
  process.exit(1);
});
