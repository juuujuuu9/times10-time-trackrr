import type { APIRoute } from 'astro';
import { db } from '../../db/index';
import { users } from '../../db/schema';
import { eq } from 'drizzle-orm';
import { requireRole } from '../../utils/session';
import { assignGeneralTasksToUser } from '../../utils/assignGeneralTasks';

export const POST: APIRoute = async (context) => {
  try {
    // Require admin role
    const currentUser = await requireRole(context, 'admin', '/admin') as any;
    
    console.log('🔄 Assigning general tasks to existing users...');

    // Get all active users
    const allUsers = await db.select().from(users).where(eq(users.status, 'active'));
    console.log(`Found ${allUsers.length} active users`);

    if (allUsers.length === 0) {
      return new Response(JSON.stringify({ 
        success: true, 
        message: 'No active users found',
        summary: {
          usersProcessed: 0,
          totalTasksAssigned: 0,
          successfulUsers: 0,
          failedUsers: 0
        },
        results: []
      }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    let totalAssigned = 0;
    const results: any[] = [];

    for (const user of allUsers) {
      console.log(`👤 Processing user: ${user.name} (${user.email})`);
      
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

    const successfulUsers = results.filter(r => !r.error).length;
    const failedUsers = results.filter(r => r.error).length;

    console.log(`\n🎉 Summary:`);
    console.log(`  👥 Processed ${allUsers.length} users`);
    console.log(`  📋 Total tasks assigned: ${totalAssigned}`);
    console.log(`  ✅ Successful: ${successfulUsers}`);
    console.log(`  ❌ Failed: ${failedUsers}`);

    return new Response(JSON.stringify({ 
      success: true, 
      message: 'General tasks assignment completed',
      summary: {
        usersProcessed: allUsers.length,
        totalTasksAssigned: totalAssigned,
        successfulUsers: successfulUsers,
        failedUsers: failedUsers
      },
      results: results
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('❌ Error assigning general tasks to existing users:', error);
    return new Response(JSON.stringify({ 
      success: false, 
      error: 'Failed to assign general tasks to existing users',
      details: error instanceof Error ? error.message : 'Unknown error'
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
};
