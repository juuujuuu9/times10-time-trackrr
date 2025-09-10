import { db } from '../db/index';
import { users, tasks, taskAssignments } from '../db/schema';
import { eq, and } from 'drizzle-orm';
import { assignGeneralTasksToUser } from '../utils/assignGeneralTasks';

async function assignGeneralTasksToExistingUsers() {
  try {
    console.log('🔄 Assigning general tasks to existing users...');

    // Get all active users
    const allUsers = await db.select().from(users).where(eq(users.status, 'active'));
    console.log(`Found ${allUsers.length} active users`);

    if (allUsers.length === 0) {
      console.log('No active users found');
      return;
    }

    let totalAssigned = 0;
    const results: any[] = [];

    for (const user of allUsers) {
      console.log(`\n👤 Processing user: ${user.name} (${user.email})`);
      
      try {
        const assignedTasks = await assignGeneralTasksToUser(user.id);
        totalAssigned += assignedTasks;
        
        results.push({
          userId: user.id,
          name: user.name,
          email: user.email,
          tasksAssigned: assignedTasks
        });

        if (assignedTasks > 0) {
          console.log(`  ✅ Assigned ${assignedTasks} general tasks`);
        } else {
          console.log(`  ℹ️  No new tasks to assign (already assigned)`);
        }
      } catch (error) {
        console.error(`  ❌ Error assigning tasks to user ${user.email}:`, error);
        results.push({
          userId: user.id,
          name: user.name,
          email: user.email,
          error: error instanceof Error ? error.message : 'Unknown error'
        });
      }
    }

    console.log(`\n🎉 Summary:`);
    console.log(`  👥 Processed ${allUsers.length} users`);
    console.log(`  📋 Total tasks assigned: ${totalAssigned}`);
    
    const successfulUsers = results.filter(r => !r.error).length;
    const failedUsers = results.filter(r => r.error).length;
    
    console.log(`  ✅ Successful: ${successfulUsers}`);
    console.log(`  ❌ Failed: ${failedUsers}`);

    if (failedUsers > 0) {
      console.log(`\n❌ Failed users:`);
      results.filter(r => r.error).forEach(r => {
        console.log(`  - ${r.name} (${r.email}): ${r.error}`);
      });
    }

  } catch (error) {
    console.error('❌ Error assigning general tasks to existing users:', error);
    throw error;
  }
}

// Run the script
assignGeneralTasksToExistingUsers()
  .then(() => {
    console.log('✅ Script completed successfully');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Script failed:', error);
    process.exit(1);
  });
