import type { APIRoute } from 'astro';
import { db } from '../../../db';
import { slackWorkspaces, slackUsers, slackCommands, tasks, taskAssignments, users } from '../../../db/schema';
import { eq, and, desc } from 'drizzle-orm';
import { getUserBySlackId, getWorkspaceById } from '../../../utils/slack';

export const POST: APIRoute = async ({ request }) => {
  try {
    console.log('Slack debug endpoint hit');
    
    const formData = await request.formData();
    const command = formData.get('command') as string;
    const text = formData.get('text') as string;
    const userId = formData.get('user_id') as string;
    const teamId = formData.get('team_id') as string;
    const channelId = formData.get('channel_id') as string;
    
    console.log('Debug endpoint received:', { command, text, userId, teamId, channelId });
    
    let debugInfo = {
      requestReceived: true,
      formData: { command, text, userId, teamId, channelId },
      databaseConnection: false,
      workspaceExists: false,
      userExists: false,
      userLinked: false,
      taskAssignments: 0,
      errors: [] as string[]
    };

    // Test database connection
    try {
      const result = await db.execute('SELECT 1 as test');
      debugInfo.databaseConnection = true;
      console.log('Database connection successful');
    } catch (error) {
      debugInfo.errors.push(`Database connection failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
      console.error('Database connection failed:', error);
    }

    // Test workspace lookup
    if (teamId) {
      try {
        const workspace = await getWorkspaceById(teamId);
        debugInfo.workspaceExists = !!workspace;
        console.log('Workspace lookup result:', workspace ? 'Found' : 'Not found');
      } catch (error) {
        debugInfo.errors.push(`Workspace lookup failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
        console.error('Workspace lookup failed:', error);
      }
    }

    // Test user lookup
    if (userId && teamId) {
      try {
        const user = await getUserBySlackId(userId, teamId);
        debugInfo.userLinked = !!user;
        console.log('User lookup result:', user ? 'Found' : 'Not found');
      } catch (error) {
        debugInfo.errors.push(`User lookup failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
        console.error('User lookup failed:', error);
      }
    }

    // Test task assignments (if user is linked)
    if (userId && teamId) {
      try {
        const user = await getUserBySlackId(userId, teamId);
        if (user) {
          const assignments = await db.query.taskAssignments.findMany({
            where: eq(taskAssignments.userId, user.id),
            orderBy: desc(taskAssignments.taskId)
          });
          debugInfo.taskAssignments = assignments.length;
          console.log('Task assignments found:', assignments.length);
        }
      } catch (error) {
        debugInfo.errors.push(`Task assignments lookup failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
        console.error('Task assignments lookup failed:', error);
      }
    }

    // Test general user existence
    try {
      const allUsers = await db.query.users.findMany({ limit: 1 });
      debugInfo.userExists = allUsers.length > 0;
      console.log('General user check:', allUsers.length > 0 ? 'Users exist' : 'No users found');
    } catch (error) {
      debugInfo.errors.push(`General user check failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
      console.error('General user check failed:', error);
    }

    // Log the debug info
    console.log('Debug info:', JSON.stringify(debugInfo, null, 2));

    return new Response(JSON.stringify({
      response_type: 'ephemeral',
      text: `🔍 Debug Results:
• Database: ${debugInfo.databaseConnection ? '✅ Connected' : '❌ Failed'}
• Workspace: ${debugInfo.workspaceExists ? '✅ Found' : '❌ Not found'}
• User Linked: ${debugInfo.userLinked ? '✅ Yes' : '❌ No'}
• Task Assignments: ${debugInfo.taskAssignments}
• Errors: ${debugInfo.errors.length > 0 ? debugInfo.errors.join(', ') : 'None'}`
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('Debug endpoint error:', error);
    
    return new Response(JSON.stringify({
      response_type: 'ephemeral',
      text: `❌ Debug failed: ${error instanceof Error ? error.message : 'Unknown error'}`
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });
  }
};
